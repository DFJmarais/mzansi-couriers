import twilio from 'twilio';
import { ENV } from './env';
import { redactRecipient } from '../services/notification-delivery';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { notificationDeliveries } from '../../drizzle/schema';

// Initialize Twilio client
const client = twilio(ENV.twilioAccountSid, ENV.twilioAuthToken);

export interface WhatsAppMessage {
  to: string;
  body: string;
  mediaUrl?: string;
  userId?: number;
  deliveryId?: number;
  eventType?: string;
}

async function createAttempt(channel: 'whatsapp' | 'sms', recipient: string, metadata?: { userId?: number; deliveryId?: number; eventType?: string }) {
  const db = await getDb();
  if (!db) return null;
  const inserted = await db.insert(notificationDeliveries).values({
    userId: metadata?.userId,
    deliveryId: metadata?.deliveryId,
    channel,
    eventType: metadata?.eventType ?? 'unspecified',
    recipientRef: redactRecipient(recipient),
    provider: 'twilio',
    status: 'submitted',
    attemptCount: 1,
    submittedAt: new Date(),
  });
  return Number(inserted[0]?.insertId || 0) || null;
}

async function finishAttempt(id: number | null, result: { success: boolean; messageId?: string; error?: string }) {
  if (!id) return;
  const db = await getDb();
  if (!db) return;
  await db.update(notificationDeliveries).set(result.success ? {
    status: 'provider_accepted',
    providerMessageId: result.messageId,
    acceptedAt: new Date(),
  } : {
    status: 'failed',
    lastErrorCode: 'provider_send_failed',
    lastErrorMessage: (result.error || 'provider_send_failed').slice(0, 255),
    failedAt: new Date(),
  }).where(eq(notificationDeliveries.id, id));
}

/**
 * Send a WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const attemptId = await createAttempt('whatsapp', message.to, message);
  if (process.env.NOTIFICATIONS_ENABLED !== 'true') {
    const output = { success: false, error: 'notification_delivery_disabled_until_controlled_test' };
    await finishAttempt(attemptId, output);
    return output;
  }
  try {
    const result = await client.messages.create({
      from: `whatsapp:${ENV.twilioWhatsappNumber}`,
      to: `whatsapp:${message.to}`,
      body: message.body
    });

    console.log(`[Twilio] WhatsApp provider accepted message for ${redactRecipient(message.to)}`);
    const output = {
      success: true,
      messageId: result.sid
    };
    await finishAttempt(attemptId, output);
    return output;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Twilio] WhatsApp send failed: ${errorMessage.slice(0, 160)}`);
    const output = {
      success: false,
      error: errorMessage
    };
    await finishAttempt(attemptId, output);
    return output;
  }
}

/**
 * Send SMS as fallback (for low-data users)
 */
export async function sendSMSMessage(to: string, body: string, metadata?: { userId?: number; deliveryId?: number; eventType?: string }): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const attemptId = await createAttempt('sms', to, metadata);
  if (process.env.NOTIFICATIONS_ENABLED !== 'true') {
    const output = { success: false, error: 'notification_delivery_disabled_until_controlled_test' };
    await finishAttempt(attemptId, output);
    return output;
  }
  try {
    const result = await client.messages.create({
      from: ENV.twilioWhatsappNumber,
      to,
      body
    });

    console.log(`[Twilio] SMS provider accepted message for ${redactRecipient(to)}`);
    const output = {
      success: true,
      messageId: result.sid
    };
    await finishAttempt(attemptId, output);
    return output;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Twilio] SMS send failed: ${errorMessage.slice(0, 160)}`);
    const output = {
      success: false,
      error: errorMessage
    };
    await finishAttempt(attemptId, output);
    return output;
  }
}

/**
 * Send WhatsApp with SMS fallback
 */
export async function sendMessageWithFallback(
  phoneNumber: string,
  message: string,
  preferWhatsApp: boolean = true
): Promise<{ success: boolean; method: 'whatsapp' | 'sms'; messageId?: string; error?: string }> {
  if (preferWhatsApp) {
    const whatsappResult = await sendWhatsAppMessage({
      to: phoneNumber,
      body: message
    });

    if (whatsappResult.success) {
      return {
        success: true,
        method: 'whatsapp',
        messageId: whatsappResult.messageId
      };
    }

    // Fallback to SMS if WhatsApp fails
    console.log(`[Twilio] WhatsApp failed; attempting deliberate SMS fallback for ${redactRecipient(phoneNumber)}`);
    const smsResult = await sendSMSMessage(phoneNumber, message);
    return {
      success: smsResult.success,
      method: 'sms',
      messageId: smsResult.messageId,
      error: smsResult.error
    };
  } else {
    // Try SMS first
    const smsResult = await sendSMSMessage(phoneNumber, message);
    return {
      success: smsResult.success,
      method: 'sms',
      messageId: smsResult.messageId,
      error: smsResult.error
    };
  }
}

/**
 * Verify Twilio credentials are valid
 */
export async function verifyTwilioCredentials(): Promise<boolean> {
  try {
    const account = await client.api.accounts.list({ limit: 1 });
    return account.length > 0;
  } catch (error) {
    console.error('[Twilio] Credential verification failed:', error);
    return false;
  }
}
