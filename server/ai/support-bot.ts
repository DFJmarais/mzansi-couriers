import { invokeLLM } from '../_core/llm';

/**
 * Intelligent Customer Support Bot
 * 
 * Uses LLM to automatically respond to support tickets
 * Handles common issues and escalates complex ones to humans
 */

export interface SupportTicket {
  id: string;
  customerId: string;
  subject: string;
  description: string;
  category: 'payment' | 'delivery' | 'courier' | 'app' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: number;
  relatedDeliveryId?: string;
}

export interface BotResponse {
  ticketId: string;
  response: string;
  shouldEscalate: boolean;
  escalationReason?: string;
  confidence: number; // 0-100, how confident is the bot in this response
  suggestedCategory?: string;
  suggestedResolution?: string;
}

/**
 * Generate AI response to a support ticket
 */
export async function generateSupportResponse(ticket: SupportTicket): Promise<BotResponse> {
  try {
    console.log(`[Support Bot] Analyzing ticket ${ticket.id}`);

    const prompt = `You are a helpful customer support agent for Mzansi Couriers, a South African peer-to-peer delivery platform.

Support Ticket:
- ID: ${ticket.id}
- Category: ${ticket.category}
- Priority: ${ticket.priority}
- Subject: ${ticket.subject}
- Description: ${ticket.description}
${ticket.relatedDeliveryId ? `- Related Delivery: ${ticket.relatedDeliveryId}` : ''}

Your task:
1. Understand the customer's issue
2. Provide a helpful, empathetic response
3. If you can resolve it, provide clear steps
4. If it requires human intervention, explain why
5. Always be professional and use South African English

Common issues you can handle:
- Tracking: "Where is my delivery?" → Provide tracking info
- Pricing: "Why was I charged this?" → Explain pricing
- Delays: "My delivery is late" → Offer compensation or reschedule
- Payment: "Payment failed" → Suggest troubleshooting steps
- Ratings: "I want to dispute a rating" → Explain process
- Refunds: "I want a refund" → Explain refund policy

Provide your response in JSON format:
{
  "response": "Your helpful response to the customer",
  "shouldEscalate": false,
  "escalationReason": null,
  "confidence": 85,
  "suggestedCategory": "delivery",
  "suggestedResolution": "Offer R50 credit for inconvenience"
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful customer support agent for Mzansi Couriers. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'support_response',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              response: {
                type: 'string',
                description: 'The support response to send to the customer',
              },
              shouldEscalate: {
                type: 'boolean',
                description: 'Whether this ticket should be escalated to a human',
              },
              escalationReason: {
                type: ['string', 'null'],
                description: 'Reason for escalation if applicable',
              },
              confidence: {
                type: 'number',
                description: 'Confidence level 0-100',
              },
              suggestedCategory: {
                type: 'string',
                description: 'Suggested ticket category',
              },
              suggestedResolution: {
                type: 'string',
                description: 'Suggested resolution or action',
              },
            },
            required: ['response', 'shouldEscalate', 'confidence', 'suggestedCategory'],
            additionalProperties: false,
          },
        },
      },
    } as any);

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('No response from LLM');
    }

    const parsed = typeof content === 'string' ? JSON.parse(content) : content;

    return {
      ticketId: ticket.id,
      response: parsed.response,
      shouldEscalate: parsed.shouldEscalate,
      escalationReason: parsed.escalationReason,
      confidence: parsed.confidence,
      suggestedCategory: parsed.suggestedCategory,
      suggestedResolution: parsed.suggestedResolution,
    };
  } catch (error) {
    console.error('[Support Bot] Error generating response:', error);
    throw error;
  }
}

/**
 * Analyze ticket sentiment and urgency
 */
export async function analyzeSentiment(ticket: SupportTicket): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative' | 'angry';
  urgency: number; // 1-10
  emotionalTone: string;
  recommendations: string[];
}> {
  try {
    const prompt = `Analyze the sentiment and urgency of this customer support ticket:

Subject: ${ticket.subject}
Description: ${ticket.description}

Provide analysis in JSON format:
{
  "sentiment": "negative",
  "urgency": 8,
  "emotionalTone": "frustrated but reasonable",
  "recommendations": ["Respond quickly", "Offer compensation"]
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing customer sentiment and urgency.',
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
      sentiment: parsed.sentiment,
      urgency: parsed.urgency,
      emotionalTone: parsed.emotionalTone,
      recommendations: parsed.recommendations,
    };
  } catch (error) {
    console.error('[Support Bot] Error analyzing sentiment:', error);
    throw error;
  }
}

/**
 * Suggest ticket category based on content
 */
export async function suggestCategory(
  subject: string,
  description: string
): Promise<{
  category: 'payment' | 'delivery' | 'courier' | 'app' | 'other';
  confidence: number;
}> {
  try {
    const prompt = `Categorize this customer support issue:

Subject: ${subject}
Description: ${description}

Categories:
- payment: Issues with payments, refunds, billing
- delivery: Issues with delivery status, timing, location
- courier: Issues with courier behavior, ratings, disputes
- app: Issues with the app, bugs, features
- other: Everything else

Respond with JSON:
{
  "category": "delivery",
  "confidence": 92
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert at categorizing customer support issues.',
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
      category: parsed.category,
      confidence: parsed.confidence,
    };
  } catch (error) {
    console.error('[Support Bot] Error suggesting category:', error);
    throw error;
  }
}

/**
 * Get suggested compensation for a customer issue
 */
export async function suggestCompensation(ticket: SupportTicket): Promise<{
  compensationType: 'credit' | 'refund' | 'discount' | 'none';
  amount: number;
  reason: string;
}> {
  try {
    const prompt = `Based on this customer issue, suggest appropriate compensation:

Category: ${ticket.category}
Priority: ${ticket.priority}
Subject: ${ticket.subject}
Description: ${ticket.description}

Compensation types:
- credit: Account credit (R0-500)
- refund: Full or partial refund
- discount: Discount on next delivery (5-20%)
- none: No compensation needed

Respond with JSON:
{
  "compensationType": "credit",
  "amount": 50,
  "reason": "Delivery was 2 hours late"
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert at determining fair customer compensation.',
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
      compensationType: parsed.compensationType,
      amount: parsed.amount,
      reason: parsed.reason,
    };
  } catch (error) {
    console.error('[Support Bot] Error suggesting compensation:', error);
    throw error;
  }
}

/**
 * Get bot performance metrics
 */
export function getPerformanceMetrics() {
  return {
    totalTicketsProcessed: 0,
    resolvedByBot: 0,
    escalatedToHuman: 0,
    averageConfidence: 0,
    customerSatisfaction: 0,
    averageResponseTime: 0,
  };
}

export default {
  generateSupportResponse,
  analyzeSentiment,
  suggestCategory,
  suggestCompensation,
  getPerformanceMetrics,
};
