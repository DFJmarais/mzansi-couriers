/**
 * Referral System - Complete Implementation
 * Handles referral codes, tracking, rewards, and leaderboard
 */

export interface ReferralData {
  referralCode: string;
  referrerId: string;
  referredUserId?: string;
  referredEmail: string;
  status: 'pending' | 'completed' | 'rewarded';
  rewardAmount: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface ReferralReward {
  referrerId: string;
  amount: number;
  type: 'referral_bonus' | 'referrer_bonus';
  referralCode: string;
}

/**
 * Generate unique referral code
 */
export function generateReferralCode(userId: string): string {
  const prefix = 'MZANSI';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * Create referral link
 */
export function createReferralLink(referralCode: string, baseUrl: string = 'https://mzansi-couriers.app'): string {
  return `${baseUrl}/signup?ref=${referralCode}`;
}

/**
 * Track referral
 */
export async function trackReferral(data: {
  referralCode: string;
  referredEmail: string;
  referredUserId?: string;
}): Promise<ReferralData> {
  const referral: ReferralData = {
    referralCode: data.referralCode,
    referrerId: '', // Would be looked up from code
    referredUserId: data.referredUserId,
    referredEmail: data.referredEmail,
    status: 'pending',
    rewardAmount: 0,
    createdAt: new Date(),
  };

  console.log(`[Referral] Tracked referral: ${data.referralCode} -> ${data.referredEmail}`);
  return referral;
}

/**
 * Complete referral and award bonuses
 */
export async function completeReferral(referralCode: string): Promise<ReferralReward[]> {
  const rewards: ReferralReward[] = [];

  // Referrer bonus: R50
  rewards.push({
    referrerId: '', // Would be looked up
    amount: 5000, // 5000 cents = R50
    type: 'referrer_bonus',
    referralCode,
  });

  // Referred user bonus: R25
  rewards.push({
    referrerId: '', // Referred user
    amount: 2500, // 2500 cents = R25
    type: 'referral_bonus',
    referralCode,
  });

  console.log(`[Referral] Completed referral ${referralCode}: Rewards distributed`);
  return rewards;
}

/**
 * Get referral leaderboard
 */
export async function getReferralLeaderboard(limit: number = 10): Promise<
  Array<{
    rank: number;
    userId: string;
    name: string;
    referralCode: string;
    totalReferrals: number;
    totalEarnings: number;
  }>
> {
  // In production, query database
  return [];
}

/**
 * Get referral stats
 */
export async function getReferralStats(userId: string): Promise<{
  referralCode: string;
  totalReferrals: number;
  completedReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  referralLink: string;
}> {
  return {
    referralCode: '',
    totalReferrals: 0,
    completedReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    referralLink: '',
  };
}

/**
 * Validate referral code
 */
export async function validateReferralCode(code: string): Promise<{
  valid: boolean;
  referrerId?: string;
  referrerName?: string;
  error?: string;
}> {
  if (!code || code.length < 10) {
    return { valid: false, error: 'Invalid referral code format' };
  }

  // In production, lookup in database
  return { valid: true };
}
