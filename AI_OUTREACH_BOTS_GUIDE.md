# AI Outreach Bots Guide - Mzansi Couriers

## Overview

Mzansi Couriers now includes two powerful AI-driven outreach bots that automate recruitment and customer acquisition:

1. **Courier Recruitment Bot** - Find and recruit delivery partners
2. **Customer Awareness Bot** - Inform businesses about your delivery service

These bots use advanced LLM technology to generate personalized, compelling messages that drive conversions.

---

## 1. Courier Recruitment Bot

### What It Does

The Recruitment Bot identifies potential couriers and generates personalized recruitment messages to encourage them to join your platform.

**Key Capabilities:**
- 🔍 **Prospect Identification** - Find drivers, taxi operators, and delivery professionals
- ✍️ **Message Generation** - Create personalized recruitment pitches
- 📊 **Performance Analysis** - Track conversion rates and ROI
- 📧 **Multi-channel Outreach** - WhatsApp, Email, SMS
- 🔄 **Follow-up Management** - Automated follow-up messages

### Benefits

✅ **Automated Recruitment** - Scale courier acquisition without manual effort  
✅ **Personalized Messaging** - Higher response rates (25-40%)  
✅ **Cost-Effective** - Lower cost per acquisition than traditional methods  
✅ **Data-Driven** - Analytics to optimize campaigns  
✅ **24/7 Operation** - Continuous recruitment  

### How It Works

**Step 1: Identify Prospects**

The bot analyzes your target location and identifies potential couriers:

```typescript
const prospects = await trpc.outreach.identifyRecruitmentProspects.mutate({
  location: 'Johannesburg',
  vehicleTypes: ['car', 'van', 'motorbike'],
  occupation: 'Taxi driver',
  minExperience: 2,
});

// Returns:
// {
//   prospects: [
//     {
//       id: 'PROSPECT-001',
//       name: 'Thabo Mthembu',
//       phone: '+27123456789',
//       currentOccupation: 'Taxi driver',
//       location: 'Johannesburg',
//       vehicleType: 'car',
//       yearsExperience: 5
//     },
//     ...
//   ],
//   searchStrategy: "Target experienced taxi drivers and delivery professionals",
//   recommendedApproach: "WhatsApp outreach with emphasis on flexibility"
// }
```

**Step 2: Generate Personalized Messages**

For each prospect, the bot creates a tailored recruitment message:

```typescript
const message = await trpc.outreach.generateRecruitmentMessage.mutate({
  prospectId: 'PROSPECT-001',
  prospectName: 'Thabo Mthembu',
  phone: '+27123456789',
  currentOccupation: 'Taxi driver',
  location: 'Johannesburg',
  vehicleType: 'car',
  yearsExperience: 5,
});

// Returns:
// {
//   prospectId: 'PROSPECT-001',
//   prospectName: 'Thabo Mthembu',
//   message: "Hi Thabo! 👋 As an experienced taxi driver, you could earn R500-1000 extra per week with Mzansi Couriers. Flexible hours, keep your vehicle, instant payouts. Join 2000+ couriers earning extra income. Tap here: [link]",
//   subject: "Earn R500-1000/week with Mzansi Couriers",
//   channel: 'whatsapp',
//   personalizationScore: 92,
//   estimatedResponseRate: 38,
//   callToAction: "Join now"
// }
```

**Step 3: Send & Track**

Messages are sent via WhatsApp/Email and tracked for responses and conversions.

**Step 4: Follow-up**

For non-responders, the bot generates follow-up messages:

```typescript
const followUp = await trpc.outreach.generateRecruitmentFollowUp.mutate({
  prospectId: 'PROSPECT-001',
  prospectName: 'Thabo Mthembu',
  location: 'Johannesburg',
  vehicleType: 'car',
});

// Returns:
// {
//   message: "Thabo, just checking in! 🚗 This week we have high demand in Johannesburg - couriers are earning 40% more. Limited spots available. Interested? [link]",
//   delay: 48,
//   channel: 'whatsapp',
//   urgencyLevel: 'medium'
// }
```

