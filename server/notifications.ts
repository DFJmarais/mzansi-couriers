// WhatsApp & SMS Notification Handlers for South Africa
// Uses Manus MCP servers for WhatsApp and SMS delivery

import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

// ============ WHATSAPP NOTIFICATIONS ============
export const sendWhatsAppMessage = async (
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    // Format phone number for WhatsApp (South Africa)
    const formattedPhone = phone.replace(/\D/g, '');
    const whatsappPhone = formattedPhone.startsWith('27') 
      ? formattedPhone 
      : `27${formattedPhone.slice(1)}`;

    // TODO: Integrate with Manus MCP WhatsApp server
    // This would use the instagram MCP server or a dedicated WhatsApp MCP connector
    console.log(`[WhatsApp] Sending to ${whatsappPhone}: ${message}`);

    return {
      success: true,
      messageId: `wa_${Date.now()}`
    };
  } catch (error) {
    console.error('WhatsApp error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// ============ SMS NOTIFICATIONS ============
export const sendSMSMessage = async (
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    // Format phone number for SMS (South Africa)
    const formattedPhone = phone.replace(/\D/g, '');
    const smsPhone = formattedPhone.startsWith('27') 
      ? formattedPhone 
      : `27${formattedPhone.slice(1)}`;

    // TODO: Integrate with Manus MCP SMS server or third-party SMS provider
    // Options: AWS SNS, Twilio, or local SA SMS provider
    console.log(`[SMS] Sending to ${smsPhone}: ${message}`);

    return {
      success: true,
      messageId: `sms_${Date.now()}`
    };
  } catch (error) {
    console.error('SMS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// ============ NOTIFICATION ROUTER ============
export const notificationRouter = router({
  // Send WhatsApp notification
  sendWhatsApp: publicProcedure.input(z.object({
    phone: z.string(),
    message: z.string(),
    deliveryId: z.number().optional(),
    courierName: z.string().optional()
  })).mutation(async ({ input }) => {
    return sendWhatsAppMessage(input.phone, input.message);
  }),

  // Send SMS notification
  sendSMS: publicProcedure.input(z.object({
    phone: z.string(),
    message: z.string(),
    deliveryId: z.number().optional()
  })).mutation(async ({ input }) => {
    return sendSMSMessage(input.phone, input.message);
  }),

  // Notify delivery status
  notifyDeliveryStatus: publicProcedure.input(z.object({
    phone: z.string(),
    status: z.enum(['assigned', 'in-transit', 'delivered']),
    courierName: z.string(),
    estimatedTime: z.string().optional(),
    method: z.enum(['sms', 'whatsapp']).default('whatsapp')
  })).mutation(async ({ input }) => {
    const messages = {
      assigned: `Ayoba! Your delivery is assigned to ${input.courierName}. Estimated arrival: ${input.estimatedTime || 'Soon'}. Track live: mzansicourier.app 🚀`,
      'in-transit': `Your package is on the way with ${input.courierName}! Real-time tracking: mzansicourier.app 📍`,
      delivered: `Delivered! Salamat sa inyong order. Rate your experience: mzansicourier.app ⭐`
    };

    const message = messages[input.status];
    
    if (input.method === 'whatsapp') {
      return sendWhatsAppMessage(input.phone, message);
    } else {
      return sendSMSMessage(input.phone, message);
    }
  }),

  // Notify courier of new job
  notifyCourierNewJob: publicProcedure.input(z.object({
    phone: z.string(),
    pickupLocation: z.string(),
    dropoffLocation: z.string(),
    estimatedEarnings: z.number(),
    method: z.enum(['sms', 'whatsapp']).default('whatsapp')
  })).mutation(async ({ input }) => {
    const message = `🎉 New job available! Pickup: ${input.pickupLocation} → Dropoff: ${input.dropoffLocation}. Earn R${input.estimatedEarnings}. Accept now: mzansicourier.app`;

    if (input.method === 'whatsapp') {
      return sendWhatsAppMessage(input.phone, message);
    } else {
      return sendSMSMessage(input.phone, message);
    }
  })
});
