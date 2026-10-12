import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import {
  addresses,
  courierProfiles,
  deliveries,
  deliveryRelayLegs,
  dispatchAssignments,
  dispatchRunReconciliations,
  dispatchRuns,
  dispatchWaveCouriers,
  dispatchWaveEvents,
  dispatchWaveParcels,
  dispatchWaveRecoveryActions,
  dispatchWaveRelayLegs,
  dispatchWaveRunLinks,
  dispatchWaveSettlementLinks,
  dispatchWaves,
  parcelFinancialLedgerEntries,
  parcelFinancialLedgers,
  relayExceptionEvents,
  relaySettlementAllocations,
  syntheticWaveHarnessRuns,
  users,
  vehicleCostProfiles,
} from "../../drizzle/schema";
import { initializeParcelLedger, appendParcelLedgerEvent, markParcelLedgerSettled } from "./financial-ledger";
import { materializeDispatchWaves, reconcileDispatchRun, transitionDispatchWave, recordWaveRecovery } from "./dispatch-waves";

export const SYNTHETIC_WAVE_NAMESPACE = "qa:wave-operations:v1";

export const SYNTHETIC_SCENARIOS = [
  "normal-single-wave",
  "multi-wave-50-plus-parcels",
  "multiple-couriers",
  "relay-handover",
  "waiting-for-departure",
  "active-in-progress",
  "completed-wave",
  "courier-cancellation-no-show",
  "failed-handover",
  "replacement-courier-recovery",
  "capacity-blocked",
  "settlement-blocked",
  "reconciliation-blocker",
  "notification-failure-indicator",
  "fully-reconciled-settled",
] as const;

export type SyntheticHarnessIds = {
  users: number[];
  courierProfiles: number[];
  vehicleCostProfiles: number[];
  addresses: number[];
  deliveries: number[];
  relayLegs: number[];
  dispatchRuns: number[];
  assignments: number[];
  waves: number[];
  waveParcels: number[];
  waveCouriers: number[];
  waveRelayLegs: number[];
  waveRunLinks: number[];
  waveEvents: number[];
  recoveryActions: number[];
  exceptions: number[];
  ledgers: number[];
  ledgerEntries: number[];
  allocations: number[];
  settlementLinks: number[];
  reconciliations: number[];
};

const emptyIds = (): SyntheticHarnessIds => ({ users: [], courierProfiles: [], vehicleCostProfiles: [], addresses: [], deliveries: [], relayLegs: [], dispatchRuns: [], assignments: [], waves: [], waveParcels: [], waveCouriers: [], waveRelayLegs: [], waveRunLinks: [], waveEvents: [], recoveryActions: [], exceptions: [], ledgers: [], ledgerEntries: [], allocations: [], settlementLinks: [], reconciliations: [] });
const round = (value: number) => Math.round(value * 100) / 100;
const tracking = (namespace: string, scenario: string, index: number) => `QA-${namespace.split(":").join("-")}-${scenario.slice(0, 12)}-${index}`.slice(0, 20);

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

async function transition(waveId: number, toStatus: "ready" | "departed" | "handover" | "in_progress" | "completed" | "settled" | "failed", actorUserId: number, reason: string) {
  return transitionDispatchWave({ waveId, toStatus, actorUserId, eventKey: `${SYNTHETIC_WAVE_NAMESPACE}:wave:${waveId}:${toStatus}`, reason });
}

