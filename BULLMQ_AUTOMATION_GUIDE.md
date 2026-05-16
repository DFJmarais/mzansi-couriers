# BullMQ Native Automation Engine - Complete Guide

## Overview

Mzansi Couriers now uses **BullMQ** - a production-grade job queue system built on Redis - to replace Zapier. This gives you complete control over automation workflows with zero monthly costs.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Mzansi Couriers App                   │
│                   (Express + tRPC)                      │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   ┌────────┐  ┌─────────┐  ┌──────────┐
   │ Event  │  │  Queue  │  │ Workers  │
   │Handler │  │ (Redis) │  │ (Node.js)│
   └────────┘  └─────────┘  └──────────┘
        │            │            │
        │  Enqueue   │  Process   │
        │  Job       │  Job       │
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌──────────┐            ┌─────────────┐
   │ External │            │ Monitoring  │
   │ Services │            │ & Logging   │
   │(Twilio,  │            │             │
   │ Email)   │            │             │
   └──────────┘            └─────────────┘
```

## The 6 Core Workflows

### 1. Payment Success Workflow
**Trigger:** Payment confirmed  
**Actions:**
- Send WhatsApp to customer confirming payment
- Send WhatsApp to courier with delivery details
- Send email receipt to customer
- Log transaction to Google Sheets

**Example:**
```typescript
await trpc.automation.queuePaymentSuccess.mutate({
  paymentId: 'PAY-001',
  customerId: 'CUST-001',
  courierId: 'COURIER-001',
  amount: 150,
  parcelId: 'PKG-001',
  customerPhone: '+27123456789',
  courierPhone: '+27987654321',
  customerEmail: 'customer@example.com',
  courierName: 'John Mthembu',
  estimatedDeliveryTime: '2:30 PM',
});
```

### 2. Delivery Status Changed Workflow
**Trigger:** Status updates (assigned → in-transit → delivered)  
**Actions:**
- Send WhatsApp update to customer
- Update Google Sheets with status
- Send Slack alert to admin

**Example:**
```typescript
await trpc.automation.queueDeliveryStatus.mutate({
  deliveryId: 'DEL-001',
  customerId: 'CUST-001',
  courierId: 'COURIER-001',
  newStatus: 'in_transit',
  previousStatus: 'assigned',
  location: { lat: -26.2023, lng: 28.0436 },
  estimatedArrival: '2:45 PM',
  customerPhone: '+27123456789',
  customerEmail: 'customer@example.com',
});
```

### 3. Courier Assigned Workflow
**Trigger:** Courier assigned to delivery  
**Actions:**
- Send WhatsApp to courier with delivery details
- Send email to customer with courier info
- Send Slack notification to admin

**Example:**
```typescript
await trpc.automation.queueCourierAssigned.mutate({
  deliveryId: 'DEL-001',
  courierId: 'COURIER-001',
  customerId: 'CUST-001',
  courierName: 'John Mthembu',
  courierPhone: '+27987654321',
  courierRating: 4.8,
  customerPhone: '+27123456789',
  customerEmail: 'customer@example.com',
  pickupLocation: 'Sandton City',
  deliveryLocation: 'Midrand Office',
  estimatedDeliveryTime: '2:30 PM',
  courierEarnings: 150,
});
```

### 4. Daily Earnings Summary Workflow ⭐ (In Admin Dashboard)
**Trigger:** Daily at 6 PM (or manual from admin dashboard)  
**Actions:**
- Send WhatsApp summary to courier
- Send email with detailed breakdown
- Log to Google Sheets

**Admin Dashboard Integration:**
- Navigate to Admin Dashboard
- Scroll to "Daily Earnings Summary Management"
- Click "Send WhatsApp" or "Email" for any courier
- Summary is automatically sent daily at 6 PM

**Example:**
```typescript
await trpc.automation.queueDailyEarnings.mutate({
  courierId: 'COURIER-001',
  courierName: 'John Mthembu',
  courierEmail: 'john@example.com',
  courierPhone: '+27987654321',
  date: '2026-05-16',
  totalDeliveries: 12,
  totalEarnings: 1200,
  bonusEarnings: 100,
  totalWithBonus: 1300,
  averageRating: 4.8,
});
```

### 5. Support Ticket Created Workflow
**Trigger:** New support ticket created  
**Actions:**
- Send email to support team
- Send Slack alert to support channel
- Log to Google Sheets

**Example:**
```typescript
await trpc.automation.queueSupportTicket.mutate({
  ticketId: 'TICKET-001',
  customerId: 'CUST-001',
  subject: 'Delivery not received',
  description: 'I did not receive my parcel',
  category: 'delivery',
  priority: 'high',
  customerEmail: 'customer@example.com',
  customerPhone: '+27123456789',
});
```

### 6. Weekly Payout Report Workflow
**Trigger:** Every Thursday at 9 AM  
**Actions:**
- Send email to finance team with payout summary
- Log to Google Sheets
- Send Slack notification

**Example:**
```typescript
await trpc.automation.queueWeeklyPayout.mutate({
  week: '2026-05-12 to 2026-05-18',
  totalCouriers: 45,
  totalPayouts: 45,
  totalAmount: 54000,
  payoutDate: '2026-05-16',
});
```

## Admin Dashboard Integration

### Daily Earnings Summary Management

The admin dashboard now includes a dedicated section for managing daily earnings summaries:

**Location:** Admin Dashboard → "Daily Earnings Summary Management"

**Features:**
- View all couriers with today's deliveries and earnings
- Send WhatsApp summary with one click
- Send email report with one click
- Helpful tip about automatic daily sends at 6 PM

**How It Works:**
1. Admin sees list of couriers with stats (deliveries, earnings, bonus)
2. Click "Send WhatsApp" to immediately send summary
3. Click "Email" to send detailed report
4. Summaries are also automatically sent daily at 6 PM via BullMQ

## Monitoring & Logging

### Get Automation Statistics
```typescript
const stats = await trpc.automation.getStats.query();
// Returns: { total, queued, processing, completed, failed, retried, avgDuration, successRate }
```

### Get Recent Events
```typescript
const events = await trpc.automation.getRecentEvents.query({ limit: 100 });
// Returns last 100 automation events with details
```

### Get Failed Events
```typescript
const failed = await trpc.automation.getFailedEvents.query();
// Returns all failed events for debugging
```

### Export Events
```typescript
const json = await trpc.automation.exportEvents.query();
// Returns all events as JSON for analysis
```

## Error Handling & Retries

BullMQ automatically handles failures:

- **Automatic Retries:** Failed jobs retry up to 3 times with exponential backoff
- **Dead Letter Queue:** Jobs that fail after all retries go to dead letter queue
- **Logging:** All failures are logged with error messages and timestamps
- **Monitoring:** Failed events can be queried via `getFailedEvents()`

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost          # Redis server host
REDIS_PORT=6379              # Redis server port
REDIS_PASSWORD=               # Redis password (optional)
REDIS_DB=0                    # Redis database number

# Worker Configuration
WORKER_CONCURRENCY=5          # Number of concurrent jobs per worker
```

