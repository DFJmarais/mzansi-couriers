import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { courierRatings, deliveries, deliveryReviews, deliveryRunStops, notifications, parcelCustodyScans, users } from "../../drizzle/schema";
import { sendMessageWithFallback } from "../_core/twilio";
import { sendDeliveryEmail } from "../_core/email";

const courierProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "courier") throw new TRPCError({ code: "FORBIDDEN", message: "Courier access required" });
  return next({ ctx });
});
const customerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "customer") throw new TRPCError({ code: "FORBIDDEN", message: "Customer access required" });
  return next({ ctx });
});

async function notifyRecipient(db: any, delivery: any, title: string, message: string) {
  const recipients = new Set<number>([delivery.customerId]);
  const matched = delivery.recipientEmail || delivery.recipientPhone
    ? await db.select({ id: users.id }).from(users).where(delivery.recipientEmail
      ? eq(users.email, delivery.recipientEmail)
      : eq(users.phone, delivery.recipientPhone)).limit(1)
    : [];
  if (matched[0]) recipients.add(matched[0].id);
  if (recipients.size) await db.insert(notifications).values(Array.from(recipients).map((userId) => ({ userId, type: "delivery_status" as const, title, message, relatedDeliveryId: delivery.id })));
  const phones = [delivery.recipientPhone];
  const sender = await db.select({ phone: users.phone }).from(users).where(eq(users.id, delivery.customerId)).limit(1);
  if (sender[0]?.phone) phones.push(sender[0].phone);
  await Promise.all(Array.from(new Set(phones.filter(Boolean))).map((phone) => sendMessageWithFallback(String(phone), `Mzansi Couriers: ${message}`).catch(() => null)));
  await sendDeliveryEmail(delivery.recipientEmail, title, message).catch(() => null);
}

export const parcelCustodyRouter = router({
  scan: courierProcedure.input(z.object({
    trackingCode: z.string().trim().min(6).max(64),
    scanType: z.enum(["pickup", "delivery"]),
    stopId: z.number().int().positive().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [delivery] = await db.select().from(deliveries).where(and(eq(deliveries.trackingCode, input.trackingCode.toUpperCase()), eq(deliveries.courierId, ctx.user.id))).limit(1);
    if (!delivery) throw new TRPCError({ code: "NOT_FOUND", message: "This parcel is not assigned to your courier account" });
    if (input.stopId) {
      const [stop] = await db.select().from(deliveryRunStops).where(and(eq(deliveryRunStops.id, input.stopId), eq(deliveryRunStops.deliveryId, delivery.id))).limit(1);
      if (!stop) throw new TRPCError({ code: "FORBIDDEN", message: "This QR code does not belong to the selected route stop" });
    }
    const [existing] = await db.select().from(parcelCustodyScans).where(and(eq(parcelCustodyScans.deliveryId, delivery.id), eq(parcelCustodyScans.scannedByUserId, ctx.user.id), eq(parcelCustodyScans.scanType, input.scanType))).limit(1);
    if (!existing) await db.insert(parcelCustodyScans).values({ deliveryId: delivery.id, scannedByUserId: ctx.user.id, scanType: input.scanType, scannedCode: input.trackingCode.toUpperCase(), accepted: true });
    if (input.scanType === "pickup") {
      await notifyRecipient(db, delivery, "Parcel scanned at pickup", `Parcel ${delivery.trackingCode} was scanned and collected. It is now moving through the delivery network.`);
    } else {
      await notifyRecipient(db, delivery, "Parcel scanned at destination", `Parcel ${delivery.trackingCode} has reached the delivery point. Delivery proof and recipient confirmation are next.`);
    }
    return { verified: true, deliveryId: delivery.id, scanType: input.scanType, trackingCode: delivery.trackingCode };
  }),

  review: customerProcedure.input(z.object({ deliveryId: z.number().int().positive(), score: z.number().int().min(1).max(5), comment: z.string().trim().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [delivery] = await db.select().from(deliveries).where(and(eq(deliveries.id, input.deliveryId), eq(deliveries.customerId, ctx.user.id), eq(deliveries.status, "delivered"))).limit(1);
    if (!delivery) throw new TRPCError({ code: "NOT_FOUND", message: "Only your completed delivery can be reviewed" });
    if (delivery.courierId) await db.insert(courierRatings).values({ courierId: delivery.courierId, customerId: ctx.user.id, deliveryId: delivery.id, rating: input.score, review: input.comment ?? null, categories: null });
    await db.insert(deliveryReviews).values({ deliveryId: delivery.id, reviewerUserId: ctx.user.id, score: input.score, comment: input.comment ?? null });
    return { submitted: true };
  }),
});
