# Paystack refund implementation notes

Source: https://paystack.com/docs/payments/refunds/

- Create refund: POST https://api.paystack.co/refund with `transaction` set to the Paystack transaction ID or reference; omit `amount` for full refund, or pass amount in the processor subunit for partial refund.
- Create response queues the refund and returns a refund object whose status can be `pending`.
- Paystack refund webhook events: `refund.pending`, `refund.processing`, `refund.needs-attention`, `refund.processed`, `refund.failed`.
- `refund.processed` means processor completion; `refund.failed` means the refund failed and the merchant account is credited back.
- Webhooks must be verified using Paystack's HMAC-SHA512 signature over the exact raw request body.
