import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createAchievement,
  getAchievements,
  unlockAchievement,
  getUserAchievements,
  updateLeaderboard,
  getLeaderboard,
  createSeasonalCompetition,
  getActiveCompetitions,
  recordCompetitionResult,
  getCompetitionResults,
} from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Achievements & Gamification Router
 * Handles achievements, badges, leaderboards, and seasonal competitions
 */

export const achievementsRouter = router({
  /**
   * Get all available achievements (optionally filtered by category)
   */
  getAchievements: publicProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(async ({ input }) => {
      try {
        const achievements = await getAchievements(input.category);
        return achievements;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch achievements",
        });
      }
    }),

  /**
   * Get user's unlocked achievements
   */
  getUserAchievements: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userAchievements = await getUserAchievements(ctx.user.id);
      return userAchievements;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user achievements",
      });
    }
  }),

  /**
   * Unlock an achievement for a user (internal use)
   */
  unlockAchievement: protectedProcedure
    .input(z.object({ achievementId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await unlockAchievement(ctx.user.id, input.achievementId);
        return { success: true, message: "Achievement unlocked!" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unlock achievement",
        });
      }
    }),

  /**
   * Get leaderboard for a specific category
   */
  getLeaderboard: publicProcedure
    .input(
      z.object({
        category: z.enum([
          "total_deliveries",
          "total_earnings",
          "average_rating",
          "referrals",
          "completion_rate",
          "response_time",
          "customer_satisfaction",
          "weekly_earnings",
          "monthly_earnings",
        ]),
        period: z.enum(["all_time", "monthly", "weekly"]).default("all_time"),
        limit: z.number().default(10),
        zone: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const leaderboard = await getLeaderboard(
          input.category,
          input.period,
          input.limit,
          input.zone
        );
        return leaderboard;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch leaderboard",
        });
      }
    }),

  /**
   * Update user's leaderboard score
   */
  updateLeaderboardScore: protectedProcedure
    .input(
      z.object({
        category: z.string(),
        score: z.number(),
        period: z.string().default("all_time"),
        zone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await updateLeaderboard(
          ctx.user.id,
          input.category,
          input.score,
          input.period,
          input.zone
        );
        return { success: true, message: "Leaderboard updated" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update leaderboard",
        });
      }
    }),

  /**
   * Get active seasonal competitions
   */
  getActiveCompetitions: publicProcedure.query(async () => {
    try {
      const competitions = await getActiveCompetitions();
      return competitions;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch competitions",
      });
    }
  }),

  /**
   * Get competition results
   */
  getCompetitionResults: publicProcedure
    .input(z.object({ competitionId: z.number() }))
    .query(async ({ input }) => {
      try {
        const results = await getCompetitionResults(input.competitionId);
        return results;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch competition results",
        });
      }
    }),

  /**
   * Admin: Create new achievement
   */
  createAchievement: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        badge: z.enum(["bronze", "silver", "gold", "platinum"]),
        category: z.enum(["courier", "customer", "both"]).default("both"),
        triggerType: z.enum([
          "delivery_count",
          "rating",
          "referral_count",
          "earnings",
          "completion_rate",
          "response_time",
          "customer_satisfaction",
          "milestone",
        ]),
        triggerValue: z.number(),
        reward: z.number().default(0),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await createAchievement(input);
        return { success: true, message: "Achievement created" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create achievement",
        });
      }
    }),

  /**
   * Admin: Create seasonal competition
   */
  createCompetition: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        category: z.enum([
          "deliveries",
          "earnings",
          "ratings",
          "referrals",
          "customer_satisfaction",
        ]),
        period: z.enum(["weekly", "monthly", "quarterly"]),
        startDate: z.string(),
        endDate: z.string(),
        prizePool: z.number(),
        firstPrize: z.number().optional(),
        secondPrize: z.number().optional(),
        thirdPrize: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await createSeasonalCompetition({
          ...input,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
        });

        return { success: true, message: "Competition created" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create competition",
        });
      }
    }),

  /**
   * Get badge progression info
   */
  getBadgeProgression: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userAchievements = await getUserAchievements(ctx.user.id);
      
      // Count achievements by badge type
      const badgeCounts = {
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0,
      };

      // In a real implementation, you'd fetch achievement details
      // For now, return mock progression
      return {
        currentBadge: "silver",
        totalAchievements: userAchievements.length,
        badgeCounts,
        nextMilestone: "Gold Badge - Unlock 15 achievements",
        progressToNextBadge: 60, // percentage
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch badge progression",
      });
    }
  }),

  /**
   * Get user's rank across all categories
   */
  getUserRanks: protectedProcedure.query(async ({ ctx }) => {
    try {
      const categories = [
        "total_deliveries",
        "total_earnings",
        "average_rating",
        "referrals",
      ];

      const ranks: Record<string, any> = {};

      for (const category of categories) {
        const leaderboard = await getLeaderboard(category, "all_time", 1000);
        const userRank = leaderboard.findIndex((l: any) => l.userId === ctx.user.id);
        ranks[category] = {
          rank: userRank + 1,
          outOf: leaderboard.length,
          percentile: Math.round(((leaderboard.length - userRank) / leaderboard.length) * 100),
        };
      }

      return ranks;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user ranks",
      });
    }
  }),
});
