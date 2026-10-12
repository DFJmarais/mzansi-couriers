import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { getDb } from "../db";
import {
  courierPayouts,
  courierProfiles,
  deliveries,
  deliveryRelayLegs,
  relayHandoffPoints,
  payoutSettings,
  relaySettlementAllocations,
  vehicleCostProfiles,
} from "../../drizzle/schema";
import { calculateSharedRelayPool, type RelayPoolLegInput } from "./relay-pool-pricing";
import { getDrivingRoute } from "./route-geometry";
import { appendParcelLedgerEvent, initializeParcelLedger } from "./financial-ledger";
import { linkWaveSettlementAllocationsForDelivery } from "./dispatch-waves";

export type WeeklySettlementResult = {
  weekStart: string;
  payoutDate: Date;
  allocations: Array<typeof relaySettlementAllocations.$inferSelect>;
  blocked: Array<{ deliveryId: number; trackingCode: string; courierIds: number[]; reason: string }>;
  totals: {
    parcels: number;
    allocations: number;
    customerChargeZar: number;
    platformFeeZar: number;
    courierPoolZar: number;
    grossEarningsZar: number;
    operatingCostZar: number;
    estimatedNetZar: number;
    roadDistanceKm: number;
    deadheadKm: number;
    returnKm: number;
    tollsZar: number;
    handoverTimeMinutes: number;
    totalCourierPoolAvailableZar: number;
  };
};

function weekBounds(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  const payoutDate = new Date(`${weekStart}T09:00:00.000Z`);
  payoutDate.setUTCDate(payoutDate.getUTCDate() + 4);
  return { start, end, payoutDate };
}

function money(value: unknown): number {
  return Number(value ?? 0);
}

function coordinate(lat: unknown, lng: unknown) {
  const parsed = { lat: money(lat), lng: money(lng) };
  return Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng) && (parsed.lat !== 0 || parsed.lng !== 0) ? parsed : null;
}

/**
 * Builds immutable settlement rows once per completed parcel and relay leg.
 * Existing rows are reused by settlementKey, making weekly review idempotent.
 */
