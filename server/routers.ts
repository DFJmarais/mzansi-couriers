import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { notificationRouter } from "./notifications";
import { onboardingRouter } from "./routers/onboarding";
import { smsEarningsRouter } from "./routers/sms-earnings";
import { TRPCError } from "@trpc/server";
import { sendMessageWithFallback } from "./_core/twilio";
import { gpsDisputesRouter } from "./routers/gps-disputes";
import { referralRouter } from "./routers/referral";
import { surgePricingRouter } from "./routers/surge-pricing";
import { zapierWorkflowsRouter } from "./routers/zapier-workflows";
import { achievementsRouter } from "./routers/achievements";
import { analyticsRouter } from "./routers/analytics";
import { courierReferralRouter } from "./routers/courier-referral";

// ============ ADMIN PROCEDURE ============
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// ============ COURIER PROCEDURE ============
const courierProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'courier') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Courier access required' });
  }
  return next({ ctx });
});

// ============ CUSTOMER PROCEDURE ============
const customerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'customer') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Customer access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  notifications: notificationRouter,
  onboarding: onboardingRouter,
  smsEarnings: smsEarningsRouter,
  gpsDisputes: gpsDisputesRouter,
  referral: referralRouter,
  surgePricing: surgePricingRouter,
  courierReferral: courierReferralRouter,
  zapierWorkflows: zapierWorkflowsRouter,
  achievements: achievementsRouter,
  analytics: analyticsRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    selectRole: protectedProcedure.input(z.object({
      role: z.enum(['customer', 'courier']),
    })).mutation(async ({ ctx, input }) => {
      await db.updateUserRole(ctx.user.id, input.role);
      return { success: true, role: input.role };
    }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ USER PROFILE ROUTES ============
  profile: router({
    getCourierProfile: courierProcedure.query(async ({ ctx }) => {
      return await db.getCourierProfile(ctx.user.id);
    }),
    
    createCourierProfile: courierProcedure.input(z.object({
      vehicleType: z.enum(['motorbike', 'car', 'van', 'bakkie']),
      vehicleRegistration: z.string(),
      licenseNumber: z.string(),
    })).mutation(async ({ ctx, input }) => {
      await db.createCourierProfile({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),

    updateAvailability: courierProcedure.input(z.object({
      isAvailable: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      await db.updateCourierAvailability(ctx.user.id, input.isAvailable);
      return { success: true };
    }),

    getUserAddresses: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAddresses(ctx.user.id);
    }),

    createAddress: protectedProcedure.input(z.object({
      label: z.string().optional(),
      street: z.string(),
      city: z.string(),
      postalCode: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      isDefault: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.createAddress({
        userId: ctx.user.id,
        label: input.label || null,
        street: input.street,
        city: input.city,
        postalCode: input.postalCode || null,
        latitude: input.latitude as any,
        longitude: input.longitude as any,
        isDefault: input.isDefault,
      });
      return { success: true };
    }),
  }),

  // ============ DELIVERY ROUTES ============
  delivery: router({
    createDelivery: customerProcedure.input(z.object({
      pickupAddressId: z.number(),
      dropoffAddressId: z.number(),
      pickupLatitude: z.number(),
      pickupLongitude: z.number(),
      dropoffLatitude: z.number(),
      dropoffLongitude: z.number(),
      packageSize: z.enum(['small', 'medium', 'large']),
      packageWeight: z.number(),
      packageDescription: z.string().optional(),
      distance: z.number(),
      estimatedPrice: z.string(),
      estimatedDeliveryTime: z.number(),
    })).mutation(async ({ ctx, input }) => {
      await db.createDelivery({
        customerId: ctx.user.id,
        pickupAddressId: input.pickupAddressId,
        dropoffAddressId: input.dropoffAddressId,
        pickupLatitude: input.pickupLatitude as any,
        pickupLongitude: input.pickupLongitude as any,
        dropoffLatitude: input.dropoffLatitude as any,
        dropoffLongitude: input.dropoffLongitude as any,
        packageSize: input.packageSize,
        packageWeight: input.packageWeight as any,
        packageDescription: input.packageDescription,
        distance: input.distance as any,
        estimatedPrice: input.estimatedPrice as any,
        estimatedDeliveryTime: input.estimatedDeliveryTime,
      });
      return { success: true };
    }),

    getDelivery: protectedProcedure.input(z.object({
      deliveryId: z.number(),
    })).query(async ({ input }) => {
      return await db.getDeliveryById(input.deliveryId);
    }),

    getMyDeliveries: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === 'customer') {
        return await db.getCustomerDeliveries(ctx.user.id);
      } else if (ctx.user.role === 'courier') {
        return await db.getCourierDeliveries(ctx.user.id);
      }
      return [];
    }),

    getPendingDeliveries: courierProcedure.query(async () => {
      return await db.getPendingDeliveries();
    }),

    acceptDelivery: courierProcedure.input(z.object({
      deliveryId: z.number(),
    })).mutation(async ({ ctx, input }: any) => {
      const delivery = await db.getDeliveryById(input.deliveryId);
      if (!delivery) return { success: false, error: 'Delivery not found' };
      const customer = await db.getUserById(delivery.customerId);
      const courier = await db.getUserById(ctx.user.id);
      
      await db.assignDeliveryToCourier(input.deliveryId, ctx.user.id);
      
      if (customer?.phone) {
        const { sendSMSMessage } = await import('./_core/twilio');
        const message = `Great news! A courier has been assigned.\nCourier: ${courier?.name || 'Courier'}\nPhone: ${courier?.phone || 'N/A'}\nTrack: mzansicourier.com/track/${input.deliveryId}`;
        await sendSMSMessage(customer.phone, message).catch(e => console.error('SMS error:', e));
      }
      
      return { success: true };
    }),

    updateDeliveryStatus: courierProcedure.input(z.object({
      deliveryId: z.number(),
      status: z.enum(['pending', 'assigned', 'in-transit', 'delivered']),
    })).mutation(async ({ input }: any) => {
      const delivery = await db.getDeliveryById(input.deliveryId);
      if (!delivery) return { success: false, error: 'Delivery not found' };
      const customer = await db.getUserById(delivery.customerId);
      
      await db.updateDeliveryStatus(input.deliveryId, input.status);
      
      if (customer?.phone) {
        const { sendSMSMessage } = await import('./_core/twilio');
        let message = '';
        
        if (input.status === 'in-transit') {
          message = `Your package is on the way!\nTracking ID: ${input.deliveryId}\nTrack: mzansicourier.com/track/${input.deliveryId}`;
        } else if (input.status === 'delivered') {
          message = `Your delivery is complete!\nThank you for using Mzansi Couriers!\nTracking ID: ${input.deliveryId}`;
        }
        
        if (message) {
          await sendSMSMessage(customer.phone, message).catch(e => console.error('SMS error:', e));
        }
      }
      
      return { success: true };
    }),

    completeDelivery: courierProcedure.input(z.object({
      deliveryId: z.number(),
      finalPrice: z.string(),
      proofOfDelivery: z.any().optional(),
    })).mutation(async ({ input }: any) => {
      const delivery = await db.getDeliveryById(input.deliveryId);
      if (!delivery) return { success: false, error: 'Delivery not found' };
      const customer = await db.getUserById(delivery.customerId);
      
      await db.completeDelivery(input.deliveryId, input.finalPrice, input.proofOfDelivery);
      
      if (customer?.phone) {
        const { sendSMSMessage } = await import('./_core/twilio');
        const message = `Your delivery is complete!\nFinal Price: R${parseFloat(input.finalPrice).toFixed(2)}\nTracking ID: ${input.deliveryId}\nThank you for using Mzansi Couriers!`;
        await sendSMSMessage(customer.phone, message).catch(e => console.error('SMS error:', e));
      }
      
      return { success: true };
    }),

    addTracking: courierProcedure.input(z.object({
      deliveryId: z.number(),
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional(),
      speed: z.number().optional(),
      heading: z.number().optional(),
      altitude: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { recordCourierLocation } = await import('./db.tracking');
      await recordCourierLocation(
        input.deliveryId,
        ctx.user.id,
        input.latitude,
        input.longitude,
        input.accuracy,
        input.speed,
        input.heading,
        input.altitude
      );
      return { success: true };
    }),

    getLatestLocation: protectedProcedure.input(z.object({
      deliveryId: z.number(),
    })).query(async ({ input }) => {
      return await db.getLatestDeliveryLocation(input.deliveryId);
    }),
  }),

  // ============ PRICING ROUTES ============
  pricing: router({
    getPricingConfig: publicProcedure.query(async () => {
      return await db.getPricingConfig();
    }),

    calculatePrice: publicProcedure.input(z.object({
      distance: z.number(),
      packageSize: z.enum(['small', 'medium', 'large']),
      packageWeight: z.number(),
    })).query(async ({ input }) => {
      // Unified pricing: R10/km across all South Africa
      // Base fare covers platform, insurance, maintenance, and courier margin
      const basePrice = 40; // R40 base (covers platform, insurance, maintenance)
      const pricePerKm = 10.0; // R10 per km (unified across all regions)
      const distancePrice = input.distance * pricePerKm;

      let multiplier = 1;
      if (input.packageSize === 'small') {
        multiplier = 1.0; // Up to 5kg
      } else if (input.packageSize === 'medium') {
        multiplier = 1.4; // 5-15kg
      } else if (input.packageSize === 'large') {
        multiplier = 1.8; // 15kg+
      }
      
      // Add weight surcharge (R1.00 per kg for items over 5kg)
      const weightSurcharge = Math.max(0, input.packageWeight - 5) * 1.0;

      const estimatedPrice = (basePrice + distancePrice) * multiplier + weightSurcharge;
      return { estimatedPrice: estimatedPrice.toFixed(2) };
    }),
  }),

  // ============ NOTIFICATION ROUTES ============
  notification: router({
    getMyNotifications: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserNotifications(ctx.user.id);
    }),

    markAsRead: protectedProcedure.input(z.object({
      notificationId: z.number(),
    })).mutation(async ({ input }) => {
      await db.markNotificationAsRead(input.notificationId);
      return { success: true };
    }),
  }),

  // ============ RATING ROUTES ============
  rating: router({
    createRating: protectedProcedure.input(z.object({
      deliveryId: z.number(),
      ratedUserId: z.number(),
      score: z.number().min(1).max(5),
      comment: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.createRating({
        deliveryId: input.deliveryId,
        ratedByUserId: ctx.user.id,
        ratedUserId: input.ratedUserId,
        score: input.score,
        comment: input.comment,
      });
      return { success: true };
    }),

    getUserRatings: protectedProcedure.input(z.object({
      userId: z.number(),
    })).query(async ({ input }) => {
      return await db.getUserRatings(input.userId);
    }),
  }),

  // ============ ADMIN ROUTES ============
  admin: router({
    getAnalytics: adminProcedure.query(async () => {
      const totalDeliveries = await db.getTotalDeliveries();
      const deliveredDeliveries = await db.getDeliveredDeliveries();
      const totalRevenue = await db.getTotalRevenue();
      const activeCouriers = await db.getActiveCouriers();

      return {
        totalDeliveries,
        deliveredDeliveries,
        totalRevenue,
        activeCouriers,
      };
    }),

    getAllDeliveries: adminProcedure.query(async () => {
      const deliveries = await db.getPendingDeliveries();
      return deliveries;
    }),

    getAvailableCouriers: adminProcedure.query(async () => {
      return await db.getAvailableCouriers();
    }),

    suspendCourier: adminProcedure.input(z.object({
      courierId: z.number(),
    })).mutation(async ({ input }) => {
      await db.updateCourierAvailability(input.courierId, false);
      return { success: true };
    }),

    approveCourier: adminProcedure.input(z.object({
      courierId: z.number(),
    })).mutation(async ({ input }) => {
      await db.updateCourierAvailability(input.courierId, true);
      return { success: true };
    }),
  }),

  // ============ PHASE 2: Regional Pricing & Zones ============
  zones: router({
    list: publicProcedure.query(async () => {
      return db.getDeliveryZones();
    }),
    
    getByName: publicProcedure.input(z.object({
      name: z.string(),
    })).query(async ({ input }) => {
      return db.getZoneByName(input.name);
    }),
  }),

  // ============ PHASE 2: Regional Pricing (getRegional added to pricing router above) ============

  // ============ PHASE 2: Payment Methods ============
  payments: router({
    addMethod: protectedProcedure.input(z.object({
      type: z.enum(['eft', 'capitec', 'card', 'wallet']),
      accountName: z.string().optional(),
      accountNumber: z.string().optional(),
      bankName: z.string().optional(),
      isDefault: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.createPaymentMethod(ctx.user.id, input);
      return { success: true };
    }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPaymentMethods(ctx.user.id);
    }),

    getDefault: protectedProcedure.query(async ({ ctx }) => {
      return db.getDefaultPaymentMethod(ctx.user.id);
    }),
  }),

  // ============ PHASE 2: User Preferences ============
  preferences: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPreferences(ctx.user.id);
    }),

    update: protectedProcedure.input(z.object({
      language: z.enum(['en', 'zu', 'xh']).optional(),
      notificationMethod: z.enum(['in_app', 'sms', 'whatsapp']).optional(),
      phoneNumber: z.string().optional(),
      whatsappNumber: z.string().optional(),
      preferredZone: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.createOrUpdateUserPreferences(ctx.user.id, input);
      return { success: true };
    }),
  }),

  // ============ PHASE 2: Community Metrics ============
  community: router({
    getMetrics: publicProcedure.input(z.object({
      zoneId: z.number(),
    })).query(async ({ input }) => {
      return db.getCommunityMetrics(input.zoneId);
    }),
  }),

  // ============ WHATSAPP MESSAGING ============
  whatsapp: router({
    sendDeliveryConfirmation: protectedProcedure.input(z.object({
      phoneNumber: z.string(),
      pickupAddress: z.string(),
      dropoffAddress: z.string(),
      estimatedPrice: z.number(),
      deliveryId: z.string(),
    })).mutation(async ({ input }) => {
      const message = `Hi! Your delivery has been confirmed.\n\nPickup: ${input.pickupAddress}\nDropoff: ${input.dropoffAddress}\nEstimated Price: R${input.estimatedPrice.toFixed(2)}\n\nTracking ID: ${input.deliveryId}\n\nTrack your delivery: mzansicourier.com/track/${input.deliveryId}`;
      const result = await sendMessageWithFallback(input.phoneNumber, message, true);
      return result;
    }),

    sendCourierAssigned: protectedProcedure.input(z.object({
      phoneNumber: z.string(),
      courierName: z.string(),
      courierPhone: z.string(),
      deliveryId: z.string(),
    })).mutation(async ({ input }) => {
      const message = `Great news! A courier has been assigned to your delivery.\n\nCourier: ${input.courierName}\nPhone: ${input.courierPhone}\n\nTracking ID: ${input.deliveryId}\n\nTrack live: mzansicourier.com/track/${input.deliveryId}`;
      const result = await sendMessageWithFallback(input.phoneNumber, message, true);
      return result;
    }),

    sendDeliveryPickedUp: protectedProcedure.input(z.object({
      phoneNumber: z.string(),
      deliveryId: z.string(),
    })).mutation(async ({ input }) => {
      const message = `Your package has been picked up!\n\nTracking ID: ${input.deliveryId}\n\nTrack live: mzansicourier.com/track/${input.deliveryId}`;
      const result = await sendMessageWithFallback(input.phoneNumber, message, true);
      return result;
    }),

    sendDeliveryComplete: protectedProcedure.input(z.object({
      phoneNumber: z.string(),
      deliveryId: z.string(),
      actualPrice: z.number(),
    })).mutation(async ({ input }) => {
      const message = `Your delivery is complete!\n\nFinal Price: R${input.actualPrice.toFixed(2)}\nTracking ID: ${input.deliveryId}\n\nThank you for using Mzansi Couriers!`;
      const result = await sendMessageWithFallback(input.phoneNumber, message, true);
      return result;
    }),

    sendCourierJobAlert: protectedProcedure.input(z.object({
      phoneNumber: z.string(),
      pickupAddress: z.string(),
      dropoffAddress: z.string(),
      estimatedPrice: z.number(),
      jobId: z.string(),
    })).mutation(async ({ input }) => {
      const message = `New job available!\n\nPickup: ${input.pickupAddress}\nDropoff: ${input.dropoffAddress}\nEstimated Earnings: R${input.estimatedPrice.toFixed(2)}\n\nAccept now: mzansicourier.com/jobs/${input.jobId}`;
      const result = await sendMessageWithFallback(input.phoneNumber, message, true);
      return result;
    }),
  }),
});

export type AppRouter = typeof appRouter;
