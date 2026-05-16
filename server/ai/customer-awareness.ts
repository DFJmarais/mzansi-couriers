import { invokeLLM } from '../_core/llm';

/**
 * AI Customer Awareness Bot
 * 
 * Uses LLM to identify, research, and inform potential customers
 * Generates personalized awareness messages about the courier app
 */

export interface CustomerProspect {
  id: string;
  name: string;
  phone: string;
  email?: string;
  businessType?: string;
  location: string;
  businessSize?: 'small' | 'medium' | 'large';
  yearsInBusiness?: number;
  sourceInfo?: string;
}

export interface AwarenessMessage {
  prospectId: string;
  prospectName: string;
  message: string;
  subject?: string;
  channel: 'whatsapp' | 'email' | 'sms';
  personalizationScore: number; // 0-100
  estimatedEngagementRate: number; // 0-100
  callToAction: string;
  useCaseHighlight: string;
}

export interface AwarenessSegment {
  id: string;
  name: string;
  description: string;
  targetBusinessTypes: string[];
  targetLocation: string;
  estimatedSize: number;
  keyBenefits: string[];
}

/**
 * Generate personalized awareness message for a customer prospect
 */
export async function generateAwarenessMessage(prospect: CustomerProspect): Promise<AwarenessMessage> {
  try {
    console.log(`[Awareness Bot] Generating message for ${prospect.name}`);

    const prompt = `You are a marketing expert for Mzansi Couriers, a South African peer-to-peer delivery platform.

Prospect Information:
- Name: ${prospect.name}
- Phone: ${prospect.phone}
- Business Type: ${prospect.businessType || 'Unknown'}
- Location: ${prospect.location}
- Business Size: ${prospect.businessSize || 'Unknown'}
- Years in Business: ${prospect.yearsInBusiness || 'Unknown'}
- Source: ${prospect.sourceInfo || 'Unknown'}

Your task:
1. Create a personalized, compelling awareness message
2. Highlight benefits relevant to their business
3. Explain how Mzansi Couriers solves their delivery needs
4. Include a clear call-to-action
5. Keep it concise and professional
6. Use South African English

Key Benefits to highlight:
- Fast, reliable delivery across South Africa
- Transparent pricing with no hidden fees
- Real-time tracking for all shipments
- Flexible delivery scheduling
- Support for businesses of all sizes
- Easy integration with existing systems

Provide response in JSON format:
{
  "message": "Personalized WhatsApp message",
  "subject": "Email subject line",
  "personalizationScore": 85,
  "estimatedEngagementRate": 38,
  "callToAction": "Learn more",
  "useCaseHighlight": "E-commerce fulfillment"
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a marketing expert. Generate compelling, personalized awareness messages. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'awareness_message',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Personalized awareness message',
              },
              subject: {
                type: 'string',
                description: 'Email subject line',
              },
              personalizationScore: {
                type: 'number',
                description: 'Personalization score 0-100',
              },
              estimatedEngagementRate: {
                type: 'number',
                description: 'Estimated engagement rate 0-100',
              },
              callToAction: {
                type: 'string',
                description: 'Call-to-action text',
              },
              useCaseHighlight: {
                type: 'string',
                description: 'Key use case for their business',
              },
            },
            required: ['message', 'personalizationScore', 'estimatedEngagementRate', 'callToAction', 'useCaseHighlight'],
            additionalProperties: false,
          },
        },
      },
    } as any);

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('No response from LLM');
    }

    const parsed = JSON.parse(content);

    return {
      prospectId: prospect.id,
      prospectName: prospect.name,
      message: parsed.message,
      subject: parsed.subject,
      channel: 'whatsapp',
      personalizationScore: parsed.personalizationScore,
      estimatedEngagementRate: parsed.estimatedEngagementRate,
      callToAction: parsed.callToAction,
      useCaseHighlight: parsed.useCaseHighlight,
    };
  } catch (error) {
    console.error('[Awareness Bot] Error generating message:', error);
    throw error;
  }
}

/**
 * Identify customer prospects based on criteria
 */
export async function identifyProspects(criteria: {
  location: string;
  businessTypes?: string[];
  businessSize?: string;
}): Promise<{
  prospects: CustomerProspect[];
  segmentStrategy: string;
  recommendedApproach: string;
  estimatedProspects: number;
}> {
  try {
    const prompt = `Suggest a strategy to identify customer prospects for Mzansi Couriers in ${criteria.location}.

Criteria:
- Location: ${criteria.location}
- Business Types: ${criteria.businessTypes?.join(', ') || 'All'}
- Business Size: ${criteria.businessSize || 'All'}

Consider:
1. E-commerce businesses needing fulfillment
2. Retail stores needing delivery services
3. Restaurants and food delivery
4. Corporate offices needing logistics
5. SMEs with distribution needs

Provide recommendations in JSON format:
{
  "segmentStrategy": "How to segment the market",
  "recommendedApproach": "Best outreach strategy",
  "channels": ["WhatsApp", "Email", "LinkedIn"],
  "estimatedProspectCount": 1500,
  "engagementEstimate": 18
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert in B2B marketing and customer acquisition for logistics services.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('No response from LLM');
    }

    const parsed = JSON.parse(content);

    // Mock prospects for demonstration
    const mockProspects: CustomerProspect[] = [
      {
        id: 'CUST-PROSPECT-001',
        name: 'Sipho\'s Online Store',
        phone: '+27123456789',
        email: 'sipho@onlinestore.co.za',
        businessType: 'E-commerce',
        location: 'Johannesburg',
        businessSize: 'small',
        yearsInBusiness: 2,
      },
      {
        id: 'CUST-PROSPECT-002',
        name: 'Durban Fresh Produce',
        phone: '+27987654321',
        email: 'info@durbanfresh.co.za',
        businessType: 'Food Distribution',
        location: 'Durban',
        businessSize: 'medium',
        yearsInBusiness: 5,
      },
    ];

    return {
      prospects: mockProspects,
      segmentStrategy: parsed.segmentStrategy,
      recommendedApproach: parsed.recommendedApproach,
      estimatedProspects: parsed.estimatedProspectCount,
    };
  } catch (error) {
    console.error('[Awareness Bot] Error identifying prospects:', error);
    throw error;
  }
}

