import { getDb } from "./db";
import { deliveryTracking, smsNotifications, earningsSummary } from "../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

/**
 * GPS Tracking Functions
 */

export async function recordCourierLocation(
  deliveryId: number,
  courierId: number,
  latitude: number,
  longitude: number,
  accuracy?: number,
  speed?: number,
  heading?: number,
  altitude?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.insert(deliveryTracking).values({
    deliveryId,
    courierId,
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    accuracy: accuracy?.toString(),
    speed: speed?.toString(),
    heading: heading?.toString(),
    altitude: altitude?.toString(),
  });
}

export async function getLatestCourierLocation(deliveryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db
    .select()
    .from(deliveryTracking)
    .where(eq(deliveryTracking.deliveryId, deliveryId))
    .orderBy(desc(deliveryTracking.createdAt))
    .limit(1);
  return result[0] || null;
}

export async function getCourierLocationHistory(deliveryId: number, limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db
    .select()
    .from(deliveryTracking)
    .where(eq(deliveryTracking.deliveryId, deliveryId))
    .orderBy(desc(deliveryTracking.createdAt))
    .limit(limit);
}

/**
 * SMS Notification Functions
 */

export async function createSmsNotification(
  userId: number,
  phoneNumber: string,
  messageType: string,
  messageContent: string,
  deliveryId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.insert(smsNotifications).values({
    userId,
    deliveryId,
    phoneNumber,
    messageType: messageType as any,
    messageContent,
    status: "pending",
  });
}

export async function updateSmsStatus(
  smsId: number,
  status: "sent" | "delivered" | "failed",
  twilioSid?: string,
  failureReason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db
    .update(smsNotifications)
    .set({
      status,
      twilioSid,
      failureReason,
      sentAt: status === "sent" ? new Date() : undefined,
      deliveredAt: status === "delivered" ? new Date() : undefined,
    })
    .where(eq(smsNotifications.id, smsId));
}

export async function getSmsNotifications(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db
    .select()
    .from(smsNotifications)
    .where(eq(smsNotifications.userId, userId))
    .orderBy(desc(smsNotifications.createdAt))
    .limit(limit);
}

/**
 * Earnings Summary Functions
 */

export async function getOrCreateEarningsSummary(
  courierId: number,
  period: "daily" | "weekly" | "monthly",
  periodDate: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const existing = await db
    .select()
    .from(earningsSummary)
    .where(
      and(
        eq(earningsSummary.courierId, courierId),
        eq(earningsSummary.period, period),
        eq(earningsSummary.periodDate, periodDate)
      )
    );

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new record
  const result = await db!.insert(earningsSummary).values({
    courierId,
    period,
    periodDate,
  });

  return {
    id: (result as any).insertId as number,
    courierId,
    period,
    periodDate,
    totalDeliveries: 0,
    completedDeliveries: 0,
    cancelledDeliveries: 0,
    totalEarnings: "0.00",
    baseFeeEarnings: "0.00",
    distanceFeeEarnings: "0.00",
    bonusEarnings: "0.00",
    averageRating: "5.00",
    completionRate: "100.00",
    totalDistance: "0.00",
    totalTime: 0,
  };
}

export async function updateEarningsSummary(
  courierId: number,
  period: "daily" | "weekly" | "monthly",
  periodDate: string,
  updates: {
    totalDeliveries?: number;
    completedDeliveries?: number;
    cancelledDeliveries?: number;
    totalEarnings?: string;
    baseFeeEarnings?: string;
    distanceFeeEarnings?: string;
    bonusEarnings?: string;
    averageRating?: string;
    completionRate?: string;
    totalDistance?: string;
    totalTime?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db
    .update(earningsSummary)
    .set(updates)
    .where(
      and(
        eq(earningsSummary.courierId, courierId),
        eq(earningsSummary.period, period),
        eq(earningsSummary.periodDate, periodDate)
      )
    );
}

export async function getCourierEarnings(
  courierId: number,
  period?: "daily" | "weekly" | "monthly",
  startDate?: string,
  endDate?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  
  const conditions = [eq(earningsSummary.courierId, courierId)];
  
  if (period) {
    conditions.push(eq(earningsSummary.period, period));
  }

  if (startDate) {
    conditions.push(gte(earningsSummary.periodDate, startDate));
  }

  if (endDate) {
    conditions.push(lte(earningsSummary.periodDate, endDate));
  }

  return db
    .select()
    .from(earningsSummary)
    .where(and(...conditions))
    .orderBy(desc(earningsSummary.periodDate));
}

export async function getTotalEarnings(courierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db
    .select()
    .from(earningsSummary)
    .where(eq(earningsSummary.courierId, courierId));

  let total = 0;
  for (const record of result) {
    total += parseFloat(record.totalEarnings || "0");
  }

  return total;
}
