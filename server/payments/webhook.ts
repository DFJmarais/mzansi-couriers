import crypto from 'crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from '../db';
import { deliveryPaymentSessions, refundRequests, relaySettlementAllocations } from '../../drizzle/schema';
import { appendParcelLedgerEvent } from '../services/financial-ledger';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

export function calculateRefundReversals(originalAmount: number, refundAmount: number, paidCourierGross: number) {
  const ratio = originalAmount > 0 ? Math.min(1, refundAmount / originalAmount) : 0;
  const platformReversal = originalAmount * 0.2 * ratio;
  const courierPoolRefund = originalAmount * 0.8 * ratio;
  const courierPoolReversal = Math.min(Math.max(0, paidCourierGross), courierPoolRefund);
  return { platformReversal, courierPoolReversal, payoutLoss: courierPoolReversal };
}

function signaturesMatch(expected: string, received: string): boolean {
  if (!expected || !received || expected.length !== received.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
  } catch {
    return false;
  }
}

/** Verify the HMAC-SHA512 signature over Paystack's exact raw request body. */
export function verifyPaystackWebhook(body: string, signature: string): boolean {
  if (!PAYSTACK_SECRET || !body || !signature) return false;
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex');
  return signaturesMatch(hash, signature.trim().toLowerCase());
}

/** Route and process supported Paystack webhook events. */
export async function handlePaystackWebhook(event: any) {
  try {
    const { event: eventType, data } = event ?? {};
    switch (eventType) {
      case 'charge.success':
        return await handlePaymentSuccess(data);
      case 'charge.failed':
        return await handlePaymentFailed(data);
      case 'refund.pending':
      case 'refund.processing':
      case 'refund.processed':
      case 'refund.failed':
      case 'refund.needs-attention':
        return await handleRefundUpdate(eventType, data);
      case 'transfer.success':
        return await handleTransferSuccess(data);
      case 'transfer.failed':
      case 'transfer.reversed':
        return await handleTransferFailed(data);
      default:
        console.log(`[Webhook] Acknowledged unsupported event type: ${eventType || 'unknown'}`);
        return { success: true, message: 'Event acknowledged' };
    }
  } catch (error) {
    console.error('[Webhook] Error handling event:', error);
    throw error;
  }
}

async function handleRefundUpdate(eventType: string, data: any) {
  const transactionReference = typeof data?.transaction_reference === 'string' ? data.transaction_reference : '';
  if (!transactionReference) return { success: true, message: 'Refund event acknowledged' };
  const db = await getDb();
  if (!db) return { success: true, message: 'Refund event acknowledged' };
  const request = (await db.select().from(refundRequests).where(eq(refundRequests.transactionReference, transactionReference)).limit(1))[0];
  if (!request) return { success: true, message: 'Refund reference not found' };
  const status = eventType === 'refund.processed' ? 'processed' : eventType === 'refund.failed' ? 'failed' : eventType === 'refund.needs-attention' ? 'needs_attention' : eventType === 'refund.processing' ? 'processing' : 'pending';
  if (request.status === 'processed' && status !== 'processed') return { success: true, message: 'Refund already processed; ignored late status' };
  const eventReference = typeof data?.refund_reference === 'string' ? data.refund_reference : data?.id ? String(data.id) : `${transactionReference}:${status}`;
  const eventKey = `delivery:${request.deliveryId}:refund:${request.id}:${status}`;
  const amount = Number(data?.amount) / 100;
  if (status === 'processed') {
    const refundAmount = Number.isFinite(amount) && amount > 0 ? amount : Number(request.approvedAmount ?? request.requestedAmount);
    const session = (await db.select().from(deliveryPaymentSessions).where(eq(deliveryPaymentSessions.id, request.paymentSessionId)).limit(1))[0];
    const original = Number(session?.amount ?? 0);
    await appendParcelLedgerEvent({ deliveryId: request.deliveryId, eventKey, type: 'refund_processed', amount: refundAmount, reference: eventReference });
    const paidAllocations = await db.select().from(relaySettlementAllocations).where(and(eq(relaySettlementAllocations.deliveryId, request.deliveryId), eq(relaySettlementAllocations.status, 'paid')));
    const paidGross = paidAllocations.reduce((sum, allocation) => sum + Number(allocation.grossEarnings), 0);
    const reversals = calculateRefundReversals(original, refundAmount, paidGross);
    await appendParcelLedgerEvent({ deliveryId: request.deliveryId, eventKey: `${eventKey}:platform`, type: 'platform_reversal', amount: reversals.platformReversal, reference: eventReference });
    if (reversals.courierPoolReversal > 0) {
      await appendParcelLedgerEvent({ deliveryId: request.deliveryId, eventKey: `${eventKey}:pool`, type: 'courier_pool_reversal', amount: reversals.courierPoolReversal, reference: eventReference });
      await appendParcelLedgerEvent({ deliveryId: request.deliveryId, eventKey: `${eventKey}:paid-payout-loss`, type: 'payout_cost', amount: reversals.payoutLoss, reference: 'Refund processed after courier payout' });
    }
  } else {
    const lifecycleType = status === 'pending' ? 'refund_pending' : status === 'processing' ? 'refund_processing' : status === 'failed' ? 'refund_failed' : 'refund_processing';
    await appendParcelLedgerEvent({ deliveryId: request.deliveryId, eventKey, type: lifecycleType, amount: 0, reference: eventReference });
  }
  await db.update(refundRequests).set({ status, paystackStatus: status, paystackEventId: eventReference, paystackRefundId: request.paystackRefundId ?? (typeof data?.refund_reference === 'string' ? data.refund_reference : null), failureReason: status === 'failed' ? String(data?.reason ?? 'Paystack refund failed') : null, processedAt: status === 'processed' ? new Date() : request.processedAt }).where(and(eq(refundRequests.id, request.id), inArray(refundRequests.status, ['approved', 'pending', 'processing', 'needs_attention', 'processed', 'failed'])));
  return { success: true, message: `Refund ${status} recorded` };
}

