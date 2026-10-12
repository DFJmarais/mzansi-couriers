# Incident Response Tabletop Test Plan
## Mzansi Couriers - Security Exercise

**Document Version**: 1.0  
**Last Updated**: July 20, 2026  
**Classification**: Internal - Security  
**Facilitated By**: Rick Marais (PR Manager & Data Protection Officer)

---

## EXECUTIVE SUMMARY

This document outlines a tabletop exercise designed to test and validate the incident response procedures for Mzansi Couriers. The exercise simulates a data security incident and evaluates the team's ability to detect, respond, and recover from security breaches.

**Objectives:**
- Test incident detection capabilities
- Validate communication protocols
- Assess response time and effectiveness
- Identify gaps in procedures
- Train team members on incident response
- Document lessons learned

---

## SCENARIO OVERVIEW

### Incident Type: Data Breach - Unauthorized API Access

**Scenario Description:**
On a Tuesday morning at 09:15 AM, the security monitoring system detects unusual API activity. Multiple payment-related endpoints are being accessed from an unknown IP address (192.168.x.x) with valid API credentials. The attacker has successfully accessed:
- 150 courier payment records
- 45 customer delivery addresses
- 12 payment transaction details

**Discovery Method:** Automated monitoring alert triggered by:
- Unusual geographic location (Nigeria)
- High volume of API calls (500+ requests in 10 minutes)
- Access to sensitive endpoints outside normal patterns
- Multiple failed authentication attempts followed by success

**Severity Level**: HIGH (Potential data exposure affecting 207 records)

---

## TABLETOP EXERCISE STRUCTURE

### Duration: 2 hours
### Participants Required: 8-10 people
### Roles:
1. **Incident Commander** - Leads response (Rick Marais)
2. **Security Lead** - Investigates technical aspects
3. **Communications Lead** - Manages internal/external communications
4. **Legal/Compliance Lead** - Handles regulatory requirements
5. **Operations Lead** - Manages system recovery
6. **Customer Support Lead** - Manages user communications
7. **Finance Lead** - Tracks incident costs
8. **Executive Sponsor** - Senior management oversight
9. **Observers** - Document lessons learned

---

## PHASE 1: DETECTION & INITIAL RESPONSE (0-15 minutes)

### Timeline of Events

**09:15 AM** - Security Alert Triggered
- Monitoring system detects anomalous API activity
- Alert sent to on-call security team
- Incident ticket auto-created in system

**09:18 AM** - Initial Triage
- Security Lead acknowledges alert
- Confirms alert is not a false positive
- Escalates to Incident Commander

**09:20 AM** - Incident Commander Activated
- Declares Incident Response Plan activated
- Convenes incident response team
- Establishes war room (virtual/physical)

### Exercise Questions for Phase 1

1. **Detection**: How long does it take to detect the anomalous activity?
   - Expected: < 5 minutes
   - Actual: _____ minutes
   - Gap Analysis: _____

2. **Escalation**: Is the escalation path clear and followed?
   - Who was notified?
   - How were they notified?
   - Response time from each person?

3. **Initial Assessment**: Can the team quickly determine:
   - What data was accessed?
   - How many records were affected?
   - What is the potential impact?

### Evaluation Criteria
- [ ] Alert received within 5 minutes of incident
- [ ] Incident Commander engaged within 10 minutes
- [ ] Initial assessment completed within 15 minutes
- [ ] All team members present and briefed

---

## PHASE 2: INVESTIGATION & CONTAINMENT (15-45 minutes)

### Investigation Steps

**Step 1: Identify the Breach (0-10 minutes)**
- Determine the source of the unauthorized access
- Identify the compromised API credentials
- Trace the attacker's IP address
- Determine entry point and attack vector

**Step 2: Scope the Damage (10-20 minutes)**
- Query logs to identify all accessed data
- Determine timeline of unauthorized access
- Identify all affected users/records
- Assess data sensitivity and risk level

**Step 3: Contain the Breach (20-30 minutes)**
- Revoke compromised API credentials
- Block attacker IP address
- Implement additional access controls
- Rotate encryption keys if necessary
- Isolate affected systems if needed

### Exercise Questions for Phase 2

