import twilio from 'twilio';
import { ENV } from './env';

// Initialize Twilio client
const client = twilio(ENV.twilioAccountSid, ENV.twilioAuthToken);

export interface WhatsAppMessage {
  to: string;
  body: string;
  mediaUrl?: string;
}

/**
 * Send a WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const result = await client.messages.create({
      from: `whatsapp:${ENV.twilioWhatsappNumber}`,
      to: `whatsapp:${message.to}`,
      body: message.body
    });

    console.log(`[Twilio] WhatsApp message sent: ${result.sid}`);
    return {
      success: true,
      messageId: result.sid
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Twilio] Failed to send WhatsApp message: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Send SMS as fallback (for low-data users)
 */
export async function sendSMSMessage(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const result = await client.messages.create({
      from: ENV.twilioWhatsappNumber,
      to,
      body
    });

    console.log(`[Twilio] SMS sent: ${result.sid}`);
    return {
      success: true,
      messageId: result.sid
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Twilio] Failed to send SMS: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage
    };
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
    console.log(`[Twilio] WhatsApp failed, falling back to SMS for ${phoneNumber}`);
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
