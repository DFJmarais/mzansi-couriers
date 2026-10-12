import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import {
  deliveries,
  deliveryRelayLegs,
  deliveryRunStops,
  deliveryRuns,
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
  relaySettlementAllocations,
  vehicleCostProfiles,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const WAVE_STATUSES = ["planned", "assigned", "ready", "departed", "handover", "in_progress", "completed", "failed", "recovery", "settled", "cancelled"] as const;
export type WaveStatus = (typeof WAVE_STATUSES)[number];

const transitions: Record<WaveStatus, readonly WaveStatus[]> = {
  planned: ["assigned", "cancelled"],
  assigned: ["ready", "failed", "recovery", "cancelled"],
  ready: ["departed", "failed", "recovery", "cancelled"],
  departed: ["handover", "in_progress", "failed", "recovery"],
  handover: ["in_progress", "completed", "failed", "recovery"],
  in_progress: ["handover", "completed", "failed", "recovery"],
  completed: ["settled", "recovery"],
  failed: ["recovery", "cancelled"],
  recovery: ["assigned", "ready", "departed", "failed", "completed", "cancelled"],
  settled: [],
  cancelled: [],
};

const round = (value: number) => Math.round(value * 100) / 100;
const number = (value: unknown) => Number(value ?? 0) || 0;
const money = (value: number) => round(Math.max(0, value));

export type WavePlanInput = {
  dispatchRunId: number;
  assignments: Array<{ deliveryId: number; courierId: number; sequence: number }>;
  capacityByCourier: Map<number, { units?: number | null; weightKg?: number | null; volumeM3?: number | null }>;
  parcelById: Map<number, { weightKg: number; volumeM3: number; customerChargeZar: number }>;
  departureGapMinutes?: number;
};

export type PlannedWave = {
  waveNumber: number;
  idempotencyKey: string;
  assignments: Array<{ deliveryId: number; courierId: number; sequence: number }>;
  courierIds: number[];
  totalWeightKg: number;
  totalVolumeM3: number;
  capacityUnits: number | null;
  capacityWeightKg: number | null;
  capacityVolumeM3: number | null;
  departureOffsetMinutes: number;
  customerChargeZar: number;
  platformAllocationZar: number;
  courierPoolAllocationZar: number;
};

/** Pure, deterministic capacity splitter used by the DB materializer and tests. */
export function planDurableWaves(input: WavePlanInput): PlannedWave[] {
  const grouped = new Map<number, typeof input.assignments>();
  for (const assignment of input.assignments) grouped.set(assignment.courierId, [...(grouped.get(assignment.courierId) ?? []), assignment]);
  const waves: PlannedWave[] = [];
  let waveNumber = 1;
  for (const [courierId, assignments] of Array.from(grouped.entries())) {
    const capacity = input.capacityByCourier.get(courierId) ?? {};
    const unitCapacity = Math.max(1, capacity.units ?? Number.MAX_SAFE_INTEGER);
    const weightCapacity = Math.max(0.01, capacity.weightKg ?? Number.MAX_SAFE_INTEGER);
    const volumeCapacity = Math.max(0.0001, capacity.volumeM3 ?? Number.MAX_SAFE_INTEGER);
    let current: typeof assignments = [];
    let weight = 0;
    let volume = 0;
    const flush = () => {
      if (!current.length) return;
      const charge = money(current.reduce((sum: number, item: { deliveryId: number }) => sum + number(input.parcelById.get(item.deliveryId)?.customerChargeZar), 0));
      waves.push({
        waveNumber,
        idempotencyKey: `dispatch:${input.dispatchRunId}:wave:${waveNumber}`,
        assignments: current,
        courierIds: [courierId],
        totalWeightKg: round(weight),
        totalVolumeM3: round(volume),
        capacityUnits: Number.isFinite(unitCapacity) ? unitCapacity : null,
        capacityWeightKg: Number.isFinite(weightCapacity) ? round(weightCapacity) : null,
        capacityVolumeM3: Number.isFinite(volumeCapacity) ? round(volumeCapacity) : null,
        departureOffsetMinutes: (waveNumber - 1) * (input.departureGapMinutes ?? 45),
        customerChargeZar: charge,
        platformAllocationZar: money(charge * 0.2),
        courierPoolAllocationZar: money(charge * 0.8),
      });
      waveNumber += 1;
      current = [];
      weight = 0;
      volume = 0;
    };
    for (const assignment of assignments.sort((a: { sequence: number }, b: { sequence: number }) => a.sequence - b.sequence)) {
      const parcel = input.parcelById.get(assignment.deliveryId) ?? { weightKg: 0, volumeM3: 0, customerChargeZar: 0 };
      if (parcel.weightKg > weightCapacity + 0.0001 || parcel.volumeM3 > volumeCapacity + 0.000001) {
        throw new Error(`Parcel ${assignment.deliveryId} exceeds the assigned vehicle capacity`);
      }
      const wouldExceed = current.length >= unitCapacity || weight + parcel.weightKg > weightCapacity + 0.0001 || volume + parcel.volumeM3 > volumeCapacity + 0.000001;
      if (wouldExceed) flush();
      current.push(assignment);
      weight += parcel.weightKg;
      volume += parcel.volumeM3;
    }
    flush();
  }
  return waves;
}

export function canTransitionWave(from: WaveStatus, to: WaveStatus): boolean {
  return from === to || transitions[from].includes(to);
}

export function assertWaveTransition(from: WaveStatus, to: WaveStatus): void {
  if (!canTransitionWave(from, to)) throw new Error(`Invalid wave transition ${from} -> ${to}`);
}

export function assertWavePoolInvariant(waves: Array<{ customerCharge: number; platformAllocation: number; courierPoolAllocation: number }>): void {
  const customer = round(waves.reduce((sum, wave) => sum + number(wave.customerCharge), 0));
  const platform = round(waves.reduce((sum, wave) => sum + number(wave.platformAllocation), 0));
  const pool = round(waves.reduce((sum, wave) => sum + number(wave.courierPoolAllocation), 0));
  if (Math.abs(platform - customer * 0.2) > 0.02) throw new Error("Wave platform allocations do not equal the single 20% platform share");
  if (Math.abs(pool - customer * 0.8) > 0.02) throw new Error("Wave courier allocations do not equal the single shared 80% courier pool");
}

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

export async function materializeDispatchWaves(input: { dispatchRunId: number; actorUserId?: number; departureGapMinutes?: number }) {
  const db = await dbOrThrow();
  const run = (await db.select().from(dispatchRuns).where(eq(dispatchRuns.id, input.dispatchRunId)).limit(1))[0];
  if (!run) throw new TRPCError({ code: "NOT_FOUND", message: "Dispatch run not found" });
  const assignments = await db.select().from(dispatchAssignments).where(and(eq(dispatchAssignments.dispatchRunId, input.dispatchRunId), inArray(dispatchAssignments.status, ["assigned", "recommended"])));
  if (!assignments.length) return { dispatchRunId: input.dispatchRunId, waves: [], reconciliation: await reconcileDispatchRun(input.dispatchRunId) };
  const deliveryIds = Array.from(new Set(assignments.map((assignment) => assignment.deliveryId)));
  const deliveryRows = await db.select().from(deliveries).where(inArray(deliveries.id, deliveryIds));
  const costProfiles = await db.select().from(vehicleCostProfiles).where(inArray(vehicleCostProfiles.courierId, Array.from(new Set(assignments.map((assignment) => assignment.courierId)))));
  const verifiedByCourier = new Map<number, typeof costProfiles[number]>();
  for (const profile of costProfiles) if (profile.verificationStatus === "verified" && !verifiedByCourier.has(profile.courierId)) verifiedByCourier.set(profile.courierId, profile);
  const parcelById = new Map(deliveryRows.map((delivery) => [delivery.id, { weightKg: number(delivery.packageWeight), volumeM3: number(delivery.lengthCm) * number(delivery.widthCm) * number(delivery.heightCm) / 1_000_000, customerChargeZar: number(delivery.finalPrice ?? delivery.estimatedPrice) }]));
  const capacityByCourier = new Map(Array.from(new Set(assignments.map((assignment) => assignment.courierId))).map((courierId) => {
    const profile = verifiedByCourier.get(courierId);
    return [courierId, { units: profile?.capacityUnits, weightKg: number(profile?.capacityWeightKg) || null, volumeM3: number(profile?.capacityVolumeM3) || null }] as const;
  }));
  const planned = planDurableWaves({ dispatchRunId: input.dispatchRunId, assignments: assignments.map((assignment) => ({ deliveryId: assignment.deliveryId, courierId: assignment.courierId, sequence: assignment.sequence })), capacityByCourier, parcelById, departureGapMinutes: input.departureGapMinutes });
  const relayLegs = deliveryIds.length ? await db.select().from(deliveryRelayLegs).where(inArray(deliveryRelayLegs.deliveryId, deliveryIds)).orderBy(asc(deliveryRelayLegs.sequence)) : [];
  const runStops = deliveryIds.length ? await db.select({ stop: deliveryRunStops, run: deliveryRuns }).from(deliveryRunStops).innerJoin(deliveryRuns, eq(deliveryRunStops.runId, deliveryRuns.id)).where(inArray(deliveryRunStops.deliveryId, deliveryIds)) : [];
  const created = [];
  for (const wave of planned) {
    const existing = (await db.select().from(dispatchWaves).where(eq(dispatchWaves.idempotencyKey, wave.idempotencyKey)).limit(1))[0];
    let waveRow = existing;
    if (!waveRow) {
      const waveRelayLegs = relayLegs.filter((leg) => wave.assignments.some((assignment) => assignment.deliveryId === leg.deliveryId));
      const routeDistanceKm = waveRelayLegs.length ? waveRelayLegs.reduce((sum, leg) => sum + number(leg.roadDistanceKm), 0) : 0;
      const routeDurationMinutes = waveRelayLegs.reduce((sum, leg) => sum + number(leg.routeDurationMinutes), 0);
      const row = await db.insert(dispatchWaves).values({
        dispatchRunId: input.dispatchRunId,
        waveNumber: wave.waveNumber,
        idempotencyKey: wave.idempotencyKey,
        status: "planned",
        parcelCount: wave.assignments.length,
        courierCount: wave.courierIds.length,
        totalWeightKg: wave.totalWeightKg.toFixed(2),
        totalVolumeM3: wave.totalVolumeM3.toFixed(4),
        capacityUnits: wave.capacityUnits,
        capacityWeightKg: wave.capacityWeightKg?.toFixed(2) ?? null,
        capacityVolumeM3: wave.capacityVolumeM3?.toFixed(4) ?? null,
        routeDistanceKm: routeDistanceKm.toFixed(2),
        routeDurationMinutes,
        departureSequence: wave.waveNumber,
        departureOffsetMinutes: wave.departureOffsetMinutes,
        customerCharge: wave.customerChargeZar.toFixed(2),
        platformAllocation: wave.platformAllocationZar.toFixed(2),
        courierPoolAllocation: wave.courierPoolAllocationZar.toFixed(2),
        routeSnapshot: { deliveryIds: wave.assignments.map((assignment) => assignment.deliveryId), relayLegIds: waveRelayLegs.map((leg) => leg.id), runIds: runStops.filter((row) => wave.assignments.some((assignment) => assignment.deliveryId === row.stop.deliveryId)).map((row) => row.run.id) },
      }).$returningId();
      const createdId = row[0]?.id;
      if (!createdId) throw new Error("Durable dispatch wave could not be created");
      waveRow = (await db.select().from(dispatchWaves).where(eq(dispatchWaves.id, createdId)).limit(1))[0];
      await db.insert(dispatchWaveEvents).values({ waveId: createdId, eventKey: `${wave.idempotencyKey}:planned`, fromStatus: null, toStatus: "planned", actorUserId: input.actorUserId ?? null, reason: "Wave materialized from committed dispatch run" });
    }
    if (!waveRow) continue;
    const waveId = waveRow.id;
    for (let index = 0; index < wave.assignments.length; index += 1) {
      const assignment = wave.assignments[index];
      const key = `${wave.idempotencyKey}:parcel:${assignment.deliveryId}`;
      if (!(await db.select({ id: dispatchWaveParcels.id }).from(dispatchWaveParcels).where(eq(dispatchWaveParcels.idempotencyKey, key)).limit(1))[0]) await db.insert(dispatchWaveParcels).values({ waveId, deliveryId: assignment.deliveryId, sequence: index + 1, status: "assigned", idempotencyKey: key });
      const courierKey = `${wave.idempotencyKey}:courier:${assignment.courierId}:primary`;
      if (!(await db.select({ id: dispatchWaveCouriers.id }).from(dispatchWaveCouriers).where(eq(dispatchWaveCouriers.idempotencyKey, courierKey)).limit(1))[0]) await db.insert(dispatchWaveCouriers).values({ waveId, courierId: assignment.courierId, role: "primary", status: "assigned", idempotencyKey: courierKey });
    }
    const waveLegs = relayLegs.filter((leg) => wave.assignments.some((assignment) => assignment.deliveryId === leg.deliveryId));
    for (const leg of waveLegs) {
      const key = `${wave.idempotencyKey}:relay:${leg.id}`;
      if (!(await db.select({ id: dispatchWaveRelayLegs.id }).from(dispatchWaveRelayLegs).where(eq(dispatchWaveRelayLegs.idempotencyKey, key)).limit(1))[0]) await db.insert(dispatchWaveRelayLegs).values({ waveId, relayLegId: leg.id, sequence: leg.sequence, idempotencyKey: key });
      for (const courierId of [leg.fromCourierId, leg.toCourierId].filter((id): id is number => id != null)) {
        const courierKey = `${wave.idempotencyKey}:courier:${courierId}:${courierId === leg.toCourierId ? "relay" : "primary"}`;
        if (!(await db.select({ id: dispatchWaveCouriers.id }).from(dispatchWaveCouriers).where(eq(dispatchWaveCouriers.idempotencyKey, courierKey)).limit(1))[0]) await db.insert(dispatchWaveCouriers).values({ waveId, courierId, role: courierId === leg.toCourierId ? "relay" : "primary", status: "assigned", idempotencyKey: courierKey });
      }
    }
    const waveRuns = runStops.filter((row) => wave.assignments.some((assignment) => assignment.deliveryId === row.stop.deliveryId));
    for (const row of waveRuns) {
      const key = `${wave.idempotencyKey}:run:${row.run.id}`;
      if (!(await db.select({ id: dispatchWaveRunLinks.id }).from(dispatchWaveRunLinks).where(eq(dispatchWaveRunLinks.idempotencyKey, key)).limit(1))[0]) await db.insert(dispatchWaveRunLinks).values({ waveId, deliveryRunId: row.run.id, idempotencyKey: key });
    }
    created.push(waveRow);
  }
  await db.update(dispatchWaves).set({ status: "assigned" }).where(and(eq(dispatchWaves.dispatchRunId, input.dispatchRunId), eq(dispatchWaves.status, "planned")));
  const reconciliation = await reconcileDispatchRun(input.dispatchRunId);
  return { dispatchRunId: input.dispatchRunId, waves: created, reconciliation };
}

export async function transitionDispatchWave(input: { waveId: number; toStatus: WaveStatus; eventKey: string; actorUserId?: number; reason?: string; metadata?: unknown }) {
  const db = await dbOrThrow();
  const existingEvent = (await db.select().from(dispatchWaveEvents).where(eq(dispatchWaveEvents.eventKey, input.eventKey)).limit(1))[0];
  const wave = (await db.select().from(dispatchWaves).where(eq(dispatchWaves.id, input.waveId)).limit(1))[0];
  if (!wave) throw new TRPCError({ code: "NOT_FOUND", message: "Dispatch wave not found" });
  if (existingEvent) return { idempotent: true, wave };
  assertWaveTransition(wave.status as WaveStatus, input.toStatus);
  const now = new Date();
  const updated = await db.update(dispatchWaves).set({ status: input.toStatus, failureReason: input.toStatus === "failed" ? input.reason ?? "Wave failed" : wave.failureReason, startedAt: input.toStatus === "departed" && !wave.startedAt ? now : wave.startedAt, completedAt: ["completed", "settled"].includes(input.toStatus) ? now : wave.completedAt, settledAt: input.toStatus === "settled" ? now : wave.settledAt }).where(and(eq(dispatchWaves.id, input.waveId), eq(dispatchWaves.status, wave.status)));
  if (!updated || Number((updated as { affectedRows?: number }).affectedRows ?? 1) === 0) return { idempotent: true, wave: (await db.select().from(dispatchWaves).where(eq(dispatchWaves.id, input.waveId)).limit(1))[0] };
  await db.insert(dispatchWaveEvents).values({ waveId: input.waveId, eventKey: input.eventKey, fromStatus: wave.status, toStatus: input.toStatus, actorUserId: input.actorUserId ?? null, reason: input.reason ?? null, metadata: input.metadata ?? null });
  return { idempotent: false, wave: (await db.select().from(dispatchWaves).where(eq(dispatchWaves.id, input.waveId)).limit(1))[0] };
}

export async function recordWaveRecovery(input: { waveId: number; idempotencyKey: string; reason: string; exceptionId?: number; originalCourierId?: number; replacementCourierId?: number }) {
  const db = await dbOrThrow();
  const existing = (await db.select().from(dispatchWaveRecoveryActions).where(eq(dispatchWaveRecoveryActions.idempotencyKey, input.idempotencyKey)).limit(1))[0];
  if (existing) return existing;
  const row = await db.insert(dispatchWaveRecoveryActions).values({ waveId: input.waveId, exceptionId: input.exceptionId ?? null, originalCourierId: input.originalCourierId ?? null, replacementCourierId: input.replacementCourierId ?? null, status: "requested", reason: input.reason, idempotencyKey: input.idempotencyKey }).$returningId();
  return (await db.select().from(dispatchWaveRecoveryActions).where(eq(dispatchWaveRecoveryActions.id, row[0].id)).limit(1))[0];
}

export async function linkWaveSettlementAllocationsForDelivery(deliveryId: number) {
  const db = await dbOrThrow();
  const parcelLinks = await db.select({ parcel: dispatchWaveParcels }).from(dispatchWaveParcels).where(eq(dispatchWaveParcels.deliveryId, deliveryId));
  const allocations = await db.select().from(relaySettlementAllocations).where(eq(relaySettlementAllocations.deliveryId, deliveryId));
  const links = [];
  for (const parcelLink of parcelLinks) for (const allocation of allocations) {
    const key = `wave:${parcelLink.parcel.waveId}:allocation:${allocation.id}`;
    const existing = (await db.select().from(dispatchWaveSettlementLinks).where(eq(dispatchWaveSettlementLinks.idempotencyKey, key)).limit(1))[0];
    if (existing) { links.push(existing); continue; }
    const row = await db.insert(dispatchWaveSettlementLinks).values({ waveId: parcelLink.parcel.waveId, settlementAllocationId: allocation.id, deliveryId, courierId: allocation.courierId, amount: allocation.grossEarnings, idempotencyKey: key }).$returningId();
    const created = (await db.select().from(dispatchWaveSettlementLinks).where(eq(dispatchWaveSettlementLinks.id, row[0].id)).limit(1))[0];
    if (created) links.push(created);
  }
  return links;
}

export async function reconcileDispatchRun(dispatchRunId: number) {
  const db = await dbOrThrow();
  const waves = await db.select().from(dispatchWaves).where(eq(dispatchWaves.dispatchRunId, dispatchRunId)).orderBy(asc(dispatchWaves.waveNumber));
  const waveIds = waves.map((wave) => wave.id);
  const links = waveIds.length ? await db.select().from(dispatchWaveSettlementLinks).where(inArray(dispatchWaveSettlementLinks.waveId, waveIds)) : [];
  const allocationIds = Array.from(new Set(links.map((link) => link.settlementAllocationId)));
  const allocations = allocationIds.length ? await db.select().from(relaySettlementAllocations).where(inArray(relaySettlementAllocations.id, allocationIds)) : [];
  const allocationStatus = new Map(allocations.map((allocation) => [allocation.id, allocation.status]));
  const completedWaves = waves.filter((wave) => ["completed", "settled"].includes(wave.status)).length;
  const settledWaves = waves.filter((wave) => wave.status === "settled").length;
  const expected = waves.length;
  const customerCharge = money(waves.reduce((sum, wave) => sum + number(wave.customerCharge), 0));
  const platformAllocation = money(waves.reduce((sum, wave) => sum + number(wave.platformAllocation), 0));
  const courierPoolAllocation = money(waves.reduce((sum, wave) => sum + number(wave.courierPoolAllocation), 0));
  const linkedCourierAllocations = money(links.reduce((sum, link) => sum + number(link.amount), 0));
  const unsettled = links.some((link) => allocationStatus.get(link.settlementAllocationId) !== "paid");
  const invariantOkay = Math.abs(platformAllocation - customerCharge * 0.2) <= 0.02 && Math.abs(courierPoolAllocation - customerCharge * 0.8) <= 0.02 && linkedCourierAllocations <= courierPoolAllocation + 0.02;
  const complete = expected > 0 && completedWaves === expected && settledWaves === expected && !unsettled && invariantOkay;
  const blockingReason = !invariantOkay ? "Wave financial totals do not conserve the single customer-funded 20/80 split" : unsettled ? "One or more linked courier allocations are not paid" : completedWaves < expected ? "All waves must complete before final reconciliation" : settledWaves < expected ? "All waves must be settled before final reconciliation" : null;
  const values = { expectedWaves: expected, completedWaves, settledWaves, customerCharge: customerCharge.toFixed(2), platformAllocation: platformAllocation.toFixed(2), courierPoolAllocation: courierPoolAllocation.toFixed(2), linkedCourierAllocations: linkedCourierAllocations.toFixed(2), status: complete ? "complete" as const : blockingReason ? "blocked" as const : "open" as const, blockingReason, reconciledAt: complete ? new Date() : null };
  const existing = (await db.select().from(dispatchRunReconciliations).where(eq(dispatchRunReconciliations.dispatchRunId, dispatchRunId)).limit(1))[0];
  if (existing) await db.update(dispatchRunReconciliations).set(values).where(eq(dispatchRunReconciliations.id, existing.id));
  else await db.insert(dispatchRunReconciliations).values({ dispatchRunId, ...values });
  return { dispatchRunId, expectedWaves: expected, completedWaves, settledWaves, customerCharge, platformAllocation, courierPoolAllocation, linkedCourierAllocations, status: values.status, blockingReason, invariantOkay };
}
