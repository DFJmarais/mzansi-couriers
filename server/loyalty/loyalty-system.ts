/**
 * Loyalty Program System
 * 
 * Manages customer and courier loyalty points, tiers, and rewards
 */

export type UserRole = 'customer' | 'courier';
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type PointsSource = 'delivery' | 'referral' | 'review' | 'bonus' | 'promo';

export interface LoyaltyAccount {
  userId: string;
  userRole: UserRole;
  tier: LoyaltyTier;
  totalPoints: number;
  availablePoints: number;
  redeemedPoints: number;
  tierProgress: number; // 0-100
  referralCode: string;
  referralCount: number;
  createdAt: number;
  lastActivityAt: number;
}

export interface LoyaltyTierBenefits {
  tier: LoyaltyTier;
  minPoints: number;
  pointsMultiplier: number;
  discountPercentage: number;
  exclusiveRewards: string[];
  prioritySupport: boolean;
  freeDeliveries: number;
  monthlyBonus: number;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  points: number;
  source: PointsSource;
  sourceId?: string; // delivery ID, referral ID, etc.
  description: string;
  timestamp: number;
  expiresAt?: number;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'freeDelivery' | 'cashback' | 'exclusive';
  value: number; // discount %, delivery count, or cash amount
  minTier: LoyaltyTier;
  available: boolean;
  redeemCount: number;
  createdAt: number;
}

export interface RedemptionRecord {
  id: string;
  userId: string;
  rewardId: string;
  pointsSpent: number;
  value: number;
  status: 'pending' | 'completed' | 'expired';
  redeemedAt: number;
  expiresAt: number;
}

/**
 * Loyalty tier benefits configuration
 */
export const TIER_BENEFITS: Record<LoyaltyTier, LoyaltyTierBenefits> = {
  bronze: {
    tier: 'bronze',
    minPoints: 0,
    pointsMultiplier: 1.0,
    discountPercentage: 0,
    exclusiveRewards: [],
    prioritySupport: false,
    freeDeliveries: 0,
    monthlyBonus: 0,
  },
  silver: {
    tier: 'silver',
    minPoints: 500,
    pointsMultiplier: 1.1,
    discountPercentage: 5,
    exclusiveRewards: ['Silver Member Discount'],
    prioritySupport: false,
    freeDeliveries: 1,
    monthlyBonus: 50,
  },
  gold: {
    tier: 'gold',
    minPoints: 2000,
    pointsMultiplier: 1.25,
    discountPercentage: 10,
    exclusiveRewards: ['Gold Member Discount', 'Early Access to Promos'],
    prioritySupport: true,
    freeDeliveries: 3,
    monthlyBonus: 150,
  },
  platinum: {
    tier: 'platinum',
    minPoints: 5000,
    pointsMultiplier: 1.5,
    discountPercentage: 15,
    exclusiveRewards: ['Platinum Concierge', 'VIP Events', 'Exclusive Rewards'],
    prioritySupport: true,
    freeDeliveries: 5,
    monthlyBonus: 300,
  },
};

/**
 * Points earning rules
 */
export const POINTS_EARNING = {
  // Customer points
  CUSTOMER_DELIVERY: 10, // points per delivery
  CUSTOMER_REFERRAL: 500, // points for successful referral
  CUSTOMER_REVIEW: 25, // points for leaving a review
  CUSTOMER_BIRTHDAY: 100, // birthday bonus

  // Courier points
  COURIER_DELIVERY: 15, // points per delivery
  COURIER_REFERRAL: 750, // points for successful referral
  COURIER_RATING: 50, // points for 5-star rating
  COURIER_STREAK: 200, // points for 10-delivery streak
};

/**
 * Calculate loyalty tier based on points
 */
export function calculateTier(points: number): LoyaltyTier {
  if (points >= TIER_BENEFITS.platinum.minPoints) return 'platinum';
  if (points >= TIER_BENEFITS.gold.minPoints) return 'gold';
  if (points >= TIER_BENEFITS.silver.minPoints) return 'silver';
  return 'bronze';
}

