import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

// ============ ADMIN PROCEDURE ============
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

/**
 * Calculate surge multiplier based on current time and demand
 */
function calculateSurgeMultiplier(configs: any[], pendingDeliveryCount: number): { multiplier: number; reason: string } {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  
  let maxMultiplier = 1.0;
  let reason = 'base_price';
  
  // Find matching surge config
  for (const config of configs) {
    if (!config.isActive) continue;
    
    // Check time slot
    const hourInRange = hour >= config.startHour && hour < config.endHour;
    if (!hourInRange) continue;
    
    // Check day of week
    const dayMatches = !config.dayOfWeek || config.dayOfWeek === 'all' || config.dayOfWeek === dayOfWeek;
    if (!dayMatches) continue;
    
    // Check demand threshold
    const demandMet = pendingDeliveryCount >= (config.demandThreshold || 5);
    if (!demandMet) continue;
    
    // This config matches - use its multiplier
    const configMultiplier = parseFloat(config.multiplier || '1.0');
    if (configMultiplier > maxMultiplier) {
      maxMultiplier = configMultiplier;
      reason = config.timeSlot || 'surge_pricing';
    }
  }
  
  return { multiplier: maxMultiplier, reason };
}

/**
 * Get count of pending deliveries
 */
async function getPendingDeliveryCount(): Promise<number> {
  // This would need to be implemented in db.ts
  // For now, return a placeholder
  return 0;
}

export const surgePricingRouter = router({
  /**
   * Admin: Create surge pricing configuration
   */
  createConfig: adminProcedure.input(z.object({
    timeSlot: z.string(),
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
    dayOfWeek: z.string().optional(),
    multiplier: z.number().min(1.0).max(5.0),
    demandThreshold: z.number().optional(),
  })).mutation(async ({ input }) => {
    try {
      await db.createSurgePricingConfig({
        timeSlot: input.timeSlot,
        startHour: input.startHour,
        endHour: input.endHour,
        dayOfWeek: input.dayOfWeek,
        multiplier: input.multiplier.toString(),
        demandThreshold: input.demandThreshold || 5,
        isActive: true,
      });
      
      return { success: true, message: 'Surge pricing config created' };
    } catch (error) {
      console.error("[SurgePricing] Failed to create config:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create surge pricing config' });
    }
  }),

  /**
   * Admin: Get all surge pricing configs
   */
  getConfigs: adminProcedure.query(async () => {
    try {
      const configs = await db.getSurgePricingConfigs(true);
      return configs;
    } catch (error) {
      console.error("[SurgePricing] Failed to get configs:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get surge pricing configs' });
    }
  }),

  /**
   * Admin: Update surge pricing configuration
   */
  updateConfig: adminProcedure.input(z.object({
    id: z.number(),
    multiplier: z.number().optional(),
    demandThreshold: z.number().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    try {
      const updates: any = {};
      if (input.multiplier !== undefined) updates.multiplier = input.multiplier.toString();
      if (input.demandThreshold !== undefined) updates.demandThreshold = input.demandThreshold;
      if (input.isActive !== undefined) updates.isActive = input.isActive;
      
      await db.updateSurgePricingConfig(input.id, updates);
      
      return { success: true, message: 'Surge pricing config updated' };
    } catch (error) {
      console.error("[SurgePricing] Failed to update config:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update surge pricing config' });
    }
  }),

  /**
   * Calculate current surge multiplier (public)
   */
  calculateMultiplier: protectedProcedure.query(async () => {
    try {
      const configs = await db.getSurgePricingConfigs(true);
      const pendingCount = await getPendingDeliveryCount();
      
      const { multiplier, reason } = calculateSurgeMultiplier(configs, pendingCount);
      
      return {
        multiplier,
        reason,
        isActive: multiplier > 1.0,
      };
    } catch (error) {
      console.error("[SurgePricing] Failed to calculate multiplier:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to calculate surge multiplier' });
    }
  }),

  /**
   * Calculate final price with surge
   */
  calculateFinalPrice: protectedProcedure.input(z.object({
    basePrice: z.number(),
  })).query(async ({ input }) => {
    try {
      const configs = await db.getSurgePricingConfigs(true);
      const pendingCount = await getPendingDeliveryCount();
      
      const { multiplier, reason } = calculateSurgeMultiplier(configs, pendingCount);
      const finalPrice = input.basePrice * multiplier;
      
      return {
        basePrice: input.basePrice,
        multiplier,
        finalPrice,
        reason,
        savings: multiplier === 1.0 ? 0 : input.basePrice * (multiplier - 1),
      };
    } catch (error) {
      console.error("[SurgePricing] Failed to calculate price:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to calculate final price' });
    }
  }),

  /**
   * Record surge pricing for a delivery
   */
  recordSurge: protectedProcedure.input(z.object({
    deliveryId: z.number(),
    basePrice: z.number(),
    surgeMultiplier: z.number(),
    finalPrice: z.number(),
    reason: z.string().optional(),
  })).mutation(async ({ input }) => {
    try {
      await db.recordSurgePricingHistory({
        deliveryId: input.deliveryId,
        basePrice: input.basePrice.toString(),
        surgeMultiplier: input.surgeMultiplier.toString(),
        finalPrice: input.finalPrice.toString(),
        reason: input.reason,
      });
      
      return { success: true };
    } catch (error) {
      console.error("[SurgePricing] Failed to record surge:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to record surge pricing' });
    }
  }),

  /**
   * Get surge pricing history for a delivery
   */
  getSurgeHistory: protectedProcedure.input(z.object({
    deliveryId: z.number(),
  })).query(async ({ input }) => {
    try {
      const history = await db.getSurgePricingHistory(input.deliveryId);
      return history;
    } catch (error) {
      console.error("[SurgePricing] Failed to get surge history:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get surge history' });
    }
  }),
});
