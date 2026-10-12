# Paystack Webhook Verification Notes

## Official sources

- https://paystack.com/docs/payments/webhooks/
- https://paystack.com/docs/payments/verify-payments/
- https://paystack.com/docs/payments/accept-payments/

## Verified requirements

Paystack webhooks are POST requests to a publicly reachable webhook URL. The endpoint must acknowledge received events with HTTP 200. Paystack recommends webhooks for final transaction updates and retries unsuccessful webhook deliveries. The `x-paystack-signature` header is an HMAC-SHA512 digest of the exact request payload, signed with the secret key. Signature validation must happen before event processing. Paystack lists `charge.success`, `transfer.success`, `transfer.failed`, and `transfer.reversed` among supported event types.

Paystack's payment guidance says the server must confirm the transaction status using the webhook or Verify Transaction API before delivering value, and must verify that the webhook/API amount matches the expected service amount. The transaction status is in `response.data.status`, not the top-level API response status. Webhook processing should be idempotent so duplicate events do not deliver value twice.

## Project comparison

The project currently mounts `POST /api/paystack/webhook` before JSON parsing with Express raw-body parsing, reads `x-paystack-signature`, validates HMAC-SHA512, routes `charge.success` and `charge.failed`, and updates `delivery_payment_sessions`. The current implementation still needs stronger constant-time signature comparison, guarded state transitions so a late failure cannot overwrite a paid session, explicit currency/amount checks, persisted event/idempotency handling, and verified notification behavior. The Paystack dashboard must be configured with the public production URL, expected to be `https://mzansicourier-nsebzqbt.manus.space/api/paystack/webhook` unless the deployed domain changes.
