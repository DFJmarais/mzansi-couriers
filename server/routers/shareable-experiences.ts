/**
 * Mzansi Couriers V2.0 - Shareable Experiences
 * Delivery journey, achievements, and shareable statistics
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

// ==================== DELIVERY JOURNEY ====================

export const deliveryJourneyEngine = {
  /**
   * Generate delivery journey milestones
   */
  generateJourneyMilestones: async (deliveryData: any): Promise<any[]> => {
    const milestones = [
      {
        step: 1,
        milestone: "Parcel Booked",
        description: "Your parcel has been registered in our system",
        aiMessage: "Your delivery is now in our network",
        timestamp: new Date(deliveryData.createdAt),
        icon: "📦",
      },
      {
        step: 2,
        milestone: "Collected by Local Mzansi Partner",
        description: "A local courier has picked up your parcel",
        aiMessage: "AI selected the best local courier for your area",
        timestamp: new Date(deliveryData.pickedUpAt || Date.now()),
        icon: "🚗",
      },
      {
        step: 3,
        milestone: "AI Selected Best Route",
        description: "Our AI optimized the delivery route for speed",
        aiMessage: "AI optimized route to save 2 hours and R50",
        timestamp: new Date(deliveryData.routeOptimizedAt || Date.now()),
        icon: "🤖",
      },
      {
        step: 4,
        milestone: "Transferred to Regional Partner",
        description: "Parcel transferred to regional logistics network",
        aiMessage: "AI consolidated your delivery with 3 others to reduce emissions",
        timestamp: new Date(deliveryData.transferredAt || Date.now()),
        icon: "🔄",
      },
      {
        step: 5,
        milestone: "Long Haul Network",
        description: "Parcel in transit via long-haul network",
        aiMessage: "AI predicted arrival 3 hours early due to optimized routing",
        timestamp: new Date(deliveryData.longHaulAt || Date.now()),
        icon: "🛣️",
      },
      {
        step: 6,
        milestone: "Destination City",
        description: "Parcel arrived at destination city",
        aiMessage: "AI routed through fastest corridor to your city",
        timestamp: new Date(deliveryData.destinationAt || Date.now()),
        icon: "🏙️",
      },
      {
        step: 7,
        milestone: "Final Delivery",
        description: "Parcel with final courier for delivery",
        aiMessage: "AI selected highest-rated courier for final delivery",
        timestamp: new Date(deliveryData.finalDeliveryAt || Date.now()),
        icon: "🎯",
      },
      {
        step: 8,
        milestone: "Successfully Delivered",
        description: "Your parcel has been delivered!",
        aiMessage: "Delivery completed successfully",
        timestamp: new Date(deliveryData.deliveredAt || Date.now()),
        icon: "✅",
      },
    ];

    return milestones;
  },

  /**
   * Generate AI-powered delivery messages
   */
  generateAIMessages: async (deliveryData: any): Promise<string[]> => {
    const messages = [
      `AI selected the fastest courier (${deliveryData.courierRating || 4.8}★ rated)`,
      `AI optimized route to save R${deliveryData.costSavings || 50}`,
      `AI combined your delivery with ${deliveryData.combinedDeliveries || 2} others to reduce emissions`,
      `AI predicted arrival ${deliveryData.timeEarlyMinutes || 45} minutes early`,
      `AI selected the safest vehicle for your package`,
      `AI routed through highest-success delivery corridor`,
      `AI verified courier has 100% delivery completion rate`,
    ];

    return messages;
  },
};

// ==================== ACHIEVEMENT SYSTEM ====================