/**
 * Create customer awareness segments
 */
export async function createAwarenessSegments(): Promise<AwarenessSegment[]> {
  try {
    return [
      {
        id: 'SEGMENT-001',
        name: 'E-commerce Businesses',
        description: 'Online retailers needing fulfillment and delivery',
        targetBusinessTypes: ['E-commerce', 'Online Retail'],
        targetLocation: 'All South Africa',
        estimatedSize: 2500,
        keyBenefits: ['Fast fulfillment', 'Real-time tracking', 'Scalable delivery'],
      },
      {
        id: 'SEGMENT-002',
        name: 'Food & Beverage',
        description: 'Restaurants and food businesses',
        targetBusinessTypes: ['Restaurant', 'Catering', 'Food Delivery'],
        targetLocation: 'All South Africa',
        estimatedSize: 3000,
        keyBenefits: ['Temperature-controlled delivery', 'Quick turnaround', 'Reliable service'],
      },
      {
        id: 'SEGMENT-003',
        name: 'Corporate & B2B',
        description: 'Businesses with B2B logistics needs',
        targetBusinessTypes: ['Manufacturing', 'Wholesale', 'Distribution'],
        targetLocation: 'All South Africa',
        estimatedSize: 1500,
        keyBenefits: ['Bulk delivery', 'Cost-effective', 'Professional service'],
      },
      {
        id: 'SEGMENT-004',
        name: 'SMEs & Startups',
        description: 'Small and medium enterprises',
        targetBusinessTypes: ['SME', 'Startup', 'Freelancer'],
        targetLocation: 'All South Africa',
        estimatedSize: 4000,
        keyBenefits: ['Affordable rates', 'Flexible scheduling', 'Easy to use'],
      },
    ];
  } catch (error) {
    console.error('[Awareness Bot] Error creating segments:', error);
    throw error;
  }
}

/**
 * Analyze awareness campaign performance
 */
export async function analyzeCampaignPerformance(campaign: {
  name: string;
  messagesSent: number;
  messagesOpened: number;
  clicksReceived: number;
  conversions: number;
}): Promise<{
  openRate: number;
  clickRate: number;
  conversionRate: number;
  recommendations: string[];
}> {
  try {
    const openRate = (campaign.messagesOpened / campaign.messagesSent) * 100;
    const clickRate = (campaign.clicksReceived / campaign.messagesSent) * 100;
    const conversionRate = (campaign.conversions / campaign.messagesSent) * 100;

    const recommendations: string[] = [];

    if (openRate > 25) {
      recommendations.push('Excellent open rate! Your messaging resonates well.');
    } else if (openRate < 10) {
      recommendations.push('Low open rate. Consider improving subject lines or timing.');
    }

    if (clickRate > 5) {
      recommendations.push('Strong click-through rate. Scale this campaign.');
    }

    if (conversionRate > 2) {
      recommendations.push('Great conversion rate! This segment is highly responsive.');
    } else if (conversionRate < 0.5) {
      recommendations.push('Low conversion. Refine messaging or targeting.');
    }

    return {
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      recommendations,
    };
  } catch (error) {
    console.error('[Awareness Bot] Error analyzing campaign:', error);
    throw error;
  }
}

export default {
  generateAwarenessMessage,
  identifyProspects,
  createAwarenessSegments,
  analyzeCampaignPerformance,
};
