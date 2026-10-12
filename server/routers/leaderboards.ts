/**
 * Mzansi Couriers V2.0 - Leaderboards & Recognition
 * Monthly and lifetime rankings across multiple categories
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

// ==================== LEADERBOARD CATEGORIES ====================

export const leaderboardCategories = [
  { id: "top_ambassadors", name: "Top Ambassadors", metric: "totalReferrals", icon: "🌟" },
  { id: "top_partners", name: "Top Partners", metric: "deliveriesCompleted", icon: "🤝" },
  { id: "top_businesses", name: "Top Businesses", metric: "totalDeliveries", icon: "💼" },
  { id: "top_referrers", name: "Top Referrers", metric: "activeReferrals", icon: "📢" },
  { id: "highest_rated", name: "Highest Rated", metric: "averageRating", icon: "⭐" },
  { id: "most_deliveries", name: "Most Deliveries", metric: "totalDeliveries", icon: "📦" },
  { id: "fastest_delivery", name: "Fastest Delivery", metric: "averageDeliveryTime", icon: "⚡" },
  { id: "carbon_champions", name: "Carbon Champions", metric: "carbonSavings", icon: "🌱" },
  { id: "community_builders", name: "Community Builders", metric: "communityImpact", icon: "🏘️" },
  { id: "rising_stars", name: "Rising Stars", metric: "monthlyGrowth", icon: "🚀" },
];

// ==================== RECOGNITION BADGES ====================

export const recognitionBadges = {
  ambassador: {
    Bronze: { icon: "🥉", color: "#CD7F32", requirement: "1+ referral" },
    Silver: { icon: "🥈", color: "#C0C0C0", requirement: "10+ referrals" },
    Gold: { icon: "🥇", color: "#FFD700", requirement: "50+ referrals" },
    Platinum: { icon: "💎", color: "#E5E4E2", requirement: "100+ referrals" },
    Diamond: { icon: "👑", color: "#B9F2FF", requirement: "250+ referrals" },
  },
  partner: {
    Trusted: { icon: "✅", color: "#4CAF50", requirement: "100+ deliveries, 4.5+ rating" },
    Elite: { icon: "🏆", color: "#FFC107", requirement: "500+ deliveries, 4.8+ rating" },
    Legend: { icon: "👑", color: "#FFD700", requirement: "1000+ deliveries, 4.9+ rating" },
  },
  business: {
    Verified: { icon: "✔️", color: "#2196F3", requirement: "Verified business account" },
    Premium: { icon: "⭐", color: "#FF9800", requirement: "50+ deliveries" },
    Enterprise: { icon: "🏢", color: "#9C27B0", requirement: "500+ deliveries" },
  },
};

// ==================== ROUTER ====================

export const leaderboardsRouter = router({
  // ==================== MONTHLY LEADERBOARDS ====================

  /**
   * Get monthly leaderboard
   */
  getMonthlyLeaderboard: publicProcedure
    .input(
      z.object({
        category: z.enum([
          "top_ambassadors",
          "top_partners",
          "top_businesses",
          "top_referrers",
          "highest_rated",
          "most_deliveries",
          "fastest_delivery",
          "carbon_champions",
          "community_builders",
          "rising_stars",
        ]),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        // Rankings remain empty until they are read from verified database records.
        const leaderboard: Array<Record<string, unknown>> = [];

        return {
          category: input.category,
          period: "monthly",
          leaderboard,
          totalEntries: 1250,
          yourRank: 42,
          yourValue: 25,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch monthly leaderboard",
        });
      }
    }),

  /**
   * Get lifetime leaderboard
   */
  getLifetimeLeaderboard: publicProcedure
    .input(
      z.object({
        category: z.enum([
          "top_ambassadors",
          "top_partners",
          "top_businesses",
          "top_referrers",
          "highest_rated",
          "most_deliveries",
          "fastest_delivery",
          "carbon_champions",
          "community_builders",
          "rising_stars",
        ]),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        // Rankings remain empty until they are read from verified database records.
        const leaderboard: Array<Record<string, unknown>> = [];

        return {
          category: input.category,
          period: "lifetime",
          leaderboard,
          totalEntries: 1250,
          yourRank: 42,
          yourValue: 250,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch lifetime leaderboard",
        });
      }
    }),

  /**
   * Get user's leaderboard position
   */
  getUserPosition: protectedProcedure
    .input(
      z.object({
        category: z.string(),
        period: z.enum(["monthly", "lifetime"]),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Position data remains unavailable until it is calculated from verified records.
        return null;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user position",
        });
      }
    }),

  // ==================== RECOGNITION BADGES ====================

  /**
   * Get user's badges
   */
  getUserBadges: protectedProcedure.query(async ({ ctx }) => {
    try {
      return {
        badges: [],
        totalBadges: 0,
        nextBadge: null,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user badges",
      });
    }
  }),

  /**
   * Get badge details
   */
  getBadgeDetails: publicProcedure
    .input(z.object({ badgeType: z.string(), badgeLevel: z.string() }))
    .query(async ({ input }) => {
      try {
        return null;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch badge details",
        });
      }
    }),

  // ==================== RECOGNITION PROGRAMS ====================

  /**
   * Get monthly recognition
   */
  getMonthlyRecognition: publicProcedure.query(async () => {
    try {
      return {
        month: null,
        topAmbassador: null,
        topPartner: null,
        topBusiness: null,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch monthly recognition",
      });
    }
  }),

  /**
   * Get recognition history
   */
  getRecognitionHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      return {
        recognitions: [],
        totalRewards: 0,
        totalRecognitions: 0,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch recognition history",
      });
    }
  }),

  // ==================== LEADERBOARD CATEGORIES ====================

  /**
   * Get all leaderboard categories
   */
  getCategories: publicProcedure.query(async () => {
    try {
      return leaderboardCategories;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch categories",
      });
    }
  }),

  /**
   * Get badge types
   */
  getBadgeTypes: publicProcedure.query(async () => {
    try {
      return recognitionBadges;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch badge types",
      });
    }
  }),
});
