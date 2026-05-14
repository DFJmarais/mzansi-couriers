import { and, eq, desc, asc, lte, gte, count, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, courierProfiles, addresses, deliveries, deliveryTracking,
  notifications, ratings, pricingConfig, InsertDelivery, InsertCourierProfile,
  InsertAddress, InsertNotification, InsertRating, InsertDeliveryTracking, deliveryZones, regionalPricing, paymentMethods, userPreferences, communityMetrics, achievements, userAchievements, leaderboards, seasonalCompetitions, competitionResults,
  referralCodes, userStars, starHistory, surgePricingConfig, surgePricingHistory, courierReferrals,
  InsertReferralCode, InsertUserStars, InsertStarHistory, InsertSurgePricingConfig, InsertSurgePricingHistory, InsertCourierReferral
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

export async function updateUserRole(userId: number, role: 'customer' | 'courier' | 'admin') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
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

// ============ PHASE 2: Regional Pricing & Zones ============

export async function getDeliveryZones() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deliveryZones).where(eq(deliveryZones.isActive, true));
}

export async function getZoneByName(name: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(deliveryZones).where(eq(deliveryZones.name, name)).limit(1);
  return result[0];
}

export async function getRegionalPricing(zoneId: number, packageSize: "small" | "medium" | "large") {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(regionalPricing)
    .where(and(eq(regionalPricing.zoneId, zoneId), eq(regionalPricing.packageSize, packageSize)))
    .limit(1);
  return result[0];
}

// ============ PHASE 2: Payment Methods ============

export async function createPaymentMethod(userId: number, method: any): Promise<any> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(paymentMethods).values({
    userId,
    type: method.type,
    accountName: method.accountName,
    accountNumber: method.accountNumber,
    bankName: method.bankName,
    isDefault: method.isDefault || false,
    isActive: true,
  });
  return result;
}

export async function getUserPaymentMethods(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentMethods).where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.isActive, true)));
}

export async function getDefaultPaymentMethod(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(paymentMethods)
    .where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.isDefault, true)))
    .limit(1);
  return result[0];
}

// ============ PHASE 2: User Preferences ============

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return result[0];
}

export async function createOrUpdateUserPreferences(userId: number, prefs: any): Promise<any> {
  const db = await getDb();
  if (!db) return undefined;
  
  const existing = await getUserPreferences(userId);
  if (existing) {
    return db.update(userPreferences).set(prefs).where(eq(userPreferences.userId, userId));
  }
  
  return db.insert(userPreferences).values({
    userId,
    language: prefs.language || 'en',
    notificationMethod: prefs.notificationMethod || 'in_app',
    phoneNumber: prefs.phoneNumber,
    whatsappNumber: prefs.whatsappNumber,
    preferredZone: prefs.preferredZone,
  });
}

// ============ PHASE 2: Community Metrics ============

export async function getCommunityMetrics(zoneId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(communityMetrics).where(eq(communityMetrics.zoneId, zoneId)).limit(1);
  return result[0];
}

export async function updateCommunityMetrics(zoneId: number, updates: any): Promise<any> {
  const db = await getDb();
  if (!db) return undefined;
  
  const existing = await getCommunityMetrics(zoneId);
  if (existing) {
    return db.update(communityMetrics).set(updates).where(eq(communityMetrics.zoneId, zoneId));
  }
  
  return db.insert(communityMetrics).values({
    zoneId,
    ...updates,
  });
}

// ============ REFERRAL SYSTEM ============

export async function generateReferralCode(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Generate unique code
  const code = `MZANSI${userId}${Date.now().toString(36).toUpperCase()}`;
  
  await db.insert(referralCodes).values({
    userId,
    code,
    isActive: true,
  });
  
  return code;
}

export async function getReferralCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(referralCodes).where(eq(referralCodes.code, code)).limit(1);
  return result[0];
}

export async function getUserReferralCode(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(referralCodes).where(eq(referralCodes.userId, userId)).limit(1);
  return result[0];
}

export async function initializeUserStars(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(userStars).where(eq(userStars.userId, userId)).limit(1);
  if (!existing.length) {
    await db.insert(userStars).values({
      userId,
      starCount: 0,
      totalReferred: 0,
    });
  }
}

export async function getUserStars(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userStars).where(eq(userStars.userId, userId)).limit(1);
  return result[0];
}

export async function awardStar(userId: number, referrerId: number, reason: string, starsAwarded: number = 1): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Record star award in history
  await db.insert(starHistory).values({
    userId,
    referrerId,
    reason,
    starsAwarded,
  });
  
  // Update user stars
  const userStar = await getUserStars(userId);
  if (userStar) {
    await db.update(userStars)
      .set({
        starCount: (userStar.starCount || 0) + starsAwarded,
        totalReferred: reason === 'referral_signup' ? (userStar.totalReferred || 0) + 1 : (userStar.totalReferred || 0),
      })
      .where(eq(userStars.userId, userId));
  } else {
    await initializeUserStars(userId);
    await awardStar(userId, referrerId, reason, starsAwarded);
  }
}

export async function getStarHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(starHistory).where(eq(starHistory.userId, userId)).limit(limit);
}

// ============ SURGE PRICING ============

export async function createSurgePricingConfig(config: InsertSurgePricingConfig): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(surgePricingConfig).values(config);
}

export async function getSurgePricingConfigs(isActive: boolean = true) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(surgePricingConfig).where(eq(surgePricingConfig.isActive, isActive));
}

