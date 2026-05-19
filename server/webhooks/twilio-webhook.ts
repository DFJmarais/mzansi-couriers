import crypto from 'crypto';
import { Router, Request, Response } from 'express';

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';

/**
 * Verify Twilio webhook signature
 * Ensures webhook requests are actually from Twilio
 */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, any>,
  signature: string
): boolean {
  // Create the data string by sorting params
  let data = url;
  const keys = Object.keys(params).sort();

  for (const key of keys) {
    data += key + params[key];
  }

  // Generate HMAC-SHA1 hash
  const hash = crypto
    .createHmac('sha1', TWILIO_AUTH_TOKEN)
    .update(data)
    .digest('base64');

  return hash === signature;
}

/**
 * Handle Twilio webhook events
 */
export async function handleTwilioWebhook(req: Request, res: Response) {
  try {
    const twilioSignature = req.headers['x-twilio-signature'] as string;
    const url = `https://${req.headers.host}${req.originalUrl}`;

    // Verify signature
    if (!verifyTwilioSignature(url, req.body, twilioSignature)) {
      console.error('[Twilio Webhook] Invalid signature');
      return res.status(403).send('Forbidden');
    }

    const { MessageSid, MessageStatus, ErrorCode, To, From } = req.body;

    console.log(`[Twilio Webhook] Message ${MessageSid}: ${MessageStatus}`);

    // Handle different message statuses
    switch (MessageStatus) {
      case 'sent':
        await handleMessageSent(MessageSid, To, From);
        break;
      case 'delivered':
        await handleMessageDelivered(MessageSid, To);
        break;
      case 'failed':
        await handleMessageFailed(MessageSid, ErrorCode);
        break;
      case 'undelivered':
        await handleMessageUndelivered(MessageSid, ErrorCode);
        break;
      case 'read':
        await handleMessageRead(MessageSid);
        break;
      default:
        console.log(`[Twilio Webhook] Unknown status: ${MessageStatus}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('[Twilio Webhook] Error:', error);
    res.status(500).send('Error');
  }
}

/**
 * Handle message sent event
 */
async function handleMessageSent(messageSid: string, to: string, from: string) {
  console.log(`[Twilio] Message sent from ${from} to ${to}`);
  // Update database: message_status = 'sent'
}

/**
 * Handle message delivered event
 */
async function handleMessageDelivered(messageSid: string, to: string) {
  console.log(`[Twilio] Message delivered to ${to}`);
  // Update database: message_status = 'delivered', delivered_at = now()
}

/**
 * Handle message failed event
 */
async function handleMessageFailed(messageSid: string, errorCode?: string) {
  console.error(`[Twilio] Message failed: ${errorCode}`);
  // Update database: message_status = 'failed', error_code = errorCode
}

/**
 * Handle message undelivered event
 */
async function handleMessageUndelivered(messageSid: string, errorCode?: string) {
  console.error(`[Twilio] Message undelivered: ${errorCode}`);
  // Update database: message_status = 'undelivered', error_code = errorCode
}

/**
 * Handle message read event (WhatsApp only)
 */
async function handleMessageRead(messageSid: string) {
  console.log(`[Twilio] Message read`);
  // Update database: message_status = 'read', read_at = now()
}

/**
 * Create Express router for Twilio webhooks
 */
export function createTwilioWebhookRouter() {
  const router = Router();

  // POST /webhooks/twilio/messages - Handle message status callbacks
  router.post('/messages', handleTwilioWebhook);

  // POST /webhooks/twilio/calls - Handle call status callbacks (optional)
  router.post('/calls', handleTwilioWebhook);

  // POST /webhooks/twilio/incoming - Handle incoming messages
  router.post('/incoming', async (req: Request, res: Response) => {
    try {
      const { From, To, Body, MediaUrl0 } = req.body;

      console.log(`[Twilio Incoming] From: ${From}, To: ${To}, Body: ${Body}`);

      // Handle incoming WhatsApp/SMS messages
      // Store in database for customer service team to review

      // Send TwiML response
      res.type('text/xml').send(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>Thank you for your message. We'll respond shortly!</Message>
        </Response>
      `);
    } catch (error) {
      console.error('[Twilio Incoming] Error:', error);
      res.status(500).send('Error');
    }
  });

  return router;
}
