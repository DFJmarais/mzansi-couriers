import { z } from "zod";
import { sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { publicAssistantAnalytics, publicFeatureVisibility } from "../../drizzle/schema";
import {
  DEFAULT_PUBLIC_FEATURE_VISIBILITY,
  PUBLIC_FEATURES,
  type PublicFeatureKey,
} from "../../shared/feature-visibility";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

export const publicAssistantInput = z.object({
  messages: z.array(messageSchema).min(1).max(12),
});

export type PublicAssistantInput = z.infer<typeof publicAssistantInput>;

export const publicAssistantAnalyticsInput = z.object({
  event: z.enum(["opened", "prompt_submitted"]),
});

export type PublicAssistantAnalyticsInput = z.infer<typeof publicAssistantAnalyticsInput>;

function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Increment an aggregate counter only; never persist question text or visitor identifiers. */
export async function recordPublicAssistantEvent(event: string) {
  const db = await getDb();
  if (!db) return;

  await db.insert(publicAssistantAnalytics).values({
    eventDate: todayUtc(),
    eventType: event,
    eventCount: 1,
  }).onDuplicateKeyUpdate({
    set: { eventCount: sql`${publicAssistantAnalytics.eventCount} + 1` },
  });
}

export async function getPublicAssistantVisibility() {
  const visibility: Record<PublicFeatureKey, boolean> = { ...DEFAULT_PUBLIC_FEATURE_VISIBILITY };
  const db = await getDb();
  if (!db) return visibility;

  const rows = await db.select({ featureKey: publicFeatureVisibility.featureKey, isPublic: publicFeatureVisibility.isPublic })
    .from(publicFeatureVisibility);
  for (const row of rows) {
    if (row.featureKey in visibility) visibility[row.featureKey as PublicFeatureKey] = Boolean(row.isPublic);
  }
  return visibility;
}

function publicFeatureSummary(visibility: Record<PublicFeatureKey, boolean>) {
  return PUBLIC_FEATURES.map((feature) => `${feature.label}: ${visibility[feature.key] ? "PUBLICLY AVAILABLE" : "HIDDEN FROM THE PUBLIC"}`).join("\n");
}

function hiddenTopics(visibility: Record<PublicFeatureKey, boolean>) {
  const topics: string[] = [];
  if (!visibility.customer_booking) topics.push("customer package booking, checkout, prices, or payment instructions");
  if (!visibility.package_tracking) topics.push("parcel tracking, live tracking links, or tracking status");
  if (!visibility.fleet_registration) topics.push("fleet registration, fleet dashboards, or fleet access");
  return topics.length ? topics.join("; ") : "none";
}

export async function answerPublicAssistant(input: PublicAssistantInput) {
  const visibility = await getPublicAssistantVisibility();
  const currentMessages = input.messages.map((message) => ({ role: message.role, content: message.content }));
  const system = `You are the Mzansi Couriers public website assistant. Answer clearly, warmly, and briefly for visitors in South Africa.\n\nCURRENT PUBLIC VISIBILITY (authoritative; do not contradict it):\n${publicFeatureSummary(visibility)}\n\nThe current launch priority is courier and fleet onboarding before customer operations open. Hidden topics: ${hiddenTopics(visibility)}.\n\nRules:\n- Never invent a route, feature, price, payment status, tracking code, approval, courier earnings figure, or account access.\n- Never reveal admin-only controls, private data, internal records, customer/courier identities, or hidden implementation details.\n- If asked about a hidden feature, say it is not currently available to public visitors and redirect to the available courier onboarding or support path. Do not provide workarounds or direct hidden URLs.\n- If courier onboarding is public, explain that applicants submit driver, vehicle, licence, ID, and insurance information for review, and that approval is required before delivery work is available. Do not promise approval or payout amounts.\n- If fleet registration is hidden, say fleet onboarding is not currently open to public visitors.\n- If a question needs an account or an Admin, direct the visitor to sign in or contact support rather than exposing protected workflows.\n- Be transparent that you are an AI assistant and recommend support for case-specific help.\n- Keep answers under 120 words unless a short step list is genuinely useful.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: system },
        ...currentMessages,
      ],
      maxTokens: 700,
    });
    const content = response.choices[0]?.message?.content;
    const answer = typeof content === "string" ? content.trim() : "I’m sorry, I couldn’t generate an answer just now. Please use Support for help.";
    void recordPublicAssistantEvent(content ? "response_succeeded" : "response_empty").catch(() => undefined);
    return { answer, visibility };
  } catch (error) {
    void recordPublicAssistantEvent("response_failed").catch(() => undefined);
    console.error("Public assistant unavailable", error instanceof Error ? error.message : "unknown error");
    return {
      answer: "I’m temporarily unavailable. You can still use the courier application or contact Support for help.",
      visibility,
      degraded: true,
    };
  }
}
