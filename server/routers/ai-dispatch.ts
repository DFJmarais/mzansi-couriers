import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { adminProcedure, router } from "../_core/trpc";
import { addresses, courierProfiles, courierVehicles, courierWorkZones, courierZones, deliveries, deliveryTracking, dispatchAssignments, dispatchRuns, deliveryRuns, deliveryRunStops, notifications, userPreferences, users, courierHandoffOffers, deliveryRelayLegs, relayHandoffPoints, smartStackRecommendations, smartAddonOpportunities, smartMatchAudits, vehicleCostProfiles } from "../../drizzle/schema";
import { defaultCapacityUnits, defaultWeightCapacityKg, sequenceAssignmentsForCourier, type ParcelSize, type VehicleType } from "../dispatch/assignment-engine";
import { allocateSmartParcels, evaluateAddOn, type SmartCourier, type SmartParcel } from "../dispatch/smartstack-engine";
import { chooseHandoffLocation } from "../relay/handoff-selection";
import { calculateCourierSafety } from "../safety/courier-safety";
import { getDrivingRoute } from "../services/route-geometry";
import { validateDispatchReadiness } from "../services/launch-readiness";
import { materializeDispatchWaves } from "../services/dispatch-waves";

const dispatchInput = z.object({ includeAssigned: z.boolean().default(false) });

function areaName(city: string, street: string) {
  return city.trim() || street.split(",")[0]?.trim() || "Unknown South Africa";
}

