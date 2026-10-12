import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * Zapier Workflows Router
 * Handles additional workflow events for zone coverage, support escalation, and performance alerts
 */

export const zapierWorkflowsRouter = router({
  /**
   * Zone Coverage Alert - Triggered when available couriers drop below threshold
   * Webhook event: zone_coverage_alert
   */
  triggerZoneCoverageAlert: publicProcedure
    .input(
      z.object({
        zone: z.string(),
        availableCouriers: z.number(),
        threshold: z.number().default(5),
        onlineCouriers: z.number(),
        activeDeliveries: z.number(),
        estimatedWaitTime: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Log zone coverage alert
        const alert = {
          zone: input.zone,
          availableCouriers: input.availableCouriers,
          threshold: input.threshold,
          onlineCouriers: input.onlineCouriers,
          activeDeliveries: input.activeDeliveries,
          estimatedWaitTime: input.estimatedWaitTime,
          severity: input.availableCouriers < input.threshold ? "warning" : "info",
          timestamp: new Date(),
        };

        // Zapier will handle:
        // 1. Send Slack alert to dispatcher
        // 2. Trigger recruitment notification
        // 3. Log to operations dashboard

        return {
          success: true,
          alert,
          message: `Zone coverage alert: ${input.zone} has ${input.availableCouriers} couriers (threshold: ${input.threshold})`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to trigger zone coverage alert",
        });
      }
    }),

  /**
   * Customer Support Escalation - Auto-escalate unresolved tickets
   * Webhook event: support_ticket_escalation
   */
  escalateSupportTicket: publicProcedure
    .input(
      z.object({
        ticketId: z.string(),
        customerId: z.string(),
        customerName: z.string(),
        customerEmail: z.string(),
        issueType: z.string(),
        priority: z.enum(["low", "medium", "high", "critical"]),
        hoursUnresolved: z.number(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Determine escalation level based on hours unresolved
        let escalationLevel = "level1";
        if (input.hoursUnresolved > 24) escalationLevel = "level2";
        if (input.hoursUnresolved > 48) escalationLevel = "level3";

        const escalation = {
          ticketId: input.ticketId,
          customerId: input.customerId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          issueType: input.issueType,
          priority: input.priority,
          hoursUnresolved: input.hoursUnresolved,
          escalationLevel,
          timestamp: new Date(),
        };

        // Zapier will handle:
        // 1. Create Slack thread for escalation
        // 2. Send email to support manager
        // 3. Assign to senior support staff
        // 4. Log to support dashboard
        // 5. Send notification to customer

        return {
          success: true,
          escalation,
          message: `Support ticket escalated to ${escalationLevel}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to escalate support ticket",
        });
      }
    }),

  /**
   * Performance Alert - Alert on low ratings or high cancellations
   * Webhook event: performance_alert
   */
  triggerPerformanceAlert: publicProcedure
    .input(
      z.object({
        courierId: z.string(),
        courierName: z.string(),
        courierEmail: z.string(),
        alertType: z.enum(["low_rating", "high_cancellation", "low_completion"]),
        currentMetric: z.number(),
        threshold: z.number(),
        recentData: z.object({
          lastDeliveries: z.number(),
          cancellations: z.number(),
          completionRate: z.number(),
          averageRating: z.number(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const alert = {
          courierId: input.courierId,
          courierName: input.courierName,
          courierEmail: input.courierEmail,
          alertType: input.alertType,
          currentMetric: input.currentMetric,
          threshold: input.threshold,
          recentData: input.recentData,
          severity:
            input.currentMetric < input.threshold * 0.5 ? "critical" : "warning",
          timestamp: new Date(),
        };

        // Zapier will handle:
        // 1. Send email to courier with performance feedback
        // 2. Alert operations team
        // 3. Log to performance dashboard
        // 4. Trigger coaching/support workflow if critical

        return {
          success: true,
          alert,
          message: `Performance alert for ${input.courierName}: ${input.alertType}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to trigger performance alert",
        });
      }
    }),

  /**
   * Daily Performance Summary - Send daily stats to admin
   * Webhook event: daily_performance_summary
   */
  generateDailyPerformanceSummary: publicProcedure
    .input(
      z.object({
        date: z.string(),
        metrics: z.object({
          totalDeliveries: z.number(),
          successfulDeliveries: z.number(),
          failedDeliveries: z.number(),
          averageDeliveryTime: z.number(),
          totalRevenue: z.number(),
          platformCommission: z.number(),
          courierEarnings: z.number(),
          activeCouriers: z.number(),
          newCustomers: z.number(),
          averageRating: z.number(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const summary = {
          date: input.date,
          metrics: input.metrics,
          successRate: (
            (input.metrics.successfulDeliveries /
              input.metrics.totalDeliveries) *
            100
          ).toFixed(2),
          timestamp: new Date(),
        };

        // Zapier will handle:
        // 1. Send daily summary email to admin
        // 2. Log to Google Sheets
        // 3. Update admin dashboard
        // 4. Generate performance trends

        return {
          success: true,
          summary,
          message: `Daily summary generated for ${input.date}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate daily performance summary",
        });
      }
    }),

  /**
   * Customer Satisfaction Follow-up - Send follow-up surveys after delivery
   * Webhook event: customer_satisfaction_followup
   */
  sendCustomerSatisfactionFollowup: publicProcedure
    .input(
      z.object({
        deliveryId: z.string(),
        customerId: z.string(),
        customerName: z.string(),
        customerEmail: z.string(),
        customerPhone: z.string(),
        deliveryDate: z.string(),
        courierName: z.string(),
        deliveryAddress: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const followup = {
          deliveryId: input.deliveryId,
          customerId: input.customerId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          deliveryDate: input.deliveryDate,
          courierName: input.courierName,
          deliveryAddress: input.deliveryAddress,
          timestamp: new Date(),
        };

        // Zapier will handle:
        // 1. Send WhatsApp survey link to customer
        // 2. Send email with feedback form
        // 3. Log responses to database
        // 4. Track satisfaction trends

        return {
          success: true,
          followup,
          message: `Customer satisfaction follow-up sent to ${input.customerName}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send customer satisfaction follow-up",
        });
      }
    }),

  /**
   * Courier Milestone Celebration - Celebrate 100, 500, 1000 deliveries
   * Webhook event: courier_milestone_reached
   */
  celebrateCourierMilestone: publicProcedure
    .input(
      z.object({
        courierId: z.string(),
        courierName: z.string(),
        courierPhone: z.string(),
        courierEmail: z.string(),
        milestone: z.enum(["100", "500", "1000", "5000"]),
        totalDeliveries: z.number(),
        totalEarnings: z.number(),
        averageRating: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Determine reward based on milestone
        const rewards: Record<string, { bonus: number; badge: string }> = {
          "100": { bonus: 100, badge: "Courier Bronze" },
          "500": { bonus: 250, badge: "Courier Silver" },
          "1000": { bonus: 500, badge: "Courier Gold" },
          "5000": { bonus: 1000, badge: "Courier Platinum" },
        };

        const reward = rewards[input.milestone] || { bonus: 0, badge: "" };

        const celebration = {
          courierId: input.courierId,
          courierName: input.courierName,
          courierPhone: input.courierPhone,
          courierEmail: input.courierEmail,
          milestone: input.milestone,
          totalDeliveries: input.totalDeliveries,
          totalEarnings: input.totalEarnings,
          averageRating: input.averageRating,
          reward,
          timestamp: new Date(),
        };

        // Zapier will handle:
        // 1. Send celebratory WhatsApp message
        // 2. Send email with achievement certificate
        // 3. Award bonus to courier account
        // 4. Update leaderboard
        // 5. Share on social media (optional)

        return {
          success: true,
          celebration,
          message: `Milestone celebration: ${input.courierName} reached ${input.milestone} deliveries!`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to celebrate courier milestone",
        });
      }
    }),

  /**
   * Weekly Payout Reminder - Send payout reminders before weekly payouts
   * Webhook event: weekly_payout_reminder
   */
  sendWeeklyPayoutReminder: publicProcedure
    .input(
      z.object({
        courierId: z.string(),
        courierName: z.string(),
        courierPhone: z.string(),
        courierEmail: z.string(),
        weeklyEarnings: z.number(),
        deliveryCount: z.number(),
        payoutDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const reminder = {
          courierId: input.courierId,
          courierName: input.courierName,
          courierPhone: input.courierPhone,
          courierEmail: input.courierEmail,
          weeklyEarnings: input.weeklyEarnings,
          deliveryCount: input.deliveryCount,
          payoutDate: input.payoutDate,
          timestamp: new Date(),
        };

        // Zapier will handle:
        // 1. Send WhatsApp payout reminder
        // 2. Send email with earnings breakdown
        // 3. Provide link to payout status
        // 4. Log reminder sent

        return {
          success: true,
          reminder,
          message: `Payout reminder sent to ${input.courierName}: R${input.weeklyEarnings.toFixed(2)} on ${input.payoutDate}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send weekly payout reminder",
        });
      }
    }),

  /**
   * Anomaly Detection Alert - Alert on unusual patterns
   * Webhook event: anomaly_detected
   */
  reportAnomaly: publicProcedure
    .input(
      z.object({
        anomalyType: z.enum([
          "unusual_cancellation_rate",
          "sudden_rating_drop",
          "location_anomaly",
          "payment_anomaly",
          "delivery_time_anomaly",
        ]),
        entityType: z.enum(["courier", "customer", "zone"]),
        entityId: z.string(),
        entityName: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        details: z.record(z.string(), z.any()),
        recommendedAction: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const anomaly = {
          anomalyType: input.anomalyType,
          entityType: input.entityType,
          entityId: input.entityId,
          entityName: input.entityName,
          severity: input.severity,
          details: input.details,
          recommendedAction: input.recommendedAction,
          timestamp: new Date(),
        };

        // Zapier will handle:
        // 1. Alert operations team (Slack)
        // 2. Create support ticket if needed
        // 3. Log to compliance sheet
        // 4. Trigger investigation workflow

        return {
          success: true,
          anomaly,
          message: `Anomaly detected: ${input.anomalyType} for ${input.entityName}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to report anomaly",
        });
      }
    }),
});