1. **Log Analysis**: Can the team quickly access and analyze logs?
   - Are logs being retained for 90 days minimum?
   - Can logs be searched by IP, user, endpoint, time range?
   - How long to identify all affected records?

2. **Containment**: Can the team quickly stop the attack?
   - Time to revoke credentials: _____ minutes
   - Time to block IP: _____ minutes
   - Time to implement additional controls: _____ minutes

3. **Communication**: Is internal communication happening?
   - Who is being kept informed?
   - What information is being shared?
   - Are there communication gaps?

### Containment Checklist
- [ ] Compromised credentials identified and revoked
- [ ] Attacker IP blocked at firewall/WAF
- [ ] Additional access controls implemented
- [ ] Affected systems isolated if necessary
- [ ] Backup systems verified as clean
- [ ] Encryption keys rotated (if applicable)

---

## PHASE 3: NOTIFICATION & COMPLIANCE (45-75 minutes)

### Regulatory Requirements

**POPIA (Protection of Personal Information Act)**
- Notify Information Regulator within 30 days
- Notify affected individuals without unreasonable delay
- Document the breach and response measures
- Assess if breach meets notification threshold

**Consumer Protection Act**
- Assess impact on consumer rights
- Prepare consumer communication
- Establish support channels for affected users

### Notification Process

**Step 1: Internal Notification (5 minutes)**
- Notify executive leadership
- Notify board members (if applicable)
- Notify insurance provider
- Notify legal counsel

**Step 2: Regulatory Notification (within 24 hours)**
- Prepare breach notification for Information Regulator
- Include: nature of breach, data affected, measures taken
- Submit via official channels

**Step 3: User Notification (within 48 hours)**
- Prepare user communication
- Include: what happened, what data was affected, what to do
- Send via email + in-app notification
- Provide credit monitoring/support (if applicable)

### Exercise Questions for Phase 3

1. **Notification Timing**: Can the team meet regulatory deadlines?
   - Time to draft internal notification: _____ minutes
   - Time to draft regulatory notification: _____ minutes
   - Time to draft user notification: _____ minutes

2. **Communication Content**: Is the messaging appropriate?
   - Is it clear and understandable?
   - Does it take responsibility?
   - Does it provide actionable guidance?
   - Does it avoid legal liability?

3. **Multi-Channel Communication**: Are all channels being used?
   - Email notifications sent?
   - In-app notifications sent?
   - SMS notifications sent?
   - Social media updates posted?
   - Press release prepared?

### Notification Checklist
- [ ] Executive leadership notified
- [ ] Legal counsel engaged
- [ ] Insurance provider notified
- [ ] Information Regulator notification prepared
- [ ] User notification prepared and approved
- [ ] Support team briefed on expected inquiries
- [ ] FAQ document prepared

---

## PHASE 4: RECOVERY & REMEDIATION (75-105 minutes)

### Recovery Steps

**Step 1: System Recovery (0-15 minutes)**
- Verify all systems are functioning normally
- Confirm no backdoors remain in systems
- Verify data integrity
- Restore from clean backups if necessary

**Step 2: Security Hardening (15-30 minutes)**
- Implement additional security controls
- Update firewall rules
- Enhance monitoring and alerting
- Review and update access controls

**Step 3: Affected User Support (30-45 minutes)**
- Establish support hotline for affected users
- Prepare FAQ document
- Brief customer support team
- Monitor social media for user concerns

### Exercise Questions for Phase 4

1. **Recovery Time**: How long to restore full functionality?
   - Time to verify system integrity: _____ minutes
   - Time to restore from backup (if needed): _____ minutes
   - Time to implement security hardening: _____ minutes

2. **User Support**: Is support infrastructure ready?
   - Support hotline staffed?
   - FAQ document prepared?
   - Support team trained?
   - Response time targets set?

3. **Root Cause Analysis**: Is the team investigating the root cause?
   - How were credentials compromised?
   - What was the attack vector?
   - How can this be prevented in future?

### Recovery Checklist
- [ ] All systems verified as operational
- [ ] Data integrity confirmed
- [ ] No backdoors or persistence mechanisms found
- [ ] Security hardening measures implemented
- [ ] Affected users provided with support
- [ ] Root cause analysis initiated
- [ ] Lessons learned documented

