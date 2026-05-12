import { getDb } from "./db";
import { gpsLocations, disputes, disputeEvidence, disputeComments } from "../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

/**
 * GPS LOCATION FUNCTIONS
 */

export async function recordGPSLocation(courierId: number, deliveryId: number, latitude: number, longitude: number, accuracy?: number, altitude?: number, speed?: number, heading?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(gpsLocations).values({
    courierId,
    deliveryId,
    latitude: String(latitude) as any,
    longitude: String(longitude) as any,
    accuracy: accuracy || undefined,
    altitude: altitude ? String(altitude) as any : undefined,
    speed: speed ? String(speed) as any : undefined,
    heading: heading || undefined,
  });
  return result;
}

export async function getLatestGPSLocation(deliveryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.select().from(gpsLocations)
    .where(eq(gpsLocations.deliveryId, deliveryId))
    .orderBy(desc(gpsLocations.createdAt))
    .limit(1);
  return result[0] || null;
}

export async function getGPSLocationHistory(deliveryId: number, limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const results = await db.select().from(gpsLocations)
    .where(eq(gpsLocations.deliveryId, deliveryId))
    .orderBy(desc(gpsLocations.createdAt))
    .limit(limit);
  return results;
}

export async function getCourierRecentLocations(courierId: number, minutesBack = 60) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const cutoffTime = new Date(Date.now() - minutesBack * 60 * 1000);
  const results = await db.select().from(gpsLocations)
    .where(and(
      eq(gpsLocations.courierId, courierId),
      gte(gpsLocations.createdAt, cutoffTime)
    ))
    .orderBy(desc(gpsLocations.createdAt));
  return results;
}

/**
 * DISPUTE FUNCTIONS
 */

export async function createDispute(deliveryId: number, customerId: number, courierId: number, reason: string, description: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(disputes).values({
    deliveryId,
    customerId,
    courierId,
    reason: reason as any,
    description,
    status: "open",
    priority: "medium",
  });
  return result;
}

export async function getDispute(disputeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.select().from(disputes)
    .where(eq(disputes.id, disputeId))
    .limit(1);
  return result[0] || null;
}

export async function getDisputesByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const results = await db.select().from(disputes)
    .where(eq(disputes.customerId, customerId))
    .orderBy(desc(disputes.createdAt));
  return results;
}

export async function getDisputesByCourier(courierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const results = await db.select().from(disputes)
    .where(eq(disputes.courierId, courierId))
    .orderBy(desc(disputes.createdAt));
  return results;
}

export async function getPendingDisputes() {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const results = await db.select().from(disputes)
    .where(eq(disputes.status, "open"))
    .orderBy(desc(disputes.createdAt));
  return results;
}

export async function updateDisputeStatus(disputeId: number, status: string, resolution?: string, refundAmount?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.update(disputes)
    .set({
      status: status as any,
      resolution,
      refundAmount: refundAmount ? String(refundAmount) : undefined,
      resolvedAt: status === "resolved" ? new Date() : undefined,
    })
    .where(eq(disputes.id, disputeId));
  return result;
}

export async function addDisputeEvidence(disputeId: number, uploadedBy: number, evidenceType: string, fileUrl: string, fileName: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(disputeEvidence).values({
    disputeId,
    uploadedBy,
    evidenceType: evidenceType as any,
    fileUrl,
    fileName,
    description,
  });
  return result;
}

export async function getDisputeEvidence(disputeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const results = await db.select().from(disputeEvidence)
    .where(eq(disputeEvidence.disputeId, disputeId))
    .orderBy(desc(disputeEvidence.createdAt));
  return results;
}

export async function addDisputeComment(disputeId: number, userId: number, userRole: string, comment: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(disputeComments).values({
    disputeId,
    userId,
    userRole: userRole as any,
    comment,
  });
  return result;
}

export async function getDisputeComments(disputeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const results = await db.select().from(disputeComments)
    .where(eq(disputeComments.disputeId, disputeId))
    .orderBy(desc(disputeComments.createdAt));
  return results;
}

export async function getDisputeStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const openCount = await db.select().from(disputes)
    .where(eq(disputes.status, "open"));
  const underReviewCount = await db.select().from(disputes)
    .where(eq(disputes.status, "under_review"));
  const resolvedCount = await db.select().from(disputes)
    .where(eq(disputes.status, "resolved"));
  
  return {
    openCount: openCount.length,
    underReviewCount: underReviewCount.length,
    resolvedCount: resolvedCount.length,
    totalDisputes: openCount.length + underReviewCount.length + resolvedCount.length,
  };
}
