import { invokeLLM } from '../_core/llm';

/**
 * AI Courier Recruitment Bot
 * 
 * Uses LLM to identify, research, and recruit couriers
 * Generates personalized recruitment messages
 */

export interface CourierProspect {
  id: string;
  name: string;
  phone: string;
  email?: string;
  currentOccupation?: string;
  location: string;
  vehicleType?: string;
  yearsExperience?: number;
  sourceInfo?: string;
}

export interface RecruitmentMessage {
  prospectId: string;
  prospectName: string;
  message: string;
  subject?: string;
  channel: 'whatsapp' | 'email' | 'sms';
  personalizationScore: number; // 0-100
  estimatedResponseRate: number; // 0-100
  callToAction: string;
}

export interface RecruitmentCampaign {
  id: string;
  name: string;
  targetLocation: string;
  targetOccupation?: string;
  vehicleTypes: string[];
  messageCount: number;
  sentCount: number;
  responseCount: number;
  conversionCount: number;
  createdAt: number;
}

/**
 * Generate personalized recruitment message for a courier prospect
 */
export async function generateRecruitmentMessage(prospect: CourierProspect): Promise<RecruitmentMessage> {
  try {
    console.log(`[Recruitment Bot] Generating message for ${prospect.name}`);

    const prompt = `You are an expert recruiter for Mzansi Couriers, a South African peer-to-peer delivery platform.

Prospect Information:
- Name: ${prospect.name}
- Phone: ${prospect.phone}
- Current Occupation: ${prospect.currentOccupation || 'Unknown'}
- Location: ${prospect.location}
- Vehicle Type: ${prospect.vehicleType || 'Unknown'}
- Years Experience: ${prospect.yearsExperience || 'Unknown'}
- Source: ${prospect.sourceInfo || 'Unknown'}

Your task:
1. Create a personalized, compelling recruitment message
2. Highlight benefits relevant to their background
3. Include a clear call-to-action
4. Keep it concise and professional
5. Use South African English
6. Avoid generic templates

Benefits to highlight based on their profile:
- Flexible working hours
- Earn extra income with their vehicle
- Be your own boss
- Real-time earnings tracking
- Weekly payouts
- Growing courier network

Provide response in JSON format:
{
  "message": "Personalized WhatsApp message",
  "subject": "Email subject line",
  "personalizationScore": 85,
  "estimatedResponseRate": 42,
  "callToAction": "Tap here to join"
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert recruiter. Generate compelling, personalized recruitment messages. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'recruitment_message',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Personalized recruitment message',
              },
              subject: {
                type: 'string',
                description: 'Email subject line',
              },
              personalizationScore: {
                type: 'number',
                description: 'Personalization score 0-100',
              },
              estimatedResponseRate: {
                type: 'number',
                description: 'Estimated response rate 0-100',
              },
              callToAction: {
                type: 'string',
                description: 'Call-to-action text',
              },
            },
            required: ['message', 'personalizationScore', 'estimatedResponseRate', 'callToAction'],
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
      estimatedResponseRate: parsed.estimatedResponseRate,
      callToAction: parsed.callToAction,
    };
  } catch (error) {
    console.error('[Recruitment Bot] Error generating message:', error);
    throw error;
  }
}

/**
 * Identify courier prospects based on criteria
 */
export async function identifyProspects(criteria: {
  location: string;
  vehicleTypes?: string[];
  occupation?: string;
  minExperience?: number;
}): Promise<{
  prospects: CourierProspect[];
  searchStrategy: string;
  recommendedApproach: string;
}> {
  try {
    const prompt = `Suggest a strategy to identify courier prospects in ${criteria.location}.

Criteria:
- Location: ${criteria.location}
- Vehicle Types: ${criteria.vehicleTypes?.join(', ') || 'Any'}
- Current Occupation: ${criteria.occupation || 'Any'}
- Min Experience: ${criteria.minExperience || 'Any'}

Provide recommendations in JSON format:
{
  "searchStrategy": "Description of how to find prospects",
  "recommendedApproach": "Recommended outreach approach",
  "channels": ["WhatsApp", "Email", "SMS"],
  "estimatedProspectCount": 500,
  "conversionEstimate": 12
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert in identifying and recruiting couriers in South Africa.',
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
    const mockProspects: CourierProspect[] = [
      {
        id: 'PROSPECT-001',
        name: 'Thabo Mthembu',
        phone: '+27123456789',
        email: 'thabo@example.com',
        currentOccupation: 'Taxi driver',
        location: 'Johannesburg',
        vehicleType: 'car',
        yearsExperience: 5,
      },
      {
        id: 'PROSPECT-002',
        name: 'Naledi Khumalo',
        phone: '+27987654321',
        email: 'naledi@example.com',
        currentOccupation: 'Delivery driver',
        location: 'Johannesburg',
        vehicleType: 'van',
        yearsExperience: 3,
      },
    ];

    return {
      prospects: mockProspects,
      searchStrategy: parsed.searchStrategy,
      recommendedApproach: parsed.recommendedApproach,
    };
  } catch (error) {
    console.error('[Recruitment Bot] Error identifying prospects:', error);
    throw error;
  }
}

/**
 * Analyze recruitment campaign performance
 */
export async function analyzeCampaignPerformance(campaign: RecruitmentCampaign): Promise<{
  conversionRate: number;
  responseRate: number;
  efficiency: number;
  recommendations: string[];
}> {
  try {
    const responseRate = (campaign.responseCount / campaign.messageCount) * 100;
    const conversionRate = (campaign.conversionCount / campaign.messageCount) * 100;
    const efficiency = (conversionRate + responseRate) / 2;

    const recommendations: string[] = [];

    if (conversionRate > 15) {
      recommendations.push('Excellent conversion rate! Scale this campaign to more prospects.');
    } else if (conversionRate < 5) {
      recommendations.push('Low conversion rate. Consider refining the message or targeting different prospects.');
    }

    if (responseRate > 30) {
      recommendations.push('High response rate indicates strong message resonance. Maintain this approach.');
    }

    if (campaign.sentCount < 100) {
      recommendations.push('Send more messages to gather better data for optimization.');
    }

    return {
      conversionRate: Math.round(conversionRate * 100) / 100,
      responseRate: Math.round(responseRate * 100) / 100,
      efficiency: Math.round(efficiency * 100) / 100,
      recommendations,
    };
  } catch (error) {
    console.error('[Recruitment Bot] Error analyzing campaign:', error);
    throw error;
  }
}

/**
 * Suggest follow-up message for non-responders
 */
export async function generateFollowUpMessage(prospect: CourierProspect): Promise<{
  message: string;
  delay: number; // hours
  channel: string;
  urgencyLevel: string;
}> {
  try {
    const prompt = `Generate a follow-up recruitment message for a prospect who didn't respond.

Prospect: ${prospect.name}
Location: ${prospect.location}
Vehicle: ${prospect.vehicleType}

The follow-up should:
1. Be different from the initial message
2. Add new information or benefits
3. Create urgency without being pushy
4. Maintain professionalism

Provide response in JSON format:
{
  "message": "Follow-up message",
  "delay": 48,
  "channel": "whatsapp",
  "urgencyLevel": "medium"
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert recruiter. Generate effective follow-up messages.',
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

    return {
      message: parsed.message,
      delay: parsed.delay,
      channel: parsed.channel,
      urgencyLevel: parsed.urgencyLevel,
    };
  } catch (error) {
    console.error('[Recruitment Bot] Error generating follow-up:', error);
    throw error;
  }
}

export default {
  generateRecruitmentMessage,
  identifyProspects,
  analyzeCampaignPerformance,
  generateFollowUpMessage,
};