---

## PHASE 5: POST-INCIDENT REVIEW (105-120 minutes)

### Lessons Learned Discussion

**What Went Well?**
- Positive aspects of the response
- Team members who performed exceptionally
- Procedures that worked as designed

**What Could Be Improved?**
- Gaps in procedures
- Communication breakdowns
- Technical limitations
- Training needs

**Action Items**
- Specific improvements to implement
- Owner for each action item
- Timeline for completion
- Success metrics

### Exercise Questions for Phase 5

1. **Timing**: Were response times acceptable?
   - Detection to containment: _____ minutes (Target: < 30 min)
   - Containment to user notification: _____ hours (Target: < 48 hours)
   - Overall incident resolution: _____ hours (Target: < 72 hours)

2. **Communication**: Was communication effective?
   - Were all stakeholders informed?
   - Was information accurate and timely?
   - Were there any communication gaps?

3. **Procedures**: Did procedures work as documented?
   - Were procedures clear and accessible?
   - Did team members know their roles?
   - Were there any procedure gaps?

### Post-Incident Checklist
- [ ] All team members debriefed
- [ ] Lessons learned documented
- [ ] Root cause analysis completed
- [ ] Preventive measures identified
- [ ] Procedures updated
- [ ] Training needs identified
- [ ] Follow-up tabletop scheduled

---

## EVALUATION METRICS

### Response Effectiveness

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Detection Time | < 5 min | _____ | ☐ Pass ☐ Fail |
| Escalation Time | < 10 min | _____ | ☐ Pass ☐ Fail |
| Containment Time | < 30 min | _____ | ☐ Pass ☐ Fail |
| User Notification | < 48 hrs | _____ | ☐ Pass ☐ Fail |
| Regulator Notification | < 30 days | _____ | ☐ Pass ☐ Fail |
| Full Recovery | < 72 hrs | _____ | ☐ Pass ☐ Fail |

### Team Performance

| Aspect | Rating | Comments |
|--------|--------|----------|
| Incident Commander Leadership | 1-5 | _____ |
| Security Team Technical Response | 1-5 | _____ |
| Communications Effectiveness | 1-5 | _____ |
| Compliance/Legal Handling | 1-5 | _____ |
| Customer Support Readiness | 1-5 | _____ |
| Overall Team Coordination | 1-5 | _____ |

---

## IMPROVEMENT PLAN

### Identified Gaps

| Gap | Priority | Owner | Timeline |
|-----|----------|-------|----------|
| _____ | High/Med/Low | _____ | _____ |
| _____ | High/Med/Low | _____ | _____ |
| _____ | High/Med/Low | _____ | _____ |

### Action Items

1. **Action**: _____
   - Owner: _____
   - Timeline: _____
   - Success Metric: _____

2. **Action**: _____
   - Owner: _____
   - Timeline: _____
   - Success Metric: _____

---

## APPENDICES

### Appendix A: Contact List
- Incident Commander: Rick Marais (dfjmarais89@icloud.com)
- Security Lead: [Name] ([Email])
- Communications Lead: [Name] ([Email])
- Legal/Compliance Lead: [Name] ([Email])
- Operations Lead: [Name] ([Email])
- Executive Sponsor: [Name] ([Email])

### Appendix B: Key Procedures
- Incident Response Plan: [Link]
- Data Breach Notification Policy: [Link]
- Communication Templates: [Link]
- Escalation Procedures: [Link]

### Appendix C: Tools & Resources
- Incident Management System: [Link]
- Log Analysis Tools: [Link]
- Communication Platforms: [Link]
- Documentation Templates: [Link]

---

## SIGN-OFF

**Facilitated By**: Rick Marais (PR Manager & Data Protection Officer)  
**Date**: July 20, 2026  
**Next Tabletop Exercise**: July 20, 2027 (Annual)

**Participants**:
- _____ (Signed)
- _____ (Signed)
- _____ (Signed)
- _____ (Signed)
- _____ (Signed)

---

## DOCUMENT HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | July 20, 2026 | Rick Marais | Initial version - Tabletop test plan created |

---

**Confidentiality Notice**: This document contains sensitive security information and should be treated as confidential. Distribution should be limited to authorized personnel only.