### Campaign Performance

**Example Campaign Results:**

```
Campaign: Johannesburg Courier Recruitment
├─ Target: 500 prospects
├─ Sent: 350 messages
├─ Responses: 89 (25.4% response rate)
├─ Conversions: 28 (8% conversion rate)
├─ Cost per Acquisition: R45
└─ ROI: 320%
```

### Best Practices

1. **Target Specific Occupations** - Taxi drivers, delivery drivers, logistics professionals
2. **Highlight Flexibility** - Emphasize "work your own hours"
3. **Show Earnings** - Include realistic income potential
4. **Use Local Language** - South African English, relevant slang
5. **Create Urgency** - "Limited spots", "High demand this week"
6. **Follow Up** - 2-3 follow-ups significantly increase conversion
7. **Test Messages** - A/B test different approaches

---

## 2. Customer Awareness Bot

### What It Does

The Awareness Bot identifies potential business customers and generates personalized messages to inform them about your delivery service.

**Key Capabilities:**
- 🎯 **Prospect Identification** - Find e-commerce, retail, F&B, and corporate businesses
- 📝 **Message Generation** - Create compelling service awareness pitches
- 📊 **Segment Analysis** - Target specific business types
- 💼 **B2B Outreach** - Professional messaging for businesses
- 📈 **Campaign Analytics** - Track engagement and conversions

### Benefits

✅ **Automated Customer Acquisition** - Scale without sales team  
✅ **Targeted Messaging** - Higher engagement rates (13-25%)  
✅ **Business-Focused** - Speaks to business needs  
✅ **Multi-segment** - Different messages for different business types  
✅ **Cost-Effective** - Lower CAC than traditional marketing  

### How It Works

**Step 1: Identify Segments**

The bot creates customer segments based on business type:

```typescript
const segments = await trpc.outreach.getAwarenessSegments.query();

// Returns:
// [
//   {
//     id: 'SEGMENT-001',
//     name: 'E-commerce Businesses',
//     description: 'Online retailers needing fulfillment',
//     targetBusinessTypes: ['E-commerce', 'Online Retail'],
//     targetLocation: 'All South Africa',
//     estimatedSize: 2500,
//     keyBenefits: ['Fast fulfillment', 'Real-time tracking', 'Scalable']
//   },
//   {
//     id: 'SEGMENT-002',
//     name: 'Food & Beverage',
//     description: 'Restaurants and food businesses',
//     targetBusinessTypes: ['Restaurant', 'Catering'],
//     targetLocation: 'All South Africa',
//     estimatedSize: 3000,
//     keyBenefits: ['Temperature control', 'Quick turnaround', 'Reliable']
//   },
//   ...
// ]
```

**Step 2: Identify Prospects**

Find businesses matching the target segment:

```typescript
const prospects = await trpc.outreach.identifyAwarenessProspects.mutate({
  location: 'Johannesburg',
  businessTypes: ['E-commerce', 'Online Retail'],
  businessSize: 'small',
});

// Returns:
// {
//   prospects: [
//     {
//       id: 'CUST-PROSPECT-001',
//       name: 'Sipho\'s Online Store',
//       phone: '+27123456789',
//       businessType: 'E-commerce',
//       location: 'Johannesburg',
//       businessSize: 'small',
//       yearsInBusiness: 2
//     },
//     ...
//   ],
//   segmentStrategy: "Target growing e-commerce businesses",
//   recommendedApproach: "Emphasize fulfillment speed and scalability"
// }
```

**Step 3: Generate Personalized Messages**

Create tailored awareness messages for each prospect:

