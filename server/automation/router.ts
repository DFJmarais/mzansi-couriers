import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { queuePaymentSuccess } from './workflows/payment-success';
import { queueDeliveryStatus } from './workflows/delivery-status';
import { queueCourierAssigned } from './workflows/courier-assigned';
import { queueDailyEarnings } from './workflows/daily-earnings';
import { queueSupportTicket } from './workflows/support-ticket';
import { queueWeeklyPayout } from './workflows/weekly-payout';
import AutomationLogger from './logger';
import { PaymentSuccessJobData, DeliveryStatusJobData, CourierAssignedJobData, DailyEarningsSummaryJobData, SupportTicketJobData, WeeklyPayoutJobData } from './types';

/**
 * Automation Router
 * 
 * tRPC procedures for triggering automation workflows
 */

export const automationRouter = router({
  /**
   * Queue a payment success notification
   */
  queuePaymentSuccess: protectedProcedure
    .input(z.object({
      paymentId: z.string(),
      customerId: z.string(),
      courierId: z.string(),
      amount: z.number(),
      parcelId: z.string(),
      customerPhone: z.string(),
      courierPhone: z.string(),
      customerEmail: z.string(),
      courierName: z.string(),
      estimatedDeliveryTime: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const data: PaymentSuccessJobData = {
          ...input,
          timestamp: Date.now(),
        };
        const job = await queuePaymentSuccess(data);
        return { success: true, jobId: job.id, message: 'Payment success notification queued' };
      } catch (error) {
        throw new Error(`Failed to queue payment success: ${error}`);
      }
    }),

  /**
   * Queue a delivery status change notification
   */
  queueDeliveryStatus: protectedProcedure
    .input(z.object({
      deliveryId: z.string(),
      customerId: z.string(),
      courierId: z.string(),
      newStatus: z.enum(['pending', 'assigned', 'in_transit', 'delivered', 'cancelled']),
      previousStatus: z.string(),
      location: z.object({ lat: z.number(), lng: z.number() }).optional(),
      estimatedArrival: z.string().optional(),
      customerPhone: z.string(),
      customerEmail: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const data: DeliveryStatusJobData = {
          ...input,
          timestamp: Date.now(),
        };
        const job = await queueDeliveryStatus(data);
        return { success: true, jobId: job.id, message: 'Delivery status notification queued' };
      } catch (error) {
        throw new Error(`Failed to queue delivery status: ${error}`);
      }
    }),

  /**
   * Queue a courier assigned notification
   */
  queueCourierAssigned: protectedProcedure
    .input(z.object({
      deliveryId: z.string(),
      courierId: z.string(),
      customerId: z.string(),
      courierName: z.string(),
      courierPhone: z.string(),
      courierRating: z.number(),
      customerPhone: z.string(),
      customerEmail: z.string(),
      pickupLocation: z.string(),
      deliveryLocation: z.string(),
      estimatedDeliveryTime: z.string(),
      courierEarnings: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        const data: CourierAssignedJobData = {
          ...input,
          timestamp: Date.now(),
        };
        const job = await queueCourierAssigned(data);
        return { success: true, jobId: job.id, message: 'Courier assigned notification queued' };
      } catch (error) {
        throw new Error(`Failed to queue courier assigned: ${error}`);
      }
    }),

  /**
   * Queue a daily earnings summary
   */
  queueDailyEarnings: protectedProcedure
    .input(z.object({
      courierId: z.string(),
      courierName: z.string(),
      courierEmail: z.string(),
      courierPhone: z.string(),
      date: z.string(),
      totalDeliveries: z.number(),
      totalEarnings: z.number(),
      bonusEarnings: z.number(),
      totalWithBonus: z.number(),
      averageRating: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        const data: DailyEarningsSummaryJobData = {
          ...input,
          timestamp: Date.now(),
        };
        const job = await queueDailyEarnings(data);
        return { success: true, jobId: job.id, message: 'Daily earnings summary queued' };
      } catch (error) {
        throw new Error(`Failed to queue daily earnings: ${error}`);
      }
    }),

  /**
   * Queue a support ticket notification
   */
  queueSupportTicket: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
      customerId: z.string(),
      courierId: z.string().optional(),
      subject: z.string(),
      description: z.string(),
      category: z.enum(['payment', 'delivery', 'courier', 'app', 'other']),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
      customerEmail: z.string(),
      customerPhone: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const data: SupportTicketJobData = {
          ...input,
          timestamp: Date.now(),
        };
        const job = await queueSupportTicket(data);
        return { success: true, jobId: job.id, message: 'Support ticket notification queued' };
      } catch (error) {
        throw new Error(`Failed to queue support ticket: ${error}`);
      }
    }),

  /**
   * Queue a weekly payout report
   */
  queueWeeklyPayout: protectedProcedure
    .input(z.object({
      week: z.string(),
      totalCouriers: z.number(),
      totalPayouts: z.number(),
      totalAmount: z.number(),
      payoutDate: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const data: WeeklyPayoutJobData = {
          ...input,
          timestamp: Date.now(),
        };
        const job = await queueWeeklyPayout(data);
        return { success: true, jobId: job.id, message: 'Weekly payout report queued' };
      } catch (error) {
        throw new Error(`Failed to queue weekly payout: ${error}`);
      }
    }),

  /**
   * Get automation statistics
   */
  getStats: publicProcedure.query(() => {
    try {
      const stats = AutomationLogger.getStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new Error(`Failed to get automation stats: ${error}`);
    }
  }),

  /**
   * Get recent automation events
   */
  getRecentEvents: publicProcedure
    .input(z.object({ limit: z.number().default(100) }))
    .query(({ input }) => {
      try {
        const events = AutomationLogger.getRecentEvents(input.limit);
        return {
          success: true,
          data: events,
        };
      } catch (error) {
        throw new Error(`Failed to get recent events: ${error}`);
      }
    }),

  /**
   * Get failed events
   */
  getFailedEvents: publicProcedure.query(() => {
    try {
      const events = AutomationLogger.getFailedEvents();
      return {
        success: true,
        data: events,
      };
    } catch (error) {
      throw new Error(`Failed to get failed events: ${error}`);
    }
  }),

  /**
   * Export events as JSON
   */
  exportEvents: publicProcedure.query(() => {
    try {
      const json = AutomationLogger.exportEvents();
      return {
        success: true,
        data: json,
      };
    } catch (error) {
      throw new Error(`Failed to export events: ${error}`);
    }
  }),
});

export default automationRouter;