export async function getSurgePricingConfigById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(surgePricingConfig).where(eq(surgePricingConfig.id, id)).limit(1);
  return result[0];
}

export async function updateSurgePricingConfig(id: number, updates: Partial<InsertSurgePricingConfig>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(surgePricingConfig).set(updates).where(eq(surgePricingConfig.id, id));
}

export async function recordSurgePricingHistory(history: InsertSurgePricingHistory): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(surgePricingHistory).values(history);
}

export async function getSurgePricingHistory(deliveryId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(surgePricingHistory).where(eq(surgePricingHistory.deliveryId, deliveryId)).limit(1);
  return result[0];
}


// Courier Referral Bonus Functions
export async function createCourierReferral(referral: InsertCourierReferral): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(courierReferrals).values(referral);
}

export async function getCourierReferralByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courierReferrals).where(eq(courierReferrals.referralCode, code)).limit(1);
  return result[0];
}

export async function getCourierReferralsByReferrer(referrerCourierId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(courierReferrals).where(eq(courierReferrals.referrerCourierId, referrerCourierId));
}

export async function updateCourierReferralDeliveries(referralId: number, deliveryCount: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: Record<string, unknown> = { referredCourierDeliveries: deliveryCount };
  
  // Check if bonus should be earned (after 10 deliveries)
  if (deliveryCount >= 10) {
    updates.bonusStatus = "earned";
    updates.bonusEarnedAt = new Date();
  }
  
  await db.update(courierReferrals).set(updates).where(eq(courierReferrals.id, referralId));
}

export async function markCourierReferralBonusPaid(referralId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(courierReferrals).set({
    bonusStatus: "paid",
    bonusPaidAt: new Date()
  }).where(eq(courierReferrals.id, referralId));
}

export async function getCourierReferralStats(courierId: string) {
  const db = await getDb();
  if (!db) return { totalEarned: 0, totalReferrals: 0, pendingBonuses: 0, earnedBonuses: 0 };
  
  const referrals = await db.select().from(courierReferrals).where(eq(courierReferrals.referrerCourierId, courierId));
  
  let totalEarned = 0;
  let pendingBonuses = 0;
  let earnedBonuses = 0;
  
  referrals.forEach(ref => {
    if (ref.bonusStatus === "paid") {
      totalEarned += parseFloat(ref.bonusAmount.toString());
    }
    if (ref.bonusStatus === "pending") pendingBonuses++;
    if (ref.bonusStatus === "earned") earnedBonuses++;
  });
  
  return {
    totalEarned,
    totalReferrals: referrals.length,
    pendingBonuses,
    earnedBonuses
  };
}


// ============ PHASE 3: Achievements & Leaderboards ============

export async function createAchievement(achievement: any): Promise<any> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(achievements).values(achievement);
  return result;
}

export async function getAchievements(category?: string): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  if (category) {
    return db.select().from(achievements).where(and(eq(achievements.isActive, true), eq(achievements.category, category as any)));
  }
  return db.select().from(achievements).where(eq(achievements.isActive, true));
}

export async function unlockAchievement(userId: number, achievementId: number): Promise<any> {
  const db = await getDb();
  if (!db) return undefined;
  
  // Check if already unlocked
  const existing = await db.select().from(userAchievements)
    .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0]; // Already unlocked
  }
  
  const result = await db.insert(userAchievements).values({
    userId,
    achievementId,
  });
  return result;
}

export async function getUserAchievements(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
}

export async function updateLeaderboard(userId: number, category: string, score: number, period: string = "all_time", zone?: string): Promise<any> {
  const db = await getDb();
  if (!db) return undefined;
  
  const existing = await db.select().from(leaderboards)
    .where(and(
      eq(leaderboards.userId, userId),
      eq(leaderboards.category, category as any),
      eq(leaderboards.period, period as any)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing
    return db.update(leaderboards).set({ score: score.toString() as any }).where(eq(leaderboards.id, existing[0].id));
  } else {
    // Create new
    return db.insert(leaderboards).values({
      userId,
      category: category as any,
      score: score.toString() as any,
      period: period as any,
      rank: 0,
      zone,
    });
  }
}

export async function getLeaderboard(category: string, period: string = "all_time", limit: number = 10, zone?: string): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (zone) {
    return db.select().from(leaderboards)
      .where(and(
        eq(leaderboards.category, category as any),
        eq(leaderboards.period, period as any),
        eq(leaderboards.zone, zone)
      ))
      .orderBy(desc(leaderboards.score))
      .limit(limit);
  }
  
  return db.select().from(leaderboards)
    .where(and(
      eq(leaderboards.category, category as any),
      eq(leaderboards.period, period as any)
    ))
    .orderBy(desc(leaderboards.score))
    .limit(limit);
}

export async function createSeasonalCompetition(competition: any): Promise<any> {
  const db = await getDb();
  if (!db) return undefined;
  return db.insert(seasonalCompetitions).values(competition);
}

export async function getActiveCompetitions(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(seasonalCompetitions).where(eq(seasonalCompetitions.isActive, true));
}

export async function recordCompetitionResult(result: any): Promise<any> {
  const db = await getDb();
  if (!db) return undefined;
  return db.insert(competitionResults).values(result);
}

export async function getCompetitionResults(competitionId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(competitionResults)
    .where(eq(competitionResults.competitionId, competitionId))
    .orderBy(asc(competitionResults.rank));
}
