import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as gpsDisputesDb from "../db.gps-disputes";

export const gpsDisputesRouter = router({
  /**
   * GPS TRACKING PROCEDURES
   */
  recordGPSLocation: protectedProcedure
    .input(
      z.object({
        deliveryId: z.number(),
        latitude: z.number(),
        longitude: z.number(),
        accuracy: z.number().optional(),
        altitude: z.number().optional(),
        speed: z.number().optional(),
        heading: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      return gpsDisputesDb.recordGPSLocation(
        ctx.user.id,
        input.deliveryId,
        input.latitude,
        input.longitude,
        input.accuracy,
        input.altitude,
        input.speed,
        input.heading
      );
    }),

  getLatestGPSLocation: protectedProcedure
    .input(z.object({ deliveryId: z.number() }))
    .query(async ({ input }: any) => {
      return gpsDisputesDb.getLatestGPSLocation(input.deliveryId);
    }),

  getGPSLocationHistory: protectedProcedure
    .input(z.object({ deliveryId: z.number(), limit: z.number().default(100) }))
    .query(async ({ input }: any) => {
      return gpsDisputesDb.getGPSLocationHistory(input.deliveryId, input.limit);
    }),

  getCourierRecentLocations: protectedProcedure
    .input(z.object({ courierId: z.number(), minutesBack: z.number().default(60) }))
    .query(async ({ input }: any) => {
      return gpsDisputesDb.getCourierRecentLocations(input.courierId, input.minutesBack);
    }),

  /**
   * DISPUTE PROCEDURES
   */
  createDispute: protectedProcedure
    .input(
      z.object({
        deliveryId: z.number(),
        courierId: z.number(),
        reason: z.enum([
          "wrong_address",
          "damaged_package",
          "missing_items",
          "late_delivery",
          "courier_behavior",
          "lost_package",
          "other",
        ]),
        description: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      return gpsDisputesDb.createDispute(
        input.deliveryId,
        ctx.user.id,
        input.courierId,
        input.reason,
        input.description
      );
    }),

  getDispute: protectedProcedure
    .input(z.object({ disputeId: z.number() }))
    .query(async ({ input }: any) => {
      return gpsDisputesDb.getDispute(input.disputeId);
    }),

  getMyDisputes: protectedProcedure.query(async ({ ctx }: any) => {
    const userRole = (ctx as any).user?.role;
    if (userRole === "courier") {
      return gpsDisputesDb.getDisputesByCourier(ctx.user.id);
    } else {
      return gpsDisputesDb.getDisputesByCustomer(ctx.user.id);
    }
  }),

  getPendingDisputes: protectedProcedure.query(async (): Promise<any> => {
    return gpsDisputesDb.getPendingDisputes();
  }),

  updateDisputeStatus: protectedProcedure
    .input(
      z.object({
        disputeId: z.number(),
        status: z.enum(["open", "under_review", "resolved", "rejected"]),
        resolution: z.string().optional(),
        refundAmount: z.number().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      return gpsDisputesDb.updateDisputeStatus(
        input.disputeId,
        input.status,
        input.resolution,
        input.refundAmount
      );
    }),

  addDisputeEvidence: protectedProcedure
    .input(
      z.object({
        disputeId: z.number(),
        evidenceType: z.enum(["photo", "document", "video", "other"]),
        fileUrl: z.string(),
        fileName: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      return gpsDisputesDb.addDisputeEvidence(
        input.disputeId,
        ctx.user.id,
        input.evidenceType,
        input.fileUrl,
        input.fileName,
        input.description
      );
    }),

  getDisputeEvidence: protectedProcedure
    .input(z.object({ disputeId: z.number() }))
    .query(async ({ input }: any) => {
      return gpsDisputesDb.getDisputeEvidence(input.disputeId);
    }),

  addDisputeComment: protectedProcedure
    .input(
      z.object({
        disputeId: z.number(),
        comment: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const userRole = (ctx as any).user?.role || "customer";
      return gpsDisputesDb.addDisputeComment(
        input.disputeId,
        ctx.user.id,
        userRole,
        input.comment
      );
    }),

  getDisputeComments: protectedProcedure
    .input(z.object({ disputeId: z.number() }))
    .query(async ({ input }: any) => {
      return gpsDisputesDb.getDisputeComments(input.disputeId);
    }),

  getDisputeStats: protectedProcedure.query(async (): Promise<any> => {
    return gpsDisputesDb.getDisputeStats();
  }),
});
