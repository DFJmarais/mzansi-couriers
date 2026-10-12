/**
 * AI Address Parser Service
 * Uses LLM to understand natural language addresses and convert them to structured data
 */

import { invokeLLM } from "../_core/llm";

export interface ParsedAddressAI {
  originalInput: string;
  streetNumber?: string;
  streetName?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  landmark?: string;
  addressType: 'formal' | 'informal' | 'estate' | 'complex' | 'township';
  confidence: number;
  searchQuery: string;
  notes?: string;
}

/**
 * Parse natural language address using AI
 * Handles informal addresses like "opposite the church" or "near the shop"
 */
export async function parseAddressWithAI(input: string): Promise<ParsedAddressAI | null> {
  if (!input || input.trim().length < 3) {
    return null;
  }

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert at parsing South African addresses. Your job is to extract address components from natural language input, even if it's informal or incomplete.

South African provinces: Western Cape, Eastern Cape, Northern Cape, Free State, KwaZulu-Natal, Gauteng, Limpopo, Mpumalanga, North West.

Common SA address types:
- Formal: "123 Main Road, Kleinmond, Western Cape, 7195"
- Informal: "Opposite the church, near the school"
- Estate: "Erf 123, Plot 456"
- Complex: "Unit 5, The Plaza, Main Street"
- Township: "Khayelitsha, Cape Town" or "Soweto, Johannesburg"

Return a JSON object with these fields:
{
  "streetNumber": "123" or null,
  "streetName": "Main Road" or null,
  "suburb": "Kleinmond" or null,
  "city": "Cape Town" or null,
  "province": "Western Cape" or null,
  "postalCode": "7195" or null,
  "landmark": "opposite the church" or null,
  "addressType": "formal|informal|estate|complex|township",
  "confidence": 0.0-1.0,
  "searchQuery": "optimized search query for geocoding API",
  "notes": "any additional context"
}

Be generous with confidence scores for informal addresses - even if incomplete, they can be useful.
Always provide a searchQuery that would work well with Photon/Nominatim APIs.`
        },
        {
          role: "user",
          content: `Parse this South African address: "${input}"`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "parsed_address",
          strict: true,
          schema: {
            type: "object",
            properties: {
              streetNumber: { type: ["string", "null"] },
              streetName: { type: ["string", "null"] },
              suburb: { type: ["string", "null"] },
              city: { type: ["string", "null"] },
              province: { type: ["string", "null"] },
              postalCode: { type: ["string", "null"] },
              landmark: { type: ["string", "null"] },
              addressType: {
                type: "string",
                enum: ["formal", "informal", "estate", "complex", "township"]
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              searchQuery: { type: "string" },
              notes: { type: ["string", "null"] }
            },
            required: ["addressType", "confidence", "searchQuery"],
            additionalProperties: false
          }
        }
      }
    });

    if (!response.choices[0]?.message?.content) {
      return null;
    }

    const content = response.choices[0].message.content;
    if (typeof content !== 'string') {
      return null;
    }

    const parsed = JSON.parse(content);

    return {
      originalInput: input,
      ...parsed
    };
  } catch (error) {
    console.error('AI address parsing error:', error);
    return null;
  }
}

/**
 * Correct typos and suggest similar addresses
 */
export async function correctAddressTypos(input: string): Promise<string[]> {
  if (!input || input.trim().length < 3) {
    return [];
  }

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert at correcting typos in South African addresses. 
          
Given a potentially misspelled address, suggest up to 3 corrections.
Return a JSON array of corrected addresses, ordered by likelihood.

Example:
Input: "Kleinmond" (correct)
Output: ["Kleinmond"]

Input: "Klienmond"
Output: ["Kleinmond"]

Input: "Capetown"
Output: ["Cape Town"]

Focus on:
- Common SA place names
- Street names
- Suburb names
- Township names`
        },
        {
          role: "user",
          content: `Correct this address and suggest alternatives: "${input}"`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "address_corrections",
          strict: true,
          schema: {
            type: "object",
            properties: {
              corrections: {
                type: "array",
                items: { type: "string" },
                maxItems: 3
              }
            },
            required: ["corrections"],
            additionalProperties: false
          }
        }
      }
    });

    if (!response.choices[0]?.message?.content) {
      return [];
    }

    const content = response.choices[0].message.content;
    if (typeof content !== 'string') {
      return [];
    }

    const parsed = JSON.parse(content);
    return parsed.corrections || [];
  } catch (error) {
    console.error('Address typo correction error:', error);
    return [];
  }
}