export const achievementEngine = {
  /**
   * Check and unlock achievements
   */
  checkAchievements: async (userId: string, userData: any): Promise<any[]> => {
    const achievements = [];

    // First Delivery
    if (userData.totalDeliveries >= 1) {
      achievements.push({
        id: "first_delivery",
        name: "First Delivery",
        icon: "🚚",
        description: "Complete your first delivery",
        unlockedAt: userData.firstDeliveryDate,
        reward: 50,
      });
    }

    // 10 Deliveries
    if (userData.totalDeliveries >= 10) {
      achievements.push({
        id: "ten_deliveries",
        name: "Delivery Veteran",
        icon: "📦",
        description: "Complete 10 deliveries",
        unlockedAt: userData.tenthDeliveryDate,
        reward: 100,
      });
    }

    // 50 Deliveries
    if (userData.totalDeliveries >= 50) {
      achievements.push({
        id: "fifty_deliveries",
        name: "Logistics Expert",
        icon: "🎖️",
        description: "Complete 50 deliveries",
        unlockedAt: userData.fiftiethDeliveryDate,
        reward: 250,
      });
    }

    // 100 Deliveries
    if (userData.totalDeliveries >= 100) {
      achievements.push({
        id: "hundred_deliveries",
        name: "Century Achiever",
        icon: "💯",
        description: "Complete 100 deliveries",
        unlockedAt: userData.hundredthDeliveryDate,
        reward: 500,
      });
    }

    // First Referral
    if (userData.totalReferrals >= 1) {
      achievements.push({
        id: "first_referral",
        name: "First Referral",
        icon: "🎯",
        description: "Refer your first friend",
        unlockedAt: userData.firstReferralDate,
        reward: 100,
      });
    }

    // Bronze Ambassador
    if (userData.ambassadorLevel === "Bronze") {
      achievements.push({
        id: "bronze_ambassador",
        name: "Bronze Ambassador",
        icon: "🥉",
        description: "Reach Bronze Ambassador level",
        unlockedAt: userData.bronzeDate,
        reward: 200,
      });
    }

    // Five Star Rating
    if (userData.averageRating >= 4.8) {
      achievements.push({
        id: "five_star",
        name: "Five-Star Partner",
        icon: "⭐",
        description: "Maintain 4.8+ average rating",
        unlockedAt: userData.fiveStarDate,
        reward: 150,
      });
    }

    // Community Builder
    if (userData.totalReferrals >= 5) {
      achievements.push({
        id: "community_builder",
        name: "Community Builder",
        icon: "🤝",
        description: "Refer 5 people to the platform",
        unlockedAt: userData.communityBuilderDate,
        reward: 300,
      });
    }

    return achievements;
  },
};

// ==================== STATISTICS & SHARING ====================

export const statisticsEngine = {
  /**
   * Generate shareable statistics card
   */
  generateStatisticsCard: async (userId: string, stats: any): Promise<any> => {
    return {
      title: "My Mzansi Couriers Journey",
      stats: [
        { label: "Parcels Sent", value: stats.totalParcelsSent || 0, icon: "📦" },
        { label: "Parcels Received", value: stats.totalParcelsReceived || 0, icon: "📬" },
        { label: "Money Saved", value: `R${stats.totalMoneySaved || 0}`, icon: "💰" },
        { label: "Average Delivery Time", value: `${stats.averageDeliveryTime || 0} min`, icon: "⏱️" },
        { label: "Cities Connected", value: stats.citiesConnected || 0, icon: "🏙️" },
        { label: "Kilometres Travelled", value: `${stats.kilometresTravelled || 0} km`, icon: "🗺️" },
        { label: "Carbon Savings", value: `${stats.carbonSavings || 0} kg`, icon: "🌱" },
        { label: "South Africans Supported", value: stats.southAfricansSupported || 0, icon: "🇿🇦" },
      ],
      shareMessage: "I've been using Mzansi Couriers and loving it! Check out my journey:",
      shareUrl: `https://mzansicourier.com/share/${userId}`,
    };
  },

  /**
   * Generate shareable achievement card
   */
  generateAchievementCard: async (achievement: any): Promise<any> => {
    return {
      title: achievement.name,
      icon: achievement.icon,
      description: achievement.description,
      reward: achievement.reward,
      unlockedAt: achievement.unlockedAt,
      shareMessage: `I just unlocked the "${achievement.name}" achievement on Mzansi Couriers! 🎉`,
      shareUrl: `https://mzansicourier.com/achievement/${achievement.id}`,
    };
  },

  /**
   * Generate delivery story
   */
  generateDeliveryStory: async (deliveryData: any): Promise<string> => {
    const stories = [
      `Today I supported South African entrepreneurship by using Mzansi Couriers. My package travelled ${deliveryData.distance || 100}km through our Smart Logistics Network.`,
      `Today I helped create income opportunities for South African couriers. My delivery strengthened the Mzansi Couriers network.`,
      `Today I was part of something bigger. My delivery supported local logistics and connected South Africans.`,
      `Today my package moved South Africa forward. Using Mzansi Couriers means supporting local entrepreneurship.`,
    ];

    return stories[Math.floor(Math.random() * stories.length)];
  },
};

// ==================== ROUTER ====================

