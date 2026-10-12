import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import {
  courierTiers,
  courierTierAssignments,
  vehicleTypes,
  courierVehicles,
  parcelSizes,
  publishedRoutes,
  routeAssignments,
  partnerLevels,
  partnerLevelAssignments,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

type AnyObject = any;

let db: any = null;

// Initialize db on first use
const initDb = async () => {
  if (!db) {
    db = await getDb();
  }
  return db;
};

export const smartLogisticsRouter = router({
  // ============ COURIER TIER OPERATIONS ============

  getAvailableTiers: protectedProcedure.query(async () => {
    const database = await initDb();
    if (!database) throw new Error("Database not available");
    return await database.select().from(courierTiers);
  }),

  getCurrentTier: protectedProcedure.query(async ({ ctx }: any) => {
    const database = await initDb();
    if (!database) throw new Error("Database not available");
    const assignment = await database
      .select()
      .from(courierTierAssignments)
      .where(eq(courierTierAssignments.courierId, ctx.user.id as any))
      .orderBy(desc(courierTierAssignments.assignedAt))
      .limit(1);

    if (!assignment.length) return null;

    const tier = await database
      .select()
      .from(courierTiers)
      .where(eq(courierTiers.id, assignment[0].tierId));

    return { tier: tier[0], assignment: assignment[0] };
  }),

  requestTierChange: protectedProcedure
    .input(z.object({ tierId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      const database = await initDb();
      if (!database) throw new Error("Database not available");
      const currentAssignment = await database
        .select()
        .from(courierTierAssignments)
        .where(eq(courierTierAssignments.courierId, ctx.user.id as any))
        .orderBy(desc(courierTierAssignments.assignedAt))
        .limit(1);

      const assignment = await database
        .insert(courierTierAssignments)
        .values({
          courierId: ctx.user.id as any,
          tierId: currentAssignment[0]?.tierId || 1, // Keep current tier
          requestedTierId: input.tierId,
          requestedAt: new Date(),
        })
        .returning();

      return assignment[0];
    }),

  // ============ VEHICLE OPERATIONS ============

  getVehicleTypes: protectedProcedure.query(async () => {
    const database = await initDb();
    if (!database) throw new Error("Database not available");
    return await database.select().from(vehicleTypes);
  }),

  registerVehicle: protectedProcedure
    .input(
      z.object({
        vehicleTypeId: z.number(),
        registrationNumber: z.string(),
        makeModel: z.string(),
        year: z.number().optional(),
        color: z.string().optional(),
        capacityUnits: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const database = await initDb();
      if (!database) throw new Error("Database not available");
      const vehicle = await database
        .insert(courierVehicles)
        .values({
          courierId: ctx.user.id as any,
          vehicleTypeId: input.vehicleTypeId,
          registrationNumber: input.registrationNumber,
          makeModel: input.makeModel,
          year: input.year,
          color: input.color,
          capacityUnits: input.capacityUnits || 25,
          isPrimary: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return vehicle[0];
    }),

  getCourierVehicles: protectedProcedure.query(async ({ ctx }: any) => {
    const database = await initDb();
    if (!database) throw new Error("Database not available");
    return await database
      .select()
      .from(courierVehicles)
      .where(eq(courierVehicles.courierId, ctx.user.id as any));
  }),

  updateVehicle: protectedProcedure
    .input(
      z.object({
        vehicleId: z.number(),
        capacityUnits: z.number().optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const database = await initDb();
      if (!database) throw new Error("Database not available");
      const updated = await database
        .update(courierVehicles)
        .set({
          capacityUnits: input.capacityUnits,
          isPrimary: input.isPrimary,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(courierVehicles.id, input.vehicleId),
            eq(courierVehicles.courierId, ctx.user.id as any)
          )
        )
        .returning();

      return updated[0];
    }),

  // ============ ROUTE OPERATIONS ============

  publishRoute: protectedProcedure
    .input(
      z.object({
        vehicleId: z.number(),
        departureCity: z.string(),
        destinationCity: z.string(),
        departureTime: z.date(),
        estimatedDistanceKm: z.number(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const database = await initDb();
      if (!database) throw new Error("Database not available");
      const vehicle = await database
        .select()
        .from(courierVehicles)
        .where(
          and(
            eq(courierVehicles.id, input.vehicleId),
            eq(courierVehicles.courierId, ctx.user.id as any)
          )
        );

      if (!vehicle.length) throw new Error("Vehicle not found");

      const route = await database
        .insert(publishedRoutes)
        .values({
          courierId: ctx.user.id as any,
          vehicleId: input.vehicleId,
          departureCity: input.departureCity,
          destinationCity: input.destinationCity,
          departureTime: input.departureTime,
          estimatedDistanceKm: input.estimatedDistanceKm,
          availableCapacityUnits: vehicle[0].capacityUnits,
          status: "published",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return route[0];
    }),

  getActiveRoutes: protectedProcedure.query(async ({ ctx }: any) => {
    const database = await initDb();
    if (!database) throw new Error("Database not available");
    return await database
      .select()
      .from(publishedRoutes)
      .where(
        and(
          eq(publishedRoutes.courierId, ctx.user.id as any),
          eq(publishedRoutes.status, "published" as any)
        )
      );
  }),

  confirmDeparture: protectedProcedure
    .input(z.object({ routeId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      const database = await initDb();
      if (!database) throw new Error("Database not available");
      const updated = await database
        .update(publishedRoutes)
        .set({
          status: "departed" as any,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(publishedRoutes.id, input.routeId),
            eq(publishedRoutes.courierId, ctx.user.id as any)
          )
        )
        .returning();

      return updated[0];
    }),

  // ============ PARTNER LEVEL OPERATIONS ============

  getPartnerLevels: protectedProcedure.query(async () => {
    const database = await initDb();
    if (!database) throw new Error("Database not available");
    return await database.select().from(partnerLevels);
  }),

  getCurrentPartnerLevel: protectedProcedure.query(async ({ ctx }: any) => {
    const database = await initDb();
    if (!database) throw new Error("Database not available");
    const assignment = await database
      .select()
      .from(partnerLevelAssignments)
      .where(eq(partnerLevelAssignments.courierId, ctx.user.id as any))
      .orderBy(desc(partnerLevelAssignments.assignedAt))
      .limit(1);

    if (!assignment.length) return null;

    const level = await database
      .select()
      .from(partnerLevels)
      .where(eq(partnerLevels.id, assignment[0].levelId));

    return { level: level[0], assignment: assignment[0] };
  }),

  // ============ ADMIN OPERATIONS ============

  approveTierChange: adminProcedure
    .input(z.object({ assignmentId: z.number() }))
    .mutation(async ({ input }: any) => {
      const database = await initDb();
      if (!database) throw new Error("Database not available");
      const updated = await database
        .update(courierTierAssignments)
        .set({
          tierId: (await database.select().from(courierTierAssignments).where(eq(courierTierAssignments.id, input.assignmentId)))[0]?.requestedTierId,
          approvedAt: new Date(),
          requestedTierId: null,
        })
        .where(eq(courierTierAssignments.id, input.assignmentId))
        .returning();

      return updated[0];
    }),

  rejectTierChange: adminProcedure
    .input(z.object({ assignmentId: z.number(), reason: z.string() }))
    .mutation(async ({ input }: any) => {
      const database = await initDb();
      if (!database) throw new Error("Database not available");
      const updated = await database
        .update(courierTierAssignments)
        .set({
          rejectedAt: new Date(),
          rejectionReason: input.reason,
        })
        .where(eq(courierTierAssignments.id, input.assignmentId))
        .returning();

      return updated[0];
    }),

  verifyVehicle: adminProcedure
    .input(z.object({ vehicleId: z.number() }))
    .mutation(async ({ input }: any) => {
      const database = await initDb();
      if (!database) throw new Error("Database not available");
      const updated = await database
        .update(courierVehicles)
        .set({
          verified: true,
          verificationDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(courierVehicles.id, input.vehicleId))
        .returning();

      return updated[0];
    }),

  assignPartnerLevel: adminProcedure
    .input(z.object({ courierId: z.number(), levelId: z.number() }))
    .mutation(async ({ input }: any) => {
      const database = await initDb();
      if (!database) throw new Error("Database not available");
      const assignment = await database
        .insert(partnerLevelAssignments)
        .values({
          courierId: input.courierId,
          levelId: input.levelId,
          assignedAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return assignment[0];
    }),

  initializeTiers: adminProcedure.mutation(async () => {
    const database = await initDb();
    if (!database) throw new Error("Database not available");
    const tiers = [
      {
        name: "local",
        displayName: "Local Courier",
        operatingRadiusMin: 0,
        operatingRadiusMax: 100,
        platformFeePercentage: 20,
        courierPayoutPercentage: 80,
        description: "Parcel pickups and local deliveries within 100km",
      },
      {
        name: "regional",
        displayName: "Regional Courier",
        operatingRadiusMin: 100,
        operatingRadiusMax: 200,
        platformFeePercentage: 20,
        courierPayoutPercentage: 80,
        description: "Town-to-town and inter-city deliveries 100-200km",
      },
      {
        name: "long_haul",
        displayName: "Long Haul Courier",
        operatingRadiusMin: 200,
        operatingRadiusMax: 5000,
        platformFeePercentage: 25,
        courierPayoutPercentage: 75,
        description: "Major city routes and bulk transport 200km+",
      },
    ];

    for (const tier of tiers) {
      await database.insert(courierTiers).values(tier);
    }

    return tiers;
  }),

  initializePartnerLevels: adminProcedure.mutation(async () => {
    const database = await initDb();
    if (!database) throw new Error("Database not available");
    const levels = [
      {
        name: "bronze",
        displayName: "Bronze Partner",
        minCompletedDeliveries: 0,
        minRating: 4.5,
        minAcceptanceRate: 80,
        benefits: JSON.stringify(["Basic support", "Standard rates"]),
      },
      {
        name: "silver",
        displayName: "Silver Partner",
        minCompletedDeliveries: 100,
        minRating: 4.7,
        minAcceptanceRate: 85,
        benefits: JSON.stringify(["Priority support", "2% bonus on earnings"]),
      },
      {
        name: "gold",
        displayName: "Gold Partner",
        minCompletedDeliveries: 500,
        minRating: 4.8,
        minAcceptanceRate: 90,
        benefits: JSON.stringify(["VIP support", "5% bonus on earnings", "Exclusive routes"]),
      },
      {
        name: "platinum",
        displayName: "Platinum Partner",
        minCompletedDeliveries: 1000,
        minRating: 4.9,
        minAcceptanceRate: 95,
        benefits: JSON.stringify(["24/7 support", "10% bonus on earnings", "Premium routes", "Partner badge"]),
      },
      {
        name: "diamond",
        displayName: "Diamond Partner",
        minCompletedDeliveries: 2000,
        minRating: 4.95,
        minAcceptanceRate: 98,
        benefits: JSON.stringify(["Elite support", "15% bonus on earnings", "Reserved routes", "Diamond badge", "Annual bonus"]),
      },
    ];

    for (const level of levels) {
      await database.insert(partnerLevels).values(level);
    }

    return levels;
  }),
});