/**
 * Match informal address to formal address
 * E.g., "opposite the church" -> "Main Street, Kleinmond"
 */
export async function matchInformalAddress(
  informalAddress: string,
  context?: { city?: string; province?: string }
): Promise<string | null> {
  if (!informalAddress || informalAddress.trim().length < 3) {
    return null;
  }

  try {
    const contextStr = context
      ? `Context: City: ${context.city || 'unknown'}, Province: ${context.province || 'unknown'}`
      : '';

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert at converting informal South African addresses to formal ones.

Informal addresses often use landmarks:
- "Opposite the church"
- "Near the school"
- "Next to the shop"
- "Behind the mall"
- "In front of the hospital"

Convert these to the most likely formal street address.
Return a JSON object with:
{
  "formalAddress": "123 Main Street, Kleinmond, Western Cape",
  "confidence": 0.85,
  "explanation": "Based on landmark context"
}

If you cannot determine the address, return confidence 0 and explanation why.`
        },
        {
          role: "user",
          content: `Convert this informal address to formal: "${informalAddress}"\n${contextStr}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "formal_address",
          strict: true,
          schema: {
            type: "object",
            properties: {
              formalAddress: { type: ["string", "null"] },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              explanation: { type: "string" }
            },
            required: ["formalAddress", "confidence", "explanation"],
            additionalProperties: false
          }
        }
      }
    });

    if (!response.choices[0]?.message?.content) {
      return null;
    }

    const content = response.choices[0].message.content;
    if (typeof content !== 'string') {
      return null;
    }

    const parsed = JSON.parse(content);
    
    if (parsed.confidence < 0.5) {
      return null;
    }

    return parsed.formalAddress;
  } catch (error) {
    console.error('Informal address matching error:', error);
    return null;
  }
}

/**
 * Validate and enhance address with AI
 * Fills in missing components based on context
 */
export async function enhanceAddressWithAI(
  partialAddress: string
): Promise<ParsedAddressAI | null> {
  if (!partialAddress || partialAddress.trim().length < 3) {
    return null;
  }

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert at enhancing partial South African addresses with missing information.

Given a partial address, try to infer missing components based on:
1. Common address patterns
2. Known SA locations
3. Logical geographic relationships

Example:
Input: "Kleinmond"
Output: {
  "suburb": "Kleinmond",
  "city": "Overstrand",
  "province": "Western Cape",
  "postalCode": "7195",
  "confidence": 0.9
}

Return a JSON object with enhanced address components.`
        },
        {
          role: "user",
          content: `Enhance this partial South African address: "${partialAddress}"`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "enhanced_address",
          strict: true,
          schema: {
            type: "object",
            properties: {
              streetNumber: { type: ["string", "null"] },
              streetName: { type: ["string", "null"] },
              suburb: { type: ["string", "null"] },
              city: { type: ["string", "null"] },
              province: { type: ["string", "null"] },
              postalCode: { type: ["string", "null"] },
              landmark: { type: ["string", "null"] },
              addressType: {
                type: "string",
                enum: ["formal", "informal", "estate", "complex", "township"]
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              searchQuery: { type: "string" }
            },
            required: ["addressType", "confidence", "searchQuery"],
            additionalProperties: false
          }
        }
      }
    });

    if (!response.choices[0]?.message?.content) {
      return null;
    }

    const content = response.choices[0].message.content;
    if (typeof content !== 'string') {
      return null;
    }

    const parsed = JSON.parse(content);

    return {
      originalInput: partialAddress,
      ...parsed
    };
  } catch (error) {
    console.error('Address enhancement error:', error);
    return null;
  }
}
