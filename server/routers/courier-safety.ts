import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { courierSafetyCheckins, courierSafetyIncidents, courierSafetyProfiles, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const courierProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "courier" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Courier safety access required" });
  }
  return next({ ctx });
});

const locationInput = z.object({ latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional() });

export const courierSafetyRouter = router({
  getProfile: courierProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    return (await db.select().from(courierSafetyProfiles).where(eq(courierSafetyProfiles.userId, ctx.user.id)).limit(1))[0] ?? null;
  }),

  saveProfile: courierProcedure.input(z.object({
    trustedContactName: z.string().trim().min(2).max(160),
    trustedContactPhone: z.string().trim().min(7).max(30),
    emergencyPreference: z.enum(["saps_10111", "emergency_112", "trusted_contact"]),
    vehicleInsuranceAcknowledged: z.literal(true),
    goodsInTransitPolicyAcknowledged: z.literal(true),
    prohibitedItemsAcknowledged: z.literal(true),
    safetyTrainingAcknowledged: z.literal(true),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const values = { ...input, userId: ctx.user.id, serviceRadiusKm: 120, completedAt: new Date() };
    const existing = (await db.select({ id: courierSafetyProfiles.id }).from(courierSafetyProfiles).where(eq(courierSafetyProfiles.userId, ctx.user.id)).limit(1))[0];
    if (existing) await db.update(courierSafetyProfiles).set(values).where(eq(courierSafetyProfiles.id, existing.id));
    else await db.insert(courierSafetyProfiles).values(values);
    return { saved: true, serviceRadiusKm: 120 };
  }),

  activeCheckin: courierProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const checkin = (await db.select().from(courierSafetyCheckins).where(and(eq(courierSafetyCheckins.courierId, ctx.user.id), eq(courierSafetyCheckins.status, "active"))).orderBy(desc(courierSafetyCheckins.createdAt)).limit(1))[0] ?? null;
    if (checkin && checkin.expectedBy.getTime() < Date.now()) {
      await db.update(courierSafetyCheckins).set({ status: "overdue" }).where(eq(courierSafetyCheckins.id, checkin.id));
      await db.insert(courierSafetyIncidents).values({ courierId: ctx.user.id, type: "other", urgency: "high", description: `Courier safety check-in ${checkin.id} became overdue and needs an operations follow-up.` });
      return null;
    }
    return checkin;
  }),

  startCheckin: courierProcedure.input(z.object({ minutes: z.number().int().min(15).max(360), deliveryRunId: z.number().int().positive().optional() }).merge(locationInput)).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    await db.update(courierSafetyCheckins).set({ status: "cancelled" }).where(and(eq(courierSafetyCheckins.courierId, ctx.user.id), eq(courierSafetyCheckins.status, "active")));
    const expectedBy = new Date(Date.now() + input.minutes * 60_000);
    const result = await db.insert(courierSafetyCheckins).values({ courierId: ctx.user.id, deliveryRunId: input.deliveryRunId, expectedBy, latitude: input.latitude?.toString(), longitude: input.longitude?.toString(), status: "active" });
    return { checkinId: Number((result as any)[0]?.insertId ?? (result as any).insertId), expectedBy };
  }),

  completeCheckin: courierProcedure.input(locationInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    await db.update(courierSafetyCheckins).set({ status: "completed", checkedInAt: new Date(), latitude: input.latitude?.toString(), longitude: input.longitude?.toString() }).where(and(eq(courierSafetyCheckins.courierId, ctx.user.id), eq(courierSafetyCheckins.status, "active")));
    return { completed: true };
  }),

  cancelCheckin: courierProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    await db.update(courierSafetyCheckins).set({ status: "cancelled" }).where(and(eq(courierSafetyCheckins.courierId, ctx.user.id), eq(courierSafetyCheckins.status, "active")));
    return { cancelled: true };
  }),

  createIncident: courierProcedure.input(z.object({
    type: z.enum(["sos", "accident", "threat", "medical", "vehicle_breakdown", "parcel_security", "roadside_hazard", "other"]),
    urgency: z.enum(["urgent", "high", "normal"]).default("normal"),
    description: z.string().trim().min(3).max(1000),
    deliveryId: z.number().int().positive().optional(),
    emergencyNumber: z.enum(["10111", "112"]).optional(),
  }).merge(locationInput)).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const urgency = input.type === "sos" || input.type === "accident" || input.type === "medical" || input.type === "threat" ? "urgent" : input.urgency;
    const result = await db.insert(courierSafetyIncidents).values({ courierId: ctx.user.id, deliveryId: input.deliveryId, type: input.type, urgency, description: input.description, emergencyNumber: input.emergencyNumber, latitude: input.latitude?.toString(), longitude: input.longitude?.toString() });
    return { incidentId: Number((result as any)[0]?.insertId ?? (result as any).insertId), status: "open" as const, emergencyNumber: input.emergencyNumber ?? (urgency === "urgent" ? "10111" : null) };
  }),

  myIncidents: courierProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    return db.select().from(courierSafetyIncidents).where(eq(courierSafetyIncidents.courierId, ctx.user.id)).orderBy(desc(courierSafetyIncidents.createdAt)).limit(25);
  }),

  adminOpenIncidents: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    return db.select({ incident: courierSafetyIncidents, courier: { id: users.id, name: users.name, phone: users.phone, email: users.email } }).from(courierSafetyIncidents).innerJoin(users, eq(courierSafetyIncidents.courierId, users.id)).where(inArray(courierSafetyIncidents.status, ["open", "acknowledged", "in_review"])).orderBy(desc(courierSafetyIncidents.createdAt));
  }),

  adminResolveIncident: adminProcedure.input(z.object({ incidentId: z.number().int().positive(), status: z.enum(["acknowledged", "in_review", "resolved", "cancelled"]), resolutionNote: z.string().trim().min(3).max(1000) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    await db.update(courierSafetyIncidents).set({ status: input.status, acknowledgedBy: ctx.user.id, resolutionNote: input.resolutionNote, resolvedAt: input.status === "resolved" || input.status === "cancelled" ? new Date() : null }).where(eq(courierSafetyIncidents.id, input.incidentId));
    return { updated: true };
  }),
});
