# Mzansi Couriers × Zapier Integration Brief

**Prepared by:** Mzansi Couriers Engineering Team  
**Date:** May 2026  
**Status:** Pre-Integration Planning  
**Platform Stage:** 99% Complete – Ready for Automation Layer

---

## Executive Summary

Mzansi Couriers is a **South African peer-to-peer logistics platform** connecting customers with independent couriers for same-day and next-day deliveries. Our platform has achieved full technical maturity with a production-ready backend, real-time GPS tracking, driver onboarding, and integrated payment processing. We are now seeking **Zapier as our automation and workflow orchestration partner** to handle operational workflows, notifications, reporting, and scaling across South Africa's nine provinces.

This brief outlines our integration scope, architectural requirements, and automation roadmap to position Zapier as the operational backbone of our national expansion.

---

## Platform Overview

### What Mzansi Couriers Does

**Mzansi Couriers** is a **logistics network platform** that enables:

- **Customers** to book same-day/next-day deliveries via mobile app
- **Independent Couriers** to earn income using their own vehicles (motorbikes, cars, vans, bakkies)
- **Real-time tracking** of packages from pickup to delivery
- **Transparent pricing** based on distance and package size
- **Weekly automated payouts** to courier bank accounts
- **Gamified engagement** through referral bonuses and star ratings

### Business Model

| Metric | Value |
|--------|-------|
| **Platform Commission** | 20% of delivery fare |
| **Johannesburg/Cape Town Pricing** | R10/km |
| **Other Areas Pricing** | R7/km |
| **Courier Monthly Potential** | R16,000–R17,000 (15–20 deliveries/day) |
| **Payout Frequency** | Weekly (Thursdays) |
| **Geographic Scope** | South Africa (9 provinces) |
| **Active Couriers** | 500+ (growing) |
| **Daily Deliveries** | 1,200–1,500 |

---

## Current Development Status

### ✅ Completed Systems

**Backend Infrastructure**
- Express.js + tRPC API with full type safety
- MySQL/TiDB database with 30+ tables
- OAuth 2.0 authentication (Manus OAuth)
- Role-based access control (Customer, Courier, Admin)

**Core Features**
- ✅ Parcel booking system with real-time quotes
- ✅ Courier onboarding (KYC, vehicle verification, agreement signing)
- ✅ Real-time GPS tracking (WebSocket + database logging)
- ✅ Delivery assignment and acceptance workflow
- ✅ Earnings calculation and commission management
- ✅ Rating and review system
- ✅ Referral system with star-based gamification
- ✅ Dynamic surge pricing (time-based and demand-based)
- ✅ Dispute resolution system
- ✅ SMS notifications (Twilio integration)

**Integrations Already Live**
- ✅ **Twilio** – SMS + WhatsApp messaging
- ✅ **Paystack** – Payment processing and courier payouts
- ✅ **Google Maps API** – Distance calculation, routing, real-time tracking
- ✅ **Firebase/Supabase** – Real-time database and authentication
- ✅ **Manus OAuth** – User authentication and session management

**Frontend**
- React 19 + Tailwind CSS 4 responsive UI
- Mobile-optimized dashboard for couriers and customers
- Real-time notifications and delivery tracking
- Multi-language support (English, Zulu, Xhosa)

---

## Existing Integrations & Why Zapier Fits

### Current Integration Stack

| System | Purpose | Status |
|--------|---------|--------|
| Twilio | SMS + WhatsApp delivery | ✅ Live |
| Paystack | Payments + Payouts | ✅ Live |
| Google Maps | Routing + Tracking | ✅ Live |
| Firebase | Real-time database | ✅ Live |
| Manus OAuth | Authentication | ✅ Live |

### Why Zapier is the Right Choice

Zapier will **NOT replace** these core integrations. Instead, it will:

