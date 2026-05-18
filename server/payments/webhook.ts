import crypto from 'crypto';
import { getDb } from '../db';
import { eq } from 'drizzle-orm';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

/**
 * Verify Paystack webhook signature
 */
export function verifyPaystackWebhook(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(body)
    .digest('hex');

  return hash === signature;
}

/**
 * Handle Paystack webhook events
 */
export async function handlePaystackWebhook(event: any) {
  try {
    const { event: eventType, data } = event;

    switch (eventType) {
      case 'charge.success':
        return await handlePaymentSuccess(data);
      case 'charge.failed':
        return await handlePaymentFailed(data);
      case 'transfer.success':
        return await handleTransferSuccess(data);
      case 'transfer.failed':
        return await handleTransferFailed(data);
      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
        return { success: true, message: 'Event acknowledged' };
    }
  } catch (error) {
    console.error('[Webhook] Error handling event:', error);
    throw error;
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(data: any) {
  try {
    const { reference, amount, customer, metadata } = data;

    // Log successful payment
    console.log(`[Webhook] Payment successful: ${reference} - Amount: ${amount / 100} ZAR`);
    return { success: true, message: 'Payment processed' };
  } catch (error) {
    console.error('[Webhook] Error processing payment success:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(data: any) {
  try {
    const { reference, amount } = data;

    // Log failed payment
    console.log(`[Webhook] Payment failed: ${reference}`);
    return { success: true, message: 'Payment failure recorded' };
  } catch (error) {
    console.error('[Webhook] Error processing payment failure:', error);
    throw error;
  }
}

/**
 * Handle successful transfer (payout to courier)
 */
async function handleTransferSuccess(data: any) {
  try {
    const { reference, amount, recipient, metadata } = data;

    // Log successful transfer
    console.log(`[Webhook] Transfer successful: ${reference} - Amount: ${amount / 100} ZAR`);
    return { success: true, message: 'Transfer processed' };
  } catch (error) {
    console.error('[Webhook] Error processing transfer success:', error);
    throw error;
  }
}

/**
 * Handle failed transfer
 */
async function handleTransferFailed(data: any) {
  try {
    const { reference, reason } = data;

    // Log failed transfer
    console.log(`[Webhook] Transfer failed: ${reference} - Reason: ${reason}`);
    return { success: true, message: 'Transfer failure recorded' };
  } catch (error) {
    console.error('[Webhook] Error processing transfer failure:', error);
    throw error;
  }
}
