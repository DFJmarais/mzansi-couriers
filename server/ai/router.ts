import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import {
  optimizeRoute,
  updateRouteInRealTime,
  analyzeRouteEfficiency,
  suggestOptimalStartTime,
  type Delivery,
  type Location,
} from './route-optimization';
import {
  generateSupportResponse,
  analyzeSentiment,
  suggestCategory,
  suggestCompensation,
  type SupportTicket,
} from './support-bot';
import {
  answerPublicAssistant,
  publicAssistantAnalyticsInput,
  publicAssistantInput,
  recordPublicAssistantEvent,
} from './public-assistant';

/**
 * AI Features Router
 * 
 * tRPC procedures for AI-powered features:
 * - Route Optimization
 * - Customer Support Bot
 */

export const aiRouter = router({
  publicAssistant: publicProcedure
    .input(publicAssistantInput)
    .mutation(({ input }) => answerPublicAssistant(input)),

  publicAssistantAnalytics: publicProcedure
    .input(publicAssistantAnalyticsInput)
    .mutation(async ({ input }) => {
      await recordPublicAssistantEvent(input.event);
      return { ok: true };
    }),

  // ============ ROUTE OPTIMIZATION ============

  /**
   * Optimize a set of deliveries into an efficient route
   */
  optimizeRoute: protectedProcedure
    .input(
      z.object({
        courierId: z.string(),
        deliveries: z.array(
          z.object({
            id: z.string(),
            pickup: z.object({
              lat: z.number(),
              lng: z.number(),
              address: z.string(),
              name: z.string().optional(),
            }),
            delivery: z.object({
              lat: z.number(),
              lng: z.number(),
              address: z.string(),
              name: z.string().optional(),
            }),
            priority: z.number().min(1).max(10),
            estimatedWeight: z.number().optional(),
            specialInstructions: z.string().optional(),
          })
        ),
        courierCurrentLocation: z.object({
          lat: z.number(),
          lng: z.number(),
          address: z.string(),
          name: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const deliveries: Delivery[] = input.deliveries.map((d) => ({
          id: d.id,
          pickup: d.pickup,
          delivery: d.delivery,
          priority: d.priority,
          estimatedWeight: d.estimatedWeight,
          specialInstructions: d.specialInstructions,
        }));

        const route = await optimizeRoute(input.courierId, deliveries, input.courierCurrentLocation);

        return {
          success: true,
          data: route,
        };
      } catch (error) {
        throw new Error(`Failed to optimize route: ${error}`);
      }
    }),

  /**
   * Update route in real-time based on current progress
   */
  updateRoute: protectedProcedure
    .input(
      z.object({
        courierId: z.string(),
        currentLocation: z.object({
          lat: z.number(),
          lng: z.number(),
          address: z.string(),
        }),
        remainingDeliveries: z.array(
          z.object({
            id: z.string(),
            pickup: z.object({
              lat: z.number(),
              lng: z.number(),
              address: z.string(),
            }),
            delivery: z.object({
              lat: z.number(),
              lng: z.number(),
              address: z.string(),
            }),
            priority: z.number(),
          })
        ),
        completedDeliveries: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const route = await updateRouteInRealTime(
          input.courierId,
          input.currentLocation,
          input.remainingDeliveries as Delivery[],
          input.completedDeliveries
        );

        return {
          success: true,
          data: route,
        };
      } catch (error) {
        throw new Error(`Failed to update route: ${error}`);
      }
    }),

  /**
   * Analyze route efficiency after completion
   */
  analyzeRouteEfficiency: protectedProcedure
    .input(
      z.object({
        actualTime: z.number(),
        actualDistance: z.number(),
        estimatedTime: z.number(),
        estimatedDistance: z.number(),
        optimizationScore: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const analysis = await analyzeRouteEfficiency(
          {
            deliveries: [],
            totalDistance: input.estimatedDistance,
            estimatedTime: input.estimatedTime,
            fuelCost: 0,
            stops: [],
            instructions: [],
            optimizationScore: input.optimizationScore,
          },
          input.actualTime,
          input.actualDistance
        );

        return {
          success: true,
          data: analysis,
        };
      } catch (error) {
        throw new Error(`Failed to analyze efficiency: ${error}`);
      }
    }),

  /**
   * Suggest optimal start time for a route
   */
  suggestStartTime: protectedProcedure
    .input(
      z.object({
        courierId: z.string(),
        deliveryCount: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const suggestion = await suggestOptimalStartTime([], input.courierId);

        return {
          success: true,
          data: suggestion,
        };
      } catch (error) {
        throw new Error(`Failed to suggest start time: ${error}`);
      }
    }),

  // ============ CUSTOMER SUPPORT BOT ============

  /**
   * Generate AI response to a support ticket
   */
  generateSupportResponse: protectedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        customerId: z.string(),
        subject: z.string(),
        description: z.string(),
        category: z.enum(['payment', 'delivery', 'courier', 'app', 'other']),
        priority: z.enum(['low', 'medium', 'high', 'critical']),
        relatedDeliveryId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const ticket: SupportTicket = {
          id: input.ticketId,
          customerId: input.customerId,
          subject: input.subject,
          description: input.description,
          category: input.category,
          priority: input.priority,
          createdAt: Date.now(),
          relatedDeliveryId: input.relatedDeliveryId,
        };

        const response = await generateSupportResponse(ticket);

        return {
          success: true,
          data: response,
        };
      } catch (error) {
        throw new Error(`Failed to generate support response: ${error}`);
      }
    }),

  /**
   * Analyze ticket sentiment and urgency
   */
  analyzeSentiment: protectedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        customerId: z.string(),
        subject: z.string(),
        description: z.string(),
        category: z.enum(['payment', 'delivery', 'courier', 'app', 'other']),
        priority: z.enum(['low', 'medium', 'high', 'critical']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const ticket: SupportTicket = {
          id: input.ticketId,
          customerId: input.customerId,
          subject: input.subject,
          description: input.description,
          category: input.category,
          priority: input.priority,
          createdAt: Date.now(),
        };

        const sentiment = await analyzeSentiment(ticket);

        return {
          success: true,
          data: sentiment,
        };
      } catch (error) {
        throw new Error(`Failed to analyze sentiment: ${error}`);
      }
    }),

  /**
   * Suggest ticket category based on content
   */
  suggestCategory: protectedProcedure
    .input(
      z.object({
        subject: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const category = await suggestCategory(input.subject, input.description);

        return {
          success: true,
          data: category,
        };
      } catch (error) {
        throw new Error(`Failed to suggest category: ${error}`);
      }
    }),

  /**
   * Suggest compensation for a customer issue
   */
  suggestCompensation: protectedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        customerId: z.string(),
        subject: z.string(),
        description: z.string(),
        category: z.enum(['payment', 'delivery', 'courier', 'app', 'other']),
        priority: z.enum(['low', 'medium', 'high', 'critical']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const ticket: SupportTicket = {
          id: input.ticketId,
          customerId: input.customerId,
          subject: input.subject,
          description: input.description,
          category: input.category,
          priority: input.priority,
          createdAt: Date.now(),
        };

        const compensation = await suggestCompensation(ticket);

        return {
          success: true,
          data: compensation,
        };
      } catch (error) {
        throw new Error(`Failed to suggest compensation: ${error}`);
      }
    }),
});

export default aiRouter;
