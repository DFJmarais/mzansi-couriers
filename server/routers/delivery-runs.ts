import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { deliveryRunStops, deliveryRuns, deliveries, deliveryPaymentSessions, notifications, addresses, users, relayExceptionEvents } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { sendMessageWithFallback } from "../_core/twilio";
import { haversineKm } from "../dispatch/assignment-engine";

const courierProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "courier") throw new TRPCError({ code: "FORBIDDEN", message: "Courier access required" });
  return next({ ctx });
});

const customerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "customer") throw new TRPCError({ code: "FORBIDDEN", message: "Customer access required" });
  return next({ ctx });
});

const stopIdInput = z.object({ stopId: z.number().int().positive() });

function sequenceDeliveryRows<T extends { id: number; pickupLatitude: string | number; pickupLongitude: string | number; dropoffLatitude: string | number; dropoffLongitude: string | number }>(rows: T[], start: { lat: number; lng: number } | null = null) {
  const remaining = [...rows];
  const ordered: T[] = [];
  let current = start;
  while (remaining.length) {
    remaining.sort((a, b) => {
      const cost = (row: T) => {
        const pickup = { lat: Number(row.pickupLatitude), lng: Number(row.pickupLongitude) };
        const dropoff = { lat: Number(row.dropoffLatitude), lng: Number(row.dropoffLongitude) };
        return (current ? haversineKm(current, pickup) : 0) + haversineKm(pickup, dropoff) * 0.25;
      };
      return cost(a) - cost(b) || a.id - b.id;
    });
    const next = remaining.shift();
    if (!next) break;
    ordered.push(next);
    current = { lat: Number(next.dropoffLatitude), lng: Number(next.dropoffLongitude) };
  }
  return ordered;
}

async function getOwnedStop(stopId: number, courierId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const rows = await db.select({ stop: deliveryRunStops, run: deliveryRuns, delivery: deliveries })
    .from(deliveryRunStops)
    .innerJoin(deliveryRuns, eq(deliveryRunStops.runId, deliveryRuns.id))
    .innerJoin(deliveries, eq(deliveryRunStops.deliveryId, deliveries.id))
    .where(and(eq(deliveryRunStops.id, stopId), eq(deliveryRuns.courierId, courierId)))
    .limit(1);
  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Delivery stop not found" });
  return { db, ...rows[0] };
}

