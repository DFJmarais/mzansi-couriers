import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { courierHandoffOffers, courierProfiles, deliveries, deliveryRelayLegs, deliveryRunStops, deliveryRuns, notifications, smartAddonOpportunities, smartStackRecommendations, users, relayExceptionEvents, dispatchWaveParcels } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { appendParcelLedgerEvent } from "../services/financial-ledger";
import { recordWaveRecovery, transitionDispatchWave } from "../services/dispatch-waves";

const courierProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "courier") throw new TRPCError({ code: "FORBIDDEN", message: "Courier access required" });
  return next({ ctx });
});

const exceptionType = z.enum(["courier_delayed", "receiving_courier_delayed", "handoff_failed", "address_clarification", "recipient_unavailable", "connectivity_concern", "custody_review"]);
const recoveryAction = z.enum(["wait_and_retry", "safe_hold", "request_replacement", "operations_review"]);

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return db;
}

export const smartStackRouter = router({
  myRecommendation: courierProcedure.query(async ({ ctx }) => {
    const db = await dbOrThrow();
    const rows = await db.select().from(smartStackRecommendations)
      .where(and(eq(smartStackRecommendations.courierId, ctx.user.id), inArray(smartStackRecommendations.status, ["recommended", "accepted"])))
      .orderBy(desc(smartStackRecommendations.createdAt)).limit(1);
    return rows[0] ?? null;
  }),

  myAddOns: courierProcedure.query(async ({ ctx }) => {
    const db = await dbOrThrow();
    return db.select({ opportunity: smartAddonOpportunities, delivery: deliveries })
      .from(smartAddonOpportunities).innerJoin(deliveries, eq(smartAddonOpportunities.deliveryId, deliveries.id))
      .where(and(eq(smartAddonOpportunities.courierId, ctx.user.id), eq(smartAddonOpportunities.status, "offered")))
      .orderBy(desc(smartAddonOpportunities.createdAt));
  }),

  acceptAddOn: courierProcedure.input(z.object({ opportunityId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const rows = await db.select().from(smartAddonOpportunities).where(and(eq(smartAddonOpportunities.id, input.opportunityId), eq(smartAddonOpportunities.courierId, ctx.user.id), eq(smartAddonOpportunities.status, "offered"))).limit(1);
    const opportunity = rows[0];
    if (!opportunity) throw new TRPCError({ code: "NOT_FOUND", message: "This add-on is no longer available" });
    if (opportunity.expiresAt && opportunity.expiresAt.getTime() < Date.now()) {
      await db.update(smartAddonOpportunities).set({ status: "expired", respondedAt: new Date() }).where(eq(smartAddonOpportunities.id, input.opportunityId));
      throw new TRPCError({ code: "CONFLICT", message: "This add-on has expired. Your current route is unchanged." });
    }
    const delivery = (await db.select().from(deliveries).where(and(eq(deliveries.id, opportunity.deliveryId), isNull(deliveries.courierId), eq(deliveries.status, "pending"))).limit(1))[0];
    if (!delivery) throw new TRPCError({ code: "CONFLICT", message: "This parcel is already being handled by another route" });
    await db.update(smartAddonOpportunities).set({ status: "accepted", respondedAt: new Date() }).where(eq(smartAddonOpportunities.id, input.opportunityId));
    await db.update(deliveries).set({ courierId: ctx.user.id, status: "assigned" }).where(eq(deliveries.id, delivery.id));
    const existingRun = (await db.select().from(deliveryRuns).where(and(eq(deliveryRuns.courierId, ctx.user.id), inArray(deliveryRuns.status, ["planned", "active"]))).orderBy(desc(deliveryRuns.createdAt)).limit(1))[0];
    let runId = existingRun?.id;
    if (!runId) {
      const [createdRun] = await db.insert(deliveryRuns).values({ courierId: ctx.user.id, status: "planned" }).$returningId();
      runId = createdRun?.id;
    }
    if (!runId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Courier route could not be updated" });
    const lastStop = (await db.select().from(deliveryRunStops).where(eq(deliveryRunStops.runId, runId)).orderBy(desc(deliveryRunStops.sequence)).limit(1))[0];
    await db.insert(deliveryRunStops).values({ runId, deliveryId: delivery.id, sequence: (lastStop?.sequence ?? 0) + 1, status: "queued" });
    await db.insert(notifications).values({ userId: delivery.customerId, type: "delivery_status", title: "Courier route updated", message: `Your parcel ${delivery.trackingCode} has been added to a courier route. Tracking will update as the route progresses.`, relatedDeliveryId: delivery.id });
    return { accepted: true, deliveryId: delivery.id, runId };
  }),

  declineAddOn: courierProcedure.input(z.object({ opportunityId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const updated = await db.update(smartAddonOpportunities).set({ status: "declined", respondedAt: new Date() }).where(and(eq(smartAddonOpportunities.id, input.opportunityId), eq(smartAddonOpportunities.courierId, ctx.user.id), eq(smartAddonOpportunities.status, "offered")));
    if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "This add-on is no longer available" });
    return { declined: true, ratingImpact: "none" as const, message: "Add-on declined. Your courier rating is unchanged." };
  }),

  reportException: courierProcedure.input(z.object({
    deliveryId: z.number().int().positive(),
    relayLegId: z.number().int().positive().optional(),
    type: exceptionType,
    recoveryAction,
    reason: z.string().trim().min(3).max(500),
    note: z.string().trim().max(1000).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const delivery = (await db.select().from(deliveries).where(eq(deliveries.id, input.deliveryId)).limit(1))[0];
    if (!delivery) throw new TRPCError({ code: "NOT_FOUND", message: "Parcel not found" });
    let leg: typeof deliveryRelayLegs.$inferSelect | undefined;
    if (input.relayLegId) leg = (await db.select().from(deliveryRelayLegs).where(and(eq(deliveryRelayLegs.id, input.relayLegId), eq(deliveryRelayLegs.deliveryId, input.deliveryId))).limit(1))[0];
    const courierHasCustody = delivery.courierId === ctx.user.id || leg?.fromCourierId === ctx.user.id || leg?.toCourierId === ctx.user.id || leg?.currentCustodianId === ctx.user.id;
    if (!courierHasCustody) throw new TRPCError({ code: "FORBIDDEN", message: "This parcel is not assigned to your route" });
    if (leg && ["handoff_failed", "custody_review"].includes(input.type)) {
      await db.update(deliveryRelayLegs).set({ status: "failed", courierNote: input.note ?? input.reason }).where(eq(deliveryRelayLegs.id, leg.id));
    }
    const [event] = await db.insert(relayExceptionEvents).values({ deliveryId: input.deliveryId, relayLegId: input.relayLegId ?? null, reportedByUserId: ctx.user.id, currentCustodianId: leg?.currentCustodianId ?? ctx.user.id, type: input.type, recoveryAction: input.recoveryAction, reason: input.reason, note: input.note ?? null, latitude: input.latitude === undefined ? null : String(input.latitude), longitude: input.longitude === undefined ? null : String(input.longitude), status: input.recoveryAction === "request_replacement" ? "recovery_requested" : "open", customerNotifiedAt: new Date() }).$returningId();
    if (input.type === "handoff_failed" || input.recoveryAction === "request_replacement") {
      const reserve = Math.max(100, Number(delivery.estimatedPrice ?? 0) * 0.1);
      try { await appendParcelLedgerEvent({ deliveryId: input.deliveryId, eventKey: `delivery:${input.deliveryId}:reserve:exception:${Number(event?.id ?? Date.now())}`, type: "reserve", amount: reserve, courierId: ctx.user.id, relayLegId: input.relayLegId ?? null, reference: input.reason }); } catch { /* Legacy parcels without a payment ledger remain blocked from automated payout. */ }
    }
    const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
    const label = input.type.replaceAll("_", " ");
    if (admins.length) await db.insert(notifications).values(admins.map(({ id }) => ({ userId: id, type: "delivery_status" as const, title: "Relay exception reported", message: `Parcel ${delivery.trackingCode}: ${label}. ${input.reason}`, relatedDeliveryId: delivery.id })));
    await db.insert(notifications).values({ userId: delivery.customerId, type: "delivery_status", title: "Delivery update", message: `We recorded a delivery update for parcel ${delivery.trackingCode}. The route team is reviewing the next safe step.`, relatedDeliveryId: delivery.id });
    let recoveryOffers = 0;
    if (input.recoveryAction === "request_replacement" && leg) {
      const candidates = await db.select({ userId: courierProfiles.userId }).from(courierProfiles).where(and(eq(courierProfiles.isAvailable, true)));
      const eligible = candidates.filter((candidate) => candidate.userId !== ctx.user.id && candidate.userId !== leg?.toCourierId && candidate.userId !== leg?.fromCourierId);
      if (eligible.length) {
        await db.insert(courierHandoffOffers).values(eligible.slice(0, 10).map((candidate) => ({ relayLegId: leg!.id, offeredByCourierId: ctx.user.id, offeredToCourierId: candidate.userId, status: "offered" as const, reason: `RECOVERY: ${input.reason}`, expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) })));
        recoveryOffers = eligible.slice(0, 10).length;
      }
    }
    // A failed handover must remain connected to the durable wave so recovery
    // and replacement-leg costs are visible in operations and reconciliation.
    if (input.type === "handoff_failed" || input.recoveryAction === "request_replacement") {
      try {
        const waveParcel = await db.select().from(dispatchWaveParcels).where(eq(dispatchWaveParcels.deliveryId, input.deliveryId)).limit(1);
        const waveId = waveParcel[0]?.waveId;
        if (waveId) {
          await recordWaveRecovery({ waveId, exceptionId: Number(event?.id ?? 0), idempotencyKey: `wave:${waveId}:recovery:${Number(event?.id ?? Date.now())}`, reason: input.reason, originalCourierId: ctx.user.id });
          await transitionDispatchWave({ waveId, toStatus: "recovery", eventKey: `wave:${waveId}:exception:${Number(event?.id ?? Date.now())}`, actorUserId: ctx.user.id, reason: input.reason, metadata: { deliveryId: input.deliveryId, relayLegId: input.relayLegId ?? null, recoveryAction: input.recoveryAction } });
        }
      } catch (error) {
        console.warn("[Relay recovery] durable wave link unavailable", error instanceof Error ? error.message : "unknown error");
      }
    }
    return { reported: true, eventId: Number(event?.id ?? 0), recoveryOffers, message: recoveryOffers ? `Exception recorded and ${recoveryOffers} nearby recovery courier${recoveryOffers === 1 ? " has" : "s have"} been invited.` : "Exception recorded. The owner team can review the next safe step." };
  }),

  myExceptions: courierProcedure.query(async ({ ctx }) => {
    const db = await dbOrThrow();
    return db.select().from(relayExceptionEvents).where(or(eq(relayExceptionEvents.reportedByUserId, ctx.user.id), eq(relayExceptionEvents.currentCustodianId, ctx.user.id))).orderBy(desc(relayExceptionEvents.createdAt)).limit(20);
  }),

  adminExceptions: adminProcedure.query(async () => {
    const db = await dbOrThrow();
    return db.select({ exception: relayExceptionEvents, delivery: deliveries, reporter: users }).from(relayExceptionEvents).innerJoin(deliveries, eq(relayExceptionEvents.deliveryId, deliveries.id)).innerJoin(users, eq(relayExceptionEvents.reportedByUserId, users.id)).where(inArray(relayExceptionEvents.status, ["open", "recovery_requested"])).orderBy(desc(relayExceptionEvents.createdAt)).limit(100);
  }),

  resolveException: adminProcedure.input(z.object({ exceptionId: z.number().int().positive(), status: z.enum(["resolved", "cancelled"]), resolutionNote: z.string().trim().min(3).max(1000) })).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const exception = (await db.select().from(relayExceptionEvents).where(and(eq(relayExceptionEvents.id, input.exceptionId), inArray(relayExceptionEvents.status, ["open", "recovery_requested"]))).limit(1))[0];
    if (!exception) throw new TRPCError({ code: "NOT_FOUND", message: "Exception is already resolved or not found" });
    await db.update(relayExceptionEvents).set({ status: input.status, resolutionNote: input.resolutionNote, resolvedByUserId: ctx.user.id, resolvedAt: new Date() }).where(eq(relayExceptionEvents.id, input.exceptionId));
    await db.insert(notifications).values({ userId: exception.reportedByUserId, type: "delivery_status", title: "Delivery exception updated", message: `The owner team marked your delivery exception as ${input.status}. ${input.resolutionNote}`, relatedDeliveryId: exception.deliveryId });
    return { resolved: true, status: input.status };
  }),
});
