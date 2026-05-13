# Zapier Workflow Architecture & Implementation Guide

**Mzansi Couriers × Zapier Integration**  
**Document Version:** 1.0  
**Last Updated:** May 2026

---

## Table of Contents

1. [Webhook Architecture](#webhook-architecture)
2. [Workflow Specifications](#workflow-specifications)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Error Handling & Retry Logic](#error-handling--retry-logic)
5. [Monitoring & Observability](#monitoring--observability)
6. [Implementation Checklist](#implementation-checklist)

---

## Webhook Architecture

### Backend Webhook Endpoint

**Endpoint:** `POST /api/zapier/webhook`

**Authentication:**
```
Authorization: Bearer {ZAPIER_WEBHOOK_TOKEN}
Content-Type: application/json
```

**Request Payload Structure:**
```json
{
  "eventType": "delivery_created|delivery_assigned|delivery_completed|...",
  "timestamp": "2026-05-12T14:30:00Z",
  "data": { /* event-specific data */ },
  "metadata": {
    "eventId": "EVT-12345",
    "retryCount": 0,
    "source": "backend"
  }
}
```

### Webhook Events & Payloads

#### Event 1: `delivery_created`
**Trigger:** New delivery booking submitted  
**Frequency:** ~50–100/hour during peak times

```json
{
  "eventType": "delivery_created",
  "timestamp": "2026-05-12T14:30:00Z",
  "data": {
    "deliveryId": "DEL-12345",
    "customerId": "CUST-789",
    "customerName": "Thabo Mthembu",
    "customerPhone": "+27721234567",
    "pickupAddress": "123 Main St, Johannesburg",
    "pickupLatitude": -26.1234,
    "pickupLongitude": 28.0567,
    "dropoffAddress": "456 Park Ave, Johannesburg",
    "dropoffLatitude": -26.2345,
    "dropoffLongitude": 28.1234,
    "pickupZone": "Johannesburg-North",
    "dropoffZone": "Johannesburg-South",
    "distance": 15.2,
    "packageSize": "medium",
    "packageWeight": 2.5,
    "packageDescription": "Electronics",
    "estimatedFare": "R152.00",
    "estimatedDeliveryTime": 45,
    "status": "pending",
    "createdAt": "2026-05-12T14:30:00Z"
  }
}
```

**Zapier Action:** Query available couriers in pickup zone → Send WhatsApp to each

---

#### Event 2: `delivery_assigned`
**Trigger:** Courier accepts delivery  
**Frequency:** ~40–80/hour

```json
{
  "eventType": "delivery_assigned",
  "timestamp": "2026-05-12T14:35:00Z",
  "data": {
    "deliveryId": "DEL-12345",
    "courierId": "COURIER-456",
    "courierName": "John Mthembu",
    "courierPhone": "+27123456789",
    "courierRating": 4.8,
    "courierStars": 45,
    "vehicleType": "car",
    "vehicleRegistration": "GP-12-ABC",
    "estimatedPickupTime": "2026-05-12T14:45:00Z",
    "estimatedDeliveryTime": "2026-05-12T15:30:00Z",
    "status": "assigned",
    "assignedAt": "2026-05-12T14:35:00Z"
  }
}
```

**Zapier Action:** Send SMS to customer with courier details and tracking link

---

#### Event 3: `delivery_in_transit`
**Trigger:** Courier marks delivery as picked up  
**Frequency:** ~30–60/hour

```json
{
  "eventType": "delivery_in_transit",
  "timestamp": "2026-05-12T14:50:00Z",
  "data": {
    "deliveryId": "DEL-12345",
    "courierId": "COURIER-456",
    "courierLatitude": -26.1300,
    "courierLongitude": 28.0600,
    "status": "in-transit",
    "pickupConfirmedAt": "2026-05-12T14:50:00Z",
    "estimatedDeliveryTime": "2026-05-12T15:25:00Z"
  }
}
```

**Zapier Action:** Update Google Sheets delivery log; send tracking update to customer

---

#### Event 4: `delivery_completed`
**Trigger:** Delivery marked as delivered  
**Frequency:** ~30–60/hour

```json
{
  "eventType": "delivery_completed",
  "timestamp": "2026-05-12T15:20:00Z",
  "data": {
    "deliveryId": "DEL-12345",
    "courierId": "COURIER-456",
    "customerId": "CUST-789",
    "baseFare": "R152.00",
    "surgePricing": {
      "multiplier": 1.0,
      "reason": "none"
    },
    "finalFare": "R152.00",
    "platformCommission": "R30.40",
    "courierEarnings": "R121.60",
    "referralBonus": 0,
    "totalCourierPayout": "R121.60",
    "customerRating": 5,
    "courierRating": 5,
    "completedAt": "2026-05-12T15:20:00Z",
    "deliveryTime": 50
  }
}
```

**Zapier Action:** 
- Log to Google Sheets (earnings, commission, delivery time)
- Send receipt email to customer
- Send earnings confirmation to courier (WhatsApp)
- Update courier stats (total deliveries, earnings)

---

#### Event 5: `courier_rating_updated`
**Trigger:** Customer rates courier or star count changes  
**Frequency:** ~20–40/hour

```json
{
  "eventType": "courier_rating_updated",
  "timestamp": "2026-05-12T15:25:00Z",
  "data": {
    "courierId": "COURIER-456",
    "deliveryId": "DEL-12345",
    "newRating": 4.9,
    "previousRating": 4.8,
    "newStarCount": 46,
    "previousStarCount": 45,
    "starChangeReason": "referral_bonus",
    "totalDeliveries": 342,
    "totalReferrals": 12,
    "updatedAt": "2026-05-12T15:25:00Z"
  }
}
```

**Zapier Action:** 
- Send celebratory message if milestone reached (e.g., 50 stars)
- Update courier leaderboard in Google Sheets
- Alert operations team if rating drops below 4.0

---

#### Event 6: `surge_pricing_triggered`
**Trigger:** Demand threshold exceeded or time-based surge activated  
**Frequency:** ~5–15/hour

```json
{
  "eventType": "surge_pricing_triggered",
  "timestamp": "2026-05-12T12:00:00Z",
  "data": {
    "zone": "Johannesburg-CBD",
    "multiplier": 1.5,
    "reason": "high_demand",
    "activeSince": "2026-05-12T12:00:00Z",
    "estimatedDuration": 120,
    "demandMetrics": {
      "activeDeliveries": 45,
      "availableCouriers": 8,
      "ratio": 5.625
    },
    "affectedDeliveries": 12,
    "estimatedAdditionalRevenue": "R456.00"
  }
}
```

**Zapier Action:** 
- Alert operations team (Slack): "Surge pricing active in {zone}: {multiplier}x"
- Log to analytics sheet
- Notify couriers in zone (WhatsApp): "High demand! Earn {multiplier}x fares"

---

#### Event 7: `payment_processed`
**Trigger:** Weekly payout executed  
**Frequency:** 1/week (Thursday)

```json
{
  "eventType": "payment_processed",
  "timestamp": "2026-05-16T09:00:00Z",
  "data": {
    "payoutId": "PAYOUT-5678",
    "courierId": "COURIER-456",
    "courierName": "John Mthembu",
    "courierEmail": "john@example.com",
    "courierPhone": "+27123456789",
    "bankAccount": "XXXX-XXXX-XXXX-1234",
    "payoutPeriod": {
      "startDate": "2026-05-09",
      "endDate": "2026-05-15"
    },
    "earnings": {
      "deliveryFares": "R2,150.00",
      "referralBonuses": "R100.00",
      "surgeEarnings": "R200.00",
      "totalEarnings": "R2,450.00",
      "platformCommission": "R490.00",
      "courierNetEarnings": "R1,960.00"
    },
    "deliveryCount": 28,
    "status": "success",
    "transactionId": "TXN-98765",
    "processedAt": "2026-05-16T09:00:00Z"
  }
}
```

**Zapier Action:**
- Log to Google Sheets (earnings summary)
- Send email receipt to courier
- Send Slack alert to finance team
- Update courier earnings dashboard

---

#### Event 8: `fraud_alert`
**Trigger:** Suspicious pattern detected by backend  
**Frequency:** ~2–5/day

```json
{
  "eventType": "fraud_alert",
  "timestamp": "2026-05-12T16:30:00Z",
  "data": {
    "alertId": "FRAUD-123",
    "courierId": "COURIER-789",
    "courierName": "Suspect Courier",
    "alertType": "suspicious_cancellation_pattern",
    "severity": "high",
    "details": {
      "cancellations": 5,
      "timeWindow": "2 hours",
      "reason": "Multiple cancellations without delivery attempts"
    },
    "history": {
      "previousAlerts": 2,
      "previousDisputes": 1,
      "accountAge": 45
    },
    "recommendedAction": "review_account",
    "createdAt": "2026-05-12T16:30:00Z"
  }
}
```

**Zapier Action:**
- Create support ticket (Slack thread)
- Send email to support team
- Log to compliance sheet
- Page on-call manager if severity = "high"

---

#### Event 9: `support_ticket_created`
**Trigger:** Customer submits complaint or dispute  
**Frequency:** ~5–15/day

```json
{
  "eventType": "support_ticket_created",
  "timestamp": "2026-05-12T17:00:00Z",
  "data": {
    "ticketId": "TICKET-999",
    "customerId": "CUST-789",
    "customerName": "Thabo Mthembu",
    "customerEmail": "thabo@example.com",
    "deliveryId": "DEL-12345",
    "issueType": "delivery_not_received",
    "priority": "high",
    "description": "Package was not delivered as promised",
    "attachments": [],
    "createdAt": "2026-05-12T17:00:00Z"
  }
}
```

**Zapier Action:**
- Send auto-response email to customer
- Create Slack channel for ticket
- Assign to support team
- Set 24-hour escalation timer

---

#### Event 10: `zone_coverage_alert`
**Trigger:** Courier availability drops below threshold  
**Frequency:** ~10–20/day

```json
{
  "eventType": "zone_coverage_alert",
  "timestamp": "2026-05-12T18:00:00Z",
  "data": {
    "zone": "Johannesburg-East",
    "availableCouriers": 3,
    "threshold": 5,
    "onlineCouriers": 12,
    "activeDeliveries": 8,
    "estimatedWaitTime": 25,
    "severity": "warning",
    "alertedAt": "2026-05-12T18:00:00Z"
  }
}
```

**Zapier Action:**
- Alert dispatcher (Slack): "Low coverage in {zone}. Available: {count}"
- Trigger recruitment notification
- Log to operations dashboard

---

## Workflow Specifications

### Workflow 1: Delivery Notification Pipeline

**Name:** "New Delivery → Notify Couriers"  
**Trigger:** `delivery_created` webhook  
**Frequency:** 50–100/hour

**Steps:**

```
1. Receive delivery_created webhook
   ├─ Extract: zone, distance, fare, pickup_location
   
2. Query Zapier Table: "Online Couriers"
   ├─ Filter: zone = delivery.zone AND status = "online"
   ├─ Result: [Courier A, Courier B, Courier C]
   
3. For each courier:
   ├─ Format WhatsApp message:
   │  "🚗 New delivery: {distance}km | R{fare} | {pickup_location}"
   │  "Accept? Reply YES or tap link: {acceptance_link}"
   │
   ├─ Send via Twilio WhatsApp
   │  ├─ Retry: 3 attempts, 10-second delay
   │  ├─ Timeout: 30 seconds
   │
   ├─ Log to Google Sheets:
   │  [Timestamp, Delivery ID, Courier, Message Status, Sent At]
   
4. Wait for acceptance (via backend webhook: delivery_assigned)
   
5. On acceptance:
   ├─ Remove delivery from "Available" list
   ├─ Notify other couriers: "Delivery accepted by {courier_name}"
   
6. If no acceptance after 5 minutes:
   ├─ Re-broadcast to backup couriers
   ├─ Alert dispatcher: "Delivery DEL-12345 not accepted"
```

**Error Handling:**
- WhatsApp send fails → Retry 3x with exponential backoff
- Courier not found → Skip and log error
- Zapier Table query fails → Use fallback list from backend

**Expected Outcome:**
- Delivery notification sent to 3–5 couriers within 30 seconds
- Acceptance rate: >80%
- Average time to acceptance: 2–3 minutes

---

### Workflow 2: Earnings Report & Payout Notification

**Name:** "Weekly Earnings Report & Payout"  
**Trigger:** `payment_processed` webhook  
**Frequency:** 1/week (Thursday 9 AM)

**Steps:**

```
1. Receive payment_processed webhook
   ├─ Extract: courier_id, earnings, payout_amount, delivery_count
   
2. Format earnings summary:
   ├─ Delivery Fares: R{amount}
   ├─ Referral Bonuses: R{amount}
   ├─ Surge Earnings: R{amount}
   ├─ Total Earnings: R{amount}
   ├─ Platform Commission: R{amount}
   ├─ Net Payout: R{amount}
   
3. Send email to courier:
   ├─ Subject: "Your Weekly Earnings: R{total}"
   ├─ Body: Formatted earnings summary + bank account confirmation
   ├─ Attachment: PDF receipt (generated by backend)
   
4. Log to Google Sheets (Earnings Report):
   ├─ [Date, Courier Name, Deliveries, Fares, Bonuses, Surge, Total, Commission, Net]
   
5. Send Slack alert to finance team:
   ├─ "{courier_name} payout processed: R{net} ({delivery_count} deliveries)"
   
6. Log to audit sheet for accounting:
   ├─ [Payout ID, Courier, Amount, Bank Account, Status, Timestamp]
   
7. Update courier dashboard:
   ├─ Refresh earnings history
   ├─ Update lifetime earnings total
```

**Error Handling:**
- Email send fails → Retry 2x, log to error sheet
- Google Sheets update fails → Queue for manual entry
- Slack notification fails → Send email to finance team instead

**Expected Outcome:**
- Payout confirmation sent to courier within 5 minutes
- Finance team has automated audit trail
- Earnings data logged for monthly reconciliation

---

### Workflow 3: Fraud Detection & Support Escalation

**Name:** "Fraud Alert → Support Escalation"  
**Trigger:** `fraud_alert` webhook  
**Frequency:** 2–5/day

**Steps:**

```
1. Receive fraud_alert webhook
   ├─ Extract: alert_type, severity, courier_id, details
   
2. Check courier history:
   ├─ Query Google Sheets: "Courier History"
   ├─ Look up: previous_alerts, disputes, account_age
   ├─ Calculate: risk_score = (alerts × 2) + (disputes × 3)
   
3. If risk_score < 3 (first alert):
   ├─ Send warning email to courier:
   │  "We noticed unusual activity on your account. Please review."
   │
   ├─ Log to compliance sheet
   ├─ Set 48-hour review timer
   
4. If risk_score >= 3 (repeated alerts):
   ├─ Create Slack thread in #fraud-alerts:
   │  "🚨 FRAUD ALERT: {courier_name}"
   │  "Alert Type: {type}"
   │  "Severity: {severity}"
   │  "History: {previous_alerts} alerts, {disputes} disputes"
   │  "Recommended: Review account, consider suspension"
   │
   ├─ Send email to support team:
   │  Subject: "Fraud Alert: {courier_name} - Action Required"
   │
   ├─ Log to compliance sheet with timestamp
   
5. If severity = "high":
   ├─ Page on-call manager via Slack:
   │  "@on-call-manager: High-severity fraud alert for {courier_name}"
   │
   ├─ Create support ticket (auto-assign to manager)
   
6. Set escalation timer:
   ├─ If unresolved after 24 hours → Send reminder to support team
   ├─ If unresolved after 48 hours → Escalate to senior manager
```

**Error Handling:**
- Slack notification fails → Send email instead
- Google Sheets query fails → Use fallback data from backend
- Manager not available → Escalate to secondary contact

**Expected Outcome:**
- First-time alerts resolved within 48 hours
- Repeated offenders flagged within 1 hour
- Compliance audit trail maintained

---

## Data Flow Diagrams

### Diagram 1: Delivery Lifecycle

```
Customer Books Delivery
        │
        ▼
[delivery_created webhook]
        │
        ├─→ Zapier: Query online couriers in zone
        │
        ├─→ Zapier: Send WhatsApp to couriers
        │
        ├─→ Courier accepts delivery
        │
        ├─→ [delivery_assigned webhook]
        │
        ├─→ Zapier: Send SMS to customer
        │
        ├─→ Zapier: Log to Google Sheets
        │
        ├─→ Courier picks up package
        │
        ├─→ [delivery_in_transit webhook]
        │
        ├─→ Zapier: Update tracking in Sheets
        │
        ├─→ Courier delivers package
        │
        ├─→ [delivery_completed webhook]
        │
        ├─→ Zapier: Log earnings
        │
        ├─→ Zapier: Send receipt email
        │
        └─→ Zapier: Update courier stats
```

### Diagram 2: Earnings & Payout Flow

```
Deliveries Completed
        │
        ▼
Weekly Payout Trigger (Thursday 9 AM)
        │
        ├─→ Backend: Calculate earnings
        │
        ├─→ Backend: Process payment (Paystack)
        │
        ├─→ [payment_processed webhook]
        │
        ├─→ Zapier: Format earnings summary
        │
        ├─→ Zapier: Send email to courier
        │
        ├─→ Zapier: Log to Google Sheets
        │
        ├─→ Zapier: Alert finance team (Slack)
        │
        └─→ Zapier: Update audit sheet
```

### Diagram 3: Fraud Detection Flow

```
Suspicious Pattern Detected
        │
        ▼
[fraud_alert webhook]
        │
        ├─→ Zapier: Query courier history
        │
        ├─→ Zapier: Calculate risk score
        │
        ├─→ If risk_score < 3:
        │   ├─→ Send warning email
        │   └─→ Log to compliance sheet
        │
        ├─→ If risk_score >= 3:
        │   ├─→ Create Slack thread
        │   ├─→ Send email to support
        │   └─→ Log to compliance sheet
        │
        ├─→ If severity = "high":
        │   ├─→ Page on-call manager
        │   └─→ Create support ticket
        │
        └─→ Set escalation timers
```

---

## Error Handling & Retry Logic

### Retry Strategy

| Component | Retry Count | Delay | Backoff |
|-----------|-------------|-------|---------|
| WhatsApp Send | 3 | 10s | Exponential |
| Email Send | 2 | 30s | Linear |
| Slack Notification | 2 | 5s | Linear |
| Google Sheets Update | 3 | 15s | Exponential |
| Webhook Delivery | 5 | 60s | Exponential |

### Error Codes & Responses

| Error | Cause | Action |
|-------|-------|--------|
| `COURIER_NOT_FOUND` | Courier ID invalid | Log error, skip notification |
| `WHATSAPP_SEND_FAILED` | Network error | Retry 3x, fallback to SMS |
| `SHEETS_QUOTA_EXCEEDED` | Too many writes | Queue for batch update |
| `SLACK_RATE_LIMIT` | Too many messages | Batch alerts, send summary |
| `INVALID_WEBHOOK_TOKEN` | Auth failure | Reject webhook, alert ops |

### Fallback Mechanisms

```
WhatsApp fails
  ├─→ Retry 3x
  ├─→ If still fails: Send SMS instead
  └─→ Log to error sheet

Google Sheets fails
  ├─→ Retry 3x
  ├─→ If still fails: Queue for manual entry
  └─→ Alert ops team

Slack fails
  ├─→ Retry 2x
  ├─→ If still fails: Send email instead
  └─→ Log to error sheet
```

---

## Monitoring & Observability

### Key Metrics to Track

| Metric | Target | Tool |
|--------|--------|------|
| Webhook delivery latency | <1 second | Zapier logs |
| WhatsApp delivery rate | >95% | Twilio logs |
| Email delivery rate | >98% | Email provider logs |
| Slack notification success | >99% | Slack API logs |
| Google Sheets update latency | <5 seconds | Zapier logs |
| Fraud alert response time | <1 hour | Support ticket logs |
| Payout notification latency | <5 minutes | Email logs |

### Monitoring Dashboard

Create a Zapier-powered dashboard in Google Sheets:

```
Metric                  | Today | This Week | This Month | Status
─────────────────────────────────────────────────────────────────
Webhooks Received       | 2,450 | 15,200    | 58,000     | ✅
Webhooks Failed         | 12    | 85        | 320        | ✅
WhatsApp Sent           | 1,200 | 7,500     | 28,000     | ✅
WhatsApp Failed         | 8     | 45        | 180        | ✅
Emails Sent             | 450   | 2,800     | 10,500     | ✅
Slack Alerts            | 35    | 220       | 850        | ✅
Google Sheets Updates   | 2,450 | 15,200    | 58,000     | ✅
Fraud Alerts            | 3     | 18        | 65         | ⚠️
Support Tickets         | 12    | 75        | 280        | ✅
```

### Alert Thresholds

Set up Zapier alerts for:
- Webhook failure rate >5%
- WhatsApp delivery rate <90%
- Email delivery rate <95%
- Slack notification failures >2/hour
- Fraud alerts >10/day
- Support ticket backlog >50

---

## Implementation Checklist

### Pre-Implementation

- [ ] Zapier account created and Pro plan activated
- [ ] Zapier webhook token generated and stored in backend env
- [ ] Backend webhook endpoint (`/api/zapier/webhook`) implemented
- [ ] Webhook authentication tested
- [ ] Twilio account linked to Zapier
- [ ] Google Sheets linked to Zapier
- [ ] Slack workspace linked to Zapier
- [ ] Email provider configured in Zapier

### Phase 1: Foundation (Weeks 1–2)

- [ ] Workflow 1 created: Delivery Notifications
  - [ ] Zapier table for online couriers created
  - [ ] WhatsApp message template finalized
  - [ ] Google Sheets logging configured
  - [ ] Testing with 5 test deliveries completed
  - [ ] Error handling tested

- [ ] Workflow 2 created: Earnings & Payout
  - [ ] Google Sheets earnings template created
  - [ ] Email template finalized
  - [ ] Slack notification configured
  - [ ] Testing with 1 test payout completed

- [ ] Workflow 3 created: Fraud Detection
  - [ ] Courier history table in Google Sheets created
  - [ ] Risk score calculation logic implemented
  - [ ] Slack thread creation tested
  - [ ] Email escalation tested

### Phase 2: Testing & Optimization (Weeks 3–4)

- [ ] Load testing: 100 webhooks/minute
- [ ] Latency testing: All workflows <5 seconds
- [ ] Error handling: All retry logic tested
- [ ] Fallback mechanisms: All tested
- [ ] Monitoring dashboard: Created and validated
- [ ] Alert thresholds: Set and tested
- [ ] Documentation: Updated with real data

### Phase 3: Deployment (Week 5)

- [ ] Staging environment: All workflows deployed
- [ ] UAT: 48-hour test run with real data
- [ ] Production deployment: Scheduled for low-traffic time
- [ ] Monitoring: 24/7 active during first week
- [ ] Runbook: Created for on-call team
- [ ] Support training: Completed

### Post-Deployment (Week 6+)

- [ ] Monitor metrics daily for 2 weeks
- [ ] Optimize based on real-world performance
- [ ] Document lessons learned
- [ ] Plan Phase 2 workflows (reporting, analytics)
- [ ] Schedule quarterly reviews

---

## Conclusion

This architecture provides a **scalable, reliable, and maintainable** foundation for Zapier integration with Mzansi Couriers. By following this specification, we will:

✅ Automate 80%+ of operational workflows  
✅ Reduce manual tasks by 30+ hours/week  
✅ Improve courier and customer satisfaction  
✅ Enable data-driven decision-making  
✅ Scale operations to 9 provinces without backend changes  

**Next Steps:**
1. Review this document with engineering team
2. Adjust workflows based on feedback
3. Begin implementation in Week 1
4. Schedule weekly sync calls with Zapier support

---

**Document Owner:** Mzansi Couriers Engineering  
**Last Updated:** May 2026  
**Next Review:** June 2026
