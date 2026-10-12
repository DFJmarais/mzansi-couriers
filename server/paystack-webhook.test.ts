import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { handlePaystackWebhook, verifyPaystackWebhook } from './payments/webhook';

describe('Paystack webhook security and routing', () => {
  const body = JSON.stringify({ event: 'charge.success', data: { reference: 'ref-123' } });
  const secret = process.env.PAYSTACK_SECRET_KEY || '';
  const signature = crypto.createHmac('sha512', secret).update(body).digest('hex');

  it('accepts the exact HMAC-SHA512 signature', () => {
    expect(verifyPaystackWebhook(body, signature)).toBe(true);
  });

  it('rejects a missing, malformed, or altered signature', () => {
    expect(verifyPaystackWebhook(body, '')).toBe(false);
    expect(verifyPaystackWebhook(body, `${signature}00`)).toBe(false);
    expect(verifyPaystackWebhook(`${body} `, signature)).toBe(false);
  });

  it('acknowledges an incomplete refund event without changing financial state', async () => {
    await expect(handlePaystackWebhook({ event: 'refund.processed', data: {} })).resolves.toEqual({
      success: true,
      message: 'Refund event acknowledged',
    });
  });

  it('acknowledges unsupported events without changing payment state', async () => {
    await expect(handlePaystackWebhook({ event: 'some.future.event', data: {} })).resolves.toEqual({
      success: true,
      message: 'Event acknowledged',
    });
  });

  it('acknowledges incomplete payment payloads without creating delivery state', async () => {
    await expect(handlePaystackWebhook({ event: 'charge.success', data: {} })).resolves.toEqual({
      success: true,
      message: 'Payment event acknowledged',
    });
  });
});