export async function buildWeeklyRelaySettlement(weekStart: string): Promise<WeeklySettlementResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { start, end, payoutDate } = weekBounds(weekStart);
  const completed = await db.select().from(deliveries).where(and(
    eq(deliveries.status, "delivered"),
    gte(deliveries.actualDeliveryTime, start),
    lt(deliveries.actualDeliveryTime, end),
  ));
  const deliveryIds = completed.map((delivery) => delivery.id);
  const relayRows = deliveryIds.length
    ? await db.select().from(deliveryRelayLegs).where(inArray(deliveryRelayLegs.deliveryId, deliveryIds)).orderBy(deliveryRelayLegs.sequence)
    : [];
  const handoffPointIds = Array.from(new Set(relayRows.map((leg) => leg.handoffPointId).filter((id): id is number => id != null)));
  const handoffPoints = handoffPointIds.length ? await db.select().from(relayHandoffPoints).where(inArray(relayHandoffPoints.id, handoffPointIds)) : [];
  const handoffPointById = new Map(handoffPoints.map((point) => [point.id, point]));
  const courierIds = Array.from(new Set(relayRows.flatMap((leg) => [leg.fromCourierId, leg.toCourierId, leg.currentCustodianId]).filter((id): id is number => id != null).concat(completed.map((delivery) => delivery.courierId).filter((id): id is number => id != null))));
  const profiles = courierIds.length
    ? await db.select().from(vehicleCostProfiles).where(and(inArray(vehicleCostProfiles.courierId, courierIds), eq(vehicleCostProfiles.verificationStatus, "verified"))).orderBy(desc(vehicleCostProfiles.verifiedAt))
    : [];
  const profileByCourier = new Map<number, typeof profiles[number]>();
  for (const profile of profiles) if (!profileByCourier.has(profile.courierId)) profileByCourier.set(profile.courierId, profile);
  const legsByDelivery = new Map<number, typeof relayRows>();
  for (const leg of relayRows) legsByDelivery.set(leg.deliveryId, [...(legsByDelivery.get(leg.deliveryId) ?? []), leg]);
  const allocations: Array<typeof relaySettlementAllocations.$inferSelect> = [];
  const blocked: WeeklySettlementResult["blocked"] = [];

  for (const delivery of completed) {
    const sourceLegs = legsByDelivery.get(delivery.id) ?? [];
    const legSpecs = sourceLegs.length
      ? sourceLegs.map((leg) => ({ leg, courierId: leg.toCourierId ?? leg.fromCourierId ?? leg.currentCustodianId ?? delivery.courierId }))
      : [{ leg: null, courierId: delivery.courierId }];
    const missingCourierIds = Array.from(new Set(legSpecs.map(({ courierId }) => courierId).filter((id): id is number => id != null && !profileByCourier.has(id))));
    if (missingCourierIds.length || legSpecs.some(({ courierId }) => courierId == null)) {
      blocked.push({ deliveryId: delivery.id, trackingCode: delivery.trackingCode, courierIds: missingCourierIds, reason: "An admin-verified vehicle operating-cost profile is required for every courier carrying this parcel." });
      continue;
    }
    const customerChargeZar = money(delivery.finalPrice ?? delivery.estimatedPrice);
    const parcelVolumeM3 = money(delivery.lengthCm) * money(delivery.widthCm) * money(delivery.heightCm) / 1_000_000;
    const poolLegs: RelayPoolLegInput[] = [];
    for (let index = 0; index < legSpecs.length; index += 1) {
      const { leg, courierId } = legSpecs[index];
      const profile = profileByCourier.get(courierId!)!;
      const previousLeg = index > 0 ? legSpecs[index - 1].leg : null;
      const previousPoint = previousLeg?.handoffPointId ? handoffPointById.get(previousLeg.handoffPointId) : null;
      const currentPoint = leg?.handoffPointId ? handoffPointById.get(leg.handoffPointId) : null;
      const origin = index === 0 ? coordinate(delivery.pickupLatitude, delivery.pickupLongitude) : coordinate(previousLeg?.meetingLatitude, previousLeg?.meetingLongitude) ?? coordinate(previousPoint?.latitude, previousPoint?.longitude);
      const destination = index === legSpecs.length - 1 ? coordinate(delivery.dropoffLatitude, delivery.dropoffLongitude) : coordinate(leg?.meetingLatitude, leg?.meetingLongitude) ?? coordinate(currentPoint?.latitude, currentPoint?.longitude);
      let roadDistanceKm = leg?.roadDistanceKm == null ? null : money(leg.roadDistanceKm);
      if (roadDistanceKm == null && origin && destination) {
        try {
          const route = await getDrivingRoute(origin, destination);
          roadDistanceKm = route.distanceKm;
          if (leg) await db.update(deliveryRelayLegs).set({ roadDistanceKm: route.distanceKm.toFixed(2), routeDurationMinutes: route.durationMinutes, routePolyline: route.polyline }).where(eq(deliveryRelayLegs.id, leg.id));
        } catch {
          roadDistanceKm = null;
        }
      }
      if (roadDistanceKm == null || roadDistanceKm <= 0) {
        blocked.push({ deliveryId: delivery.id, trackingCode: delivery.trackingCode, courierIds: [courierId!], reason: `Actual road kilometres are required for relay leg ${leg?.sequence ?? index + 1}; add valid route geometry before settlement.` });
        continue;
      }
      poolLegs.push({
        legId: leg ? `relay-leg-${leg.id}` : `delivery-${delivery.id}-direct`,
        sequence: leg?.sequence ?? index + 1,
        courierId: String(courierId),
        origin: leg?.originArea ?? "Pickup",
        destination: leg?.destinationArea ?? "Delivery",
        distanceKm: roadDistanceKm,
        deadheadKm: money(leg?.deadheadKm),
        returnKm: money(leg?.returnKm),
        fuelPricePerLitre: money(profile.fuelPricePerLitre),
        fuelLitresPer100Km: money(profile.fuelLitresPer100Km),
        driverCompensationPerKm: money(profile.driverCompensationPerKm),
        vehicleAllowancePerKm: money(profile.vehicleAllowancePerKm),
        routeOverheadPerKm: money(profile.routeOverheadPerKm),
        handoverFeeZar: leg && leg.sequence > 1 ? 35 : 0,
        tollsZar: money(leg?.tollsZar),
        handoverTimeMinutes: money(leg?.handoverTimeMinutes),
        availableBackhaul: Boolean(leg?.availableBackhaul),
        backhaulRevenueZar: money(leg?.backhaulRevenueZar),
        parcelCountOnLeg: 1,
        parcelWeightKg: money(delivery.packageWeight),
        parcelVolumeM3,
        vehicleCapacityUnits: profile.capacityUnits ?? undefined,
        vehicleCapacityWeightKg: money(profile.capacityWeightKg) || undefined,
        vehicleCapacityVolumeM3: money(profile.capacityVolumeM3) || undefined,
      });
    }
    if (poolLegs.length !== legSpecs.length) continue;
    const pool = calculateSharedRelayPool({ customerChargeZar, parcelCount: 1, totalCourierPoolAvailableZar: customerChargeZar * 0.8, legs: poolLegs });
    await initializeParcelLedger({ deliveryId: delivery.id, customerPayment: customerChargeZar, paymentCost: customerChargeZar * 0.029 + 1.5, reserveAmount: Math.max(0, pool.totalCourierCostFloorZar * 0.1) });
    const existingRows = await db.select().from(relaySettlementAllocations).where(eq(relaySettlementAllocations.deliveryId, delivery.id));
    const existingByKey = new Map(existingRows.map((row) => [row.settlementKey, row]));
    for (const allocation of pool.legs) {
      const source = legSpecs.find(({ leg }) => allocation.legId === (leg ? `relay-leg-${leg.id}` : `delivery-${delivery.id}-direct`));
      const profile = profileByCourier.get(Number(allocation.courierId))!;
      const settlementKey = `delivery:${delivery.id}:leg:${source?.leg?.id ?? "direct"}:courier:${allocation.courierId}`;
      const values = {
        settlementKey,
        deliveryId: delivery.id,
        relayLegId: source?.leg?.id ?? null,
        courierId: Number(allocation.courierId),
        vehicleCostProfileId: profile.id,
        weekStart: start,
        customerCharge: pool.customerChargeZar.toFixed(2),
        platformFee: (pool.platformFeeZar * allocation.valueScore).toFixed(2),
        courierPool: pool.courierPoolZar.toFixed(2),
        linehaulDistanceKm: allocation.distanceKm.toFixed(2),
        deadheadKm: allocation.deadheadKm.toFixed(2),
        returnKm: allocation.returnKm.toFixed(2),
        totalDrivenKm: allocation.totalDrivenKm.toFixed(2),
        operatingCost: allocation.operatingCostZar.toFixed(2),
        handoverFee: allocation.handoverFeeZar.toFixed(2),
        grossEarnings: allocation.grossAllocationZar.toFixed(2),
        estimatedNet: allocation.estimatedNetZar.toFixed(2),
        minimumPayout: (pool.couriers.find((courier) => courier.courierId === allocation.courierId)?.minimumPayoutZar ?? 0).toFixed(2),
        parcelCountOnLeg: 1,
        parcelWeightKg: (poolLegs.find((item) => item.legId === allocation.legId)?.parcelWeightKg ?? 0).toFixed(2),
        parcelVolumeM3: (poolLegs.find((item) => item.legId === allocation.legId)?.parcelVolumeM3 ?? 0).toFixed(4),
        vehicleCapacityUnits: profile.capacityUnits,
        vehicleCapacityWeightKg: profile.capacityWeightKg,
        vehicleCapacityVolumeM3: profile.capacityVolumeM3,
        tolls: (poolLegs.find((item) => item.legId === allocation.legId)?.tollsZar ?? 0).toFixed(2),
        handoverTimeMinutes: poolLegs.find((item) => item.legId === allocation.legId)?.handoverTimeMinutes ?? 0,
        availableBackhaul: poolLegs.find((item) => item.legId === allocation.legId)?.availableBackhaul ?? false,
        backhaulRevenue: (poolLegs.find((item) => item.legId === allocation.legId)?.backhaulRevenueZar ?? 0).toFixed(2),
        totalCourierPoolAvailable: pool.totalCourierPoolAvailableZar.toFixed(2),
        status: "calculated" as const,
      };
      const existing = existingByKey.get(settlementKey);
      if (existing) {
        allocations.push(existing);
      } else {
        const inserted = await db.insert(relaySettlementAllocations).values(values);
        const [created] = await db.select().from(relaySettlementAllocations).where(eq(relaySettlementAllocations.id, Number(inserted[0].insertId))).limit(1);
        if (created) allocations.push(created);
      }
      await appendParcelLedgerEvent({ deliveryId: delivery.id, eventKey: `delivery:${delivery.id}:allocation:${allocation.legId}`, type: "leg_allocation", amount: allocation.grossAllocationZar, courierId: Number(allocation.courierId), relayLegId: source?.leg?.id ?? null, reference: settlementKey });
      await linkWaveSettlementAllocationsForDelivery(delivery.id);
    }
  }

  const totals = allocations.reduce((sum, row) => ({
    parcels: sum.parcels + 1,
    allocations: sum.allocations + 1,
    customerChargeZar: sum.customerChargeZar + money(row.customerCharge),
    platformFeeZar: sum.platformFeeZar + money(row.platformFee),
    courierPoolZar: sum.courierPoolZar + (money(row.courierPool) / Math.max(1, allocations.filter((item) => item.deliveryId === row.deliveryId).length)),
    grossEarningsZar: sum.grossEarningsZar + money(row.grossEarnings),
    operatingCostZar: sum.operatingCostZar + money(row.operatingCost) + money(row.handoverFee),
    estimatedNetZar: sum.estimatedNetZar + money(row.estimatedNet),
    roadDistanceKm: sum.roadDistanceKm + money(row.linehaulDistanceKm),
    deadheadKm: sum.deadheadKm + money(row.deadheadKm),
    returnKm: sum.returnKm + money(row.returnKm),
    tollsZar: sum.tollsZar + money(row.tolls),
    handoverTimeMinutes: sum.handoverTimeMinutes + money(row.handoverTimeMinutes),
    totalCourierPoolAvailableZar: sum.totalCourierPoolAvailableZar + money(row.totalCourierPoolAvailable) / Math.max(1, allocations.filter((item) => item.deliveryId === row.deliveryId).length),
  }), { parcels: 0, allocations: 0, customerChargeZar: 0, platformFeeZar: 0, courierPoolZar: 0, grossEarningsZar: 0, operatingCostZar: 0, estimatedNetZar: 0, roadDistanceKm: 0, deadheadKm: 0, returnKm: 0, tollsZar: 0, handoverTimeMinutes: 0, totalCourierPoolAvailableZar: 0 });
  return { weekStart, payoutDate, allocations, blocked, totals: Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, Math.round(Number(value) * 100) / 100])) as WeeklySettlementResult["totals"] };
}

