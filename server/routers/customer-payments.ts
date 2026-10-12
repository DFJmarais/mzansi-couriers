import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { addresses, deliveryPaymentSessions, deliveries, users } from "../../drizzle/schema";
import { initializePayment, verifyPayment } from "../payments/paystack";
import { generateTrackingCode } from "../services/tracking-code";
import { z } from "zod";
import { storagePut } from "../storage";
import { validateTrackingCode } from "../services/tracking-code";
import { calculateCustomerPricing, type CourierServiceLevel } from "../services/courier-pricing";
import { initializeParcelLedger } from "../services/financial-ledger";

const addressInput = z.object({
  street: z.string().min(2),
  city: z.string().min(2),
  postalCode: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
});

const bookingInput = z.object({
  pickup: addressInput,
  dropoff: addressInput,
  packageSize: z.enum(["small", "medium", "large"]),
  packageType: z.enum(["envelope", "box", "soft_parcel"]),
  lengthCm: z.number().positive().max(300),
  widthCm: z.number().positive().max(300),
  heightCm: z.number().positive().max(300),
  fragile: z.boolean().default(false),
  livestock: z.boolean().default(false),
  packageWeight: z.number().positive(),
  packageDescription: z.string().max(500).optional(),
  distance: z.number().positive(),
  estimatedDeliveryTime: z.number().positive(),
  serviceLevel: z.enum(["economy", "priority", "express", "localSameDay"]).default("economy"),
  amount: z.number().positive(),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  customerPhone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number").optional(),
  recipientName: z.string().trim().min(1).max(160),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid recipient phone number").optional(),
  callbackUrl: z.string().url(),
  trackingCode: z.string().refine(validateTrackingCode, "Enter the parcel identification code shown by Mzansi Couriers"),
  packageLabelPhotoKey: z.string().min(1).max(255),
  packageLabelConfirmed: z.literal(true),
});

const customerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "customer") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Customer access required" });
  }
  return next({ ctx });
});

export function calculateExpectedDeliveryAmount(input: Pick<z.infer<typeof bookingInput>, "distance" | "packageSize" | "packageWeight" | "lengthCm" | "widthCm" | "heightCm" | "serviceLevel" | "fragile">) {
  const packageSizeMinimumWeight = { small: 0, medium: 5, large: 15 } as const;
  return calculateCustomerPricing({
    distanceKm: input.distance,
    actualWeightKg: Math.max(input.packageWeight, packageSizeMinimumWeight[input.packageSize]),
    lengthCm: input.lengthCm,
    widthCm: input.widthCm,
    heightCm: input.heightCm,
    serviceLevel: input.serviceLevel as CourierServiceLevel,
    isFragile: input.fragile,
  }).finalPrice;
}

function asJson(value: z.infer<typeof bookingInput>) {
  return value as unknown as Record<string, unknown>;
}

export function validateCustomerParcelEvidence(input: Pick<z.infer<typeof bookingInput>, "trackingCode" | "packageLabelPhotoKey" | "packageLabelConfirmed">, customerId: number) {
  return input.packageLabelConfirmed === true
    && validateTrackingCode(input.trackingCode)
    && input.packageLabelPhotoKey.startsWith(`package-label/${customerId}/`);
}

