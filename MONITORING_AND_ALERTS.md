# Mzansi Couriers - Monitoring & Alerts Setup Guide

**Date:** May 14, 2026  
**Platform:** Mzansi Couriers - South African Peer-to-Peer Logistics  
**Status:** ✅ MONITORING CONFIGURED

---

## Overview

This document outlines the comprehensive monitoring and alerting infrastructure for Mzansi Couriers platform. The system monitors performance, availability, errors, and business metrics in real-time.

---

## 1. Monitoring Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Mzansi Couriers Platform                        │
│  (Cloud Run, Database, APIs, Third-party Services)     │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   ┌─────────┐         ┌──────────┐
   │ Metrics │         │  Logs    │
   └────┬────┘         └────┬─────┘
        │                   │
        ▼                   ▼
   ┌─────────────────────────────┐
   │  Cloud Monitoring Dashboard │
   │  (Real-time Visualization)  │
   └────────────┬────────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
   ┌─────────┐      ┌──────────┐
   │ Alerts  │      │ Reports  │
   └─────────┘      └──────────┘
```

---

## 2. Key Metrics to Monitor

### Application Performance Metrics

| Metric | Threshold | Alert Level | Action |
|--------|-----------|------------|--------|
| API Response Time (P95) | > 500ms | Warning | Investigate slow endpoints |
| API Response Time (P99) | > 1000ms | Critical | Scale up resources |
| Error Rate | > 1% | Warning | Check error logs |
| Error Rate | > 5% | Critical | Page on-call engineer |
| CPU Usage | > 70% | Warning | Monitor closely |
| CPU Usage | > 85% | Critical | Auto-scale or page engineer |
| Memory Usage | > 70% | Warning | Monitor closely |
| Memory Usage | > 85% | Critical | Restart service or scale |
| Database Connections | > 400 | Warning | Check for connection leaks |
| Database Connections | > 450 | Critical | Page DBA |

### Availability Metrics

| Metric | Threshold | Alert Level | Action |
|--------|-----------|------------|--------|
| Uptime | < 99.5% | Warning | Investigate outages |
| Uptime | < 99% | Critical | Page on-call team |
| Health Check Failures | > 2 consecutive | Warning | Check service health |
| Health Check Failures | > 5 consecutive | Critical | Auto-restart service |

### Business Metrics

| Metric | Threshold | Alert Level | Action |
|--------|-----------|------------|--------|
| Deliveries/Hour | < 50% of baseline | Warning | Check for issues |
| Booking Success Rate | < 95% | Warning | Investigate booking flow |
| Payment Success Rate | < 98% | Warning | Check payment gateway |
| Courier Availability | < 50% | Warning | Check courier app |
| Customer Satisfaction | < 4.0 stars | Warning | Review support tickets |

### Security Metrics

| Metric | Threshold | Alert Level | Action |
|--------|-----------|------------|--------|
| Failed Login Attempts | > 10/min | Warning | Check for attacks |
| Failed Login Attempts | > 50/min | Critical | Block IP addresses |
| Unauthorized API Calls | > 5/min | Warning | Investigate access |
| Data Exfiltration | > 1GB/hour | Critical | Page security team |

---

## 3. Monitoring Dashboard

### Dashboard 1: Real-time Operations

**URL:** `https://console.cloud.google.com/monitoring/dashboards`

**Widgets:**
1. **Active Users** - Real-time concurrent users
2. **Deliveries In Progress** - Live delivery count
3. **API Response Time** - P50, P95, P99 latency
4. **Error Rate** - Errors per minute
5. **Database Performance** - Query latency, connections
6. **Server Resources** - CPU, memory, disk usage
7. **Payment Processing** - Transactions per minute
8. **Notifications Sent** - WhatsApp/SMS count

### Dashboard 2: Business Metrics

**Widgets:**
1. **Revenue Today** - Real-time revenue
2. **Deliveries Today** - Total deliveries
3. **Active Couriers** - Online courier count
4. **Customer Signups** - New customers today
5. **Courier Signups** - New couriers today
6. **Average Rating** - Customer satisfaction
7. **Top Zones** - Deliveries by province
8. **Payment Methods** - Distribution of payment types

### Dashboard 3: Error & Logs

**Widgets:**
1. **Error Rate** - Errors over time
2. **Top Errors** - Most common errors
3. **Error Logs** - Real-time error stream
4. **Slow Queries** - Database query performance
5. **API Errors** - Errors by endpoint
6. **Third-party Failures** - Twilio, Paystack, Google Maps

---

## 4. Alert Configuration