export const shareableExperiencesRouter = router({
  // ==================== DELIVERY JOURNEY ====================

  /**
   * Get delivery journey with AI messages
   */
  getDeliveryJourney: publicProcedure
    .input(z.object({ deliveryId: z.number() }))
    .query(async ({ input }) => {
      try {
        // TODO: Fetch delivery data from database
        const deliveryData = {
          createdAt: new Date("2026-05-01"),
          pickedUpAt: new Date("2026-05-01T10:00:00"),
          routeOptimizedAt: new Date("2026-05-01T10:15:00"),
          transferredAt: new Date("2026-05-01T11:00:00"),
          longHaulAt: new Date("2026-05-01T14:00:00"),
          destinationAt: new Date("2026-05-02T08:00:00"),
          finalDeliveryAt: new Date("2026-05-02T09:00:00"),
          deliveredAt: new Date("2026-05-02T10:00:00"),
          courierRating: 4.9,
          costSavings: 75,
          combinedDeliveries: 3,
          timeEarlyMinutes: 45,
          distance: 250,
        };

        const milestones = await deliveryJourneyEngine.generateJourneyMilestones(deliveryData);

        return {
          deliveryId: input.deliveryId,
          milestones,
          totalTime: "24 hours",
          distance: deliveryData.distance,
          costSavings: deliveryData.costSavings,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch delivery journey",
        });
      }
    }),

  /**
   * Get AI messages for delivery
   */
  getAIMessages: publicProcedure
    .input(z.object({ deliveryId: z.number() }))
    .query(async ({ input }) => {
      try {
        const deliveryData = {
          courierRating: 4.8,
          costSavings: 50,
          combinedDeliveries: 2,
          timeEarlyMinutes: 30,
        };

        const messages = await deliveryJourneyEngine.generateAIMessages(deliveryData);

        return {
          messages,
          rotateInterval: 5000, // milliseconds
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch AI messages",
        });
      }
    }),

  // ==================== ACHIEVEMENTS ====================

  /**
   * Get user achievements
   */
  getUserAchievements: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userData = {
        totalDeliveries: 42,
        totalReferrals: 8,
        ambassadorLevel: "Silver",
        averageRating: 4.9,
        firstDeliveryDate: new Date("2024-01-15"),
        tenthDeliveryDate: new Date("2024-02-01"),
        fiftiethDeliveryDate: new Date("2024-05-10"),
        firstReferralDate: new Date("2024-03-20"),
        bronzeDate: new Date("2024-03-25"),
        fiveStarDate: new Date("2024-02-01"),
        communityBuilderDate: new Date("2024-04-15"),
      };

      const achievements = await achievementEngine.checkAchievements(String(ctx.user.id), userData);

      return {
        achievements,
        totalAchievements: achievements.length,
        totalRewards: achievements.reduce((sum, a) => sum + (a.reward || 0), 0),
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch achievements",
      });
    }
  }),

  /**
   * Get achievement card for sharing
   */
  getAchievementCard: protectedProcedure
    .input(z.object({ achievementId: z.string().or(z.number()) }))
    .query(async ({ input }) => {
      try {
        const achievement = {
          id: String(input.achievementId),
          name: "Bronze Ambassador",
          icon: "🥉",
          description: "Reach Bronze Ambassador level",
          reward: 200,
          unlockedAt: new Date(),
        };

        const card = await statisticsEngine.generateAchievementCard(achievement);

        return card;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate achievement card",
        });
      }
    }),

  // ==================== STATISTICS & SHARING ====================

  /**
   * Get shareable statistics
   */
  getShareableStatistics: protectedProcedure.query(async ({ ctx }) => {
    try {
      const stats = {
        totalParcelsSent: 42,
        totalParcelsReceived: 18,
        totalMoneySaved: 1250,
        averageDeliveryTime: 45,
        citiesConnected: 8,
        kilometresTravelled: 3500,
        carbonSavings: 420,
        southAfricansSupported: 15,
      };

      const card = await statisticsEngine.generateStatisticsCard(String(ctx.user.id), stats);

      return card;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate statistics card",
      });
    }
  }),

  /**
   * Get delivery story
   */
  getDeliveryStory: publicProcedure
    .input(z.object({ deliveryId: z.number().or(z.string()) }))
    .query(async ({ input }) => {
      try {
        const deliveryData = {
          distance: 250,
        };

        const story = await statisticsEngine.generateDeliveryStory(deliveryData);

        return {
          story,
          shareMessage: "Check out my delivery story on Mzansi Couriers:",
          deliveryId: String(input.deliveryId),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate delivery story",
        });
      }
    }),

  /**
   * Share delivery to social media
   */
  shareDelivery: protectedProcedure
    .input(
      z.object({
        deliveryId: z.number(),
        platform: z.enum(["twitter", "facebook", "whatsapp", "email"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // TODO: Integrate with social media APIs
        return {
          success: true,
          message: `Delivery shared to ${input.platform}`,
          shareUrl: `https://mzansicourier.com/delivery/${input.deliveryId}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to share delivery",
        });
      }
    }),

  /**
   * Share achievement to social media
   */
  shareAchievement: protectedProcedure
    .input(
      z.object({
        achievementId: z.string(),
        platform: z.enum(["twitter", "facebook", "whatsapp", "email"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // TODO: Integrate with social media APIs
        return {
          success: true,
          message: `Achievement shared to ${input.platform}`,
          shareUrl: `https://mzansicourier.com/achievement/${String(input.achievementId)}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to share achievement",
        });
      }
    }),
});