export const customerPaymentsRouter = router({
  prepareParcelCode: customerProcedure.mutation(() => ({ trackingCode: generateTrackingCode() })),

  uploadParcelLabelPhoto: customerProcedure.input(z.object({
    photoDataUrl: z.string().regex(/^data:image\/(jpeg|png|webp);base64,/).max(12_000_000),
    photoName: z.string().min(1).max(255).default("parcel-label.jpg"),
  })).mutation(async ({ ctx, input }) => {
    const match = input.photoDataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Please upload a parcel photo in JPG, PNG, or WebP format" });
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > 8 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Parcel photo must be 8 MB or smaller" });
    const stored = await storagePut(`package-label/${ctx.user.id}/${input.photoName}`, buffer, match[1]);
    return { ...stored, message: "Parcel photo uploaded securely" };
  }),

  startCheckout: customerProcedure.input(bookingInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Payment service is unavailable" });

    if (!validateCustomerParcelEvidence(input, ctx.user.id)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Confirm the parcel code and upload its labelled-parcel photo before continuing" });
    }
    const reference = `delivery-checkout-${ctx.user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const expectedAmount = calculateExpectedDeliveryAmount(input);
    if (Math.abs(input.amount - expectedAmount) > 0.01) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "The payment amount does not match the current delivery quote" });
    }
    const bookingData = asJson(input);
    await db.insert(deliveryPaymentSessions).values({
      customerId: ctx.user.id,
      reference,
      amount: input.amount.toFixed(2),
      currency: "ZAR",
      status: "pending",
      bookingData,
    });

    const paystackResult = await initializePayment({
      email: input.customerEmail,
      amount: input.amount,
      reference,
      callback_url: input.callbackUrl,
      metadata: {
        customer_id: ctx.user.id,
        customer_name: input.customerName,
        type: "delivery_payment",
        checkout_reference: reference,
      },
    });
    if (!paystackResult.success || !paystackResult.authorization_url) {
      await db.update(deliveryPaymentSessions).set({ status: "failed" }).where(eq(deliveryPaymentSessions.reference, reference));
      return { success: false as const, error: paystackResult.error ?? "Paystack could not start checkout" };
    }
    return { success: true as const, authorization_url: paystackResult.authorization_url, reference };
  }),

  verifyCheckout: customerProcedure.input(z.object({ reference: z.string().min(10) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Payment service is unavailable" });
    const sessionRows = await db.select().from(deliveryPaymentSessions).where(and(eq(deliveryPaymentSessions.reference, input.reference), eq(deliveryPaymentSessions.customerId, ctx.user.id))).limit(1);
    const session = sessionRows[0];
    if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Payment session not found" });
    if (session.deliveryId) return { success: true as const, deliveryId: session.deliveryId, trackingCode: "" };
    if (session.status === "cancelled" || session.status === "failed") return { success: false as const, error: "This payment session is no longer active" };

    const result = await verifyPayment(input.reference);
    const verifiedData = result.success ? result.data : undefined;
    if (!result.success || !result.isPaid || !verifiedData || verifiedData.reference !== input.reference || Math.abs(Number(verifiedData.amount) - Number(session.amount)) > 0.01) {
      await db.update(deliveryPaymentSessions).set({ status: "failed" }).where(eq(deliveryPaymentSessions.id, session.id));
      return { success: false as const, error: "Payment was not verified. No delivery was created." };
    }

    const booking = session.bookingData as any;
      const trackingCode = booking.trackingCode;
      if (!validateTrackingCode(trackingCode)) throw new TRPCError({ code: "BAD_REQUEST", message: "The parcel identification code is invalid" });
    const deliveryId = await db.transaction(async (tx) => {
      const [existing] = await tx.select({ deliveryId: deliveryPaymentSessions.deliveryId }).from(deliveryPaymentSessions).where(eq(deliveryPaymentSessions.id, session.id)).limit(1);
      if (existing?.deliveryId) return existing.deliveryId;
      const [pickup] = await tx.insert(addresses).values({ userId: ctx.user.id, street: booking.pickup.street, city: booking.pickup.city, postalCode: booking.pickup.postalCode ?? null, latitude: Number(booking.pickup.latitude).toString(), longitude: Number(booking.pickup.longitude).toString() });
      const [dropoff] = await tx.insert(addresses).values({ userId: ctx.user.id, street: booking.dropoff.street, city: booking.dropoff.city, postalCode: booking.dropoff.postalCode ?? null, latitude: Number(booking.dropoff.latitude).toString(), longitude: Number(booking.dropoff.longitude).toString() });
      const [created] = await tx.insert(deliveries).values({
        customerId: ctx.user.id,
        recipientName: booking.recipientName,
        recipientEmail: booking.recipientEmail ?? null,
        recipientPhone: booking.recipientPhone ?? null,
        pickupAddressId: Number(pickup.insertId),
        dropoffAddressId: Number(dropoff.insertId),
        pickupLatitude: Number(booking.pickup.latitude).toString(),
        pickupLongitude: Number(booking.pickup.longitude).toString(),
        dropoffLatitude: Number(booking.dropoff.latitude).toString(),
        dropoffLongitude: Number(booking.dropoff.longitude).toString(),
        packageSize: booking.packageSize,
        packageType: booking.packageType,
        lengthCm: Number(booking.lengthCm).toFixed(1),
        widthCm: Number(booking.widthCm).toFixed(1),
        heightCm: Number(booking.heightCm).toFixed(1),
        fragile: Boolean(booking.fragile),
        livestock: Boolean(booking.livestock),
        packageWeight: Number(booking.packageWeight).toFixed(2),
        packageDescription: booking.packageDescription,
        distance: Number(booking.distance).toFixed(2),
        estimatedPrice: Number(booking.amount).toFixed(2),
        estimatedDeliveryTime: Number(booking.estimatedDeliveryTime),
        trackingCode,
        packageLabelPhotoUrl: booking.packageLabelPhotoKey ? `/manus-storage/${booking.packageLabelPhotoKey}` : null,
        packageLabelPhotoKey: booking.packageLabelPhotoKey,
        packageLabelConfirmedAt: booking.packageLabelConfirmed ? new Date() : null,
      });
      const id = Number(created.insertId);
      await tx.update(deliveryPaymentSessions).set({ status: "paid", deliveryId: id, paidAt: new Date() }).where(eq(deliveryPaymentSessions.id, session.id));
      return id;
    });
    if (booking.customerPhone) {
      await db.update(users).set({ phone: booking.customerPhone }).where(eq(users.id, ctx.user.id));
    }
    await initializeParcelLedger({ deliveryId, customerPayment: Number(session.amount), paymentCost: Number(session.amount) * 0.029 + 1.5, reserveAmount: 0 });
    return { success: true as const, deliveryId, trackingCode, bookingData: booking };
  }),

  cancelCheckout: customerProcedure.input(z.object({ reference: z.string().min(10) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Payment service is unavailable" });
    await db.update(deliveryPaymentSessions).set({ status: "cancelled" }).where(and(eq(deliveryPaymentSessions.reference, input.reference), eq(deliveryPaymentSessions.customerId, ctx.user.id), eq(deliveryPaymentSessions.status, "pending")));
    return { success: true };
  }),
});