/**
 * Calculate tier progress (0-100)
 */
export function calculateTierProgress(points: number): number {
  const currentTier = calculateTier(points);
  const tierBenefits = TIER_BENEFITS[currentTier];
  const nextTierKey = Object.keys(TIER_BENEFITS).find(
    (key) => TIER_BENEFITS[key as LoyaltyTier].minPoints > tierBenefits.minPoints
  );

  if (!nextTierKey) return 100; // Already at max tier

  const nextTierMinPoints = TIER_BENEFITS[nextTierKey as LoyaltyTier].minPoints;
  const currentTierMinPoints = tierBenefits.minPoints;
  const pointsInTier = points - currentTierMinPoints;
  const pointsNeededForNextTier = nextTierMinPoints - currentTierMinPoints;

  return Math.round((pointsInTier / pointsNeededForNextTier) * 100);
}

/**
 * Add points to user account
 */
export function addPoints(
  account: LoyaltyAccount,
  points: number,
  source: PointsSource,
  sourceId?: string
): {
  account: LoyaltyAccount;
  transaction: PointsTransaction;
} {
  try {
    const tierBenefits = TIER_BENEFITS[account.tier];
    const multipliedPoints = Math.round(points * tierBenefits.pointsMultiplier);

    const updatedAccount: LoyaltyAccount = {
      ...account,
      totalPoints: account.totalPoints + multipliedPoints,
      availablePoints: account.availablePoints + multipliedPoints,
      tier: calculateTier(account.totalPoints + multipliedPoints),
      tierProgress: calculateTierProgress(account.totalPoints + multipliedPoints),
      lastActivityAt: Date.now(),
    };

    const transaction: PointsTransaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: account.userId,
      points: multipliedPoints,
      source,
      sourceId,
      description: `Earned ${multipliedPoints} points from ${source}`,
      timestamp: Date.now(),
    };

    return {
      account: updatedAccount,
      transaction,
    };
  } catch (error) {
    console.error('[Loyalty] Error adding points:', error);
    throw error;
  }
}

/**
 * Redeem points for reward
 */
export function redeemReward(
  account: LoyaltyAccount,
  reward: Reward
): {
  account: LoyaltyAccount;
  redemption: RedemptionRecord;
} {
  try {
    if (account.availablePoints < reward.pointsCost) {
      throw new Error('Insufficient points');
    }

    const updatedAccount: LoyaltyAccount = {
      ...account,
      availablePoints: account.availablePoints - reward.pointsCost,
      redeemedPoints: account.redeemedPoints + reward.pointsCost,
      lastActivityAt: Date.now(),
    };

    const redemption: RedemptionRecord = {
      id: `redeem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: account.userId,
      rewardId: reward.id,
      pointsSpent: reward.pointsCost,
      value: reward.value,
      status: 'completed',
      redeemedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    return {
      account: updatedAccount,
      redemption,
    };
  } catch (error) {
    console.error('[Loyalty] Error redeeming reward:', error);
    throw error;
  }
}

/**
 * Generate referral code
 */
export function generateReferralCode(userId: string): string {
  return `MZ${userId.substring(0, 4).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

/**
 * Calculate monthly bonus
 */
export function calculateMonthlyBonus(account: LoyaltyAccount): number {
  return TIER_BENEFITS[account.tier].monthlyBonus;
}

/**
 * Get tier benefits
 */
export function getTierBenefits(tier: LoyaltyTier): LoyaltyTierBenefits {
  return TIER_BENEFITS[tier];
}

export default {
  calculateTier,
  calculateTierProgress,
  addPoints,
  redeemReward,
  generateReferralCode,
  calculateMonthlyBonus,
  getTierBenefits,
  TIER_BENEFITS,
  POINTS_EARNING,
};
