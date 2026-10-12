import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { courierProfiles, dispatchAssignments, dispatchRunReconciliations, dispatchRuns, dispatchWaveCouriers, dispatchWaveEvents, dispatchWaveParcels, dispatchWaveRecoveryActions, dispatchWaveRelayLegs, dispatchWaveSettlementLinks, dispatchWaves, deliveries, deliveryRelayLegs, parcelFinancialLedgerEntries, parcelFinancialLedgers, relayExceptionEvents, relaySettlementAllocations, users, vehicleCostProfiles } from "../../drizzle/schema";
import { buildWeeklyRelaySettlement, createOrUpdateVehicleCostProfile } from "../services/relay-settlement";
import { appendParcelLedgerEvent, getParcelLedgerState, initializeParcelLedger } from "../services/financial-ledger";
import { planParallelWaves, validateDispatchReadiness } from "../services/launch-readiness";
import { materializeDispatchWaves, transitionDispatchWave, recordWaveRecovery, linkWaveSettlementAllocationsForDelivery, reconcileDispatchRun, type WaveStatus } from "../services/dispatch-waves";
import { getSyntheticWaveHarnessStatus, resetSyntheticWaveOperations, seedSyntheticWaveOperations } from "../services/synthetic-wave-harness";

const weekInput = z.object({ weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
const vehicleProfileInput = z.object({
  id: z.number().int().positive().optional(),
  courierId: z.number().int().positive(),
  vehicleType: z.string().min(2).max(40),
  makeModel: z.string().max(120).nullable().optional(),
  modelYear: z.number().int().min(1950).max(2100).nullable().optional(),
  fuelType: z.string().min(2).max(30),
  fuelPricePerLitre: z.number().positive(),
  fuelLitresPer100Km: z.number().positive(),
  driverCompensationPerKm: z.number().nonnegative(),
  vehicleAllowancePerKm: z.number().nonnegative(),
  routeOverheadPerKm: z.number().nonnegative(),
  capacityUnits: z.number().int().positive().nullable().optional(),
  capacityWeightKg: z.number().positive().nullable().optional(),
  capacityVolumeM3: z.number().positive().nullable().optional(),
  evidenceNote: z.string().max(1000).nullable().optional(),
  verified: z.boolean(),
});

export const relaySettlementRouter = router({
  getSyntheticWaveHarnessStatus: adminProcedure.query(() => getSyntheticWaveHarnessStatus()),
  seedSyntheticWaveOperations: adminProcedure.mutation(({ ctx }) => seedSyntheticWaveOperations(ctx.user.id)),
  resetSyntheticWaveOperations: adminProcedure.mutation(() => resetSyntheticWaveOperations()),
  getWaveOperations: adminProcedure.input(z.object({ filter: z.enum(["all", "active", "planned", "in_progress", "exception", "completed", "settlement_blocked"]).default("all") })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const runs = await db.select().from(dispatchRuns).orderBy(desc(dispatchRuns.updatedAt)).limit(100);
    const waves = await db.select().from(dispatchWaves).orderBy(desc(dispatchWaves.updatedAt)).limit(500);
    const waveIds = waves.map((wave) => wave.id);
    const runIds = runs.map((run) => run.id);
    const waveParcels = waveIds.length ? await db.select().from(dispatchWaveParcels).where(inArray(dispatchWaveParcels.waveId, waveIds)) : [];
    const waveCouriers = waveIds.length ? await db.select().from(dispatchWaveCouriers).where(inArray(dispatchWaveCouriers.waveId, waveIds)) : [];
    const waveRelayLegs = waveIds.length ? await db.select().from(dispatchWaveRelayLegs).where(inArray(dispatchWaveRelayLegs.waveId, waveIds)) : [];
    const waveEvents = waveIds.length ? await db.select().from(dispatchWaveEvents).where(inArray(dispatchWaveEvents.waveId, waveIds)).orderBy(desc(dispatchWaveEvents.createdAt)) : [];
    const recoveryActions = waveIds.length ? await db.select().from(dispatchWaveRecoveryActions).where(inArray(dispatchWaveRecoveryActions.waveId, waveIds)).orderBy(desc(dispatchWaveRecoveryActions.updatedAt)) : [];
    const settlementLinks = waveIds.length ? await db.select().from(dispatchWaveSettlementLinks).where(inArray(dispatchWaveSettlementLinks.waveId, waveIds)) : [];
    const reconciliations = runIds.length ? await db.select().from(dispatchRunReconciliations).where(inArray(dispatchRunReconciliations.dispatchRunId, runIds)) : [];
    const assignmentRows = runIds.length ? await db.select().from(dispatchAssignments).where(inArray(dispatchAssignments.dispatchRunId, runIds)) : [];
    const deliveryIds = Array.from(new Set(waveParcels.map((row) => row.deliveryId)));
    const deliveriesById = new Map((deliveryIds.length ? await db.select().from(deliveries).where(inArray(deliveries.id, deliveryIds)) : []).map((delivery) => [delivery.id, delivery]));
    const relayIds = Array.from(new Set(waveRelayLegs.map((row) => row.relayLegId)));
    const relayById = new Map((relayIds.length ? await db.select().from(deliveryRelayLegs).where(inArray(deliveryRelayLegs.id, relayIds)) : []).map((leg) => [leg.id, leg]));
    const courierIds = Array.from(new Set([...waveCouriers.map((row) => row.courierId), ...assignmentRows.map((row) => row.courierId), ...recoveryActions.flatMap((row) => [row.originalCourierId, row.replacementCourierId].filter((id): id is number => id != null))]));
    const courierRows = courierIds.length ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, courierIds)) : [];
    const courierById = new Map(courierRows.map((row) => [row.id, row]));
    const exceptionRows = deliveryIds.length ? await db.select().from(relayExceptionEvents).where(inArray(relayExceptionEvents.deliveryId, deliveryIds)).orderBy(desc(relayExceptionEvents.updatedAt)) : [];
    const reconciliationByRun = new Map(reconciliations.map((row) => [row.dispatchRunId, row]));
    const runById = new Map(runs.map((run) => [run.id, run]));
    const assignmentsByRun = new Map<number, typeof assignmentRows>();
    for (const row of assignmentRows) assignmentsByRun.set(row.dispatchRunId, [...(assignmentsByRun.get(row.dispatchRunId) ?? []), row]);
    const filterWave = (wave: typeof waves[number]) => {
      const reconciliation = reconciliationByRun.get(wave.dispatchRunId);
      const hasException = exceptionRows.some((exception) => waveParcels.some((parcel) => parcel.waveId === wave.id && parcel.deliveryId === exception.deliveryId) && ["open", "recovery_requested"].includes(exception.status));
      if (input.filter === "all") return true;
      if (input.filter === "planned") return ["planned", "assigned", "ready"].includes(wave.status);
      if (input.filter === "active") return ["assigned", "ready", "departed", "handover", "in_progress", "recovery"].includes(wave.status);
      if (input.filter === "in_progress") return ["departed", "handover", "in_progress"].includes(wave.status);
      if (input.filter === "exception") return hasException || ["failed", "recovery"].includes(wave.status) || recoveryActions.some((action) => action.waveId === wave.id && ["requested", "offered", "accepted", "failed"].includes(action.status));
      if (input.filter === "completed") return ["completed", "settled"].includes(wave.status);
      return reconciliation?.status === "blocked" || Boolean(reconciliation?.blockingReason);
    };
    return {
      runs: runs.map((run) => ({ run, reconciliation: reconciliationByRun.get(run.id) ?? null, assignmentCount: assignmentsByRun.get(run.id)?.length ?? 0 })),
      waves: waves.filter(filterWave).map((wave) => ({
        wave,
        run: runById.get(wave.dispatchRunId) ?? null,
        reconciliation: reconciliationByRun.get(wave.dispatchRunId) ?? null,
        parcels: waveParcels.filter((row) => row.waveId === wave.id).map((row) => ({ link: row, delivery: deliveriesById.get(row.deliveryId) ?? null })),
        couriers: waveCouriers.filter((row) => row.waveId === wave.id).map((row) => ({ assignment: row, courier: courierById.get(row.courierId) ?? null })),
        relayLegs: waveRelayLegs.filter((row) => row.waveId === wave.id).map((row) => ({ link: row, leg: relayById.get(row.relayLegId) ?? null })),
        events: waveEvents.filter((row) => row.waveId === wave.id),
        recoveryActions: recoveryActions.filter((row) => row.waveId === wave.id).map((row) => ({ action: row, originalCourier: row.originalCourierId ? courierById.get(row.originalCourierId) ?? null : null, replacementCourier: row.replacementCourierId ? courierById.get(row.replacementCourierId) ?? null : null })),
        exceptions: exceptionRows.filter((exception) => waveParcels.some((parcel) => parcel.waveId === wave.id && parcel.deliveryId === exception.deliveryId)),
        settlementLinks: settlementLinks.filter((row) => row.waveId === wave.id),
      })),
    };
  }),
  materializeDispatchWaves: adminProcedure.input(z.object({ dispatchRunId: z.number().int().positive(), departureGapMinutes: z.number().int().min(0).max(1440).optional() })).mutation(({ ctx, input }) => materializeDispatchWaves({ ...input, actorUserId: ctx.user.id })),
  transitionDispatchWave: adminProcedure.input(z.object({ waveId: z.number().int().positive(), toStatus: z.enum(["planned", "assigned", "ready", "departed", "handover", "in_progress", "completed", "failed", "recovery", "settled", "cancelled"]), eventKey: z.string().min(8).max(200), reason: z.string().max(1000).optional(), metadata: z.unknown().optional() })).mutation(({ ctx, input }) => transitionDispatchWave({ ...input, toStatus: input.toStatus as WaveStatus, actorUserId: ctx.user.id })),
  recordWaveRecovery: adminProcedure.input(z.object({ waveId: z.number().int().positive(), idempotencyKey: z.string().min(8).max(200), reason: z.string().trim().min(3).max(1000), exceptionId: z.number().int().positive().optional(), originalCourierId: z.number().int().positive().optional(), replacementCourierId: z.number().int().positive().optional() })).mutation(({ input }) => recordWaveRecovery(input)),
  linkWaveSettlement: adminProcedure.input(z.object({ deliveryId: z.number().int().positive() })).mutation(({ input }) => linkWaveSettlementAllocationsForDelivery(input.deliveryId)),
  reconcileDispatchRun: adminProcedure.input(z.object({ dispatchRunId: z.number().int().positive() })).query(({ input }) => reconcileDispatchRun(input.dispatchRunId)),
  preDispatchReadiness: adminProcedure.input(z.object({
    customerChargeZar: z.number().positive(), parcelCount: z.number().int().positive(), totalWeightKg: z.number().nonnegative(), totalVolumeM3: z.number().nonnegative(), requiredReserveZar: z.number().nonnegative().default(0), minimumCourierNetZar: z.number().nonnegative().default(150),
    legs: z.array(z.object({ legId: z.string(), sequence: z.number().int().positive(), courierId: z.string(), origin: z.string(), destination: z.string(), distanceKm: z.number().positive(), deadheadKm: z.number().nonnegative().default(0), returnKm: z.number().nonnegative().default(0), vehicleCapacityUnits: z.number().int().positive().optional(), vehicleCapacityWeightKg: z.number().positive().optional(), vehicleCapacityVolumeM3: z.number().positive().optional(), fuelPricePerLitre: z.number().nonnegative().optional(), fuelLitresPer100Km: z.number().nonnegative().optional(), driverCompensationPerKm: z.number().nonnegative().optional(), vehicleAllowancePerKm: z.number().nonnegative().optional(), routeOverheadPerKm: z.number().nonnegative().optional(), handoverFeeZar: z.number().nonnegative().optional(), tollsZar: z.number().nonnegative().optional(), handoverTimeMinutes: z.number().nonnegative().optional(), parcelCountOnLeg: z.number().int().positive().optional(), parcelWeightKg: z.number().nonnegative().optional(), parcelVolumeM3: z.number().nonnegative().optional() })),
  })).query(({ input }) => validateDispatchReadiness(input)),
  planParallelWaves: adminProcedure.input(z.object({ parcelCount: z.number().int().positive(), parcelWeightKg: z.number().positive(), parcelVolumeM3: z.number().positive(), maxParcelsPerVehicle: z.number().int().positive(), maxWeightKg: z.number().positive(), maxVolumeM3: z.number().positive(), courierIds: z.array(z.string()).min(1), customerChargePerParcelZar: z.number().positive(), routeLegs: z.array(z.object({ legId: z.string(), sequence: z.number().int().positive(), courierId: z.string(), origin: z.string(), destination: z.string(), distanceKm: z.number().positive() })) })).query(({ input }) => planParallelWaves({ ...input, routeFactory: (_waveNumber, count) => ({ customerChargeZar: input.customerChargePerParcelZar * count, parcelCount: count, totalWeightKg: count * input.parcelWeightKg, totalVolumeM3: count * input.parcelVolumeM3, legs: input.routeLegs.map((leg) => ({ ...leg, parcelCountOnLeg: count, parcelWeightKg: count * input.parcelWeightKg, parcelVolumeM3: count * input.parcelVolumeM3 })) }) })),
  initializeParcelLedger: adminProcedure.input(z.object({ deliveryId: z.number().int().positive(), customerPayment: z.number().nonnegative(), paymentCost: z.number().nonnegative().default(0), reserveAmount: z.number().nonnegative().default(0) })).mutation(({ input }) => initializeParcelLedger(input)),
  appendParcelLedgerEvent: adminProcedure.input(z.object({ deliveryId: z.number().int().positive(), eventKey: z.string().min(8).max(180), type: z.enum(["reserve", "refund", "cancellation", "replacement_leg", "payment_cost", "payout_cost", "settlement"]), amount: z.number().nonnegative(), courierId: z.number().int().positive().nullable().optional(), relayLegId: z.number().int().positive().nullable().optional(), reference: z.string().max(255).nullable().optional() })).mutation(({ input }) => appendParcelLedgerEvent(input)),
  getParcelLedger: adminProcedure.input(z.object({ deliveryId: z.number().int().positive() })).query(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("Database not available"); const ledger = (await db.select().from(parcelFinancialLedgers).where(eq(parcelFinancialLedgers.deliveryId, input.deliveryId)).limit(1))[0]; if (!ledger) return null; const entries = await db.select().from(parcelFinancialLedgerEntries).where(eq(parcelFinancialLedgerEntries.deliveryId, input.deliveryId)); return { ledger, entries, calculated: await getParcelLedgerState(input.deliveryId) }; }),
  getWeeklyEconomics: adminProcedure.input(weekInput).query(async ({ input }) => {
    const result = await buildWeeklyRelaySettlement(input.weekStart);
    const courierIds = Array.from(new Set(result.allocations.map((row) => row.courierId)));
    const db = await getDb();
    const names = db && courierIds.length
      ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, courierIds))
      : [];
    const nameById = new Map(names.map((user) => [user.id, user]));
    const byCourier = new Map<number, typeof result.allocations>();
    for (const allocation of result.allocations) byCourier.set(allocation.courierId, [...(byCourier.get(allocation.courierId) ?? []), allocation]);
    const couriers = Array.from(byCourier.entries()).map(([courierId, rows]) => ({
      courierId,
      name: nameById.get(courierId)?.name ?? `Courier ${courierId}`,
      email: nameById.get(courierId)?.email ?? null,
      allocationCount: rows.length,
      parcels: new Set(rows.map((row) => row.deliveryId)).size,
      linehaulDistanceKm: rows.reduce((sum, row) => sum + Number(row.linehaulDistanceKm), 0),
      totalDrivenKm: rows.reduce((sum, row) => sum + Number(row.totalDrivenKm), 0),
      customerChargeZar: rows.reduce((sum, row) => sum + Number(row.customerCharge), 0),
      platformFeeZar: rows.reduce((sum, row) => sum + Number(row.platformFee), 0),
      courierPoolZar: rows.reduce((sum, row) => sum + Number(row.courierPool) / rows.length, 0),
      operatingCostZar: rows.reduce((sum, row) => sum + Number(row.operatingCost) + Number(row.handoverFee), 0),
      grossEarningsZar: rows.reduce((sum, row) => sum + Number(row.grossEarnings), 0),
      estimatedNetZar: rows.reduce((sum, row) => sum + Number(row.estimatedNet), 0),
      poolSharePct: result.totals.courierPoolZar > 0 ? rows.reduce((sum, row) => sum + Number(row.grossEarnings), 0) / result.totals.courierPoolZar * 100 : 0,
      statuses: Array.from(new Set(rows.map((row) => row.status))),
    }));
    return { ...result, couriers, allocations: result.allocations.slice(0, 300) };
  }),
  getVehicleCostProfiles: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const rows = await db.select({ profile: vehicleCostProfiles, courier: { id: users.id, name: users.name, email: users.email }, courierProfile: { vehicleType: courierProfiles.vehicleType, vehicleRegistration: courierProfiles.vehicleRegistration } })
      .from(vehicleCostProfiles)
      .leftJoin(users, eq(vehicleCostProfiles.courierId, users.id))
      .leftJoin(courierProfiles, eq(vehicleCostProfiles.courierId, courierProfiles.userId))
      .orderBy(desc(vehicleCostProfiles.updatedAt));
    return rows;
  }),
  saveVehicleCostProfile: adminProcedure.input(vehicleProfileInput).mutation(async ({ ctx, input }) => {
    const row = await createOrUpdateVehicleCostProfile({ ...input, verifiedBy: ctx.user.id });
    return { success: true, profile: row };
  }),
  rejectVehicleCostProfile: adminProcedure.input(z.object({ id: z.number().int().positive(), evidenceNote: z.string().max(1000).nullable().optional() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(vehicleCostProfiles).set({ verificationStatus: "rejected", evidenceNote: input.evidenceNote ?? null }).where(eq(vehicleCostProfiles.id, input.id));
    return { success: true };
  }),
  approveSettlementAllocations: adminProcedure.input(z.object({ allocationIds: z.array(z.number().int().positive()).min(1) })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(relaySettlementAllocations).set({ status: "approved" }).where(and(inArray(relaySettlementAllocations.id, input.allocationIds), eq(relaySettlementAllocations.status, "calculated")));
    return { success: true, allocationIds: input.allocationIds };
  }),
});