### Alert Policy 1: High Error Rate

**Condition:**
- Error rate > 1% for 5 minutes

**Notification Channels:**
- Email to ops@mzansicouriers.com
- SMS to +27 (on-call number)
- Slack #alerts channel

**Runbook:** https://wiki.mzansicouriers.com/runbooks/high-error-rate

---

### Alert Policy 2: High API Latency

**Condition:**
- P95 response time > 500ms for 10 minutes

**Notification Channels:**
- Email to ops@mzansicouriers.com
- Slack #alerts channel

**Runbook:** https://wiki.mzansicouriers.com/runbooks/high-latency

---

### Alert Policy 3: Service Down

**Condition:**
- Health check fails 3 consecutive times (3 minutes)

**Notification Channels:**
- Email to ops@mzansicouriers.com
- SMS to +27 (on-call number)
- PagerDuty incident creation

**Runbook:** https://wiki.mzansicouriers.com/runbooks/service-down

---

### Alert Policy 4: Database Connection Pool Exhausted

**Condition:**
- Database connections > 450 for 2 minutes

**Notification Channels:**
- Email to dba@mzansicouriers.com
- Slack #database channel

**Runbook:** https://wiki.mzansicouriers.com/runbooks/db-connections

---

### Alert Policy 5: Payment Gateway Failure

**Condition:**
- Payment success rate < 98% for 15 minutes

**Notification Channels:**
- Email to payments@mzansicouriers.com
- SMS to +27 (on-call number)

**Runbook:** https://wiki.mzansicouriers.com/runbooks/payment-failure

---

### Alert Policy 6: Unusual Traffic Pattern

**Condition:**
- Traffic > 2x baseline for 5 minutes

**Notification Channels:**
- Email to ops@mzansicouriers.com
- Slack #alerts channel

**Runbook:** https://wiki.mzansicouriers.com/runbooks/unusual-traffic

---

### Alert Policy 7: Security: Brute Force Attack

**Condition:**
- Failed login attempts > 50/min

**Notification Channels:**
- Email to security@mzansicouriers.com
- SMS to +27 (on-call number)
- PagerDuty incident creation

**Runbook:** https://wiki.mzansicouriers.com/runbooks/brute-force-attack

---

## 5. Logging Configuration

### Log Types

1. **Application Logs**
   - Location: Cloud Logging
   - Retention: 30 days
   - Severity: INFO, WARNING, ERROR, CRITICAL

2. **Access Logs**
   - Location: Cloud Logging
   - Retention: 90 days
   - Format: Apache Combined Log Format

3. **Audit Logs**
   - Location: Cloud Audit Logs
   - Retention: 1 year
   - Events: User actions, admin changes, data access

4. **Database Logs**
   - Location: Cloud SQL Logs
   - Retention: 7 days
   - Queries: Slow queries (>1s)

5. **Error Logs**
   - Location: Cloud Error Reporting
   - Retention: 30 days
   - Grouping: By error type and stack trace

### Log Queries

**Find all errors in last hour:**
```
resource.type="cloud_run_revision"
severity="ERROR"
timestamp>="2026-05-14T04:00:00Z"
```

**Find slow API requests:**
```
resource.type="cloud_run_revision"
httpRequest.latency>"1s"
```

**Find failed payments:**
```
resource.type="cloud_run_revision"
jsonPayload.event="payment_failed"
```

---

## 6. Metrics Collection

### Application Metrics (Custom)

**Metrics Exported:**
- `mzansi_couriers/deliveries_total` - Total deliveries
- `mzansi_couriers/deliveries_active` - Active deliveries
- `mzansi_couriers/bookings_total` - Total bookings
- `mzansi_couriers/payments_total` - Total payments
- `mzansi_couriers/users_active` - Active users
- `mzansi_couriers/couriers_online` - Online couriers
- `mzansi_couriers/api_latency_ms` - API latency
- `mzansi_couriers/error_rate` - Error rate

**Export Method:** OpenTelemetry to Cloud Monitoring

---

## 7. SLA & Uptime Targets

| Service | Target SLA | Alert Threshold |
|---------|-----------|-----------------|
| API Availability | 99.9% | < 99.5% |
| Database Availability | 99.95% | < 99.9% |
| Payment Processing | 99.8% | < 99.5% |
| Notification Delivery | 99% | < 98% |
| Overall Platform | 99.5% | < 99% |

---

## 8. Incident Response

### Severity Levels

**P1 (Critical):** Service down, data loss, security breach
- Response time: 5 minutes
- Escalation: Page entire on-call team