export async function getVerifiedVehicleCostProfiles() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select({ profile: vehicleCostProfiles, courierName: courierProfiles.vehicleRegistration }).from(vehicleCostProfiles).leftJoin(courierProfiles, eq(vehicleCostProfiles.courierId, courierProfiles.userId)).orderBy(desc(vehicleCostProfiles.updatedAt));
}

export async function createOrUpdateVehicleCostProfile(input: {
  id?: number;
  courierId: number;
  vehicleType: string;
  makeModel?: string | null;
  modelYear?: number | null;
  fuelType: string;
  fuelPricePerLitre: number;
  fuelLitresPer100Km: number;
  driverCompensationPerKm: number;
  vehicleAllowancePerKm: number;
  routeOverheadPerKm: number;
  capacityUnits?: number | null;
  capacityWeightKg?: number | null;
  capacityVolumeM3?: number | null;
  evidenceNote?: string | null;
  verified: boolean;
  verifiedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const values = {
    courierId: input.courierId,
    vehicleType: input.vehicleType,
    makeModel: input.makeModel ?? null,
    modelYear: input.modelYear ?? null,
    fuelType: input.fuelType,
    fuelPricePerLitre: input.fuelPricePerLitre.toFixed(2),
    fuelLitresPer100Km: input.fuelLitresPer100Km.toFixed(2),
    driverCompensationPerKm: input.driverCompensationPerKm.toFixed(2),
    vehicleAllowancePerKm: input.vehicleAllowancePerKm.toFixed(2),
    routeOverheadPerKm: input.routeOverheadPerKm.toFixed(2),
    capacityUnits: input.capacityUnits ?? null,
    capacityWeightKg: input.capacityWeightKg?.toFixed(2) ?? null,
    capacityVolumeM3: input.capacityVolumeM3?.toFixed(4) ?? null,
    evidenceNote: input.evidenceNote ?? null,
    verificationStatus: input.verified ? "verified" as const : "pending" as const,
    verifiedBy: input.verified ? input.verifiedBy : null,
    verifiedAt: input.verified ? new Date() : null,
  };
  if (input.id) {
    await db.update(vehicleCostProfiles).set(values).where(eq(vehicleCostProfiles.id, input.id));
    const [row] = await db.select().from(vehicleCostProfiles).where(eq(vehicleCostProfiles.id, input.id)).limit(1);
    return row;
  }
  const result = await db.insert(vehicleCostProfiles).values(values);
  const [row] = await db.select().from(vehicleCostProfiles).where(eq(vehicleCostProfiles.id, Number(result[0].insertId))).limit(1);
  return row;
}
