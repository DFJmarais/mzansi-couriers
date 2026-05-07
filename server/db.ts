import { eq, and, desc, asc, lte, gte, count, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, courierProfiles, addresses, deliveries, deliveryTracking,
  notifications, ratings, pricingConfig, InsertDelivery, InsertCourierProfile,
  InsertAddress, InsertNotification, InsertRating, InsertDeliveryTracking
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ COURIER PROFILE QUERIES ============

export async function getCourierProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courierProfiles).where(eq(courierProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCourierProfile(data: InsertCourierProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(courierProfiles).values(data);
}

export async function updateCourierAvailability(userId: number, isAvailable: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(courierProfiles).set({ isAvailable }).where(eq(courierProfiles.userId, userId));
}

export async function getAvailableCouriers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(courierProfiles).where(eq(courierProfiles.isAvailable, true));
}

// ============ ADDRESS QUERIES ============

export async function getUserAddresses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(addresses).where(eq(addresses.userId, userId));
}

export async function createAddress(data: InsertAddress) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(addresses).values(data);
}

export async function getAddressById(addressId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(addresses).where(eq(addresses.id, addressId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ DELIVERY QUERIES ============

export async function createDelivery(data: InsertDelivery) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deliveries).values(data);
  return result;
}

export async function getDeliveryById(deliveryId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(deliveries).where(eq(deliveries.id, deliveryId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCustomerDeliveries(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deliveries)
    .where(eq(deliveries.customerId, customerId))
    .orderBy(desc(deliveries.createdAt));
}

export async function getCourierDeliveries(courierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deliveries)
    .where(eq(deliveries.courierId, courierId))
    .orderBy(desc(deliveries.createdAt));
}

export async function getPendingDeliveries() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deliveries).where(eq(deliveries.status, "pending"));
}

export async function updateDeliveryStatus(deliveryId: number, status: "pending" | "assigned" | "in-transit" | "delivered") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deliveries).set({ status }).where(eq(deliveries.id, deliveryId));
}

export async function assignDeliveryToCourier(deliveryId: number, courierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deliveries).set({ courierId, status: "assigned" }).where(eq(deliveries.id, deliveryId));
}

export async function completeDelivery(deliveryId: number, finalPrice: string, proofOfDelivery: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deliveries).set({
    status: "delivered",
    finalPrice: finalPrice as any,
    actualDeliveryTime: new Date(),
    proofOfDelivery
  }).where(eq(deliveries.id, deliveryId));
}

// ============ DELIVERY TRACKING QUERIES ============

export async function addDeliveryTracking(data: InsertDeliveryTracking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(deliveryTracking).values(data);
}

export async function getLatestDeliveryLocation(deliveryId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(deliveryTracking)
    .where(eq(deliveryTracking.deliveryId, deliveryId))
    .orderBy(desc(deliveryTracking.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ PRICING QUERIES ============

export async function getPricingConfig() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(pricingConfig).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ============ NOTIFICATION QUERIES ============

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notifications).values(data);
}

export async function getUserNotifications(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
}

// ============ RATING QUERIES ============

export async function createRating(data: InsertRating) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ratings).values(data);
}

export async function getUserRatings(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(ratings).where(eq(ratings.ratedUserId, userId));
}

// ============ ANALYTICS QUERIES ============

export async function getTotalDeliveries() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(deliveries);
  return result[0]?.count || 0;
}

export async function getDeliveredDeliveries() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(deliveries).where(eq(deliveries.status, "delivered"));
  return result[0]?.count || 0;
}

export async function getTotalRevenue() {
  const db = await getDb();
  if (!db) return "0.00";
  const result = await db.select({ total: sum(deliveries.finalPrice) }).from(deliveries).where(eq(deliveries.status, "delivered"));
  return result[0]?.total?.toString() || "0.00";
}

export async function getActiveCouriers() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(courierProfiles).where(eq(courierProfiles.isAvailable, true));
  return result[0]?.count || 0;
}