```typescript
const message = await trpc.outreach.generateAwarenessMessage.mutate({
  prospectId: 'CUST-PROSPECT-001',
  prospectName: 'Sipho\'s Online Store',
  phone: '+27123456789',
  businessType: 'E-commerce',
  location: 'Johannesburg',
  businessSize: 'small',
  yearsInBusiness: 2,
});

// Returns:
// {
//   prospectId: 'CUST-PROSPECT-001',
//   prospectName: 'Sipho\'s Online Store',
//   message: "Hi Sipho! 👋 Struggling with fulfillment? Mzansi Couriers delivers to 95% of South Africa in 24-48 hours. Our e-commerce partners save 30% on shipping. Real-time tracking, transparent pricing. Let's grow together! [link]",
//   subject: "Scale Your E-commerce with Mzansi Couriers",
//   channel: 'whatsapp',
//   personalizationScore: 88,
//   estimatedEngagementRate: 32,
//   callToAction: "Get a quote",
//   useCaseHighlight: "E-commerce fulfillment"
// }
```

**Step 4: Campaign Analytics**

Track campaign performance:

```typescript
const analysis = await trpc.outreach.analyzeAwarenessCampaign.mutate({
  campaignName: 'E-commerce Awareness Campaign',
  messagesSent: 1200,
  messagesOpened: 156,
  clicksReceived: 45,
  conversions: 18,
});

// Returns:
// {
//   openRate: 13.0,
//   clickRate: 3.75,
//   conversionRate: 1.5,
//   recommendations: [
//     "Strong click-through rate. Scale this campaign.",
//     "Great conversion rate! This segment is highly responsive."
//   ]
// }
```

### Business Segments

| Segment | Size | Key Benefits | Approach |
|---------|------|-------------|----------|
| E-commerce | 2,500 | Fast fulfillment, Scalability, Tracking | Speed & reliability |
| Food & Beverage | 3,000 | Temperature control, Quick delivery | Quality & freshness |
| Corporate/B2B | 1,500 | Bulk delivery, Cost-effective | Professional service |
| SMEs & Startups | 4,000 | Affordable, Flexible, Easy to use | Simplicity & support |

### Campaign Performance

**Example Campaign Results:**

```
Campaign: E-commerce Awareness
├─ Target: 1,200 prospects
├─ Sent: 1,200 messages
├─ Opened: 156 (13% open rate)
├─ Clicked: 45 (3.75% click rate)
├─ Conversions: 18 (1.5% conversion rate)
├─ Cost per Acquisition: R280
└─ ROI: 280%
```

### Best Practices

1. **Segment by Business Type** - Different messages for different industries
2. **Highlight Specific Benefits** - E-commerce = speed, F&B = quality
3. **Show ROI** - "Save 30% on shipping costs"
4. **Include Social Proof** - "Join 500+ businesses"
5. **Clear CTA** - "Get a quote", "Schedule demo", "Learn more"
6. **Professional Tone** - Business-appropriate language
7. **Test Segments** - Identify highest-converting segments

---

## Integration with BullMQ Automation

Both outreach bots integrate with BullMQ for automated campaign execution:

### Recruitment Workflow

```
Admin Creates Campaign
    ↓
Queue: recruitment-outreach
    ↓
Worker: Identify prospects
    ↓
Worker: Generate messages
    ↓
Send via WhatsApp/Email
    ↓
Track responses
    ↓
Generate follow-ups for non-responders
    ↓
Update campaign analytics
```

### Awareness Workflow

```
Admin Creates Campaign
    ↓
Queue: awareness-outreach
    ↓
Worker: Identify prospects
    ↓
Worker: Generate messages
    ↓
Send via WhatsApp/Email
    ↓
Track engagement
    ↓
Update campaign analytics
```

---

## Admin Dashboard

### Outreach Campaigns Dashboard

**Location:** Admin Dashboard → Outreach Campaigns

**Features:**
- Campaign creation and management
- Real-time performance tracking
- Prospect management
- Message preview and editing
- Campaign pause/resume
- Analytics and ROI tracking

**Key Metrics:**
- Response rate
- Conversion rate
- Cost per acquisition
- ROI
- Engagement rate

---

## API Reference

### Recruitment Bot

