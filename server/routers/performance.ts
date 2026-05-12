import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  createCourierRating,
  getCourierRatings,
  getCourierMetrics,
  getCourierPerformanceStats,
  sendWhatsAppMessage,
  getWhatsAppMessages,
  updateWhatsAppMessageStatus,
} from '../db.performance';

const t = initTRPC.context<any>().create();

const protectedProcedure = t.procedure.use(({ ctx, next }: any) => {
  if (!(ctx as any).user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: (ctx as any).user } });
});

export const performanceRouter = t.router({
  // Ratings
  createRating: protectedProcedure
    .input(
      z.object({
        courierId: z.number(),
        deliveryId: z.number(),
        rating: z.number().min(1).max(5),
        review: z.string().optional(),
        categories: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      return await createCourierRating({
        courierId: input.courierId,
        customerId: ctx.user.id,
        deliveryId: input.deliveryId,
        rating: input.rating,
        review: input.review,
        categories: input.categories,
      });
    }),

  getCourierRatings: protectedProcedure
    .input(z.object({ courierId: z.number() }))
    .query(async ({ input }: any) => {
      return await getCourierRatings(input.courierId);
    }),

  getCourierMetrics: protectedProcedure
    .input(z.object({ courierId: z.number() }))
    .query(async ({ input }: any) => {
      return await getCourierMetrics(input.courierId);
    }),

  getPerformanceStats: protectedProcedure
    .input(z.object({ courierId: z.number() }))
    .query(async ({ input }: any) => {
      return await getCourierPerformanceStats(input.courierId);
    }),

  // WhatsApp Messages
  sendWhatsAppNotification: protectedProcedure
    .input(
      z.object({
        recipientId: z.number(),
        deliveryId: z.number().optional(),
        messageType: z.enum([
          'delivery_confirmed',
          'courier_assigned',
          'in_transit',
          'delivery_completed',
          'delivery_failed',
          'courier_job_available',
          'earnings_summary',
        ]),
        messageContent: z.string(),
        mediaUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      return await sendWhatsAppMessage({
        recipientId: input.recipientId,
        deliveryId: input.deliveryId,
        messageType: input.messageType,
        messageContent: input.messageContent,
        mediaUrl: input.mediaUrl,
      });
    }),

  getWhatsAppMessages: protectedProcedure
    .input(z.object({ recipientId: z.number() }))
    .query(async ({ input }: any) => {
      return await getWhatsAppMessages(input.recipientId);
    }),

  updateMessageStatus: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        status: z.enum(['pending', 'sent', 'delivered', 'read', 'failed']),
      })
    )
    .mutation(async ({ input }: any) => {
      return await updateWhatsAppMessageStatus(input.messageId, input.status);
    }),
});
