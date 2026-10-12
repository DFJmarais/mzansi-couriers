import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { deliveryPaymentSessions, deliveries, parcelFinancialLedgers, refundRequests, relaySettlementAllocations, users } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { appendParcelLedgerEvent } from "../services/financial-ledger";
import { initiateRefund } from "../payments/paystack";

const activeStatuses = ["requested", "under_review", "approved", "pending", "processing", "needs_attention"] as const;
const settledStatuses = ["processed"] as const;

type RefundStatus = typeof refundRequests.$inferSelect["status"];

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Refund service is unavailable" });
  return db;
}

async function getPaymentContext(deliveryId: number) {
  const db = await dbOrThrow();
  const delivery = (await db.select().from(deliveries).where(eq(deliveries.id, deliveryId)).limit(1))[0];
  if (!delivery) throw new TRPCError({ code: "NOT_FOUND", message: "Parcel not found" });
  const session = (await db.select().from(deliveryPaymentSessions).where(eq(deliveryPaymentSessions.deliveryId, deliveryId)).orderBy(desc(deliveryPaymentSessions.id)).limit(1))[0];
  if (!session || session.status !== "paid") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A verified paid Paystack transaction is required before requesting a refund" });
  const requests = await db.select().from(refundRequests).where(eq(refundRequests.deliveryId, deliveryId));
  const original = Number(session.amount);
  const reserved = requests.filter((request) => (activeStatuses as readonly string[]).includes(request.status)).reduce((sum, request) => sum + Number(request.approvedAmount ?? request.requestedAmount), 0);
  const processed = requests.filter((request) => (settledStatuses as readonly string[]).includes(request.status)).reduce((sum, request) => sum + Number(request.approvedAmount ?? request.requestedAmount), 0);
  return { db, delivery, session, requests, original, available: Math.max(0, Math.round((original - reserved - processed) * 100) / 100) };
}

async function appendStatusEvent(deliveryId: number, requestId: number, type: "refund_requested" | "refund_approved" | "refund_processing" | "refund_failed", reference: string) {
  return appendParcelLedgerEvent({ deliveryId, eventKey: `delivery:${deliveryId}:refund:${requestId}:${type}`, type, amount: 0, reference });
}

