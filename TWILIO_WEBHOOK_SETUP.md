# Twilio Webhook Configuration Guide

## Overview

This guide explains how to configure Twilio webhooks for production WhatsApp and SMS delivery notifications in Mzansi Couriers.

## What is a Webhook?

A webhook is a way for Twilio to notify your application about message events (sent, delivered, failed, etc.) in real-time. Instead of polling Twilio for status, Twilio sends HTTP POST requests to your server.

## Webhook Events

Your app receives callbacks for these events:

| Event | Meaning | Use Case |
|-------|---------|----------|
| `sent` | Message left Twilio's system | Confirm message queued |
| `delivered` | Message reached recipient | Update UI, mark as delivered |
| `failed` | Message couldn't be sent | Retry or notify user |
| `undelivered` | Recipient rejected message | Log error, investigate |
| `read` | Recipient read message (WhatsApp) | Show read receipts |

## Setup Instructions

### Step 1: Get Your Webhook URL

Your Mzansi Couriers app will have a webhook endpoint at:

```
https://mzansicourier-nsebzqbt.manus.space/api/webhooks/twilio/messages
```

### Step 2: Configure Twilio Console

1. Go to [Twilio Console](https://www.twilio.com/console)
2. Navigate to **Messaging → Settings → General**
3. Scroll to **Webhook URL**
4. Enter your webhook URL: `https://mzansicourier-nsebzqbt.manus.space/api/webhooks/twilio/messages`
5. Select **HTTP POST**
6. Click **Save**

### Step 3: Configure WhatsApp Webhooks

For WhatsApp specifically:

1. Go to **Messaging → Manage → WhatsApp Senders**
2. Select your WhatsApp Business Account
3. Click **Settings**
4. Scroll to **Webhooks**
5. Enter webhook URL: `https://mzansicourier-nsebzqbt.manus.space/api/webhooks/twilio/incoming`
6. Enter webhook auth token (your `TWILIO_AUTH_TOKEN`)
7. Click **Save**

### Step 4: Test Webhook

Send a test message:

```bash
curl -X POST https://mzansicourier-nsebzqbt.manus.space/api/webhooks/twilio/messages \
  -d "MessageSid=SM1234567890abcdef1234567890abcdef" \
  -d "MessageStatus=delivered" \
  -d "To=%2B27123456789" \
  -d "From=%2B27123456789"
```

## Security

### Signature Verification

Twilio signs all webhook requests with your auth token. The app verifies signatures automatically.

**How it works:**
1. Twilio creates HMAC-SHA1 hash of request data
2. Twilio sends hash in `X-Twilio-Signature` header
3. Your app recalculates hash with your auth token
4. If hashes match, request is from Twilio

### Best Practices

- ✅ Always verify signatures
- ✅ Use HTTPS (not HTTP)
- ✅ Keep auth token secret
- ✅ Implement rate limiting
- ✅ Log all webhook events

## Testing Checklist

### WhatsApp Delivery Test

```
1. Send WhatsApp message via app
2. Check Twilio Console for "sent" event
3. Wait 2-5 seconds
4. Check for "delivered" event
5. Verify message appears on recipient's phone
6. Check app shows delivery status
```

### SMS Delivery Test

```
1. Send SMS via app
2. Check Twilio Console for "sent" event
3. Wait 1-2 seconds
4. Check for "delivered" event
5. Verify SMS received on phone
6. Check app shows delivery status
```

### Error Handling Test

```
1. Send message to invalid number (e.g., +1234567890)
2. Check for "failed" event
3. Verify error code in webhook
4. Check app displays error to user
5. Verify retry logic triggers
```

## Production Deployment

### Before Going Live

- [ ] Webhook URL is HTTPS
- [ ] Signature verification is enabled
- [ ] Error handling is implemented
- [ ] Retry logic is in place
- [ ] Message tracking is working
- [ ] Delivery stats are accurate
- [ ] Logs are being collected
- [ ] Alerts are configured

### Monitoring

Monitor these metrics:

- **Delivery Rate**: % of messages successfully delivered
- **Average Latency**: Time from send to delivery
- **Error Rate**: % of failed messages
- **Retry Success**: % of retried messages that succeed

### Troubleshooting

**Webhook not receiving events:**
- Verify webhook URL is correct
- Check firewall allows Twilio IPs
- Verify auth token is correct
- Check server logs for errors

**Messages not being delivered:**
- Verify phone numbers are valid
- Check account balance
- Review error codes in webhook
- Check Twilio status page

**High error rate:**
- Review error codes
- Check phone number format
- Verify account permissions
- Contact Twilio support

## API Endpoints

### Message Status Webhook

```
POST /api/webhooks/twilio/messages
```

**Parameters:**
- `MessageSid`: Unique message identifier
- `MessageStatus`: Event type (sent, delivered, failed, etc.)
- `To`: Recipient phone number
- `From`: Sender phone number
- `ErrorCode`: Error code if failed

**Response:**
```
200 OK
```

### Incoming Message Webhook

```
POST /api/webhooks/twilio/incoming
```

**Parameters:**
- `From`: Sender phone number
- `To`: Recipient phone number
- `Body`: Message text
- `MediaUrl0`: Media attachment URL (if present)

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for your message!</Message>
</Response>
```

## Support

For issues:
1. Check Twilio logs: https://www.twilio.com/console/logs
2. Review webhook delivery: https://www.twilio.com/console/webhooks
3. Contact Twilio support: https://www.twilio.com/help

## Next Steps

1. ✅ Configure webhook URL in Twilio Console
2. ✅ Test with WhatsApp and SMS
3. ✅ Monitor delivery rates
4. ✅ Set up alerts for failures
5. ✅ Document any issues