1. **Orchestrate workflows** across these systems
2. **Automate operational tasks** (reporting, alerts, escalations)
3. **Connect to business tools** (Google Sheets, Slack, email)
4. **Enable non-technical staff** to build new workflows
5. **Scale automation** across provinces without backend changes

---

## What Zapier Will Handle

### ✅ Zapier Responsibilities

**Notification Workflows**
- WhatsApp alerts to couriers when new deliveries match their zone
- SMS reminders to customers 30 minutes before delivery
- Escalation alerts to support team when delivery is delayed >15 minutes
- Driver rating notifications (when star count changes)
- Referral bonus earned notifications

**Reporting & Logging**
- Daily delivery summary to Google Sheets
- Weekly earnings report (by courier, by zone, by day)
- Real-time dashboard updates to Slack for operations team
- Monthly financial reconciliation export
- Surge pricing event logging

**Administrative Workflows**
- New courier onboarding checklist (email + Slack)
- Fraud alert escalation (suspicious activity → support team)
- Driver verification status updates
- Commission audit trails
- Payment failure notifications

**Customer Support**
- Ticket creation when customer disputes a charge
- Auto-response emails for common queries
- Support escalation to senior team after 24 hours
- Customer feedback collection via email

**Operational Alerts**
- Zone coverage alerts (when no couriers online in a region)
- High-demand alerts (surge pricing trigger notifications)
- System health checks (API uptime monitoring)
- Payment processing failures
- Database backup confirmations

---

## What Zapier Will NOT Handle

### ❌ Zapier Exclusions

**Core Business Logic** – Handled by backend
- Driver matching algorithms
- Real-time delivery assignment
- Price calculation and surge multipliers
- GPS tracking and location updates
- Fraud detection engine
- Payment processing (Paystack handles this)

**Database Management** – Handled by MySQL/TiDB
- User data storage
- Delivery records
- Transaction logs
- GPS coordinates
- Driver verification documents

**Real-time Communication** – Handled by Twilio + WebSockets
- Live chat between customer and courier
- Real-time location streaming
- Instant notifications during delivery
- Emergency contact protocols

**Authentication & Security** – Handled by Manus OAuth + backend
- User login/logout
- Session management
- Role-based access control
- Data encryption

---

## Automation Architecture

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mzansi Couriers Backend                  │
│  (Express + tRPC + MySQL + Real-time Tracking)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─→ Webhooks (Events)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Zapier Orchestration Layer                │
│  (Automation, Workflows, Business Logic Coordination)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬────────────┐
        │              │              │            │
        ▼              ▼              ▼            ▼
   ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐
   │ Twilio  │  │ Paystack │  │Google Sheets│  │  Slack   │
   │ (SMS)   │  │ (Payouts)│  │ (Reports)  │  │ (Alerts) │
   └─────────┘  └──────────┘  └────────────┘  └──────────┘
        │              │              │            │
        └──────────────┼──────────────┴────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
   ┌─────────────┐           ┌──────────────┐
   │   Email     │           │  Operations  │
   │ (Automated) │           │   Dashboard  │
   └─────────────┘           └──────────────┘