export const aiDispatchRouter = router({
  recommend: adminProcedure.input(dispatchInput).mutation(async ({ ctx, input }) => {
    const db = await getDbOrThrow();
    const deliveryRows = await db.select().from(deliveries)
      .where(input.includeAssigned ? inArray(deliveries.status, ["pending", "assigned"]) : and(eq(deliveries.status, "pending"), isNull(deliveries.courierId)))
      .orderBy(asc(deliveries.createdAt));
    const addressIds = deliveryRows.reduce<number[]>((ids, delivery) => ids.concat([delivery.pickupAddressId, delivery.dropoffAddressId]), []);
    const addressRows = addressIds.length ? await db.select().from(addresses).where(inArray(addresses.id, addressIds)) : [];
    const addressById = new Map(addressRows.map((address) => [address.id, address]));
    const parcelRows = deliveryRows.map((delivery) => ({ delivery, pickup: addressById.get(delivery.pickupAddressId), dropoff: addressById.get(delivery.dropoffAddressId) })).filter((row) => row.pickup && row.dropoff) as Array<{ delivery: typeof deliveryRows[number]; pickup: typeof addressRows[number]; dropoff: typeof addressRows[number] }>;

    const profileRows = await db.select().from(courierProfiles).where(eq(courierProfiles.isAvailable, true));
    const courierIds = profileRows.map((profile) => profile.userId);
    const [userRows, vehicleRows, zoneRows, locationRows, preferenceRows] = courierIds.length ? await Promise.all([
      db.select().from(users).where(inArray(users.id, courierIds)),
      db.select().from(courierVehicles).where(and(inArray(courierVehicles.courierId, courierIds), eq(courierVehicles.isPrimary, true), eq(courierVehicles.verified, true))),
      db.select({ assignment: courierWorkZones, zone: courierZones }).from(courierWorkZones).innerJoin(courierZones, eq(courierWorkZones.zoneId, courierZones.id)).where(and(inArray(courierWorkZones.courierId, courierIds), eq(courierZones.isActive, true))),
      db.select().from(deliveryTracking).where(inArray(deliveryTracking.courierId, courierIds)).orderBy(desc(deliveryTracking.timestamp)),
      db.select().from(userPreferences).where(inArray(userPreferences.userId, courierIds)),
    ]) : [[], [], [], [], []];

    const safetyByCourier = new Map(courierIds.map((courierId) => [courierId, calculateCourierSafety(locationRows.filter((row) => row.courierId === courierId).map((row) => ({ latitude: Number(row.latitude), longitude: Number(row.longitude), timestamp: row.timestamp })))]));
    const safeProfileRows = profileRows.filter((profile) => safetyByCourier.get(profile.userId)?.eligibleForOffers !== false);
    const userById = new Map(userRows.map((user) => [user.id, user]));
    const vehicleByCourier = new Map(vehicleRows.map((vehicle) => [vehicle.courierId, vehicle]));
    const zonesByCourier = new Map<number, string[]>();
    for (const row of zoneRows) zonesByCourier.set(row.assignment.courierId, [...(zonesByCourier.get(row.assignment.courierId) ?? []), row.zone.city, row.zone.name]);
    const zoneById = new Map(zoneRows.map((row) => [row.zone.id, row.zone]));
    for (const preference of preferenceRows) {
      const preferred = preference.preferredZone ? zoneById.get(preference.preferredZone) : undefined;
      if (preferred) zonesByCourier.set(preference.userId, [...(zonesByCourier.get(preference.userId) ?? []), preferred.city, preferred.name]);
    }
    const locationByCourier = new Map<number, { lat: number; lng: number }>();
    for (const row of locationRows) if (!locationByCourier.has(row.courierId)) locationByCourier.set(row.courierId, { lat: Number(row.latitude), lng: Number(row.longitude) });

    const parcels: SmartParcel[] = parcelRows.map(({ delivery, pickup, dropoff }) => ({
      id: delivery.id,
      trackingCode: delivery.trackingCode,
      pickup: { lat: Number(delivery.pickupLatitude), lng: Number(delivery.pickupLongitude), area: areaName(pickup.city, pickup.street) },
      dropoff: { lat: Number(delivery.dropoffLatitude), lng: Number(delivery.dropoffLongitude), area: areaName(dropoff.city, dropoff.street) },
      packageSize: delivery.packageSize as ParcelSize,
      packageWeightKg: Number(delivery.packageWeight),
      priority: delivery.status === "pending" ? 5 : 3,
      estimatedPriceZar: Number(delivery.estimatedPrice),
      deadlineAt: delivery.estimatedDeliveryTime ? Date.now() + Number(delivery.estimatedDeliveryTime) * 60_000 : null,
      pickupServiceMinutes: 5,
      deliveryServiceMinutes: 5,
    }));
    const couriers: SmartCourier[] = safeProfileRows.map((profile) => {
      const vehicle = vehicleByCourier.get(profile.userId);
      const vehicleType = profile.vehicleType as VehicleType;
      return {
        id: profile.userId,
        name: userById.get(profile.userId)?.name ?? `Courier ${profile.userId}`,
        vehicleType,
        capacityUnits: vehicle?.capacityUnits ?? defaultCapacityUnits[vehicleType],
        maxWeightKg: defaultWeightCapacityKg[vehicleType],
        isAvailable: profile.isAvailable,
        currentLocation: locationByCourier.get(profile.userId) ?? null,
        workingAreas: zonesByCourier.get(profile.userId) ?? [],
      };
    });

    const deterministic = allocateSmartParcels(parcels, couriers);
    let selected = deterministic.assignments;
    let aiSummary = "Deterministic dispatch selected the safest available courier for each eligible parcel.";
    if (selected.length > 0) {
      try {
        const allowed = selected.map((assignment) => ({ parcelId: assignment.parcelId, courierId: assignment.courierId, sequence: assignment.sequence }));
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a dispatch assistant. Return only assignments using the allowed parcel/courier pairs. Never invent IDs, never exceed the allowed pairs, and preserve all parcels unless an assignment is explicitly impossible." },
            { role: "user", content: JSON.stringify({ parcels, couriers, allowedAssignments: allowed }) },
          ],
          response_format: { type: "json_schema", json_schema: { name: "dispatch_recommendation", strict: true, schema: { type: "object", properties: { assignments: { type: "array", items: { type: "object", properties: { parcelId: { type: "integer" }, courierId: { type: "integer" }, reasoning: { type: "string" } }, required: ["parcelId", "courierId", "reasoning"], additionalProperties: false } }, summary: { type: "string" } }, required: ["assignments", "summary"], additionalProperties: false } } },
        });
        const content = response.choices[0]?.message?.content;
        if (typeof content === "string") {
          const parsed = JSON.parse(content) as { assignments: Array<{ parcelId: number; courierId: number; reasoning: string }>; summary: string };
          const allowedKeys = new Set(allowed.map((item) => `${item.parcelId}:${item.courierId}`));
          const safeAi = parsed.assignments.filter((item) => allowedKeys.has(`${item.parcelId}:${item.courierId}`));
          if (safeAi.length === selected.length) {
            selected = selected.map((assignment) => ({ ...assignment, reasoning: safeAi.find((item) => item.parcelId === assignment.parcelId && item.courierId === assignment.courierId)?.reasoning || assignment.reasoning }));
            aiSummary = parsed.summary.slice(0, 2000);
          }
        }
      } catch (error) {
        console.warn("[AI Dispatch] AI recommendation unavailable; deterministic allocation retained", error);
      }
    }

    const [run] = await db.insert(dispatchRuns).values({ status: "recommended", requestedBy: ctx.user.id, parcelCount: parcels.length, assignedCount: selected.length, unassignedCount: deterministic.unassigned.length, aiSummary }).$returningId();
    if (!run?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Dispatch run could not be created" });
    if (selected.length) await db.insert(dispatchAssignments).values(selected.map((assignment) => ({ dispatchRunId: run.id, deliveryId: assignment.parcelId, courierId: assignment.courierId, sequence: assignment.sequence, score: String(assignment.score), distanceToPickupKm: assignment.distanceToPickupKm === null ? null : String(assignment.distanceToPickupKm), areaMatch: assignment.areaMatch, reasoning: assignment.reasoning, status: "recommended" as const })));
    if (deterministic.stacks.length) {
      await db.insert(smartStackRecommendations).values(deterministic.stacks.map((stack) => ({
        courierId: stack.courierId,
        status: "recommended" as const,
        stackScore: String(stack.metrics.stackScore),
        totalDistanceKm: String(stack.metrics.totalDistanceKm),
        totalTimeMinutes: stack.metrics.totalTimeMinutes,
        grossEarnings: String(stack.metrics.grossEarnings),
        platformFee: String(stack.metrics.platformFee),
        estimatedFuel: String(stack.metrics.estimatedFuel),
        estimatedCourierNet: String(stack.metrics.estimatedCourierNet),
        capacityUsedUnits: stack.metrics.capacityUsedUnits,
        capacityUnits: stack.metrics.capacityUnits,
        deadlineRisk: stack.metrics.deadlineRisk,
        emptyKilometres: String(stack.metrics.emptyKilometres),
        routeStops: stack.metrics.route,
        selectionReason: stack.metrics.reason,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      })));
    }
    const unassignedParcels = deterministic.unassigned.map(({ parcelId }) => parcels.find((parcel) => parcel.id === parcelId)).filter((parcel): parcel is SmartParcel => Boolean(parcel));
    for (const stack of deterministic.stacks) {
      const courier = couriers.find((candidate) => candidate.id === stack.courierId);
      if (!courier || !unassignedParcels.length) continue;
      const currentStack = selected.filter((assignment) => assignment.courierId === stack.courierId).map((assignment) => parcels.find((parcel) => parcel.id === assignment.parcelId)).filter((parcel): parcel is SmartParcel => Boolean(parcel));
      const addOns = unassignedParcels.map((candidate) => ({ candidate, evaluation: evaluateAddOn(currentStack, candidate, courier) })).filter(({ evaluation }) => evaluation.acceptedByRules).slice(0, 3);
      if (addOns.length) await db.insert(smartAddonOpportunities).values(addOns.map(({ candidate, evaluation }) => ({ recommendationId: null, courierId: courier.id, deliveryId: candidate.id, status: "offered" as const, additionalDistanceKm: String(evaluation.addedDistanceKm), additionalTimeMinutes: evaluation.addedTimeMinutes, additionalPayout: String(evaluation.additionalPayout), deadlineRisk: evaluation.metrics.deadlineRisk, score: String(evaluation.metrics.stackScore), reason: evaluation.reason, expiresAt: new Date(Date.now() + 30 * 60 * 1000) })));
    }
    if (selected.length) {
      const stackByCourier = new Map(deterministic.stacks.map((stack) => [stack.courierId, stack]));
      await db.insert(smartMatchAudits).values(selected.map((assignment) => {
        const stack = stackByCourier.get(assignment.courierId);
        return {
          courierId: assignment.courierId,
          deliveryId: assignment.parcelId,
          matchScore: String(assignment.score),
          routeCompatibilityScore: String(assignment.score),
          deadlineRisk: stack?.metrics.deadlineRisk ?? "medium",
          decision: "recommended" as const,
          routeConsidered: stack?.metrics.route ?? null,
          reason: assignment.reasoning,
        };
      }));
    }
    return { runId: run.id, parcelCount: parcels.length, assignedCount: selected.length, unassigned: deterministic.unassigned, assignments: selected, stacks: deterministic.stacks, aiSummary };
  }),

  commit: adminProcedure.input(z.object({ dispatchRunId: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = await getDbOrThrow();
    const result = await db.transaction(async (tx) => {
      const run = await tx.select().from(dispatchRuns).where(eq(dispatchRuns.id, input.dispatchRunId)).limit(1);
      if (!run[0] || run[0].status !== "recommended") throw new TRPCError({ code: "CONFLICT", message: "This dispatch recommendation is no longer available" });
      const assignments = await tx.select().from(dispatchAssignments).where(and(eq(dispatchAssignments.dispatchRunId, input.dispatchRunId), eq(dispatchAssignments.status, "recommended")));
      // Hard gate: no assignment is committed until road geometry, verified vehicle
      // economics, capacity, reserves, and courier net have been recalculated.
      for (const assignment of assignments) {
        const delivery = (await tx.select().from(deliveries).where(eq(deliveries.id, assignment.deliveryId)).limit(1))[0];
        const pickup = delivery ? (await tx.select().from(addresses).where(eq(addresses.id, delivery.pickupAddressId)).limit(1))[0] : undefined;
        const dropoff = delivery ? (await tx.select().from(addresses).where(eq(addresses.id, delivery.dropoffAddressId)).limit(1))[0] : undefined;
        const profile = (await tx.select().from(vehicleCostProfiles).where(and(eq(vehicleCostProfiles.courierId, assignment.courierId), eq(vehicleCostProfiles.verificationStatus, "verified"))).limit(1))[0];
        if (!delivery || !pickup || !dropoff || !profile) throw new TRPCError({ code: "CONFLICT", message: `Dispatch blocked for parcel ${assignment.deliveryId}: missing verified route inputs or vehicle-cost profile` });
        let route;
        try { route = await getDrivingRoute({ lat: Number(delivery.pickupLatitude), lng: Number(delivery.pickupLongitude) }, { lat: Number(delivery.dropoffLatitude), lng: Number(delivery.dropoffLongitude) }); }
        catch { throw new TRPCError({ code: "CONFLICT", message: `Dispatch blocked for parcel ${assignment.deliveryId}: actual road-route geometry is unavailable` }); }
        const readiness = validateDispatchReadiness({ customerChargeZar: Number(delivery.finalPrice ?? delivery.estimatedPrice), parcelCount: 1, totalWeightKg: Number(delivery.packageWeight), totalVolumeM3: Number(delivery.lengthCm) * Number(delivery.widthCm) * Number(delivery.heightCm) / 1_000_000, requiredReserveZar: 0, legs: [{ legId: `delivery-${delivery.id}`, sequence: 1, courierId: String(assignment.courierId), origin: pickup.city, destination: dropoff.city, distanceKm: route.distanceKm, parcelCountOnLeg: 1, parcelWeightKg: Number(delivery.packageWeight), parcelVolumeM3: Number(delivery.lengthCm) * Number(delivery.widthCm) * Number(delivery.heightCm) / 1_000_000, vehicleCapacityUnits: profile.capacityUnits ?? undefined, vehicleCapacityWeightKg: Number(profile.capacityWeightKg) || undefined, vehicleCapacityVolumeM3: Number(profile.capacityVolumeM3) || undefined, fuelPricePerLitre: Number(profile.fuelPricePerLitre), fuelLitresPer100Km: Number(profile.fuelLitresPer100Km), driverCompensationPerKm: Number(profile.driverCompensationPerKm), vehicleAllowancePerKm: Number(profile.vehicleAllowancePerKm), routeOverheadPerKm: Number(profile.routeOverheadPerKm) }] });
        if (readiness.decision !== "DISPATCH") throw new TRPCError({ code: "CONFLICT", message: `Dispatch blocked for parcel ${assignment.deliveryId}: ${readiness.decision} — ${readiness.reasons.join("; ") || "route is not economically viable"}` });
      }
      const assignmentsByCourier = new Map<number, typeof assignments>();
      const directRunAssignments = new Map<number, typeof assignments>();
      const assignmentCourierIds = Array.from(new Set(assignments.map((assignment) => assignment.courierId)));
      const assignmentTracking = assignmentCourierIds.length ? await tx.select().from(deliveryTracking).where(inArray(deliveryTracking.courierId, assignmentCourierIds)) : [];
      const safeAssignmentIds = new Set(assignmentCourierIds.filter((courierId) => calculateCourierSafety(assignmentTracking.filter((point) => point.courierId === courierId).map((point) => ({ latitude: Number(point.latitude), longitude: Number(point.longitude), timestamp: point.timestamp }))).eligibleForOffers));
      const unsafeAssignment = assignments.find((assignment) => !safeAssignmentIds.has(assignment.courierId));
      if (unsafeAssignment) throw new TRPCError({ code: "CONFLICT", message: `Courier ${unsafeAssignment.courierId} is on a fatigue cooldown and cannot receive a new pickup notification yet` });
      const availableNextCouriers = (await tx.select().from(courierProfiles).where(eq(courierProfiles.isAvailable, true))).filter((profile) => {
        const points = assignmentTracking.filter((point) => point.courierId === profile.userId);
        return calculateCourierSafety(points.map((point) => ({ latitude: Number(point.latitude), longitude: Number(point.longitude), timestamp: point.timestamp }))).eligibleForOffers;
      });
      const nextZoneRows = await tx.select({ assignment: courierWorkZones, zone: courierZones }).from(courierWorkZones).innerJoin(courierZones, eq(courierWorkZones.zoneId, courierZones.id)).where(eq(courierZones.isActive, true));
      const nextAreasByCourier = new Map<number, string[]>();
      for (const row of nextZoneRows) nextAreasByCourier.set(row.assignment.courierId, [...(nextAreasByCourier.get(row.assignment.courierId) ?? []), row.zone.city, row.zone.name]);
      for (const assignment of assignments) {
        const delivery = await tx.select({ id: deliveries.id }).from(deliveries).where(and(eq(deliveries.id, assignment.deliveryId), eq(deliveries.status, "pending"), isNull(deliveries.courierId))).limit(1);
        if (delivery.length === 0) throw new TRPCError({ code: "CONFLICT", message: `Parcel ${assignment.deliveryId} is no longer available for assignment` });
        const deliveryWithDropoff = await tx.select({ delivery: deliveries, dropoff: addresses }).from(deliveries).innerJoin(addresses, eq(deliveries.dropoffAddressId, addresses.id)).where(eq(deliveries.id, assignment.deliveryId)).limit(1);
        const destinationArea = deliveryWithDropoff[0] ? areaName(deliveryWithDropoff[0].dropoff.city, deliveryWithDropoff[0].dropoff.street) : "Unknown South Africa";
        const nextCourier = availableNextCouriers.find((candidate) => candidate.userId !== assignment.courierId && (nextAreasByCourier.get(candidate.userId) ?? []).some((area) => area.toLowerCase() === destinationArea.toLowerCase()));
        await tx.update(deliveries).set({ courierId: assignment.courierId, status: "assigned" }).where(eq(deliveries.id, assignment.deliveryId));
        await tx.update(dispatchAssignments).set({ status: "assigned" }).where(eq(dispatchAssignments.id, assignment.id));
        if (nextCourier) {
          const point = (await tx.select().from(relayHandoffPoints).where(and(eq(relayHandoffPoints.isActive, true), eq(relayHandoffPoints.area, destinationArea))).limit(1))[0];
          const [firstLeg] = await tx.insert(deliveryRelayLegs).values({ deliveryId: assignment.deliveryId, sequence: 1, originArea: "Sender area", destinationArea, toCourierId: assignment.courierId, status: "planned", handoffMode: "courier_meeting" }).$returningId();
          if (!firstLeg?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Relay pickup leg could not be created" });
          const handoffAddress = point?.address ?? "Safe public meeting point to be agreed by both couriers";
          const [secondLeg] = await tx.insert(deliveryRelayLegs).values({ deliveryId: assignment.deliveryId, sequence: 2, originArea: destinationArea, destinationArea, fromCourierId: assignment.courierId, toCourierId: nextCourier.userId, status: "planned", handoffPointId: point?.id ?? null, handoffMode: point ? "designated_point" : "courier_meeting", meetingAddress: handoffAddress, meetingLatitude: point ? String(point.latitude) : null, meetingLongitude: point ? String(point.longitude) : null }).$returningId();
          if (!secondLeg?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Relay handoff leg could not be created" });
          await tx.insert(courierHandoffOffers).values({ relayLegId: secondLeg.id, offeredByCourierId: assignment.courierId, offeredToCourierId: nextCourier.userId, status: "offered", expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
          await tx.insert(notifications).values({ userId: nextCourier.userId, type: "delivery_status", title: "Parcel handoff offer", message: `Parcel ${assignment.deliveryId} needs a relay handoff in ${destinationArea}. Meet at ${handoffAddress}.`, relatedDeliveryId: assignment.deliveryId });
        } else {
          const courierAssignments = directRunAssignments.get(assignment.courierId) ?? [];
          courierAssignments.push(assignment);
          directRunAssignments.set(assignment.courierId, courierAssignments);
        }
        const courierAssignments = assignmentsByCourier.get(assignment.courierId) ?? [];
        courierAssignments.push(assignment);
        assignmentsByCourier.set(assignment.courierId, courierAssignments);
      }
      for (const courierId of Array.from(directRunAssignments.keys())) {
        const courierAssignments = directRunAssignments.get(courierId) ?? [];
        const [deliveryRun] = await tx.insert(deliveryRuns).values({ courierId, status: "planned" }).$returningId();
        if (!deliveryRun?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Courier delivery run could not be created" });
        const routeParcels = await Promise.all(courierAssignments.map(async (assignment: typeof assignments[number]) => {
          const delivery = (await tx.select().from(deliveries).where(eq(deliveries.id, assignment.deliveryId)).limit(1))[0];
          const pickup = delivery ? (await tx.select().from(addresses).where(eq(addresses.id, delivery.pickupAddressId)).limit(1))[0] : undefined;
          const dropoff = delivery ? (await tx.select().from(addresses).where(eq(addresses.id, delivery.dropoffAddressId)).limit(1))[0] : undefined;
          return delivery && pickup && dropoff ? { id: delivery.id, pickup: { lat: Number(delivery.pickupLatitude), lng: Number(delivery.pickupLongitude), area: areaName(pickup.city, pickup.street) }, dropoff: { lat: Number(delivery.dropoffLatitude), lng: Number(delivery.dropoffLongitude), area: areaName(dropoff.city, dropoff.street) } } : null;
        })).then((rows) => rows.filter((parcel): parcel is NonNullable<typeof parcel> => Boolean(parcel)));
        const orderedAssignments = sequenceAssignmentsForCourier(courierAssignments.map((assignment: typeof assignments[number]) => ({ parcelId: assignment.deliveryId, sequence: assignment.sequence, assignment })), routeParcels).map(({ assignment }) => assignment);
        await tx.insert(deliveryRunStops).values(orderedAssignments.map((assignment: typeof assignments[number], index: number) => ({ runId: deliveryRun.id, deliveryId: assignment.deliveryId, sequence: index + 1, status: "queued" as const })));
        await tx.insert(notifications).values({ userId: courierId, type: "delivery_assigned", title: "Courier route ready", message: `You have ${courierAssignments.length} parcel${courierAssignments.length === 1 ? "" : "s"} ready for pickup in your area.`, relatedDeliveryId: courierAssignments[0]?.deliveryId ?? null });
      }
      await tx.update(dispatchRuns).set({ status: "committed", assignedCount: assignments.length }).where(eq(dispatchRuns.id, input.dispatchRunId));
      return { committed: true, assignedCount: assignments.length, courierRunsCreated: assignmentsByCourier.size };
    });
    // Wave records are materialized only after the dispatch transaction commits.
    // If materialization is retried, idempotency keys prevent duplicate operational records.
    const waves = await materializeDispatchWaves({ dispatchRunId: input.dispatchRunId });
    return { ...result, durableWaves: waves.waves.map((wave) => wave.id), reconciliation: waves.reconciliation };
  }),
});

async function getDbOrThrow() {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return db;
}
