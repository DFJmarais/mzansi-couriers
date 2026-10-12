import { Router, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { notificationDeliveryEvents, notificationDeliveries } from "../../drizzle/schema";
import { mapTwilioStatus, transitionNotification, verifyTwilioSignature as verifySignature } from "../services/notification-delivery";

export function verifyTwilioSignature(url: string, params: Record<string, unknown>, signature: string, authToken = process.env.TWILIO_AUTH_TOKEN || ""): boolean {
  return verifySignature(url, params, signature, authToken);
}

export async function handleTwilioWebhook(req: Request, res: Response) {
  const signature = String(req.headers["x-twilio-signature"] || "");
  const url = `${process.env.PUBLIC_APP_URL || `https://${req.headers.host}`}${req.originalUrl}`;
  if (!verifyTwilioSignature(url, req.body, signature)) return res.status(403).send("Forbidden");

  const messageId = String(req.body.MessageSid || "");
  const providerStatus = String(req.body.MessageStatus || "");
  const mappedStatus = mapTwilioStatus(providerStatus);
  if (!messageId || !mappedStatus) return res.status(400).send("Invalid webhook payload");

  const db = await getDb();
  if (!db) return res.status(503).send("Notification store unavailable");
  const delivery = (await db.select().from(notificationDeliveries).where(eq(notificationDeliveries.providerMessageId, messageId)).limit(1))[0];
  if (!delivery) return res.status(202).send("Ignored unknown provider message");

  const eventId = `${messageId}:${providerStatus}:${String(req.body.Timestamp || req.body.DateUpdated || "")}`;
  const duplicate = (await db.select({ id: notificationDeliveryEvents.id }).from(notificationDeliveryEvents).where(and(eq(notificationDeliveryEvents.notificationDeliveryId, delivery.id), eq(notificationDeliveryEvents.providerEventId, eventId))).limit(1))[0];
  if (duplicate) return res.status(200).send("OK");

  const next = transitionNotification({ status: delivery.status, providerMessageId: delivery.providerMessageId || undefined, attemptCount: delivery.attemptCount }, mappedStatus);
  await db.insert(notificationDeliveryEvents).values({ notificationDeliveryId: delivery.id, providerEventId: eventId, providerStatus, mappedStatus, signatureVerified: true });
  if (next.status !== delivery.status) {
    const now = new Date();
    await db.update(notificationDeliveries).set({
      status: next.status,
      deliveredAt: next.status === "delivered" ? now : delivery.deliveredAt,
      failedAt: ["failed", "rejected", "undeliverable", "expired"].includes(next.status) ? now : delivery.failedAt,
    }).where(eq(notificationDeliveries.id, delivery.id));
  }
  return res.status(200).send("OK");
}

export function createTwilioWebhookRouter() {
  const router = Router();
  router.post("/messages", handleTwilioWebhook);
  return router;
}