**Generate Message:**
```typescript
trpc.outreach.generateRecruitmentMessage.mutate({
  prospectId: string;
  prospectName: string;
  phone: string;
  email?: string;
  currentOccupation?: string;
  location: string;
  vehicleType?: string;
  yearsExperience?: number;
})
```

**Identify Prospects:**
```typescript
trpc.outreach.identifyRecruitmentProspects.mutate({
  location: string;
  vehicleTypes?: string[];
  occupation?: string;
  minExperience?: number;
})
```

**Analyze Campaign:**
```typescript
trpc.outreach.analyzeRecruitmentCampaign.mutate({
  campaignId: string;
  campaignName: string;
  messageCount: number;
  responseCount: number;
  conversionCount: number;
})
```

**Generate Follow-up:**
```typescript
trpc.outreach.generateRecruitmentFollowUp.mutate({
  prospectId: string;
  prospectName: string;
  location: string;
  vehicleType?: string;
})
```

### Awareness Bot

**Generate Message:**
```typescript
trpc.outreach.generateAwarenessMessage.mutate({
  prospectId: string;
  prospectName: string;
  phone: string;
  email?: string;
  businessType?: string;
  location: string;
  businessSize?: 'small' | 'medium' | 'large';
  yearsInBusiness?: number;
})
```

**Identify Prospects:**
```typescript
trpc.outreach.identifyAwarenessProspects.mutate({
  location: string;
  businessTypes?: string[];
  businessSize?: string;
})
```

**Get Segments:**
```typescript
trpc.outreach.getAwarenessSegments.query()
```

**Analyze Campaign:**
```typescript
trpc.outreach.analyzeAwarenessCampaign.mutate({
  campaignName: string;
  messagesSent: number;
  messagesOpened: number;
  clicksReceived: number;
  conversions: number;
})
```

---

## Performance Targets

### Recruitment Bot

- **Response Rate:** 25-40%
- **Conversion Rate:** 5-15%
- **Cost per Acquisition:** R30-100
- **ROI:** 200-400%

### Awareness Bot

- **Open Rate:** 10-20%
- **Click Rate:** 2-5%
- **Conversion Rate:** 0.5-2%
- **Cost per Acquisition:** R200-500
- **ROI:** 150-300%

---

## Troubleshooting

### Low Response Rates

**Problem:** Recruitment messages getting low response  
**Solutions:**
- Test different messaging approaches
- Target more specific occupations
- Increase follow-up frequency
- Highlight higher earnings

### Low Conversion Rates

**Problem:** Prospects responding but not converting  
**Solutions:**
- Simplify onboarding process
- Provide clearer earnings examples
- Add social proof (testimonials)
- Offer incentive for first delivery

### Low Engagement on Awareness

**Problem:** Businesses not opening messages  
**Solutions:**
- Improve subject lines
- Test different send times
- Segment more precisely
- Personalize more

---

## Future Enhancements

### Planned Features

1. **AI Lead Scoring** - Predict which prospects are most likely to convert
2. **Dynamic Pricing** - AI-powered pricing for different segments
3. **Multilingual Support** - Messages in Zulu, Xhosa, Afrikaans
4. **Advanced Analytics** - Cohort analysis, lifetime value prediction
5. **A/B Testing** - Automatic message optimization
6. **Integration with CRM** - Sync with external systems

### Roadmap

- **Q3 2026:** Lead scoring
- **Q4 2026:** Multilingual support
- **Q1 2027:** Advanced analytics
- **Q2 2027:** CRM integration

---

## Support & Documentation

For detailed implementation, see:
- Recruitment Bot: `server/ai/courier-recruitment.ts`
- Awareness Bot: `server/ai/customer-awareness.ts`
- tRPC Router: `server/ai/outreach-router.ts`
- Dashboard: `client/src/pages/OutreachCampaigns.tsx`

---

**Last Updated:** May 16, 2026  
**Version:** 1.0  
**Status:** Production Ready
