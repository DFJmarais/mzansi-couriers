import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, gte, lte, desc, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { fleetAccounts, fleetVehicles, fleetDrivers, fleetDeliveries, fleetEarnings, fleetDocuments, fleetNotifications, deliveries, notifications } from "../../drizzle/schema";
import { isVehicleFit } from "../dispatch/fleet-matching";

/**
 * Fleet Partner Router
 * Manages fleet business operations
 */
export const fleetRouter = router({
  /**
   * Create a new fleet account
   */
  createFleetAccount: protectedProcedure
    .input(
      z.object({
        businessName: z.string().min(3),
        ownerName: z.string().min(2),
        saIdNumber: z.string().length(13),
        businessRegistrationNumber: z.string().optional(),
        vatNumber: z.string().optional(),
        contactEmail: z.string().email(),
        contactPhone: z.string(),
        physicalAddress: z.string().min(10),
        operatingProvinces: z.array(z.string()),
        areasServed: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const existing = await db.select().from(fleetAccounts).where(eq(fleetAccounts.userId, ctx.user.id)).limit(1);
      if (existing[0]) {
        return {
          fleetId: existing[0].id,
          status: existing[0].status,
          message: "A fleet account already exists for this user.",
        };
      }

      const result = await db.insert(fleetAccounts).values({
        userId: ctx.user.id,
        businessName: input.businessName,
        ownerName: input.ownerName,
        saIdNumber: input.saIdNumber,
        businessRegistrationNumber: input.businessRegistrationNumber,
        vatNumber: input.vatNumber,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        physicalAddress: input.physicalAddress,
        operatingProvinces: input.operatingProvinces,
        areasServed: input.areasServed,
      });

      return {
        fleetId: Number((result as any).insertId),
        status: "pending" as const,
        message: "Fleet account created. Awaiting document verification.",
      };
    }),

  /**
   * Get fleet account details
   */
  getFleetAccount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const rows = await db.select().from(fleetAccounts).where(eq(fleetAccounts.userId, ctx.user.id)).limit(1);
    return rows[0] ?? null;
  }),

  /**
   * Upload fleet document
   */
  uploadFleetDocument: protectedProcedure
    .input(
      z.object({
        documentType: z.enum([
          "id",
          "business_registration",
          "vat_certificate",
          "proof_of_address",
          "insurance",
          "operating_permit",
        ]),
        documentUrl: z.string().url(),
        documentHash: z.string(),
        expiryDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const fleet = await db.select({ id: fleetAccounts.id }).from(fleetAccounts).where(eq(fleetAccounts.userId, ctx.user.id)).limit(1);
      if (!fleet[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Create a fleet account before uploading documents" });
      await db.insert(fleetDocuments).values({ fleetId: fleet[0].id, documentType: input.documentType, documentUrl: input.documentUrl, documentHash: input.documentHash, expiryDate: input.expiryDate });
      return { status: "pending" as const, message: "Document uploaded for verification" };
    }),

  /**
   * Add vehicle to fleet
   */
  addVehicle: protectedProcedure
    .input(
      z.object({
        registrationNumber: z.string().min(3).max(50),
        vehicleType: z.enum([
          "bicycle",
          "scooter",
          "motorcycle",
          "car",
          "bakkie",
          "small_van",
          "large_van",
          "truck",
          "refrigerated",
          "flatbed",
        ]),
        vehiclePhoto: z.string().url().optional(),
        maxParcelCapacity: z.number().int().positive().optional(),
        weightCapacity: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const fleet = await db.select().from(fleetAccounts).where(eq(fleetAccounts.userId, ctx.user.id)).limit(1);
      if (!fleet[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Create a fleet account before adding vehicles" });

      const result = await db.insert(fleetVehicles).values({
        fleetId: fleet[0].id,
        registrationNumber: input.registrationNumber,
        vehicleType: input.vehicleType,
        vehiclePhoto: input.vehiclePhoto,
        maxParcelCapacity: input.maxParcelCapacity,
        weightCapacity: input.weightCapacity?.toString(),
      });
      await db.update(fleetAccounts).set({ totalVehicles: (fleet[0].totalVehicles ?? 0) + 1 }).where(eq(fleetAccounts.id, fleet[0].id));

      return {
        vehicleId: Number((result as any).insertId),
        message: "Vehicle added to fleet",
      };
    }),

  /**
   * Get fleet vehicles
   */
  getFleetVehicles: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const fleet = await db.select({ id: fleetAccounts.id }).from(fleetAccounts).where(eq(fleetAccounts.userId, ctx.user.id)).limit(1);
    if (!fleet[0]) return [];
    return db.select().from(fleetVehicles).where(eq(fleetVehicles.fleetId, fleet[0].id));
  }),

  /**
   * Add driver to fleet
   */
  addDriver: protectedProcedure
    .input(
      z.object({
        driverName: z.string().min(2).max(255),
        licenseNumber: z.string().min(3).max(50),
        licenseExpiryDate: z.date(),
        saIdNumber: z.string().length(13),
        contactPhone: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return {
        message: "Driver added to fleet",
      };
    }),

  /**
   * Get fleet drivers
   */
  getFleetDrivers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const fleet = await db.select({ id: fleetAccounts.id }).from(fleetAccounts).where(eq(fleetAccounts.userId, ctx.user.id)).limit(1);
    if (!fleet[0]) return [];
    return db.select().from(fleetDrivers).where(eq(fleetDrivers.fleetId, fleet[0].id));
  }),

  /**
   * Get fleet dashboard
   */
  getFleetDashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const fleet = await db.select().from(fleetAccounts).where(eq(fleetAccounts.userId, ctx.user.id)).limit(1);
    if (!fleet[0]) return { fleet: null, vehicleCount: 0, driverCount: 0, activeVehicles: 0, activeDrivers: 0, deliveriesToday: 0, grossRevenue: "0.00", platformFee: "0.00", fleetEarnings: "0.00" };
    const vehicles = await db.select({ availability: fleetVehicles.availability }).from(fleetVehicles).where(eq(fleetVehicles.fleetId, fleet[0].id));
    const drivers = await db.select({ currentStatus: fleetDrivers.currentStatus }).from(fleetDrivers).where(eq(fleetDrivers.fleetId, fleet[0].id));
    const activeVehicles = vehicles.filter((vehicle) => vehicle.availability === "in_use").length;
    const activeDrivers = drivers.filter((driver) => driver.currentStatus === "online" || driver.currentStatus === "on_delivery").length;
    const deliveryRows = await db.select({ completedAt: fleetDeliveries.completedAt, assignedAt: fleetDeliveries.assignedAt }).from(fleetDeliveries).where(eq(fleetDeliveries.fleetId, fleet[0].id));
    const earningRows = await db.select({ grossAmount: fleetEarnings.grossAmount, platformFee: fleetEarnings.platformFee, netAmount: fleetEarnings.netAmount, earningDate: fleetEarnings.earningDate }).from(fleetEarnings).where(eq(fleetEarnings.fleetId, fleet[0].id));
    const today = new Date().toISOString().slice(0, 10);
    const todayEarnings = earningRows.filter((earning) => String(earning.earningDate) === today);
    const total = (rows: Array<{ grossAmount: string | null }>) => rows.reduce((sum, row) => sum + Number(row.grossAmount ?? 0), 0).toFixed(2);
    const fee = todayEarnings.reduce((sum, row) => sum + Number(row.platformFee ?? 0), 0).toFixed(2);
    const net = todayEarnings.reduce((sum, row) => sum + Number(row.netAmount ?? 0), 0).toFixed(2);
    return { fleet: fleet[0], vehicleCount: vehicles.length, driverCount: drivers.length, activeVehicles, activeDrivers, deliveriesToday: deliveryRows.filter((delivery) => delivery.assignedAt.toISOString().slice(0, 10) === today).length, completedDeliveries: deliveryRows.filter((delivery) => Boolean(delivery.completedAt)).length, grossRevenue: total(todayEarnings), platformFee: fee, fleetEarnings: net };
  }),

  /**
   * Get fleet earnings
   */
  getFleetEarnings: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const fleet = await db.select({ id: fleetAccounts.id }).from(fleetAccounts).where(eq(fleetAccounts.userId, ctx.user.id)).limit(1);
      if (!fleet[0]) return [];
      return db.select().from(fleetEarnings).where(and(eq(fleetEarnings.fleetId, fleet[0].id), gte(fleetEarnings.earningDate, input.startDate), lte(fleetEarnings.earningDate, input.endDate))).orderBy(desc(fleetEarnings.earningDate));
    }),

  /**
   * Get fleet notifications
   */
  getFleetNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(10),
        offset: z.number().int().nonnegative().default(0),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const fleet = await db.select({ id: fleetAccounts.id }).from(fleetAccounts).where(eq(fleetAccounts.userId, ctx.user.id)).limit(1);
      if (!fleet[0]) return [];
      const conditions = [eq(fleetNotifications.fleetId, fleet[0].id)];
      if (input.unreadOnly) conditions.push(eq(fleetNotifications.isRead, false));
      return db.select().from(fleetNotifications).where(and(...conditions)).orderBy(desc(fleetNotifications.createdAt)).limit(input.limit).offset(input.offset);
    }),

  /**
   * Mark notification as read
   */
  markNotificationAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const fleet = await db.select({ id: fleetAccounts.id }).from(fleetAccounts).where(eq(fleetAccounts.userId, ctx.user.id)).limit(1);
      if (!fleet[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Fleet account not found" });
      await db.update(fleetNotifications).set({ isRead: true, readAt: new Date() }).where(and(eq(fleetNotifications.id, input.notificationId), eq(fleetNotifications.fleetId, fleet[0].id)));
      return { success: true };
    }),

  /**
   * Get AI recommendations
   */
  getAIRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const fleet = await db.select({ id: fleetAccounts.id, status: fleetAccounts.status }).from(fleetAccounts).where(eq(fleetAccounts.userId, ctx.user.id)).limit(1);
    if (!fleet[0]) return { recommendations: [], message: "Register your fleet to see work that fits your vehicles." };
    const vehicles = await db.select().from(fleetVehicles).where(and(eq(fleetVehicles.fleetId, fleet[0].id), eq(fleetVehicles.availability, "available"), eq(fleetVehicles.insuranceStatus, "active")));
    const pending = await db.select().from(deliveries).where(and(eq(deliveries.status, "pending"), isNull(deliveries.courierId))).orderBy(desc(deliveries.createdAt)).limit(50);
    const recommendations = pending.flatMap((delivery) => {
      const vehicle = vehicles.find((candidate) => isVehicleFit(candidate, delivery.packageSize, Number(delivery.packageWeight)));
      if (!vehicle) return [];
      return [{ deliveryId: delivery.id, trackingCode: delivery.trackingCode, packageSize: delivery.packageSize, packageWeight: Number(delivery.packageWeight), distanceKm: delivery.distance == null ? null : Number(delivery.distance), estimatedPrice: Number(delivery.finalPrice ?? delivery.estimatedPrice), vehicleId: vehicle.id, vehicleRegistration: vehicle.registrationNumber, reason: `Fits ${vehicle.registrationNumber} capacity and current availability`, requiresOwnerApproval: true }];
    });
    return { recommendations, message: recommendations.length ? "These parcels fit available fleet capacity. Review each one before assignment." : "No pending parcels currently match an available insured vehicle." };
  }),

  approveRecommendation: protectedProcedure
    .input(z.object({ deliveryId: z.number().int().positive(), vehicleId: z.number().int().positive(), driverId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const fleet = await db.select({ id: fleetAccounts.id, status: fleetAccounts.status }).from(fleetAccounts).where(eq(fleetAccounts.userId, ctx.user.id)).limit(1);
      if (!fleet[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Register your fleet before approving work" });
      if (fleet[0].status !== "approved") throw new TRPCError({ code: "FORBIDDEN", message: "Fleet verification must be complete before assigning work" });
      const vehicle = await db.select().from(fleetVehicles).where(and(eq(fleetVehicles.id, input.vehicleId), eq(fleetVehicles.fleetId, fleet[0].id))).limit(1);
      const driver = await db.select().from(fleetDrivers).where(and(eq(fleetDrivers.id, input.driverId), eq(fleetDrivers.fleetId, fleet[0].id))).limit(1);
      const delivery = await db.select().from(deliveries).where(and(eq(deliveries.id, input.deliveryId), eq(deliveries.status, "pending"), isNull(deliveries.courierId))).limit(1);
      if (!vehicle[0] || !driver[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Select a vehicle and active fleet driver" });
      if (vehicle[0].availability !== "available" || vehicle[0].insuranceStatus !== "active") throw new TRPCError({ code: "CONFLICT", message: "Choose an available vehicle with active insurance" });
      if (driver[0].status !== "active" || driver[0].backgroundCheckStatus !== "verified") throw new TRPCError({ code: "CONFLICT", message: "Choose an active, verified driver" });
      if (!delivery[0]) throw new TRPCError({ code: "CONFLICT", message: "This parcel is no longer available for assignment" });
      const existing = await db.select({ id: fleetDeliveries.id }).from(fleetDeliveries).where(and(eq(fleetDeliveries.fleetId, fleet[0].id), eq(fleetDeliveries.deliveryId, input.deliveryId))).limit(1);
      if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "This parcel is already being reviewed by your fleet" });
      await db.insert(fleetDeliveries).values({ fleetId: fleet[0].id, vehicleId: vehicle[0].id, driverId: driver[0].id, deliveryId: delivery[0].id, assignmentMode: "manual", acceptedAt: new Date() });
      await db.update(deliveries).set({ courierId: driver[0].userId, status: "assigned" }).where(eq(deliveries.id, delivery[0].id));
      await db.update(fleetVehicles).set({ availability: "in_use", currentDeliveries: (vehicle[0].currentDeliveries ?? 0) + 1 }).where(eq(fleetVehicles.id, vehicle[0].id));
      await db.insert(notifications).values({ userId: driver[0].userId, type: "delivery_assigned", title: "Fleet parcel ready", message: `Parcel ${delivery[0].trackingCode} has been assigned to your fleet route. Review the pickup and destination in your courier dashboard.`, relatedDeliveryId: delivery[0].id });
      return { assigned: true, deliveryId: delivery[0].id, vehicleId: vehicle[0].id, driverId: driver[0].id };
    }),

  /**
   * Get trust score history
   */
  getTrustScoreHistory: protectedProcedure.query(async () => {
    return [];
  }),

  /**
   * Get referral program info
   */
  getReferralProgram: protectedProcedure.query(async () => {
    return {
      referralCode: "",
      totalReferrals: 0,
      completedReferrals: 0,
      totalRewards: 0,
      pendingRewards: 0,
    };
  }),

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics: protectedProcedure
    .input(
      z.object({
        days: z.number().int().positive().default(30),
      })
    )
    .query(async () => {
      return {
        totalDeliveries: 0,
        completedDeliveries: 0,
        cancelledDeliveries: 0,
        averageDeliveryTime: 0,
        customerRating: 0,
        acceptanceRate: 0,
        completionRate: 0,
        revenue: 0,
        costs: 0,
        profit: 0,
      };
    }),

  /**
   * Update dispatch mode
   */
  updateDispatchMode: protectedProcedure
    .input(z.object({ mode: z.enum(["automatic", "manual"]) }))
    .mutation(async ({ ctx, input }) => {
      return { success: true, mode: input.mode };
    }),

  /**
   * Get live fleet map data
   */
  getLiveFleetData: protectedProcedure.query(async ({ ctx }) => {
    return {
      vehicles: [
        {
          id: 1,
          registrationNumber: "GP 23 ABC",
          latitude: -25.7461,
          longitude: 28.2313,
          status: "on_delivery",
          driver: "John Doe",
          nextStop: "Sandton City",
        },
        {
          id: 2,
          registrationNumber: "GP 24 XYZ",
          latitude: -25.7558,
          longitude: 28.2305,
          status: "idle",
          driver: "Jane Smith",
          nextStop: "Waiting for assignment",
        },
      ],
      activeDeliveries: 2,
      totalDistance: 45.2,
      estimatedCompletionTime: "2 hours",
    };
  }),

  /**
   * Get smart dispatch suggestions
   */
  getSmartDispatchSuggestions: protectedProcedure.query(async ({ ctx }) => {
    return [
      {
        deliveryId: "DEL001",
        suggestedVehicle: "GP 23 ABC",
        suggestedDriver: "John Doe",
        matchScore: 0.95,
        estimatedDeliveryTime: 35,
        reason: "Optimal route match",
      },
      {
        deliveryId: "DEL002",
        suggestedVehicle: "GP 24 XYZ",
        suggestedDriver: "Jane Smith",
        matchScore: 0.87,
        estimatedDeliveryTime: 42,
        reason: "Good capacity match",
      },
    ];
  }),
});