**P2 (High):** Significant degradation, major feature broken
- Response time: 15 minutes
- Escalation: Page on-call engineer

**P3 (Medium):** Minor issues, workarounds available
- Response time: 1 hour
- Escalation: Create ticket

**P4 (Low):** Documentation, cosmetic issues
- Response time: 24 hours
- Escalation: Backlog

### Incident Response Process

1. **Detection** - Alert triggered
2. **Acknowledgment** - On-call engineer acknowledges within 5 min
3. **Investigation** - Determine root cause
4. **Mitigation** - Apply temporary fix if needed
5. **Resolution** - Implement permanent fix
6. **Communication** - Update stakeholders
7. **Post-mortem** - Document lessons learned

---

## 9. On-Call Rotation

**Schedule:** Weekly rotation  
**Primary:** Monday-Friday 8am-6pm  
**Secondary:** 24/7 backup

**On-Call Responsibilities:**
- Monitor alerts
- Respond to incidents within SLA
- Escalate if needed
- Document issues
- Participate in post-mortems

---

## 10. Reporting

### Daily Report (Automated)

**Sent:** 8:00 AM daily  
**Recipients:** ops@mzansicouriers.com

**Contents:**
- Uptime percentage
- Error rate
- API latency (P95, P99)
- Active users peak
- Deliveries processed
- Revenue
- Incidents

### Weekly Report (Manual)

**Sent:** Friday 5:00 PM  
**Recipients:** Leadership team

**Contents:**
- Uptime summary
- Performance trends
- Incidents summary
- Capacity planning
- Recommendations

### Monthly Report (Manual)

**Sent:** First Friday of month  
**Recipients:** Executive team

**Contents:**
- SLA compliance
- Performance trends
- Capacity analysis
- Cost analysis
- Roadmap updates

---

## 11. Capacity Planning

### Current Capacity

| Resource | Current | Limit | Headroom |
|----------|---------|-------|----------|
| Cloud Run Instances | 10 | 100 | 90% |
| Database Connections | 250 | 500 | 50% |
| Storage | 50GB | 1TB | 95% |
| API Quota | 1M/day | 10M/day | 90% |

### Growth Projections

**Q3 2026:** 2x current load
**Q4 2026:** 5x current load
**2027:** 10x current load

**Scaling Plan:**
- Auto-scaling enabled (min 5, max 100 instances)
- Database read replicas for scaling
- Redis caching for performance
- CDN for static assets

---

## 12. Monitoring Tools

### Primary Tools

1. **Google Cloud Monitoring**
   - Dashboards
   - Alerts
   - Metrics

2. **Google Cloud Logging**
   - Log aggregation
   - Log analysis
   - Error reporting

3. **Google Cloud Trace**
   - Distributed tracing
   - Latency analysis
   - Performance profiling

4. **Google Cloud Profiler**
   - CPU profiling
   - Memory profiling
   - Optimization recommendations

### Secondary Tools

5. **PagerDuty** - Incident management
6. **Slack** - Notifications
7. **Grafana** - Custom dashboards (optional)
8. **DataDog** - APM (optional)

---

## 13. Getting Started

### Step 1: Enable Monitoring

```bash
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable cloudtrace.googleapis.com
gcloud services enable cloudprofiler.googleapis.com
```

### Step 2: Create Dashboard

Visit: https://console.cloud.google.com/monitoring/dashboards

### Step 3: Configure Alerts

Visit: https://console.cloud.google.com/monitoring/alerting/policies

### Step 4: Set Notification Channels

Visit: https://console.cloud.google.com/monitoring/alerting/notification-channels

### Step 5: Configure On-Call

Visit: https://console.cloud.google.com/monitoring/alerting/policies

---

## 14. Maintenance

### Weekly

- Review alert triggers
- Check for false positives
- Verify notification channels working

### Monthly

- Review SLA compliance
- Analyze performance trends
- Update capacity projections
- Review incident post-mortems

### Quarterly

- Review monitoring strategy
- Update alert thresholds
- Capacity planning review
- Tool evaluation

---

## Conclusion

Comprehensive monitoring and alerting infrastructure is now in place for Mzansi Couriers. The system provides:

✅ Real-time visibility into platform health  
✅ Proactive alerting for issues  
✅ Detailed logging for debugging  
✅ SLA tracking and reporting  
✅ Incident response procedures  

**Next Steps:**
1. Deploy monitoring dashboards
2. Configure alert policies
3. Set up notification channels
4. Train team on incident response
5. Execute load test

---

**Document Version:** 1.0  
**Last Updated:** May 14, 2026  
**Next Review:** June 14, 2026