export async function getSyntheticWaveHarnessStatus() {
  const db = await dbOrThrow();
  const latest = (await db.select().from(syntheticWaveHarnessRuns).where(eq(syntheticWaveHarnessRuns.namespace, SYNTHETIC_WAVE_NAMESPACE)).limit(1))[0];
  if (!latest) return { namespace: SYNTHETIC_WAVE_NAMESPACE, seeded: false, scenarios: SYNTHETIC_SCENARIOS, counts: null };
  const ids = latest.recordIds as Partial<SyntheticHarnessIds>;
  const [runs, waves, deliveriesRows, ledgerRows] = await Promise.all([
    ids.dispatchRuns?.length ? db.select().from(dispatchRuns).where(inArray(dispatchRuns.id, ids.dispatchRuns)) : [],
    ids.waves?.length ? db.select().from(dispatchWaves).where(inArray(dispatchWaves.id, ids.waves)) : [],
    ids.deliveries?.length ? db.select().from(deliveries).where(inArray(deliveries.id, ids.deliveries)) : [],
    ids.ledgers?.length ? db.select().from(parcelFinancialLedgers).where(inArray(parcelFinancialLedgers.id, ids.ledgers)) : [],
  ]);
  return { namespace: SYNTHETIC_WAVE_NAMESPACE, seeded: true, scenarios: SYNTHETIC_SCENARIOS, createdAt: latest.createdAt, counts: { runs: runs.length, waves: waves.length, parcels: deliveriesRows.length, ledgers: ledgerRows.length }, statuses: waves.reduce<Record<string, number>>((result, wave) => { result[wave.status] = (result[wave.status] ?? 0) + 1; return result; }, {}) };
}

