import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { createSmsNotification, getSmsNotifications, getOrCreateEarningsSummary, getCourierEarnings, getTotalEarnings, updateSmsStatus } from "../db.tracking";
import { sendWhatsAppMessage, sendSMSMessage } from "../_core/twilio";

// Courier-only procedure
const courierProcedure = protectedProcedure.use(({ ctx, next }: any) => {
  if (ctx.user.role !== "courier") {
    throw new Error("Unauthorized: Courier access required");
  }
  return next({ ctx });
});

export const smsEarningsRouter = router({
  // SMS Procedures
  sendDeliveryNotification: protectedProcedure
    .input(z.object({
      phoneNumber: z.string(),
      deliveryId: z.number(),
      messageType: z.enum([
        "delivery_confirmed",
        "courier_assigned",
        "pickup_started",
        "in_transit",
        "delivery_completed",
        "delivery_failed",
      ]),
      messageContent: z.string(),
    }))
    .mutation(async ({ ctx, input }: any) => {
      try {
        // Create SMS record
        const smsResult = await createSmsNotification(
          ctx.user.id,
          input.phoneNumber,
          input.messageType,
          input.messageContent,
          input.deliveryId
        );

        // Send via Twilio
        const twilioResult = await sendSMSMessage(input.phoneNumber, input.messageContent);

        if (twilioResult.success) {
          await updateSmsStatus((smsResult as any).insertId || 0, "sent", twilioResult.messageId);
          return {
            success: true,
            smsId: (smsResult as any).insertId || 0,
            twilioSid: twilioResult.messageId,
          };
        }

        await updateSmsStatus((smsResult as any).insertId || 0, "failed", undefined, twilioResult.error);
        return { success: false, error: twilioResult.error };
      } catch (error) {
        console.error("[SMS] Error sending notification:", error);
        return { success: false, error: String(error) };
      }
    }),

  getSmsHistory: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }: any) => {
      try {
        const messages = await getSmsNotifications(ctx.user.id, input.limit);
        return { success: true, messages };
      } catch (error) {
        console.error("[SMS] Error fetching history:", error);
        return { success: false, error: String(error) };
      }
    }),

  // Earnings Procedures
  getEarningsSummary: courierProcedure
    .input(z.object({
      period: z.enum(["daily", "weekly", "monthly"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }: any) => {
      try {
        const earnings = await getCourierEarnings(
          ctx.user.id,
          input.period,
          input.startDate,
          input.endDate
        );

        const total = await getTotalEarnings(ctx.user.id);

        return {
          success: true,
          earnings,
          totalEarnings: total,
          count: earnings.length,
        };
      } catch (error) {
        console.error("[Earnings] Error fetching summary:", error);
        return { success: false, error: String(error) };
      }
    }),

  getTodayEarnings: courierProcedure.query(async ({ ctx }: any) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const earnings = await getCourierEarnings(ctx.user.id, "daily", today, today);

      if (earnings.length === 0) {
        return {
          success: true,
          totalEarnings: 0,
          completedDeliveries: 0,
          averageRating: 5.0,
          completionRate: 100,
        };
      }

      const summary = earnings[0];
      return {
        success: true,
        totalEarnings: parseFloat(summary.totalEarnings || "0"),
        completedDeliveries: summary.completedDeliveries || 0,
        averageRating: parseFloat(summary.averageRating || "5.00"),
        completionRate: parseFloat(summary.completionRate || "100"),
      };
    } catch (error) {
      console.error("[Earnings] Error fetching today earnings:", error);
      return { success: false, error: String(error) };
    }
  }),

  getWeeklyEarnings: courierProcedure.query(async ({ ctx }: any) => {
    try {
      const earnings = await getCourierEarnings(ctx.user.id, "weekly");

      let totalEarnings = 0;
      let totalDeliveries = 0;

      for (const week of earnings) {
        totalEarnings += parseFloat(week.totalEarnings || "0");
        totalDeliveries += week.completedDeliveries || 0;
      }

      return {
        success: true,
        weeks: earnings,
        totalEarnings,
        totalDeliveries,
      };
    } catch (error) {
      console.error("[Earnings] Error fetching weekly earnings:", error);
      return { success: false, error: String(error) };
    }
  }),

  getMonthlyEarnings: courierProcedure.query(async ({ ctx }: any) => {
    try {
      const earnings = await getCourierEarnings(ctx.user.id, "monthly");

      let totalEarnings = 0;
      let totalDeliveries = 0;

      for (const month of earnings) {
        totalEarnings += parseFloat(month.totalEarnings || "0");
        totalDeliveries += month.completedDeliveries || 0;
      }

      return {
        success: true,
        months: earnings,
        totalEarnings,
        totalDeliveries,
      };
    } catch (error) {
      console.error("[Earnings] Error fetching monthly earnings:", error);
      return { success: false, error: String(error) };
    }
  }),

  getLifetimeStats: courierProcedure.query(async ({ ctx }: any) => {
    try {
      const earnings = await getCourierEarnings(ctx.user.id);
      const total = await getTotalEarnings(ctx.user.id);

      let totalDeliveries = 0;
      let totalDistance = 0;
      let totalTime = 0;
      let avgRating = 0;

      for (const record of earnings) {
        totalDeliveries += record.completedDeliveries || 0;
        totalDistance += parseFloat(record.totalDistance || "0");
        totalTime += record.totalTime || 0;
        avgRating += parseFloat(record.averageRating || "5.00");
      }

      avgRating = earnings.length > 0 ? avgRating / earnings.length : 5.0;

      return {
        success: true,
        totalEarnings: total,
        totalDeliveries,
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        totalHours: parseFloat((totalTime / 3600).toFixed(2)),
        averageRating: parseFloat(avgRating.toFixed(2)),
      };
    } catch (error) {
      console.error("[Earnings] Error fetching lifetime stats:", error);
      return { success: false, error: String(error) };
    }
  }),
});
