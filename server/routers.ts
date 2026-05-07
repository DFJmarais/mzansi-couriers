import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

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
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
    })).mutation(async ({ ctx, input }) => {
      await db.assignDeliveryToCourier(input.deliveryId, ctx.user.id);
      return { success: true };
    }),

    updateDeliveryStatus: courierProcedure.input(z.object({
      deliveryId: z.number(),
      status: z.enum(['pending', 'assigned', 'in-transit', 'delivered']),
    })).mutation(async ({ input }) => {
      await db.updateDeliveryStatus(input.deliveryId, input.status);
      return { success: true };
    }),

    completeDelivery: courierProcedure.input(z.object({
      deliveryId: z.number(),
      finalPrice: z.string(),
      proofOfDelivery: z.any().optional(),
    })).mutation(async ({ input }) => {
      await db.completeDelivery(input.deliveryId, input.finalPrice, input.proofOfDelivery);
      return { success: true };
    }),

    addTracking: courierProcedure.input(z.object({
      deliveryId: z.number(),
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional(),
      speed: z.number().optional(),
      heading: z.number().optional(),
    })).mutation(async ({ input }) => {
      await db.addDeliveryTracking({
        deliveryId: input.deliveryId,
        latitude: input.latitude as any,
        longitude: input.longitude as any,
        accuracy: input.accuracy as any,
        speed: input.speed as any,
        heading: input.heading,
      });
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
      const config = await db.getPricingConfig();
      if (!config) {
        return { estimatedPrice: '50.00' };
      }

      let basePrice = parseFloat(config.basePrice.toString());
      const pricePerKm = parseFloat(config.pricePerKm.toString());
      const distancePrice = input.distance * pricePerKm;

      let multiplier = 1;
      if (input.packageSize === 'small') {
        multiplier = parseFloat((config.smallPackageMultiplier || '1.00').toString());
      } else if (input.packageSize === 'medium') {
        multiplier = parseFloat((config.mediumPackageMultiplier || '1.50').toString());
      } else if (input.packageSize === 'large') {
        multiplier = parseFloat((config.largePackageMultiplier || '2.00').toString());
      }

      const estimatedPrice = (basePrice + distancePrice) * multiplier;
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
});

export type AppRouter = typeof appRouter;
