import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { sendMessageWithFallback } from "./_core/twilio";

const outboundEnabled = () => process.env.NOTIFICATIONS_ENABLED === "true";
const disabled = () => ({ success: false as const, error: "notification_delivery_disabled_until_controlled_test" });

async function sendChannel(channel: "whatsapp" | "sms", phone: string, message: string) {
  if (!outboundEnabled()) return disabled();
  if (channel === "whatsapp") return sendMessageWithFallback(phone, message, true);
  return sendMessageWithFallback(phone, message, false);
}

export const notificationRouter = router({
  sendWhatsApp: protectedProcedure.input(z.object({
    phone: z.string().min(7),
    message: z.string().min(1).max(1600),
    deliveryId: z.number().int().positive().optional(),
    courierName: z.string().max(160).optional(),
  })).mutation(async ({ input }) => sendChannel("whatsapp", input.phone, input.message)),

  sendSMS: protectedProcedure.input(z.object({
    phone: z.string().min(7),
    message: z.string().min(1).max(1600),
    deliveryId: z.number().int().positive().optional(),
  })).mutation(async ({ input }) => sendChannel("sms", input.phone, input.message)),

  notifyDeliveryStatus: protectedProcedure.input(z.object({
    phone: z.string().min(7),
    status: z.enum(["assigned", "in-transit", "delivered"]),
    courierName: z.string().max(160),
    estimatedTime: z.string().max(80).optional(),
    method: z.enum(["sms", "whatsapp"]).default("whatsapp"),
  })).mutation(async ({ input }) => {
    const messages = {
      assigned: `Delivery assigned to ${input.courierName}. ETA: ${input.estimatedTime || "Soon"}.`,
      "in-transit": `Package on the way with ${input.courierName}.`,
      delivered: "Delivery completed. Please confirm receipt in the Mzansi Couriers app.",
    };
    return sendChannel(input.method, input.phone, messages[input.status]);
  }),

  notifyCourierNewJob: protectedProcedure.input(z.object({
    phone: z.string().min(7),
    pickupLocation: z.string().min(1).max(180),
    dropoffLocation: z.string().min(1).max(180),
    estimatedEarnings: z.number().finite().nonnegative(),
    method: z.enum(["sms", "whatsapp"]).default("whatsapp"),
  })).mutation(async ({ input }) => sendChannel(input.method, input.phone, `New job: ${input.pickupLocation} to ${input.dropoffLocation}. Estimated earnings R${input.estimatedEarnings.toFixed(2)}.`)),
});
