import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createCourierReferral,
  getCourierReferralByCode,
  getCourierReferralsByReferrer,
  updateCourierReferralDeliveries,
  markCourierReferralBonusPaid,
  getCourierReferralStats,
} from "../db";
import { TRPCError } from "@trpc/server";

export const courierReferralRouter = router({
  // Get or create referral code for courier
  getOrCreateCode: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "courier") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can use this feature" });
    }

    // Generate unique code: COURIER-{userId}-{random}
    const userId = typeof ctx.user.id === 'string' ? ctx.user.id : String(ctx.user.id);
    const code = `COURIER-${userId.substring(0, 6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return { code, message: "Share this code with other couriers to earn bonuses!" };
  }),

  // Redeem courier referral code
  redeemCode: protectedProcedure
    .input(z.object({ code: z.string().min(5) }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "courier") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can redeem referral codes" });
      }

      // Validate code format
      if (!input.code.startsWith("COURIER-")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid courier referral code" });
      }

      // Check if code exists
      const referral = await getCourierReferralByCode(input.code);
      if (!referral) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Referral code not found" });
      }

      const userId = typeof ctx.user.id === 'string' ? ctx.user.id : String(ctx.user.id);
      if (referral.referredCourierId === userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot use your own referral code" });
      }

      // Update referral with new courier
      await updateCourierReferralDeliveries(referral.id, 0);

      return {
        success: true,
        message: `Welcome! You're now referred by ${referral.referrerCourierId}. Complete 10 deliveries to earn them a R${referral.bonusAmount} bonus!`,
        referrerCourierId: referral.referrerCourierId,
      };
    }),

  // Get referral stats for current courier
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "courier") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can view referral stats" });
    }

    const userId = typeof ctx.user.id === 'string' ? ctx.user.id : String(ctx.user.id);
    const stats = await getCourierReferralStats(userId);
    return stats;
  }),

  // Get all referrals for current courier
  getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "courier") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can view referrals" });
    }

    const userId = typeof ctx.user.id === 'string' ? ctx.user.id : String(ctx.user.id);
    const referrals = await getCourierReferralsByReferrer(userId);
    return referrals.map(ref => ({
      id: ref.id,
      referredCourierId: ref.referredCourierId,
      bonusAmount: ref.bonusAmount,
      bonusStatus: ref.bonusStatus,
      deliveriesProgress: ref.referredCourierDeliveries,
      deliveryThreshold: ref.deliveryThreshold,
      progressPercent: Math.min(100, (ref.referredCourierDeliveries / ref.deliveryThreshold) * 100),
      createdAt: ref.createdAt,
      bonusEarnedAt: ref.bonusEarnedAt,
    }));
  }),

  // Update delivery count for referred courier
  updateDeliveryCount: protectedProcedure
    .input(z.object({ referralId: z.number(), deliveryCount: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verify the user is the referrer
      const referral = await getCourierReferralByCode(`REF-${input.referralId}`);
      const userId = typeof ctx.user.id === 'string' ? ctx.user.id : String(ctx.user.id);
      if (!referral || referral.referrerCourierId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own referrals" });
      }
      await updateCourierReferralDeliveries(input.referralId, input.deliveryCount);
      return { success: true };
    }),

  // Mark bonus as paid (admin/system only)
  markBonusPaid: protectedProcedure
    .input(z.object({ referralId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // In production, check if user is admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can mark bonuses as paid" });
      }

      await markCourierReferralBonusPaid(input.referralId);
      return { success: true, message: "Bonus marked as paid" };
    }),

  // Get referral code for sharing
  getShareLink: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "courier") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only couriers can share referral links" });
    }

    const userId = typeof ctx.user.id === 'string' ? ctx.user.id : String(ctx.user.id);
    const code = `COURIER-${userId.substring(0, 6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const shareMessage = `Join me on Mzansi Couriers and earn money! Use my referral code: ${code} when you sign up. I'll earn a R50-R100 bonus when you complete 10 deliveries! 🚗💰`;

    return {
      code,
      whatsappLink: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
      smsText: shareMessage,
      message: shareMessage,
    };
  }),
});
