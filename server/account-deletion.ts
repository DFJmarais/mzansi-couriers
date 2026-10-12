import { and, eq, ne } from "drizzle-orm";
import {
  addresses,
  courierProfiles,
  notifications,
  paymentMethods,
  userAchievements,
  userPreferences,
  userStars,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";

export const ACCOUNT_DELETION_CONFIRMATION = "DELETE MY ACCOUNT";

/**
 * Removes personal account data while preserving the minimum operational
 * delivery records needed for custody, payment, tax, and dispute history.
 * The user identity is severed from the account by replacing its provider ID
 * and clearing contact fields, which also invalidates the current session.
 */
export async function deleteUserAccount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await db.select({ id: users.id, openId: users.openId, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user[0]) throw new Error("Account not found");
  if (user[0].openId.startsWith("deleted:")) return;

  // Remove user-owned personal records first. Delivery records are retained
  // because they form the parcel custody and payment audit trail.
  await db.delete(addresses).where(eq(addresses.userId, userId));
  await db.delete(notifications).where(eq(notifications.userId, userId));
  await db.delete(paymentMethods).where(eq(paymentMethods.userId, userId));
  await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
  await db.delete(userAchievements).where(eq(userAchievements.userId, userId));
  await db.delete(userStars).where(eq(userStars.userId, userId));
  await db.delete(courierProfiles).where(eq(courierProfiles.userId, userId));

  const anonymizedOpenId = `deleted:${userId}:${Date.now()}`;
  await db.update(users)
    .set({
      openId: anonymizedOpenId,
      name: null,
      email: null,
      phone: null,
      loginMethod: null,
      role: "customer",
      isVerified: false,
      lastSignedIn: new Date(0),
    })
    .where(and(eq(users.id, userId), ne(users.openId, anonymizedOpenId)));
}