export const deliveryRunsRouter = router({
  create: courierProcedure.input(z.object({
    deliveryIds: z.array(z.number().int().positive()).min(1).max(50),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const uniqueIds = input.deliveryIds.filter((id, index, ids) => ids.indexOf(id) === index);
    const selected = await db.select().from(deliveries)
      .where(and(eq(deliveries.courierId, ctx.user.id), inArray(deliveries.id, uniqueIds)));
    if (selected.length !== uniqueIds.length) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Every parcel must be assigned to this courier before it can be added to a run" });
    }
    const result = await db.insert(deliveryRuns).values({ courierId: ctx.user.id, status: "planned" });
    const runId = Number((result as any)[0]?.insertId ?? (result as any).insertId);
    const ordered = sequenceDeliveryRows(selected);
    await db.insert(deliveryRunStops).values(ordered.map((delivery, index) => ({
      runId,
      deliveryId: delivery.id,
      sequence: index + 1,
      status: "queued" as const,
    })));
    return { runId, stopCount: selected.length };
  }),

  createFromAssigned: courierProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const existingRuns = await db.select().from(deliveryRuns)
      .where(and(eq(deliveryRuns.courierId, ctx.user.id), inArray(deliveryRuns.status, ["planned", "active"])))
      .orderBy(asc(deliveryRuns.createdAt)).limit(1);
    if (existingRuns[0]) {
      const existingStops = await db.select().from(deliveryRunStops).where(eq(deliveryRunStops.runId, existingRuns[0].id));
      if (existingStops.length) return { runId: existingRuns[0].id, stopCount: existingStops.length, reused: true };
    }
    const selected = await db.select({ delivery: deliveries }).from(deliveries)
      .innerJoin(deliveryPaymentSessions, and(eq(deliveryPaymentSessions.deliveryId, deliveries.id), eq(deliveryPaymentSessions.status, "paid")))
      .where(and(eq(deliveries.courierId, ctx.user.id), inArray(deliveries.status, ["assigned", "in-transit"])))
      .orderBy(asc(deliveries.createdAt)).limit(50);
    if (!selected.length) throw new TRPCError({ code: "NOT_FOUND", message: "No assigned parcels are ready for a delivery run" });
    const result = await db.insert(deliveryRuns).values({ courierId: ctx.user.id, status: "planned" });
    const runId = Number((result as any)[0]?.insertId ?? (result as any).insertId);
    const ordered = sequenceDeliveryRows(selected.map(({ delivery }) => delivery));
    await db.insert(deliveryRunStops).values(ordered.map((delivery, index) => ({ runId, deliveryId: delivery.id, sequence: index + 1, status: "queued" as const })));
    return { runId, stopCount: selected.length, reused: false };
  }),

  active: courierProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const runRows = await db.select().from(deliveryRuns)
      .where(and(eq(deliveryRuns.courierId, ctx.user.id), inArray(deliveryRuns.status, ["planned", "active"])))
      .orderBy(asc(deliveryRuns.createdAt)).limit(1);
    const assignedDeliveries = await db.select({ id: deliveries.id, status: deliveries.status, paymentStatus: deliveryPaymentSessions.status }).from(deliveries)
      .leftJoin(deliveryPaymentSessions, eq(deliveryPaymentSessions.deliveryId, deliveries.id))
      .where(and(eq(deliveries.courierId, ctx.user.id), inArray(deliveries.status, ["assigned", "in-transit"])));
    const assignedSummary = { total: assignedDeliveries.length, ready: assignedDeliveries.filter(({ paymentStatus }) => paymentStatus === "paid").length, remaining: assignedDeliveries.length };
    if (!runRows[0]) return { run: null, stops: [], assignedSummary };
    const stops = await db.select({ stop: deliveryRunStops, delivery: deliveries, payment: deliveryPaymentSessions })
      .from(deliveryRunStops)
      .innerJoin(deliveries, eq(deliveryRunStops.deliveryId, deliveries.id))
      .leftJoin(deliveryPaymentSessions, eq(deliveryPaymentSessions.deliveryId, deliveries.id))
      .where(eq(deliveryRunStops.runId, runRows[0].id))
      .orderBy(asc(deliveryRunStops.sequence));
    const addressIds = stops.reduce<number[]>((ids, row) => ids.concat([row.delivery.pickupAddressId, row.delivery.dropoffAddressId]), []);
    const addressRows = addressIds.length ? await db.select().from(addresses).where(inArray(addresses.id, addressIds)) : [];
    const addressById = new Map(addressRows.map((address) => [address.id, address]));
    return { run: runRows[0], stops: stops.map((row) => ({ ...row, paymentStatus: row.payment?.status ?? null, pickupAddress: addressById.get(row.delivery.pickupAddressId) ?? null, dropoffAddress: addressById.get(row.delivery.dropoffAddressId) ?? null })), assignedSummary: { total: stops.length, ready: stops.filter(({ payment }) => payment?.status === "paid").length, remaining: stops.filter(({ stop }) => stop.status !== "completed").length } };
  }),

  start: courierProcedure.input(z.object({ runId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const run = await db.select().from(deliveryRuns).where(and(eq(deliveryRuns.id, input.runId), eq(deliveryRuns.courierId, ctx.user.id))).limit(1);
    if (!run[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Delivery run not found" });
    const first = await db.select({ stop: deliveryRunStops, paymentStatus: deliveryPaymentSessions.status }).from(deliveryRunStops)
      .innerJoin(deliveries, eq(deliveryRunStops.deliveryId, deliveries.id))
      .leftJoin(deliveryPaymentSessions, eq(deliveryPaymentSessions.deliveryId, deliveries.id))
      .where(and(eq(deliveryRunStops.runId, input.runId), eq(deliveryRunStops.status, "queued"))).orderBy(asc(deliveryRunStops.sequence)).limit(1);
    if (!first[0]) throw new TRPCError({ code: "CONFLICT", message: "There are no accepted parcels ready to start" });
    if (!first[0].stop.courierAcceptedAt) throw new TRPCError({ code: "CONFLICT", message: "Accept the first parcel before starting the route" });
    if (first[0].paymentStatus !== "paid") throw new TRPCError({ code: "CONFLICT", message: "This parcel is not paid and is not ready for pickup" });
    await db.update(deliveryRuns).set({ status: "active", startedAt: new Date() }).where(eq(deliveryRuns.id, input.runId));
    await db.update(deliveryRunStops).set({ status: "navigating" }).where(eq(deliveryRunStops.id, first[0].stop.id));
    return { started: true, firstStopId: first[0].stop.id };
  }),

  beginStop: courierProcedure.input(stopIdInput).mutation(async ({ ctx, input }) => {
    const { db, stop, delivery, run } = await getOwnedStop(input.stopId, ctx.user.id);
    if (run.status !== "active") throw new TRPCError({ code: "CONFLICT", message: "Start the courier route before beginning pickup navigation" });
    if (stop.status !== "queued" || !stop.courierAcceptedAt) throw new TRPCError({ code: "CONFLICT", message: "Accept this parcel before starting its pickup route" });
    if (!delivery.packageLabelPhotoKey || !delivery.packageLabelConfirmedAt) throw new TRPCError({ code: "CONFLICT", message: "The customer parcel label evidence is still required before pickup" });
    const [payment] = await db.select({ status: deliveryPaymentSessions.status }).from(deliveryPaymentSessions).where(eq(deliveryPaymentSessions.deliveryId, stop.deliveryId)).limit(1);
    if (payment?.status !== "paid") throw new TRPCError({ code: "CONFLICT", message: "This parcel is not paid and is not ready for pickup" });
    await db.update(deliveryRunStops).set({ status: "navigating" }).where(eq(deliveryRunStops.id, input.stopId));
    return { started: true, stopId: input.stopId };
  }),

  acceptStop: courierProcedure.input(stopIdInput).mutation(async ({ ctx, input }) => {
    const { db, stop, delivery } = await getOwnedStop(input.stopId, ctx.user.id);
    if (stop.status !== "queued") throw new TRPCError({ code: "CONFLICT", message: "This parcel is not waiting for acceptance" });
    if (!delivery.packageLabelPhotoKey || !delivery.packageLabelConfirmedAt) throw new TRPCError({ code: "CONFLICT", message: "This parcel is waiting for the customer’s identification-code photo before pickup" });
    const [payment] = await db.select({ status: deliveryPaymentSessions.status }).from(deliveryPaymentSessions).where(eq(deliveryPaymentSessions.deliveryId, stop.deliveryId)).limit(1);
    if (payment?.status !== "paid") throw new TRPCError({ code: "CONFLICT", message: "This parcel is not paid and cannot be accepted for pickup" });
    await db.update(deliveryRunStops).set({ courierAcceptedAt: new Date(), courierDeclinedAt: null, declineReason: null }).where(eq(deliveryRunStops.id, input.stopId));
    return { accepted: true, stopId: input.stopId };
  }),

  confirmPickup: courierProcedure.input(stopIdInput).mutation(async ({ ctx, input }) => {
    const { db, stop, delivery } = await getOwnedStop(input.stopId, ctx.user.id);
    if (!stop.courierAcceptedAt) throw new TRPCError({ code: "CONFLICT", message: "Accept this parcel before confirming pickup" });
    if (stop.pickupCompletedAt) return { pickedUp: true, stopId: input.stopId, alreadyRecorded: true };
    if (!delivery.packageLabelPhotoKey || !delivery.packageLabelConfirmedAt) throw new TRPCError({ code: "CONFLICT", message: "The customer parcel label evidence is still required before pickup" });
    if (!["arrived", "navigating"].includes(stop.status)) throw new TRPCError({ code: "CONFLICT", message: "Navigate to the pickup address before confirming pickup" });
    const [payment] = await db.select({ status: deliveryPaymentSessions.status }).from(deliveryPaymentSessions).where(eq(deliveryPaymentSessions.deliveryId, stop.deliveryId)).limit(1);
    if (payment?.status !== "paid") throw new TRPCError({ code: "CONFLICT", message: "This parcel is not paid and is not ready for pickup" });
    await db.update(deliveryRunStops).set({ pickupCompletedAt: new Date(), status: "navigating" }).where(eq(deliveryRunStops.id, input.stopId));
    await db.update(deliveries).set({ status: "in-transit" }).where(eq(deliveries.id, delivery.id));
    await db.insert(notifications).values({ userId: delivery.customerId, type: "delivery_status", title: "Parcel collected", message: `Parcel ${delivery.trackingCode} has been collected and is now on the way.`, relatedDeliveryId: delivery.id });
    return { pickedUp: true, stopId: input.stopId, alreadyRecorded: false };
  }),

  declineStop: courierProcedure.input(stopIdInput.extend({ reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => {
    const { db, stop, delivery } = await getOwnedStop(input.stopId, ctx.user.id);
    if (!["queued", "navigating"].includes(stop.status)) throw new TRPCError({ code: "CONFLICT", message: "This parcel can no longer be declined" });
    await db.update(deliveryRunStops).set({ status: "failed", courierDeclinedAt: new Date(), declineReason: input.reason }).where(eq(deliveryRunStops.id, input.stopId));
    await db.update(deliveries).set({ courierId: null, status: "pending" }).where(eq(deliveries.id, delivery.id));
    await db.insert(notifications).values({ userId: ctx.user.id, type: "delivery_status", title: "Parcel returned to shared queue", message: `Parcel ${delivery.trackingCode} was declined and returned to the shared courier queue for reassignment.`, relatedDeliveryId: delivery.id });
    return { declined: true, stopId: input.stopId, returnedToDispatch: true };
  }),


  markArrived: courierProcedure.input(stopIdInput).mutation(async ({ ctx, input }) => {
    const { db, stop } = await getOwnedStop(input.stopId, ctx.user.id);
    if (!["navigating", "queued"].includes(stop.status)) throw new TRPCError({ code: "CONFLICT", message: "This stop is not ready for arrival confirmation" });
    await db.update(deliveryRunStops).set({ status: "arrived", courierArrivedAt: new Date() }).where(eq(deliveryRunStops.id, input.stopId));
    return { status: "arrived" as const };
  }),

  requestHelp: courierProcedure.input(stopIdInput.extend({
    issue: z.enum(["address", "customer", "parcel", "relay"]),
    note: z.string().trim().max(500).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { db, stop, delivery } = await getOwnedStop(input.stopId, ctx.user.id);
    const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
    const issueLabel = { address: "address help", customer: "customer contact help", parcel: "parcel guidance", relay: "relay handoff help" }[input.issue];
    const message = `Courier requested ${issueLabel} for parcel ${delivery.trackingCode}.${input.note ? ` Note: ${input.note}` : ""}`;
    if (admins.length) await db.insert(notifications).values(admins.map(({ id }) => ({ userId: id, type: "delivery_status" as const, title: "Courier help requested", message, relatedDeliveryId: delivery.id })));
    return { requested: true, message: "Help request sent to the Mzansi support team." };
  }),

  completeWithPhoto: courierProcedure.input(stopIdInput.extend({
    photoDataUrl: z.string().regex(/^data:image\/(jpeg|png|webp);base64,/).max(12_000_000),
    photoName: z.string().min(1).max(255).default("delivery-proof.jpg"),
    note: z.string().max(1000).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { db, stop, delivery } = await getOwnedStop(input.stopId, ctx.user.id);
    if (!["arrived", "navigating"].includes(stop.status)) throw new TRPCError({ code: "CONFLICT", message: "The courier must arrive at this stop before uploading proof" });
    const match = input.photoDataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid proof photo" });
    const contentType = match[1];
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > 8 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Proof photo must be 8 MB or smaller" });
    const stored = await storagePut(`delivery-proof/${stop.deliveryId}/${input.photoName}`, buffer, contentType);
    await db.update(deliveryRunStops).set({
      status: "awaiting_customer_confirmation",
      courierCompletedAt: new Date(),
      proofPhotoUrl: stored.url,
      proofPhotoKey: stored.key,
      proofPhotoName: input.photoName,
      courierNote: input.note,
    }).where(eq(deliveryRunStops.id, input.stopId));
    await db.insert(notifications).values({
      userId: delivery.customerId,
      type: "delivery_status",
      title: "Confirm your delivery",
      message: `Courier proof is ready for parcel ${delivery.trackingCode}. Confirm receipt at /delivery/confirm/${delivery.id} before the courier continues.`,
      relatedDeliveryId: delivery.id,
    });
    return {
      status: "awaiting_customer_confirmation" as const,
      proofPhotoUrl: stored.url,
      confirmationPath: `/delivery/confirm/${stop.deliveryId}`,
    };
  }),

  customerView: customerProcedure.input(z.object({ deliveryId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const rows = await db.select({ stop: deliveryRunStops, delivery: deliveries })
      .from(deliveryRunStops).innerJoin(deliveries, eq(deliveryRunStops.deliveryId, deliveries.id))
      .where(and(eq(deliveryRunStops.deliveryId, input.deliveryId), eq(deliveries.customerId, ctx.user.id))).limit(1);
    if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Delivery confirmation not found" });
    return rows[0];
  }),

  confirmReceipt: customerProcedure.input(z.object({ stopId: z.number().int().positive(), accepted: z.boolean(), issueType: z.enum(["parcel_mismatch", "proof_unclear", "damage_concern", "recipient_unavailable", "other"]).optional(), note: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const rows = await db.select({ stop: deliveryRunStops, run: deliveryRuns, delivery: deliveries })
      .from(deliveryRunStops).innerJoin(deliveryRuns, eq(deliveryRunStops.runId, deliveryRuns.id)).innerJoin(deliveries, eq(deliveryRunStops.deliveryId, deliveries.id))
      .where(and(eq(deliveryRunStops.id, input.stopId), eq(deliveries.customerId, ctx.user.id))).limit(1);
    const row = rows[0];
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Delivery confirmation not found" });
    if (row.stop.status !== "awaiting_customer_confirmation") throw new TRPCError({ code: "CONFLICT", message: "This delivery is not awaiting confirmation" });
    if (!input.accepted) {
      const issueType = input.issueType ?? "other";
      const reason = `Customer reported ${issueType.replaceAll("_", " ")} for parcel ${row.delivery.trackingCode}.`;
      await db.update(deliveryRunStops).set({ status: "failed", courierNote: input.note || reason }).where(eq(deliveryRunStops.id, input.stopId));
      await db.insert(relayExceptionEvents).values({ deliveryId: row.delivery.id, relayLegId: null, reportedByUserId: ctx.user.id, currentCustodianId: row.delivery.courierId, type: "custody_review", status: "open", recoveryAction: "operations_review", reason, note: input.note ?? null, customerNotifiedAt: new Date() });
      if (row.delivery.courierId) await db.insert(notifications).values({ userId: row.delivery.courierId, type: "delivery_status", title: "Customer requested a parcel review", message: `A customer review is open for parcel ${row.delivery.trackingCode}. Please keep the parcel secure while the owner team reviews it.`, relatedDeliveryId: row.delivery.id });
      return { status: "failed" as const, nextStopId: null, exceptionRecorded: true };
    }
    await db.update(deliveryRunStops).set({ status: "completed", customerConfirmedAt: new Date(), courierNote: input.note }).where(eq(deliveryRunStops.id, input.stopId));
    await db.update(deliveries).set({ status: "delivered", actualDeliveryTime: new Date(), proofOfDelivery: { type: "photo", data: row.stop.proofPhotoUrl, customerConfirmed: true } }).where(eq(deliveries.id, row.delivery.id));
    await db.insert(notifications).values({
      userId: row.delivery.customerId,
      type: "delivery_status",
      title: "Delivery completed",
      message: `Parcel ${row.delivery.trackingCode} was delivered and confirmed at its destination.`,
      relatedDeliveryId: row.delivery.id,
    });
    if (row.delivery.courierId) {
      await db.insert(notifications).values({
        userId: row.delivery.courierId,
        type: "delivery_status",
        title: "Delivery confirmed",
        message: `Customer confirmed delivery for parcel ${row.delivery.trackingCode}.`,
        relatedDeliveryId: row.delivery.id,
      });
    }
    const [customer] = await db.select({ phone: users.phone }).from(users).where(eq(users.id, row.delivery.customerId)).limit(1);
    if (customer?.phone) {
      await sendMessageWithFallback(customer.phone, `Mzansi Couriers: parcel ${row.delivery.trackingCode} was delivered and confirmed at its destination.`).catch((error) => {
        console.error("[Delivery Completion] Outbound customer notification failed:", error);
      });
    }
    const next = await db.select().from(deliveryRunStops).where(and(eq(deliveryRunStops.runId, row.run.id), eq(deliveryRunStops.sequence, row.stop.sequence + 1))).limit(1);
    if (next[0]) {
      // The next parcel remains queued until the courier explicitly accepts it.
      await db.update(deliveryRunStops).set({ status: "queued" }).where(eq(deliveryRunStops.id, next[0].id));
    } else await db.update(deliveryRuns).set({ status: "completed", completedAt: new Date() }).where(eq(deliveryRuns.id, row.run.id));
    return { status: "completed" as const, nextStopId: next[0]?.id ?? null };
  }),
});