export async function seedSyntheticWaveOperations(actorUserId: number) {
  const db = await dbOrThrow();
  const existing = await getSyntheticWaveHarnessStatus();
  if (existing.seeded) return { idempotent: true, ...existing };
  const ids = emptyIds();
  const namespace = SYNTHETIC_WAVE_NAMESPACE;
  const syntheticUsers: number[] = [];
  const customer = (await db.insert(users).values({ openId: `${namespace}:customer`, name: "TEST Synthetic Customer", email: "qa.synthetic.customer@invalid.mzansi", role: "customer", isVerified: true, loginMethod: "synthetic-test" }).$returningId())[0];
  if (!customer?.id) throw new Error("Synthetic customer could not be created");
  ids.users.push(customer.id); syntheticUsers.push(customer.id);
  for (let index = 1; index <= 5; index += 1) {
    const courier = (await db.insert(users).values({ openId: `${namespace}:courier:${index}`, name: `TEST Synthetic Courier ${index}`, email: `qa.synthetic.courier${index}@invalid.mzansi`, role: "courier", isVerified: true, loginMethod: "synthetic-test" }).$returningId())[0];
    if (!courier?.id) throw new Error(`Synthetic courier ${index} could not be created`);
    ids.users.push(courier.id); syntheticUsers.push(courier.id);
    const profile = (await db.insert(courierProfiles).values({ userId: courier.id, vehicleType: index === 1 ? "van" : "car", vehicleRegistration: `QA-${index}-TEST`, licenseNumber: `QA-LIC-${index}`, province: "Gauteng", region: "Synthetic QA corridor", isAvailable: true, rating: "5.00", totalDeliveries: 0, totalEarnings: "0.00" }).$returningId())[0];
    if (profile?.id) ids.courierProfiles.push(profile.id);
    const vehicle = (await db.insert(vehicleCostProfiles).values({ courierId: courier.id, vehicleType: index === 1 ? "van" : "car", makeModel: index === 1 ? "TEST Van" : "TEST Sedan", modelYear: 2024, fuelType: "petrol", fuelPricePerLitre: "24.00", fuelLitresPer100Km: index === 1 ? "9.00" : "7.00", driverCompensationPerKm: "2.20", vehicleAllowancePerKm: "1.10", routeOverheadPerKm: "0.35", capacityUnits: index === 1 ? 15 : 12, capacityWeightKg: index === 1 ? "120.00" : "60.00", capacityVolumeM3: index === 1 ? "1.5000" : "0.7000", verificationStatus: "verified", evidenceNote: `${namespace}: verified synthetic QA profile`, verifiedBy: actorUserId, verifiedAt: new Date() }).$returningId())[0];
    if (vehicle?.id) ids.vehicleCostProfiles.push(vehicle.id);
  }

  const addressIds: number[] = [];
  for (let index = 0; index < 6; index += 1) {
    const address = (await db.insert(addresses).values({ userId: customer.id, label: `${namespace}:address:${index}`, street: `${index + 1} Synthetic QA Way`, city: index % 2 ? "Cape Town" : "Johannesburg", postalCode: "0000", latitude: index % 2 ? "-33.92490000" : "-26.20410000", longitude: index % 2 ? "18.42410000" : "28.04730000", isDefault: index === 0 }).$returningId())[0];
    if (!address?.id) throw new Error("Synthetic address could not be created");
    ids.addresses.push(address.id); addressIds.push(address.id);
  }

  const scenarios: Array<{ key: string; count: number; courierIds: number[]; price: number; weight: number; relay?: boolean }> = [
    { key: "normal-single-wave", count: 1, courierIds: [syntheticUsers[1]], price: 180, weight: 2 },
    { key: "multi-wave-50-plus-parcels", count: 55, courierIds: [syntheticUsers[1], syntheticUsers[2], syntheticUsers[3], syntheticUsers[4]], price: 220, weight: 2 },
    { key: "waiting-for-departure", count: 1, courierIds: [syntheticUsers[2]], price: 200, weight: 3 },
    { key: "active-in-progress", count: 1, courierIds: [syntheticUsers[3]], price: 260, weight: 4 },
    { key: "completed-wave", count: 1, courierIds: [syntheticUsers[4]], price: 280, weight: 5 },
    { key: "courier-cancellation-no-show", count: 1, courierIds: [syntheticUsers[5]], price: 200, weight: 3 },
    { key: "failed-handover", count: 1, courierIds: [syntheticUsers[1], syntheticUsers[2]], price: 480, weight: 6, relay: true },
    { key: "fully-reconciled-settled", count: 1, courierIds: [syntheticUsers[2]], price: 320, weight: 3 },
  ];
  const runWavePairs: Array<{ key: string; runId: number; waveIds: number[]; deliveryIds: number[]; courierIds: number[] }> = [];
  let parcelIndex = 0;
  for (const scenario of scenarios) {
    const deliveryIds: number[] = [];
    const assignmentRows: Array<{ deliveryId: number; courierId: number; sequence: number }> = [];
    for (let index = 0; index < scenario.count; index += 1) {
      const pickup = addressIds[(parcelIndex + index) % addressIds.length];
      const dropoff = addressIds[(parcelIndex + index + 1) % addressIds.length];
      const lat1 = pickup % 2 ? -33.9249 : -26.2041;
      const lng1 = pickup % 2 ? 18.4241 : 28.0473;
      const lat2 = dropoff % 2 ? -33.9249 : -26.2041;
      const lng2 = dropoff % 2 ? 18.4241 : 28.0473;
      const delivery = (await db.insert(deliveries).values({ customerId: customer.id, recipientName: `TEST Recipient ${scenario.key} ${index + 1}`, recipientEmail: "qa.synthetic.recipient@invalid.mzansi", recipientPhone: "+27000000000", courierId: scenario.courierIds[index % scenario.courierIds.length], pickupAddressId: pickup, dropoffAddressId: dropoff, pickupLatitude: lat1.toFixed(8), pickupLongitude: lng1.toFixed(8), dropoffLatitude: lat2.toFixed(8), dropoffLongitude: lng2.toFixed(8), status: "pending", packageSize: scenario.weight > 4 ? "large" : "medium", packageType: "box", lengthCm: "30.0", widthCm: "20.0", heightCm: "15.0", fragile: false, livestock: false, packageWeight: scenario.weight.toFixed(2), packageDescription: `${namespace}:${scenario.key}`, trackingCode: tracking(namespace, scenario.key, parcelIndex + index), estimatedPrice: scenario.price.toFixed(2), finalPrice: scenario.price.toFixed(2), distance: "90.00", estimatedDeliveryTime: 240, notes: `TEST / SYNTHETIC DATA ONLY · ${namespace} · scenario=${scenario.key}` }).$returningId())[0];
      if (!delivery?.id) throw new Error(`Synthetic delivery could not be created for ${scenario.key}`);
      ids.deliveries.push(delivery.id); deliveryIds.push(delivery.id);
      await initializeParcelLedger({ deliveryId: delivery.id, customerPayment: scenario.price, paymentCost: 0, reserveAmount: scenario.key.includes("recovery") || scenario.key === "failed-handover" ? 45 : 0 });
      assignmentRows.push({ deliveryId: delivery.id, courierId: scenario.courierIds[index % scenario.courierIds.length], sequence: index + 1 });
      if (scenario.relay && index === 0) {
        const leg1 = (await db.insert(deliveryRelayLegs).values({ deliveryId: delivery.id, sequence: 1, originArea: "Johannesburg", destinationArea: "Bloemfontein", meetingAddress: "Synthetic QA handover 1", meetingLatitude: "-29.0852", meetingLongitude: "26.1596", roadDistanceKm: "410.00", routeDurationMinutes: 260, routePolyline: `${namespace}:polyline:1`, tollsZar: "120.00", handoverTimeMinutes: 20, deadheadKm: "15.00", returnKm: "30.00", availableBackhaul: true, backhaulRevenueZar: "80.00", fromCourierId: scenario.courierIds[0], toCourierId: scenario.courierIds[1], status: "accepted", currentCustodianId: scenario.courierIds[0] }).$returningId())[0];
        const leg2 = (await db.insert(deliveryRelayLegs).values({ deliveryId: delivery.id, sequence: 2, originArea: "Bloemfontein", destinationArea: "Cape Town", meetingAddress: "Synthetic QA final handover", meetingLatitude: "-33.9249", meetingLongitude: "18.4241", roadDistanceKm: "920.00", routeDurationMinutes: 560, routePolyline: `${namespace}:polyline:2`, tollsZar: "180.00", handoverTimeMinutes: 20, deadheadKm: "25.00", returnKm: "45.00", availableBackhaul: false, backhaulRevenueZar: "0.00", fromCourierId: scenario.courierIds[1], toCourierId: scenario.courierIds[0], status: "handoff_pending", currentCustodianId: scenario.courierIds[0] }).$returningId())[0];
        if (leg1?.id) ids.relayLegs.push(leg1.id);
        if (leg2?.id) ids.relayLegs.push(leg2.id);
      }
    }
    parcelIndex += scenario.count;
    const run = (await db.insert(dispatchRuns).values({ status: "committed", requestedBy: actorUserId, parcelCount: scenario.count, assignedCount: scenario.count, unassignedCount: 0, aiSummary: `TEST / SYNTHETIC DATA ONLY · namespace=${namespace} · scenario=${scenario.key}` }).$returningId())[0];
    if (!run?.id) throw new Error(`Synthetic dispatch run could not be created for ${scenario.key}`);
    ids.dispatchRuns.push(run.id);
    const assignments = await db.insert(dispatchAssignments).values(assignmentRows.map((assignment) => ({ dispatchRunId: run.id, deliveryId: assignment.deliveryId, courierId: assignment.courierId, sequence: assignment.sequence, score: "99.00", distanceToPickupKm: "0.50", areaMatch: "Synthetic QA corridor", reasoning: `${namespace}:${scenario.key}`, status: "assigned" as const }))).$returningId();
    ids.assignments.push(...assignments.map((row) => row.id));
    const materialized = await materializeDispatchWaves({ dispatchRunId: run.id, actorUserId, departureGapMinutes: 30 });
    const waveIds = materialized.waves.map((wave) => wave.id);
    ids.waves.push(...waveIds);
    runWavePairs.push({ key: scenario.key, runId: run.id, waveIds, deliveryIds, courierIds: scenario.courierIds });
  }

  const waveRows = ids.waves.length ? await db.select().from(dispatchWaves).where(inArray(dispatchWaves.id, ids.waves)) : [];
  const waveParcelRows = ids.waves.length ? await db.select().from(dispatchWaveParcels).where(inArray(dispatchWaveParcels.waveId, ids.waves)) : [];
  const waveCourierRows = ids.waves.length ? await db.select().from(dispatchWaveCouriers).where(inArray(dispatchWaveCouriers.waveId, ids.waves)) : [];
  const waveLegRows = ids.waves.length ? await db.select().from(dispatchWaveRelayLegs).where(inArray(dispatchWaveRelayLegs.waveId, ids.waves)) : [];
  const waveRunRows = ids.waves.length ? await db.select().from(dispatchWaveRunLinks).where(inArray(dispatchWaveRunLinks.waveId, ids.waves)) : [];
  ids.waveParcels.push(...waveParcelRows.map((row) => row.id)); ids.waveCouriers.push(...waveCourierRows.map((row) => row.id)); ids.waveRelayLegs.push(...waveLegRows.map((row) => row.id)); ids.waveRunLinks.push(...waveRunRows.map((row) => row.id));

  for (const pair of runWavePairs) {
    for (const waveId of pair.waveIds) {
      if (pair.key === "active-in-progress") { await transition(waveId, "ready", actorUserId, `${namespace}: active wave ready`); await transition(waveId, "departed", actorUserId, `${namespace}: active wave departed`); await transition(waveId, "in_progress", actorUserId, `${namespace}: active wave in progress`); }
      if (pair.key === "completed-wave") { await transition(waveId, "ready", actorUserId, `${namespace}: completed wave ready`); await transition(waveId, "departed", actorUserId, `${namespace}: completed wave departed`); await transition(waveId, "in_progress", actorUserId, `${namespace}: completed wave in progress`); await transition(waveId, "completed", actorUserId, `${namespace}: completed wave done`); }
      if (pair.key === "courier-cancellation-no-show") { const courierLink = waveCourierRows.find((row) => row.waveId === waveId); if (courierLink) await db.update(dispatchWaveCouriers).set({ status: "cancelled" }).where(eq(dispatchWaveCouriers.id, courierLink.id)); await transition(waveId, "failed", actorUserId, `${namespace}: courier no-show`); }
      if (pair.key === "failed-handover") { await transition(waveId, "ready", actorUserId, `${namespace}: relay ready`); await transition(waveId, "departed", actorUserId, `${namespace}: relay departed`); await transition(waveId, "handover", actorUserId, `${namespace}: handover started`); const deliveryId = pair.deliveryIds[0]; const exception = (await db.insert(relayExceptionEvents).values({ deliveryId, relayLegId: ids.relayLegs[1] ?? null, reportedByUserId: pair.courierIds[0], currentCustodianId: pair.courierIds[0], type: "handoff_failed", status: "recovery_requested", recoveryAction: "request_replacement", reason: `${namespace}: synthetic failed handover`, note: "TEST / SYNTHETIC DATA ONLY", latitude: "-29.0852000", longitude: "26.1596000" }).$returningId())[0]; if (exception?.id) { ids.exceptions.push(exception.id); const recovery = await recordWaveRecovery({ waveId, exceptionId: exception.id, originalCourierId: pair.courierIds[0], replacementCourierId: pair.courierIds[1], idempotencyKey: `${namespace}:recovery:${waveId}`, reason: `${namespace}: replacement courier requested` }); if (recovery?.id) ids.recoveryActions.push(recovery.id); } await transition(waveId, "failed", actorUserId, `${namespace}: failed handover`); }
      if (pair.key === "fully-reconciled-settled") { await transition(waveId, "ready", actorUserId, `${namespace}: settlement ready`); await transition(waveId, "departed", actorUserId, `${namespace}: settlement departed`); await transition(waveId, "in_progress", actorUserId, `${namespace}: settlement in progress`); await transition(waveId, "completed", actorUserId, `${namespace}: settlement completed`); const deliveryId = pair.deliveryIds[0]; const courierId = pair.courierIds[0]; const delivery = (await db.select().from(deliveries).where(eq(deliveries.id, deliveryId)).limit(1))[0]; const profile = (await db.select().from(vehicleCostProfiles).where(eq(vehicleCostProfiles.courierId, courierId)).limit(1))[0]; if (delivery && profile) { const charge = Number(delivery.finalPrice ?? delivery.estimatedPrice); const pool = round(charge * 0.8); const allocation = (await db.insert(relaySettlementAllocations).values({ settlementKey: `${namespace}:allocation:${deliveryId}`, deliveryId, relayLegId: null, courierId, vehicleCostProfileId: profile.id, weekStart: new Date("2026-10-05T00:00:00.000Z"), customerCharge: charge.toFixed(2), platformFee: (charge * 0.2).toFixed(2), courierPool: pool.toFixed(2), linehaulDistanceKm: "90.00", deadheadKm: "5.00", returnKm: "10.00", totalDrivenKm: "105.00", operatingCost: "110.00", handoverFee: "0.00", grossEarnings: (pool * 0.7).toFixed(2), estimatedNet: (pool * 0.7 - 110).toFixed(2), minimumPayout: "80.00", parcelCountOnLeg: 1, parcelWeightKg: String(delivery.packageWeight), parcelVolumeM3: "0.0090", vehicleCapacityUnits: profile.capacityUnits, vehicleCapacityWeightKg: profile.capacityWeightKg, vehicleCapacityVolumeM3: profile.capacityVolumeM3, tolls: "0.00", handoverTimeMinutes: 0, availableBackhaul: false, backhaulRevenue: "0.00", totalCourierPoolAvailable: pool.toFixed(2), status: "paid" }).$returningId())[0]; if (allocation?.id) { ids.allocations.push(allocation.id); await appendParcelLedgerEvent({ deliveryId, eventKey: `${namespace}:ledger:${deliveryId}:leg-allocation`, type: "leg_allocation", amount: pool * 0.7, courierId, reference: namespace }); await appendParcelLedgerEvent({ deliveryId, eventKey: `${namespace}:ledger:${deliveryId}:payout-cost`, type: "payout_cost", amount: 0, courierId, reference: namespace }); await markParcelLedgerSettled(deliveryId); const link = (await db.insert(dispatchWaveSettlementLinks).values({ waveId, settlementAllocationId: allocation.id, deliveryId, courierId, amount: (pool * 0.7).toFixed(2), idempotencyKey: `${namespace}:wave:${waveId}:settlement:${allocation.id}` }).$returningId())[0]; if (link?.id) ids.settlementLinks.push(link.id); } } await transition(waveId, "settled", actorUserId, `${namespace}: fully reconciled and settled`); }
    }
  }

  const allWaveEvents = ids.waves.length ? await db.select().from(dispatchWaveEvents).where(inArray(dispatchWaveEvents.waveId, ids.waves)) : [];
  const allRecovery = ids.waves.length ? await db.select().from(dispatchWaveRecoveryActions).where(inArray(dispatchWaveRecoveryActions.waveId, ids.waves)) : [];
  const allReconciliations = ids.dispatchRuns.length ? await db.select().from(dispatchRunReconciliations).where(inArray(dispatchRunReconciliations.dispatchRunId, ids.dispatchRuns)) : [];
  const allLedgers = ids.deliveries.length ? await db.select().from(parcelFinancialLedgers).where(inArray(parcelFinancialLedgers.deliveryId, ids.deliveries)) : [];
  const allLedgerEntries = allLedgers.length ? await db.select().from(parcelFinancialLedgerEntries).where(inArray(parcelFinancialLedgerEntries.ledgerId, allLedgers.map((row) => row.id))) : [];
  ids.waveEvents.push(...allWaveEvents.map((row) => row.id)); ids.recoveryActions.push(...allRecovery.map((row) => row.id)); ids.reconciliations.push(...allReconciliations.map((row) => row.id)); ids.ledgers.push(...allLedgers.map((row) => row.id)); ids.ledgerEntries.push(...allLedgerEntries.map((row) => row.id));
  for (const runId of ids.dispatchRuns) await reconcileDispatchRun(runId);
  await db.insert(syntheticWaveHarnessRuns).values({ namespace, createdBy: actorUserId, recordIds: ids });
  return { idempotent: false, namespace, scenarios: SYNTHETIC_SCENARIOS, counts: Object.fromEntries(Object.entries(ids).map(([key, value]) => [key, value.length])) };
}