export const refundsRouter = router({
  eligibility: protectedProcedure.input(z.object({ deliveryId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const context = await getPaymentContext(input.deliveryId);
    if (ctx.user.role !== "admin" && context.delivery.customerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Refund access is limited to the parcel owner" });
    return { allowed: true as const, originalPaymentAmount: context.original, availableToRefund: context.available };
  }),

  request: protectedProcedure.input(z.object({ deliveryId: z.number().int().positive(), requestedAmount: z.number().positive(), reason: z.string().trim().min(5).max(1000) })).mutation(async ({ ctx, input }) => {
    const context = await getPaymentContext(input.deliveryId);
    if (ctx.user.role !== "admin" && context.delivery.customerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You may only request a refund for your own parcel" });
    if (input.requestedAmount > context.available + 0.01) throw new TRPCError({ code: "BAD_REQUEST", message: `Refund exceeds the remaining refundable amount of R${context.available.toFixed(2)}` });
    const [created] = await context.db.insert(refundRequests).values({ deliveryId: input.deliveryId, customerId: context.delivery.customerId, paymentSessionId: context.session.id, transactionReference: context.session.reference, requestedAmount: input.requestedAmount.toFixed(2), currency: context.session.currency, reason: input.reason, requestedByUserId: ctx.user.id, status: "requested" }).$returningId();
    await appendStatusEvent(input.deliveryId, Number(created.id), "refund_requested", `Customer/admin request ${Number(created.id)}`);
    return { created: true, requestId: Number(created.id), status: "requested" as const, availableToRefund: context.available - input.requestedAmount };
  }),

  list: adminProcedure.query(async () => {
    const db = await dbOrThrow();
    const rows = await db.select({ request: refundRequests, delivery: deliveries, customer: users }).from(refundRequests).innerJoin(deliveries, eq(refundRequests.deliveryId, deliveries.id)).innerJoin(users, eq(refundRequests.customerId, users.id)).orderBy(desc(refundRequests.createdAt)).limit(200);
    if (rows.length === 0) return [];
    const sessionIds = Array.from(new Set(rows.map(({ request }) => request.paymentSessionId)));
    const deliveryIds = Array.from(new Set(rows.map(({ request }) => request.deliveryId)));
    const sessions = await db.select().from(deliveryPaymentSessions).where(inArray(deliveryPaymentSessions.id, sessionIds));
    const ledgers = await db.select().from(parcelFinancialLedgers).where(inArray(parcelFinancialLedgers.deliveryId, deliveryIds));
    const paidAllocations = await db.select().from(relaySettlementAllocations).where(inArray(relaySettlementAllocations.deliveryId, deliveryIds));
    return rows.map(({ request, delivery, customer }) => {
      const session = sessions.find((candidate) => candidate.id === request.paymentSessionId);
      const ledger = ledgers.find((candidate) => candidate.deliveryId === request.deliveryId);
      const paidCourierGross = paidAllocations.filter((allocation) => allocation.deliveryId === request.deliveryId && allocation.status === "paid").reduce((sum, allocation) => sum + Number(allocation.grossEarnings), 0);
      const original = Number(session?.amount ?? 0);
      const refundAmount = Number(request.approvedAmount ?? request.requestedAmount);
      const ratio = original > 0 ? Math.min(1, refundAmount / original) : 0;
      const reserved = rows.filter((candidate) => candidate.request.paymentSessionId === request.paymentSessionId && (activeStatuses as readonly string[]).includes(candidate.request.status)).reduce((sum, candidate) => sum + Number(candidate.request.approvedAmount ?? candidate.request.requestedAmount), 0);
      const processed = rows.filter((candidate) => candidate.request.paymentSessionId === request.paymentSessionId && (settledStatuses as readonly string[]).includes(candidate.request.status)).reduce((sum, candidate) => sum + Number(candidate.request.approvedAmount ?? candidate.request.requestedAmount), 0);
      return { ...request, parcelId: delivery.id, trackingCode: delivery.trackingCode, customerName: customer.name, customerEmail: customer.email, originalPaymentAmount: original, availableToRefund: Math.max(0, Math.round((original - reserved - processed) * 100) / 100), refundAmount, courierPayoutExposure: Math.min(paidCourierGross, original * 0.8 * ratio), paidCourierGross, platformReversalAmount: original * 0.2 * ratio, finalPlatformContribution: Number(ledger?.finalPlatformContribution ?? 0), finalCourierEarnings: Number(ledger?.finalCourierEarnings ?? 0) };
    });
  }),

  review: adminProcedure.input(z.object({ requestId: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = await dbOrThrow();
    const request = (await db.select().from(refundRequests).where(eq(refundRequests.id, input.requestId)).limit(1))[0];
    if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Refund request not found" });
    if (!["requested", "under_review"].includes(request.status)) throw new TRPCError({ code: "CONFLICT", message: "This refund is no longer awaiting review" });
    await db.update(refundRequests).set({ status: "under_review" }).where(and(eq(refundRequests.id, input.requestId), inArray(refundRequests.status, ["requested", "under_review"])));
    return { reviewed: true, status: "under_review" as const };
  }),

  reject: adminProcedure.input(z.object({ requestId: z.number().int().positive(), adminNote: z.string().trim().min(3).max(1000) })).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const request = (await db.select().from(refundRequests).where(eq(refundRequests.id, input.requestId)).limit(1))[0];
    if (!request || !["requested", "under_review"].includes(request.status)) throw new TRPCError({ code: "CONFLICT", message: "This refund is no longer awaiting review" });
    await db.update(refundRequests).set({ status: "rejected", reviewedByAdminId: ctx.user.id, reviewedAt: new Date(), adminNote: input.adminNote }).where(and(eq(refundRequests.id, input.requestId), inArray(refundRequests.status, ["requested", "under_review"])));
    return { rejected: true, status: "rejected" as const };
  }),

  approve: adminProcedure.input(z.object({ requestId: z.number().int().positive(), amount: z.number().positive().optional(), adminNote: z.string().trim().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const request = (await db.select().from(refundRequests).where(eq(refundRequests.id, input.requestId)).limit(1))[0];
    if (!request || !["requested", "under_review"].includes(request.status)) throw new TRPCError({ code: "CONFLICT", message: "This refund is no longer awaiting review" });
    const context = await getPaymentContext(request.deliveryId);
    const amount = Math.round((input.amount ?? Number(request.requestedAmount)) * 100) / 100;
    if (amount <= 0 || amount > context.available + 0.01 || amount > context.original + 0.01) throw new TRPCError({ code: "BAD_REQUEST", message: `Refund must not exceed the remaining refundable amount of R${context.available.toFixed(2)}` });
    const claimed = await db.update(refundRequests).set({ status: "approved", approvedAmount: amount.toFixed(2), reviewedByAdminId: ctx.user.id, reviewedAt: new Date(), adminNote: input.adminNote ?? null }).where(and(eq(refundRequests.id, input.requestId), inArray(refundRequests.status, ["requested", "under_review"])));
    const affectedRows = Number((claimed as unknown as Array<{ affectedRows?: number }>)[0]?.affectedRows ?? 0);
    if (affectedRows !== 1) throw new TRPCError({ code: "CONFLICT", message: "Refund was already approved or reviewed by another administrator" });
    await appendStatusEvent(request.deliveryId, request.id, "refund_approved", `Approved by admin ${ctx.user.id}`);
    const result = await initiateRefund({ transaction: request.transactionReference, ...(amount + 0.01 < context.original ? { amount } : {}), merchantNote: `Mzansi Couriers refund request ${request.id}`, customerNote: `Refund for Mzansi Couriers parcel ${request.deliveryId}` });
    if (!result.success) {
      await db.update(refundRequests).set({ status: "failed", paystackStatus: "failed", failureReason: result.error }).where(and(eq(refundRequests.id, request.id), eq(refundRequests.status, "approved")));
      await appendStatusEvent(request.deliveryId, request.id, "refund_failed", result.error ?? "Paystack rejected the refund request");
      return { approved: false as const, status: "failed" as const, error: result.error };
    }
    const status = (result.status === "processing" ? "processing" : "pending") as "pending" | "processing";
    await db.update(refundRequests).set({ status, paystackStatus: result.status, paystackRefundId: result.refundId, initiatedAt: new Date() }).where(and(eq(refundRequests.id, request.id), eq(refundRequests.status, "approved")));
    await appendStatusEvent(request.deliveryId, request.id, "refund_processing", result.refundId ?? `Paystack ${result.status}`);
    return { approved: true as const, status, paystackRefundId: result.refundId };
  }),
});
