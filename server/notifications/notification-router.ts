import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb, getUserNotifications } from "../db";
import { notificationDeliveries, notifications } from "../../drizzle/schema";

/**
 * Notifications Router
 * Real user-scoped notifications created by delivery and payment workflows.
 */

function toClientNotification(notification: typeof notifications.$inferSelect) {
  return {
    id: String(notification.id),
    type: notification.type,
    title: notification.title,
    body: notification.message,
    priority: "normal" as const,
    status: notification.isRead ? "read" as const : "unread" as const,
    createdAt: notification.createdAt.getTime(),
    relatedDeliveryId: notification.relatedDeliveryId,
  };
}

export const notificationRouter = router({
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    const rows = await getUserNotifications(ctx.user.id, 50);
    return { success: true, data: rows.map(toClientNotification) };
  }),

  /** Preferences are intentionally not exposed as persisted controls until a preference table is available. */
  getPreferences: protectedProcedure.query(async () => ({
    success: true,
    data: null,
    message: "Notification preferences are managed by the active delivery channels.",
  })),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        channels: z.object({
          push: z.boolean(),
          email: z.boolean(),
          sms: z.boolean(),
          inApp: z.boolean(),
        }),
        quietHours: z.object({
          enabled: z.boolean(),
          startTime: z.string(),
          endTime: z.string(),
        }),
      }),
    )
    .mutation(async () => ({
      success: false as const,
      message: "Notification preferences are not yet persisted.",
    })),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.coerce.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false as const, message: "Notifications are temporarily unavailable." };
      const result = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, input.notificationId), eq(notifications.userId, ctx.user.id)));
      return { success: true as const, data: { notificationId: String(input.notificationId), status: "read" as const, updated: result[0]?.affectedRows > 0 } };
    }),

  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const rows = await getUserNotifications(ctx.user.id, 100);
    const byType: Record<string, number> = {};
    for (const row of rows) byType[row.type] = (byType[row.type] ?? 0) + 1;
    return {
      success: true,
      data: {
        total: rows.length,
        unread: rows.filter((row) => !row.isRead).length,
        byType,
      },
    };
  }),

  listFailedDeliveries: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { success: false as const, data: [], error: "notification_store_unavailable" };
    const rows = await db.select().from(notificationDeliveries)
      .where(inArray(notificationDeliveries.status, ["failed", "rejected", "undeliverable"]))
      .orderBy(desc(notificationDeliveries.updatedAt)).limit(100);
    return { success: true as const, data: rows.map((row) => ({ id: row.id, channel: row.channel, eventType: row.eventType, status: row.status, attemptCount: row.attemptCount, lastErrorCode: row.lastErrorCode, queuedAt: row.queuedAt, updatedAt: row.updatedAt })) };
  }),

  retryFailedDelivery: adminProcedure
    .input(z.object({ notificationId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false as const, error: "notification_store_unavailable" };
      const current = (await db.select().from(notificationDeliveries).where(eq(notificationDeliveries.id, input.notificationId)).limit(1))[0];
      if (!current) return { success: false as const, error: "notification_not_found" };
      if (!(current.status === "failed" || current.status === "rejected" || current.status === "undeliverable")) return { success: false as const, error: "notification_not_retryable" };
      if (current.attemptCount >= 3) return { success: false as const, error: "notification_retry_limit_reached" };
      await db.update(notificationDeliveries).set({ status: "queued", lastErrorCode: null, lastErrorMessage: null, queuedAt: new Date() }).where(eq(notificationDeliveries.id, input.notificationId));
      return { success: true as const, queued: true as const, notificationId: input.notificationId };
    }),
});

export default notificationRouter;

// Keep the imported schema type aligned with the database contract at compile time.
void notifications;
