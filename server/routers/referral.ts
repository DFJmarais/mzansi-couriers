import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const referralRouter = router({
  /**
   * Generate or retrieve user's referral code
   */
  getOrCreateCode: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Check if code already exists
      let code = await db.getUserReferralCode(ctx.user.id);
      
      if (!code) {
        // Generate new code
        const newCode = await db.generateReferralCode(ctx.user.id);
        code = await db.getReferralCode(newCode);
      }
      
      return code;
    } catch (error) {
      console.error("[Referral] Failed to get/create code:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get referral code' });
    }
  }),

  /**
   * Redeem a referral code (new user signing up with referral)
   */
  redeemCode: protectedProcedure.input(z.object({
    referralCode: z.string(),
  })).mutation(async ({ ctx, input }) => {
    try {
      const code = await db.getReferralCode(input.referralCode);
      
      if (!code) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid referral code' });
      }
      
      if (!code.isActive) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Referral code is no longer active' });
      }
      
      if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Referral code has expired' });
      }
      
      // Initialize stars for new user
      await db.initializeUserStars(ctx.user.id);
      
      // Award star to referrer (signup bonus)
      await db.awardStar(code.userId, ctx.user.id, 'referral_signup', 1);
      
      return { success: true, message: 'Referral code redeemed! Referrer earned 1 star.' };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[Referral] Failed to redeem code:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to redeem referral code' });
    }
  }),

  /**
   * Get user's star count and referral stats
   */
  getStars: protectedProcedure.query(async ({ ctx }) => {
    try {
      const stars = await db.getUserStars(ctx.user.id);
      
      if (!stars) {
        // Initialize if doesn't exist
        await db.initializeUserStars(ctx.user.id);
        return {
          userId: ctx.user.id,
          starCount: 0,
          totalReferred: 0,
          updatedAt: new Date(),
        };
      }
      
      return stars;
    } catch (error) {
      console.error("[Referral] Failed to get stars:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get star count' });
    }
  }),

  /**
   * Get star history for user
   */
  getStarHistory: protectedProcedure.input(z.object({
    limit: z.number().optional().default(50),
  })).query(async ({ ctx, input }) => {
    try {
      const history = await db.getStarHistory(ctx.user.id, input.limit);
      return history;
    } catch (error) {
      console.error("[Referral] Failed to get star history:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get star history' });
    }
  }),

  /**
   * Award star for first delivery (admin/system use)
   */
  awardFirstDeliveryStar: protectedProcedure.input(z.object({
    courierId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    try {
      // Only allow admin or the courier themselves
      if (ctx.user.role !== 'admin' && ctx.user.id !== input.courierId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
      }
      
      // Award star for first delivery
      await db.awardStar(input.courierId, input.courierId, 'first_delivery', 1);
      
      return { success: true, message: 'Star awarded for first delivery!' };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[Referral] Failed to award star:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to award star' });
    }
  }),

  /**
   * Get referral sharing link (WhatsApp/SMS friendly)
   */
  getShareLink: protectedProcedure.query(async ({ ctx }) => {
    try {
      const code = await db.getUserReferralCode(ctx.user.id);
      
      if (!code) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No referral code found' });
      }
      
      const baseUrl = process.env.VITE_APP_FRONTEND_URL || 'https://mzansicourier.com';
      const shareLink = `${baseUrl}?ref=${code.code}`;
      const whatsappMessage = `🚗 Join Mzansi Couriers and earn money with your vehicle! Use my referral code: ${code.code}\n\n${shareLink}`;
      
      return {
        link: shareLink,
        code: code.code,
        whatsappMessage,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[Referral] Failed to get share link:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get share link' });
    }
  }),
});