```

### Webhook Events from Backend

The backend will emit webhooks for key events:

```json
{
  "delivery_created": {
    "deliveryId": "DEL-12345",
    "customerId": "CUST-789",
    "pickupZone": "Johannesburg-North",
    "dropoffZone": "Johannesburg-South",
    "distance": 15.2,
    "estimatedFare": "R152",
    "timestamp": "2026-05-12T14:30:00Z"
  },
  "delivery_assigned": {
    "deliveryId": "DEL-12345",
    "courierId": "COURIER-456",
    "courierName": "John Mthembu",
    "courierPhone": "+27123456789",
    "estimatedPickupTime": "2026-05-12T14:45:00Z"
  },
  "delivery_completed": {
    "deliveryId": "DEL-12345",
    "courierId": "COURIER-456",
    "finalFare": "R152",
    "platformCommission": "R30.40",
    "courierEarnings": "R121.60",
    "completedAt": "2026-05-12T15:15:00Z"
  },
  "courier_rating_updated": {
    "courierId": "COURIER-456",
    "newStarCount": 47,
    "previousStarCount": 46,
    "totalReferrals": 12
  },
  "surge_pricing_triggered": {
    "zone": "Johannesburg-CBD",
    "multiplier": 1.5,
    "reason": "high_demand",
    "activeSince": "2026-05-12T12:00:00Z",
    "estimatedDuration": 120
  },
  "payment_processed": {
    "courierId": "COURIER-456",
    "amount": "R2,450.80",
    "payoutDate": "2026-05-16",
    "transactionId": "PAY-98765",
    "status": "success"
  },
  "fraud_alert": {
    "type": "suspicious_cancellation_pattern",
    "courierId": "COURIER-789",
    "details": "5 cancellations in 2 hours",
    "severity": "high",
    "timestamp": "2026-05-12T16:30:00Z"
  }
}
```

### Zapier Trigger Points

| Event | Trigger | Action |
|-------|---------|--------|
| Delivery Created | New booking in system | Notify matching couriers (WhatsApp) |
| Delivery Assigned | Courier accepts job | Confirm to customer (SMS) |
| Delivery In-Transit | Status updated | Update Google Sheets log |
| Delivery Completed | Marked complete | Log earnings, send receipt email |
| Courier Rating Updated | Star count changes | Celebrate milestone (Slack alert) |
| Surge Pricing Active | Demand threshold hit | Alert operations team (Slack) |
| Payment Processed | Weekly payout | Log to Google Sheets, send email |
| Fraud Detected | Suspicious pattern | Escalate to support (email + Slack) |
| Support Ticket Created | Customer complaint | Create Slack thread, assign owner |
| Zone Coverage Low | <5 couriers online | Alert dispatcher to recruit |

---

## Proposed Automation Roadmap

### Phase 1: Foundation (Weeks 1–2)
**Goal:** Establish core workflows and data logging

1. **Delivery Lifecycle Automation**
   - Trigger: Delivery created → Send WhatsApp to matching couriers
   - Trigger: Delivery assigned → Send SMS confirmation to customer
   - Trigger: Delivery completed → Log to Google Sheets + send email receipt

2. **Earnings & Payout Tracking**
   - Trigger: Weekly payout processed → Log to Google Sheets
   - Trigger: Payout failed → Alert finance team (email + Slack)

3. **Operational Alerts**
   - Trigger: Zone coverage <5 couriers → Slack alert to dispatcher
   - Trigger: Delivery delayed >15 min → SMS to customer + Slack to support

### Phase 2: Intelligence (Weeks 3–4)
**Goal:** Add reporting, analytics, and escalation workflows

4. **Daily/Weekly Reporting**
   - Trigger: 11:59 PM daily → Generate daily summary to Google Sheets
   - Trigger: Thursday 5 PM → Generate weekly earnings report by courier
   - Trigger: Friday 9 AM → Send financial reconciliation to accounting

5. **Fraud Detection Escalation**
   - Trigger: Suspicious pattern detected → Create support ticket
   - Trigger: Multiple cancellations → Escalate to senior team after 2 hours
   - Trigger: High dispute rate → Flag courier for review

6. **Customer Support Automation**
   - Trigger: Support ticket created → Auto-response email + Slack notification
   - Trigger: Ticket unresolved >24 hrs → Escalate to manager
   - Trigger: Customer rating <3 stars → Offer support follow-up

### Phase 3: Scale (Weeks 5–6)
**Goal:** Enable multi-province operations and advanced analytics

7. **Multi-Zone Management**
   - Trigger: New zone activated → Create zone-specific reporting sheets
   - Trigger: Zone performance <threshold → Alert regional manager
   - Trigger: Courier moves to new zone → Update assignments

8. **Gamification & Engagement**
   - Trigger: Courier earns star → Send celebratory WhatsApp
   - Trigger: Referral bonus earned → Notify referrer + referral recipient
   - Trigger: Milestone reached (50 stars) → Send special offer email

9. **Advanced Analytics**
   - Trigger: End of month → Generate comprehensive performance dashboard
   - Trigger: Surge pricing event → Log to analytics sheet for trend analysis
   - Trigger: Competitor pricing changes → Alert pricing team

---

## First 3 Workflows to Implement

### Workflow 1: Delivery Notification & Assignment Confirmation

**Purpose:** Ensure couriers see new jobs immediately and customers get confirmation

**Trigger:** `delivery_created` webhook

**Steps:**
1. Extract delivery details (zone, distance, fare, pickup location)
2. Query Zapier storage for couriers in matching zone (status = online)
3. Send WhatsApp to each courier: "New delivery: {distance}km, R{fare}, {pickup_location}"
4. Wait for acceptance (via backend webhook)
5. On acceptance, send SMS to customer: "Courier {name} assigned. ETA {time}. Track: {link}"
6. Log event to Google Sheets (timestamp, courier, customer, fare)

**Expected Result:** Couriers see jobs within 30 seconds; customers get confirmation within 1 minute

---

### Workflow 2: Weekly Earnings Report & Payout Notification

**Purpose:** Provide transparent earnings tracking and payment confirmation

**Trigger:** `payment_processed` webhook (weekly payout)

**Steps:**
1. Collect all deliveries completed by courier in past 7 days
2. Calculate total earnings, commission, bonuses, referral earnings
3. Create summary row in Google Sheets: `[Date, Courier Name, Deliveries, Earnings, Bonuses, Total]`
4. Send email to courier: "Your weekly earnings: R{total}. Payout processed to {bank_account}"
5. Send Slack alert to finance team: "{courier_name} payout processed: R{total}"
6. Log transaction to audit sheet for accounting

**Expected Result:** Couriers have transparent earnings visibility; finance team has automated audit trail

---

### Workflow 3: Fraud Alert & Support Escalation

**Purpose:** Detect suspicious patterns and escalate to support team

**Trigger:** `fraud_alert` webhook

**Steps:**
1. Receive fraud alert (e.g., 5 cancellations in 2 hours)
2. Check courier history in Google Sheets (previous alerts, dispute count)
3. If first alert: Send warning email to courier
4. If repeated alerts: Create support ticket in Slack
5. Send email to support team: "Fraud Alert: {courier_name}. Details: {reason}. Action: Review account"
6. Log alert to compliance sheet with timestamp and severity
7. If severity = "high": Page on-call manager via Slack

**Expected Result:** Fraudulent patterns caught within 1 hour; support team alerted automatically

---

## Scaling Automation Nationally

### Multi-Province Strategy

**Phase 1: Johannesburg & Cape Town (Current)**
- Establish workflows in high-volume zones
- Refine automation based on real data
- Build reporting templates

**Phase 2: Expansion to 7 More Provinces**
- Replicate workflows for new zones (Durban, Pretoria, Bloemfontein, Port Elizabeth, East London, Pietermaritzburg, Polokwane)
- Create province-specific reporting sheets
- Set up regional manager alerts

**Phase 3: National Operations Center**
- Centralized Slack channel for all provinces
- National daily/weekly reporting
- Cross-province courier matching (for long-distance deliveries)
- Unified fraud detection across all zones

### Scaling Considerations

| Aspect | Current | Scale Target |
|--------|---------|--------------|
| **Daily Deliveries** | 1,200–1,500 | 10,000+ |
| **Active Couriers** | 500+ | 5,000+ |
| **Zones** | 2 | 9 provinces |
| **Webhook Events/Day** | ~6,000 | 40,000+ |
| **Zapier Tasks/Day** | ~10,000 | 100,000+ |

**Zapier Scaling Approach:**
1. Use **Zapier Tables** for high-frequency data (daily summaries, zone status)
2. Implement **Zapier Webhooks** for real-time event processing
3. Create **Zapier Paths** for conditional logic (fraud detection, escalation rules)
4. Use **Zapier Delay** for batch processing (nightly reports, weekly summaries)
5. Monitor **Zapier Task Usage** and optimize workflows to stay within budget

---

## Integration Timeline

| Week | Milestone | Deliverable |
|------|-----------|-------------|
| **Week 1** | Zapier account setup + webhook configuration | Zapier app connected to backend |
| **Week 2** | Workflow 1 (Delivery Notifications) | Couriers receive WhatsApp alerts |
| **Week 3** | Workflow 2 (Earnings Reports) | Weekly reports in Google Sheets |
| **Week 4** | Workflow 3 (Fraud Alerts) | Support team receives escalations |
| **Week 5** | Testing & optimization | Performance tuning, error handling |
| **Week 6** | Go-live & monitoring | Production deployment, 24/7 monitoring |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Delivery Notification Latency** | <30 seconds | Webhook → WhatsApp delivery time |
| **Workflow Automation Rate** | >95% | Automated vs. manual workflows |
| **Support Ticket Response Time** | <1 hour | Escalation → support team assignment |
| **Report Generation Time** | <5 minutes | Trigger → Google Sheets update |
| **Fraud Detection Accuracy** | >90% | True positives / total alerts |
| **Courier Satisfaction** | >4.5/5 | Survey feedback on notifications |
| **Operational Cost Reduction** | 30% | Manual tasks eliminated |

---

## Technical Requirements for Zapier

### API Requirements
- Webhook endpoint: `POST /api/zapier/webhook`
- Authentication: Bearer token (provided by Manus)
- Rate limit: 1,000 requests/minute
- Retry policy: Exponential backoff (3 retries)
- Timeout: 30 seconds

### Data Security
- All data encrypted in transit (TLS 1.3)
- Zapier credentials stored in environment variables
- No sensitive data (passwords, API keys) logged
- GDPR/POPIA compliance for customer data

### Monitoring & Support
- Zapier task usage dashboard
- Error logging and alerting
- Weekly performance reports
- Dedicated Zapier support contact

---

## Budget & Pricing

| Component | Estimated Cost | Notes |
|-----------|----------------|-------|
| Zapier Pro Plan | $99/month | 100,000 tasks/month |
| Additional Tasks (if needed) | $0.99 per 1,000 | Scalable as volume grows |
| Google Sheets (free tier) | $0 | Unlimited sheets |
| Slack (free tier) | $0 | Basic notifications |
| **Total Monthly** | **~$100** | Scales with volume |

---

## Conclusion

Mzansi Couriers is a **mature, production-ready logistics platform** seeking Zapier as our **operational automation partner**. We have built a robust backend, integrated core payment and messaging systems, and are now ready to automate workflows at scale.

By implementing Zapier, we will:
- ✅ Eliminate manual operational tasks
- ✅ Improve courier and customer experience through instant notifications
- ✅ Enable data-driven decision-making via automated reporting
- ✅ Scale operations across South Africa without backend changes
- ✅ Reduce operational costs by 30%+

We are ready to move forward with integration and welcome a partnership discussion with the Zapier team.

---

## Next Steps

1. **Schedule Discovery Call** – Discuss integration timeline and requirements
2. **Set Up Zapier Account** – Configure webhook endpoints and authentication
3. **Implement Phase 1 Workflows** – Deploy delivery notifications and earnings tracking
4. **Monitor & Optimize** – Track performance metrics and refine workflows
5. **Scale to National Operations** – Expand automation to all 9 provinces

---

**Contact Information**

**Mzansi Couriers Engineering Team**  
Email: engineering@mzansicouriers.co.za  
Phone: +27 (0) 11 XXX XXXX  
Website: www.mzansicouriers.co.za  

---

*This brief represents the technical and business requirements for Zapier integration as of May 2026. Updates will be provided as the platform evolves.*
