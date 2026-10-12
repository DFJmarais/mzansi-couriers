import { eq } from "drizzle-orm";
import { ENV } from "./env";
import { getDb } from "../db";
import { notificationDeliveries } from "../../drizzle/schema";
import { redactRecipient } from "../services/notification-delivery";

async function createEmailAttempt(to: string) {
  const db = await getDb();
  if (!db) return null;
  const inserted = await db.insert(notificationDeliveries).values({
    channel: "email",
    eventType: "email_message",
    recipientRef: redactRecipient(to),
    provider: "resend",
    status: "submitted",
    attemptCount: 1,
    submittedAt: new Date(),
  });
  return Number(inserted[0]?.insertId || 0) || null;
}

async function finishEmailAttempt(id: number | null, result: { sent: boolean; providerMessageId?: string; reason?: string }) {
  if (!id) return;
  const db = await getDb();
  if (!db) return;
  await db.update(notificationDeliveries).set(result.sent ? {
    status: "provider_accepted",
    providerMessageId: result.providerMessageId,
    acceptedAt: new Date(),
  } : {
    status: "failed",
    lastErrorCode: result.reason || "email_provider_error",
    lastErrorMessage: (result.reason || "email_provider_error").slice(0, 255),
    failedAt: new Date(),
  }).where(eq(notificationDeliveries.id, id));
}

export async function sendDeliveryEmail(to: string | null | undefined, subject: string, text: string) {
  if (!to) return { sent: false as const, reason: "email_recipient_missing" as const };
  const attemptId = await createEmailAttempt(to);
  if (!ENV.resendApiKey) {
    const result = { sent: false as const, reason: "email_provider_not_configured" as const };
    await finishEmailAttempt(attemptId, result);
    return result;
  }
  if (process.env.NOTIFICATIONS_ENABLED !== "true") {
    const result = { sent: false as const, reason: "notification_delivery_disabled_until_controlled_test" as const };
    await finishEmailAttempt(attemptId, result);
    return result;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${ENV.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: ENV.emailFrom, to: [to], subject, text }),
    });
    if (!response.ok) {
      const result = { sent: false as const, reason: "email_provider_error" as const };
      await finishEmailAttempt(attemptId, result);
      return result;
    }
    const payload = await response.json().catch(() => ({} as { id?: string }));
    const result = { sent: true as const, providerAccepted: true as const, providerMessageId: payload.id };
    await finishEmailAttempt(attemptId, result);
    return result;
  } catch {
    const result = { sent: false as const, reason: "email_provider_error" as const };
    await finishEmailAttempt(attemptId, result);
    return result;
  }
}
