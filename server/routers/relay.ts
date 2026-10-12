import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { courierHandoffOffers, courierProfiles, deliveryRelayLegs, deliveries, deliveryTracking, notifications, relayHandoffPoints, parcelCustodyScans, relayHandoffInspections } from "../../drizzle/schema";
import { chooseHandoffLocation } from "../relay/handoff-selection";
import { getDb } from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";
import { calculateCourierSafety } from "../safety/courier-safety";

const courierProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "courier") throw new TRPCError({ code: "FORBIDDEN", message: "Courier access required" });
  return next({ ctx });
});

const offerIdInput = z.object({ offerId: z.number().int().positive() });
const legIdInput = z.object({ legId: z.number().int().positive() });

export const relayRouter = router({
  plan: adminProcedure.input(z.object({
    deliveryId: z.number().int().positive(),
    originArea: z.string().trim().min(2).max(120),
    destinationArea: z.string().trim().min(2).max(120),
    firstCourierId: z.number().int().positive(),
    nextCourierId: z.number().int().positive().optional(),
    handoffPointId: z.number().int().positive().optional(),
    currentCourierLocation: z.object({ lat: z.number(), lng: z.number() }).optional(),
    nextCourierLocation: z.object({ lat: z.number(), lng: z.number() }).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    if (input.nextCourierId && input.nextCourierId === input.firstCourierId) throw new TRPCError({ code: "BAD_REQUEST", message: "Relay couriers must be different" });
    const relayCourierIds = [input.firstCourierId, input.nextCourierId].filter((id): id is number => Boolean(id));
    const [relayProfiles, relayTracking] = await Promise.all([
      db.select().from(courierProfiles).where(inArray(courierProfiles.userId, relayCourierIds)),
      db.select().from(deliveryTracking).where(inArray(deliveryTracking.courierId, relayCourierIds)),
    ]);
    for (const courierId of relayCourierIds) {
      const profile = relayProfiles.find((candidate) => candidate.userId === courierId);
      const status = calculateCourierSafety(relayTracking.filter((point) => point.courierId === courierId).map((point) => ({ latitude: Number(point.latitude), longitude: Number(point.longitude), timestamp: point.timestamp })));
      if (!profile?.isAvailable || !status.eligibleForOffers) throw new TRPCError({ code: "CONFLICT", message: `Courier ${courierId} is not currently eligible for a relay notification because of availability or fatigue controls` });
    }
    const existing = await db.select({ id: deliveryRelayLegs.id }).from(deliveryRelayLegs).where(eq(deliveryRelayLegs.deliveryId, input.deliveryId)).limit(1);
    if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "A relay plan already exists for this parcel" });
    const selectedPoint = input.nextCourierId && input.handoffPointId ? (await db.select().from(relayHandoffPoints).where(and(eq(relayHandoffPoints.id, input.handoffPointId), eq(relayHandoffPoints.isActive, true))).limit(1))[0] : undefined;
    const availablePoints = input.nextCourierId && !selectedPoint ? await db.select().from(relayHandoffPoints).where(eq(relayHandoffPoints.isActive, true)) : [];
    const selectedHandoff = selectedPoint
      ? { mode: "designated_point" as const, pointId: selectedPoint.id, address: selectedPoint.address, name: selectedPoint.name, area: selectedPoint.area, latitude: Number(selectedPoint.latitude), longitude: Number(selectedPoint.longitude), safetyNotes: selectedPoint.safetyNotes }
      : input.nextCourierId && input.currentCourierLocation && input.nextCourierLocation
        ? chooseHandoffLocation(input.currentCourierLocation, input.nextCourierLocation, availablePoints.map((point) => ({ id: point.id, name: point.name, area: point.area, address: point.address, lat: Number(point.latitude), lng: Number(point.longitude), safetyNotes: point.safetyNotes })))
        : { mode: "courier_meeting" as const, pointId: null, address: "Safe meeting point to be agreed by both couriers", name: "Courier meeting point", area: "Between courier areas", latitude: null, longitude: null, safetyNotes: "Both couriers must agree on a public, well-lit location before handoff." };
    const legValues: Array<typeof deliveryRelayLegs.$inferInsert> = [{ deliveryId: input.deliveryId, sequence: 1, originArea: input.originArea, destinationArea: input.nextCourierId ? input.originArea : input.destinationArea, handoffPointId: null, handoffMode: "courier_meeting", meetingAddress: null, meetingLatitude: null, meetingLongitude: null, fromCourierId: null, toCourierId: input.firstCourierId, status: "planned", currentCustodianId: null }];
    if (input.nextCourierId) legValues.push({ deliveryId: input.deliveryId, sequence: 2, originArea: input.originArea, destinationArea: input.destinationArea, handoffPointId: selectedHandoff.pointId, handoffMode: selectedHandoff.mode, meetingAddress: selectedHandoff.address, meetingLatitude: selectedHandoff.latitude === null ? null : String(selectedHandoff.latitude), meetingLongitude: selectedHandoff.longitude === null ? null : String(selectedHandoff.longitude), fromCourierId: input.firstCourierId, toCourierId: input.nextCourierId, status: "planned", currentCustodianId: null });
    const legs = await db.insert(deliveryRelayLegs).values(legValues);
    const firstLegId = Number(legs[0].insertId);
    if (input.nextCourierId) {
      const secondLegId = firstLegId + 1;
      await db.insert(courierHandoffOffers).values({ relayLegId: secondLegId, offeredByCourierId: input.firstCourierId, offeredToCourierId: input.nextCourierId, status: "offered", expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
      await db.insert(notifications).values({ userId: input.firstCourierId, type: "delivery_status", title: "Relay route ready", message: `Parcel ${input.deliveryId} must be handed to the next courier at ${selectedHandoff.name} in ${selectedHandoff.area}.`, relatedDeliveryId: input.deliveryId });
      await db.insert(notifications).values({ userId: input.nextCourierId, type: "delivery_status", title: "Relay handoff offered", message: `A parcel is ready for handoff at ${selectedHandoff.name}. Meet the other courier at ${selectedHandoff.address}.`, relatedDeliveryId: input.deliveryId });
    }
    return { created: true, firstLegId, relayLegCount: legValues.length, createdBy: ctx.user.id };
  }),

  myOffers: courierProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    return db.select({ offer: courierHandoffOffers, leg: deliveryRelayLegs, delivery: deliveries })
      .from(courierHandoffOffers)
      .innerJoin(deliveryRelayLegs, eq(courierHandoffOffers.relayLegId, deliveryRelayLegs.id))
      .innerJoin(deliveries, eq(deliveryRelayLegs.deliveryId, deliveries.id))
      .where(and(eq(courierHandoffOffers.offeredToCourierId, ctx.user.id), eq(courierHandoffOffers.status, "offered")))
      .orderBy(desc(courierHandoffOffers.createdAt));
  }),

  activeReceives: courierProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    return db.select({ leg: deliveryRelayLegs, delivery: deliveries })
      .from(deliveryRelayLegs)
      .innerJoin(deliveries, eq(deliveryRelayLegs.deliveryId, deliveries.id))
      .where(and(eq(deliveryRelayLegs.toCourierId, ctx.user.id), inArray(deliveryRelayLegs.status, ["accepted", "handoff_pending"])))
      .orderBy(desc(deliveryRelayLegs.id));
  }),

  acceptOffer: courierProcedure.input(offerIdInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const rows = await db.select({ offer: courierHandoffOffers, leg: deliveryRelayLegs }).from(courierHandoffOffers).innerJoin(deliveryRelayLegs, eq(courierHandoffOffers.relayLegId, deliveryRelayLegs.id)).where(and(eq(courierHandoffOffers.id, input.offerId), eq(courierHandoffOffers.offeredToCourierId, ctx.user.id), eq(courierHandoffOffers.status, "offered"))).limit(1);
    if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Handoff offer not found or already answered" });
    const acceptanceTracking = await db.select().from(deliveryTracking).where(eq(deliveryTracking.courierId, ctx.user.id));
    if (!calculateCourierSafety(acceptanceTracking.map((point) => ({ latitude: Number(point.latitude), longitude: Number(point.longitude), timestamp: point.timestamp }))).eligibleForOffers) throw new TRPCError({ code: "CONFLICT", message: "Your safety cooldown is active. Please rest before accepting another relay parcel." });
    await db.update(courierHandoffOffers).set({ status: "accepted", respondedAt: new Date() }).where(eq(courierHandoffOffers.id, input.offerId));
    await db.update(deliveryRelayLegs).set({ status: "accepted", toCourierId: ctx.user.id }).where(eq(deliveryRelayLegs.id, rows[0].leg.id));
    return { accepted: true, relayLegId: rows[0].leg.id };
  }),

  declineOffer: courierProcedure.input(offerIdInput.extend({ reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const rows = await db.select({ offer: courierHandoffOffers, leg: deliveryRelayLegs }).from(courierHandoffOffers).innerJoin(deliveryRelayLegs, eq(courierHandoffOffers.relayLegId, deliveryRelayLegs.id)).where(and(eq(courierHandoffOffers.id, input.offerId), eq(courierHandoffOffers.offeredToCourierId, ctx.user.id), eq(courierHandoffOffers.status, "offered"))).limit(1);
    if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Handoff offer not found or already answered" });
    await db.update(courierHandoffOffers).set({ status: "declined", reason: input.reason, respondedAt: new Date() }).where(eq(courierHandoffOffers.id, input.offerId));
    await db.update(deliveryRelayLegs).set({ status: "declined" }).where(eq(deliveryRelayLegs.id, rows[0].leg.id));
    return { declined: true, relayLegId: rows[0].leg.id, returnedToNetwork: true };
  }),

  recordPickup: courierProcedure.input(legIdInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const rows = await db.select().from(deliveryRelayLegs).where(and(eq(deliveryRelayLegs.id, input.legId), eq(deliveryRelayLegs.toCourierId, ctx.user.id), inArray(deliveryRelayLegs.status, ["planned", "accepted"]))).limit(1);
    if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Relay leg is not assigned to you" });
    await db.update(deliveryRelayLegs).set({ status: "in_transit", currentCustodianId: ctx.user.id, pickupAt: new Date() }).where(eq(deliveryRelayLegs.id, input.legId));
    return { pickedUp: true, relayLegId: input.legId };
  }),

  completeHandoff: courierProcedure.input(legIdInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const rows = await db.select({ leg: deliveryRelayLegs }).from(deliveryRelayLegs).where(and(eq(deliveryRelayLegs.id, input.legId), eq(deliveryRelayLegs.fromCourierId, ctx.user.id), eq(deliveryRelayLegs.status, "in_transit"))).limit(1);
    if (!rows[0]) throw new TRPCError({ code: "CONFLICT", message: "This parcel is not ready for handoff" });
    await db.update(deliveryRelayLegs).set({ status: "handoff_pending", handoffConfirmedByFrom: new Date() }).where(eq(deliveryRelayLegs.id, input.legId));
    return { handoffPending: true, nextCourierId: rows[0].leg.toCourierId, message: "The receiving courier must confirm the parcel and barcode before custody transfers." };
  }),

  scanReceive: courierProcedure.input(legIdInput.extend({ trackingCode: z.string().trim().min(6).max(64) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const rows = await db.select({ leg: deliveryRelayLegs, delivery: deliveries }).from(deliveryRelayLegs).innerJoin(deliveries, eq(deliveryRelayLegs.deliveryId, deliveries.id)).where(and(eq(deliveryRelayLegs.id, input.legId), eq(deliveryRelayLegs.toCourierId, ctx.user.id), eq(deliveries.trackingCode, input.trackingCode.toUpperCase()), eq(deliveryRelayLegs.status, "handoff_pending"))).limit(1);
    if (!rows[0]) throw new TRPCError({ code: "CONFLICT", message: "This QR code is not the parcel waiting for your relay handoff" });
    await db.insert(parcelCustodyScans).values({ deliveryId: rows[0].delivery.id, relayLegId: input.legId, scannedByUserId: ctx.user.id, scanType: "relay_receive", scannedCode: input.trackingCode.toUpperCase(), accepted: true });
    if (rows[0].leg.fromCourierId) await db.insert(notifications).values({ userId: rows[0].leg.fromCourierId, type: "delivery_status", title: "Relay handoff ready for approval", message: `The receiving courier scanned parcel ${rows[0].delivery.trackingCode}. Please approve the handoff after reviewing the condition report.`, relatedDeliveryId: rows[0].delivery.id });
    return { scanned: true, deliveryId: rows[0].delivery.id, awaitingFromCourierApproval: true };
  }),

  submitInspection: courierProcedure.input(legIdInput.extend({ conditionAccepted: z.boolean(), checklist: z.object({ sealed: z.boolean(), labelMatches: z.boolean(), noVisibleDamage: z.boolean() }), defectNote: z.string().trim().max(1000).optional(), defectPhotos: z.array(z.object({ dataUrl: z.string().regex(/^data:image\/(jpeg|png|webp);base64,/), name: z.string().min(1).max(255) })).max(5).default([]) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [leg] = await db.select().from(deliveryRelayLegs).where(and(eq(deliveryRelayLegs.id, input.legId), eq(deliveryRelayLegs.toCourierId, ctx.user.id), eq(deliveryRelayLegs.status, "handoff_pending"))).limit(1);
    if (!leg) throw new TRPCError({ code: "NOT_FOUND", message: "Relay handoff not found" });
    const photos: string[] = [];
    for (const photo of input.defectPhotos) {
      const match = photo.dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
      if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid defect photo" });
      const stored = await storagePut(`relay-defects/${leg.deliveryId}/${photo.name}`, Buffer.from(match[2], "base64"), match[1]);
      photos.push(stored.url);
    }
    await db.insert(relayHandoffInspections).values({ deliveryId: leg.deliveryId, relayLegId: leg.id, inspectorCourierId: ctx.user.id, conditionAccepted: input.conditionAccepted, checklist: input.checklist, defectNote: input.defectNote ?? null, defectPhotoUrls: photos });
    return { submitted: true, photoCount: photos.length, awaitingFromCourierApproval: true };
  }),

  confirmHandoff: courierProcedure.input(legIdInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const rows = await db.select().from(deliveryRelayLegs).where(and(eq(deliveryRelayLegs.id, input.legId), eq(deliveryRelayLegs.toCourierId, ctx.user.id), eq(deliveryRelayLegs.status, "handoff_pending"))).limit(1);
    if (!rows[0]) throw new TRPCError({ code: "CONFLICT", message: "This parcel is not waiting for your handoff confirmation" });
    if (!rows[0].handoffConfirmedByFrom) throw new TRPCError({ code: "CONFLICT", message: "The current courier must confirm the handoff first" });
    const [scan] = await db.select().from(parcelCustodyScans).where(and(eq(parcelCustodyScans.relayLegId, input.legId), eq(parcelCustodyScans.scannedByUserId, ctx.user.id), eq(parcelCustodyScans.scanType, "relay_receive"))).limit(1);
    const [inspection] = await db.select().from(relayHandoffInspections).where(and(eq(relayHandoffInspections.relayLegId, input.legId), eq(relayHandoffInspections.inspectorCourierId, ctx.user.id))).limit(1);
    if (!scan || !inspection) throw new TRPCError({ code: "CONFLICT", message: "Scan the parcel QR code and complete the condition inspection before custody can transfer" });
    await db.update(deliveryRelayLegs).set({ status: "handed_off", handoffConfirmedByTo: new Date(), handedOffAt: new Date(), currentCustodianId: ctx.user.id }).where(eq(deliveryRelayLegs.id, input.legId));
    return { confirmed: true, relayLegId: input.legId, custodyCourierId: ctx.user.id };
  }),
});