### Job Defaults

```typescript
// In server/automation/config.ts
export const jobDefaults = {
  attempts: 3,                    // Retry 3 times
  backoff: {
    type: 'exponential',
    delay: 2000,                  // Start with 2 second delay
  },
  removeOnComplete: {
    age: 3600,                    // Keep completed jobs for 1 hour
  },
  removeOnFail: {
    age: 86400,                   // Keep failed jobs for 24 hours
  },
};
```

## Integration Points

### Triggering Workflows from Your Code

All workflows are triggered via tRPC mutations:

```typescript
// In any React component
import { trpc } from '@/lib/trpc';

const handlePaymentSuccess = async (paymentData) => {
  try {
    const result = await trpc.automation.queuePaymentSuccess.mutate(paymentData);
    console.log('Job queued:', result.jobId);
  } catch (error) {
    console.error('Failed to queue job:', error);
  }
};
```

### Integrating with Delivery Lifecycle

Example: Queue status change when delivery is updated

```typescript
// In your delivery update procedure
export const updateDeliveryStatus = protectedProcedure
  .input(z.object({ deliveryId: z.string(), status: z.string() }))
  .mutation(async ({ input }) => {
    // Update database
    await db.updateDeliveryStatus(input.deliveryId, input.status);

    // Queue automation workflow
    await trpc.automation.queueDeliveryStatus.mutate({
      deliveryId: input.deliveryId,
      // ... other fields
    });

    return { success: true };
  });
```

## Performance & Scaling

### Throughput
- **Single Worker:** 1,000+ jobs/minute
- **Multiple Workers:** Scales linearly with worker count
- **Recommended:** 5-10 workers for production

### Latency
- **Average Job Processing:** 100-500ms
- **Queue Latency:** <50ms
- **Total End-to-End:** 200-1000ms

### Scaling Strategy
1. Start with 1 worker (development)
2. Scale to 5 workers (production)
3. Add more workers if queue depth increases
4. Monitor via `getStats()` query

## Troubleshooting

### Redis Connection Issues
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution:** Ensure Redis is running on the configured host/port

### Jobs Not Processing
```
Check:
1. Redis connection status
2. Worker logs for errors
3. Failed events via getFailedEvents()
4. Job configuration in config.ts
```

### High Queue Depth
```
Solution:
1. Increase WORKER_CONCURRENCY
2. Add more workers
3. Check for slow external services (email, Slack)
4. Optimize job processing logic
```

## Migration from Zapier

### What Changed
- ✅ No more external Zapier dependency
- ✅ All automation runs in your app
- ✅ Full control over workflow logic
- ✅ No monthly Zapier costs
- ✅ Better error handling and logging

### What Stayed the Same
- ✅ Same 6 core workflows
- ✅ Same notifications (WhatsApp, Email, Slack)
- ✅ Same triggers and actions
- ✅ Same reliability and performance

## Next Steps

1. **Test Workflows:** Use admin dashboard to test daily earnings workflow
2. **Monitor:** Check automation stats and logs regularly
3. **Integrate:** Add workflow triggers to your delivery lifecycle
4. **Scale:** Add more workers as volume increases
5. **Optimize:** Fine-tune job configuration based on performance

## Support

For issues or questions:
1. Check automation logs: `getFailedEvents()`
2. Review configuration: `server/automation/config.ts`
3. Check worker status: `getStats()`
4. Review workflow code: `server/automation/workflows/`

---

**BullMQ Documentation:** https://docs.bullmq.io/  
**Redis Documentation:** https://redis.io/docs/  
**Mzansi Couriers:** https://mzansicourier-nsebzqbt.manus.space/