export async function resetSyntheticWaveOperations() {
  const db = await dbOrThrow();
  const catalog = (await db.select().from(syntheticWaveHarnessRuns).where(eq(syntheticWaveHarnessRuns.namespace, SYNTHETIC_WAVE_NAMESPACE)).limit(1))[0];
  if (!catalog) return { namespace: SYNTHETIC_WAVE_NAMESPACE, reset: true, deleted: emptyIds() };
  const ids = catalog.recordIds as SyntheticHarnessIds;
  if (ids.settlementLinks?.length) await db.delete(dispatchWaveSettlementLinks).where(inArray(dispatchWaveSettlementLinks.id, ids.settlementLinks));
  if (ids.allocations?.length) await db.delete(relaySettlementAllocations).where(inArray(relaySettlementAllocations.id, ids.allocations));
  if (ids.ledgerEntries?.length) await db.delete(parcelFinancialLedgerEntries).where(inArray(parcelFinancialLedgerEntries.id, ids.ledgerEntries));
  if (ids.ledgers?.length) await db.delete(parcelFinancialLedgers).where(inArray(parcelFinancialLedgers.id, ids.ledgers));
  if (ids.reconciliations?.length) await db.delete(dispatchRunReconciliations).where(inArray(dispatchRunReconciliations.id, ids.reconciliations));
  if (ids.recoveryActions?.length) await db.delete(dispatchWaveRecoveryActions).where(inArray(dispatchWaveRecoveryActions.id, ids.recoveryActions));
  if (ids.exceptions?.length) await db.delete(relayExceptionEvents).where(inArray(relayExceptionEvents.id, ids.exceptions));
  if (ids.waveEvents?.length) await db.delete(dispatchWaveEvents).where(inArray(dispatchWaveEvents.id, ids.waveEvents));
  if (ids.waveRunLinks?.length) await db.delete(dispatchWaveRunLinks).where(inArray(dispatchWaveRunLinks.id, ids.waveRunLinks));
  if (ids.waveRelayLegs?.length) await db.delete(dispatchWaveRelayLegs).where(inArray(dispatchWaveRelayLegs.id, ids.waveRelayLegs));
  if (ids.waveCouriers?.length) await db.delete(dispatchWaveCouriers).where(inArray(dispatchWaveCouriers.id, ids.waveCouriers));
  if (ids.waveParcels?.length) await db.delete(dispatchWaveParcels).where(inArray(dispatchWaveParcels.id, ids.waveParcels));
  if (ids.waves?.length) await db.delete(dispatchWaves).where(inArray(dispatchWaves.id, ids.waves));
  if (ids.assignments?.length) await db.delete(dispatchAssignments).where(inArray(dispatchAssignments.id, ids.assignments));
  if (ids.dispatchRuns?.length) await db.delete(dispatchRuns).where(inArray(dispatchRuns.id, ids.dispatchRuns));
  if (ids.relayLegs?.length) await db.delete(deliveryRelayLegs).where(inArray(deliveryRelayLegs.id, ids.relayLegs));
  if (ids.deliveries?.length) await db.delete(deliveries).where(inArray(deliveries.id, ids.deliveries));
  if (ids.addresses?.length) await db.delete(addresses).where(inArray(addresses.id, ids.addresses));
  if (ids.vehicleCostProfiles?.length) await db.delete(vehicleCostProfiles).where(inArray(vehicleCostProfiles.id, ids.vehicleCostProfiles));
  if (ids.courierProfiles?.length) await db.delete(courierProfiles).where(inArray(courierProfiles.id, ids.courierProfiles));
  if (ids.users?.length) await db.delete(users).where(inArray(users.id, ids.users));
  await db.delete(syntheticWaveHarnessRuns).where(eq(syntheticWaveHarnessRuns.id, catalog.id));
  return { namespace: SYNTHETIC_WAVE_NAMESPACE, reset: true, deleted: ids };
}