async function handlePaymentSuccess(data: any) {
  const reference = typeof data?.reference === 'string' ? data.reference : '';
  const amountInSubunits = Number(data?.amount);
  const currency = typeof data?.currency === 'string' ? data.currency.toUpperCase() : '';
  if (!reference || !Number.isFinite(amountInSubunits) || currency !== 'ZAR') {
    return { success: true, message: 'Payment event acknowledged' };
  }

  const db = await getDb();
  if (!db) return { success: true, message: 'Payment event acknowledged' };
  const [session] = await db.select().from(deliveryPaymentSessions).where(eq(deliveryPaymentSessions.reference, reference)).limit(1);
  if (!session) return { success: true, message: 'Payment reference not found' };

  const expectedAmount = Number(session.amount);
  const receivedAmount = amountInSubunits / 100;
  if (!Number.isFinite(expectedAmount) || Math.abs(expectedAmount - receivedAmount) > 0.01 || session.currency !== currency) {
    console.warn(`[Webhook] Payment amount/currency mismatch for ${reference}`);
    return { success: true, message: 'Payment event acknowledged' };
  }

  // Idempotent: a duplicate success does not rewrite the timestamp or downgrade any state.
  if (session.status === 'pending') {
    await db.update(deliveryPaymentSessions)
      .set({ status: 'paid', paidAt: session.paidAt ?? new Date() })
      .where(and(eq(deliveryPaymentSessions.id, session.id), eq(deliveryPaymentSessions.status, 'pending')));
  }
  console.log(`[Webhook] Payment successful: ${reference} - Amount: ${receivedAmount.toFixed(2)} ${currency}`);
  return { success: true, message: 'Payment processed' };
}

async function handlePaymentFailed(data: any) {
  const reference = typeof data?.reference === 'string' ? data.reference : '';
  if (!reference) return { success: true, message: 'Payment failure acknowledged' };
  const db = await getDb();
  if (db) {
    // A late failure must never overwrite a payment already confirmed as paid.
    await db.update(deliveryPaymentSessions)
      .set({ status: 'failed' })
      .where(and(eq(deliveryPaymentSessions.reference, reference), eq(deliveryPaymentSessions.status, 'pending')));
  }
  console.log(`[Webhook] Payment failure recorded: ${reference}`);
  return { success: true, message: 'Payment failure recorded' };
}

async function handleTransferSuccess(data: any) {
  const reference = typeof data?.reference === 'string' ? data.reference : '';
  const amount = Number(data?.amount);
  console.log(`[Webhook] Transfer successful: ${reference || 'unknown'} - Amount: ${Number.isFinite(amount) ? (amount / 100).toFixed(2) : 'unknown'} ZAR`);
  return { success: true, message: 'Transfer processed' };
}

async function handleTransferFailed(data: any) {
  const reference = typeof data?.reference === 'string' ? data.reference : '';
  console.log(`[Webhook] Transfer status recorded: ${reference || 'unknown'} - Reason: ${data?.reason || 'not provided'}`);
  return { success: true, message: 'Transfer status recorded' };
}
