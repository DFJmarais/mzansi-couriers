import { router, protectedProcedure, adminProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from '../db';
import { courierPayouts, payoutSettings, notifications, relaySettlementAllocations } from '../../drizzle/schema';
import { initiateTransfer, verifyTransfer } from '../payments/paystack';
import { buildWeeklyRelaySettlement } from '../services/relay-settlement';
import { markParcelLedgerSettled } from '../services/financial-ledger';

const weeklyPayoutInput = z.object({ weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
function payoutDateFor(weekStart: string) {
  const date = new Date(`${weekStart}T09:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 4);
  return date;
}

async function buildWeeklyCandidates(weekStart: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const settlement = await buildWeeklyRelaySettlement(weekStart);
  const payoutDate = settlement.payoutDate;
  const grouped = new Map<number, { courierId: number; deliveryIds: Set<number>; customerRevenue: number; platformFee: number; grossEarnings: number }>();
  for (const allocation of settlement.allocations) {
    const current = grouped.get(allocation.courierId) || { courierId: allocation.courierId, deliveryIds: new Set<number>(), customerRevenue: 0, platformFee: 0, grossEarnings: 0 };
    current.deliveryIds.add(allocation.deliveryId);
    current.customerRevenue += Number(allocation.customerCharge);
    current.platformFee += Number(allocation.platformFee);
    current.grossEarnings += Number(allocation.grossEarnings);
    grouped.set(allocation.courierId, current);
  }
  const candidates = [];
  for (const totals of Array.from(grouped.values())) {
    const [payoutSettingsRow] = await db.select().from(payoutSettings).where(eq(payoutSettings.courierId, totals.courierId)).limit(1);
    const payoutAmount = Math.round(totals.grossEarnings * 100) / 100;
    if (!payoutSettingsRow?.isVerified || !payoutSettingsRow.paystackRecipientCode || payoutAmount < Number(payoutSettingsRow.minimumPayoutAmount ?? 100)) continue;
    const [existing] = await db.select().from(courierPayouts).where(and(eq(courierPayouts.courierId, totals.courierId), eq(courierPayouts.payoutDate, payoutDate))).limit(1);
    if (existing) {
      candidates.push(existing);
      continue;
    }
    const inserted = await db.insert(courierPayouts).values({
      courierId: totals.courierId,
      amount: payoutAmount.toFixed(2),
      currency: 'ZAR',
      payoutDate,
      status: 'pending',
      recipientCode: payoutSettingsRow.paystackRecipientCode,
      deliveryCount: totals.deliveryIds.size,
      platformCommission: totals.platformFee.toFixed(2),
      netAmount: payoutAmount.toFixed(2),
    });
    const payoutId = Number(inserted[0].insertId);
    await db.update(relaySettlementAllocations).set({ payoutId, status: 'approved' }).where(and(inArray(relaySettlementAllocations.deliveryId, Array.from(totals.deliveryIds)), eq(relaySettlementAllocations.courierId, totals.courierId), eq(relaySettlementAllocations.status, 'calculated')));
    candidates.push({ id: payoutId, courierId: totals.courierId, amount: payoutAmount.toFixed(2), currency: 'ZAR', payoutDate, status: 'pending', recipientCode: payoutSettingsRow.paystackRecipientCode, deliveryCount: totals.deliveryIds.size, settlementMode: 'parcel-relay' as const });
  }
  return { candidates, blocked: settlement.blocked, totals: settlement.totals };
}

export const payoutRouter = router({
  reviewWeeklyPayouts: adminProcedure.input(weeklyPayoutInput).mutation(async ({ input }) => {
    const review = await buildWeeklyCandidates(input.weekStart);
    return { success: true, payoutDate: payoutDateFor(input.weekStart), ...review };
  }),
  getWeeklyReview: adminProcedure.input(weeklyPayoutInput).query(async ({ input }) => {
    const review = await buildWeeklyCandidates(input.weekStart);
    return { success: true, payoutDate: payoutDateFor(input.weekStart), ...review };
  }),
  processWeeklyCourierPayouts: adminProcedure.input(z.object({ payoutIds: z.array(z.number()).min(1), testMode: z.boolean().default(true) })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    const key = process.env.PAYSTACK_SECRET_KEY || '';
    const isTestKey = key.includes('sk_test');
    if (input.testMode && !isTestKey) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Test-mode payout processing requires a Paystack test secret key.' });
    if (!input.testMode && isTestKey) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Live payout processing requires a Paystack live secret key.' });
    const results = [];
    for (const payoutId of input.payoutIds) {
      const [payout] = await db.select().from(courierPayouts).where(eq(courierPayouts.id, payoutId)).limit(1);
      if (!payout || payout.status !== 'pending' || !payout.recipientCode) continue;
      const claim = await db.update(courierPayouts).set({ status: 'processing', updatedAt: new Date() }).where(and(eq(courierPayouts.id, payoutId), eq(courierPayouts.status, 'pending')));
      const claimedRows = Number((claim as unknown as Array<{ affectedRows?: number }>)[0]?.affectedRows ?? 0);
      if (claimedRows !== 1) continue;
      const transfer = await initiateTransfer({ source: 'balance', recipient_code: payout.recipientCode, amount: Number(payout.amount), reason: `Mzansi Couriers relay settlement payout ${payoutId}`, reference: `courier-payout-${payoutId}` });
      if (!transfer.success || !transfer.reference) {
        const failureReason = transfer.error || 'Paystack transfer failed';
        await db.update(courierPayouts).set({ status: 'failed', failureReason, updatedAt: new Date() }).where(eq(courierPayouts.id, payoutId));
        await db.insert(notifications).values({ userId: payout.courierId, type: 'payment', title: 'Relay payout needs attention', message: `Your parcel-level courier payout could not be started: ${failureReason}`, relatedDeliveryId: null });
        results.push({ payoutId, status: 'failed', error: failureReason });
        continue;
      }
      await db.update(courierPayouts).set({ status: 'processing', paystackTransferId: transfer.transfer_code || transfer.reference, updatedAt: new Date() }).where(eq(courierPayouts.id, payoutId));
      await db.update(relaySettlementAllocations).set({ status: 'paid', updatedAt: new Date() }).where(and(eq(relaySettlementAllocations.payoutId, payoutId), eq(relaySettlementAllocations.status, 'approved')));
      const paidAllocations = await db.select().from(relaySettlementAllocations).where(eq(relaySettlementAllocations.payoutId, payoutId));
      for (const deliveryId of Array.from(new Set(paidAllocations.map((allocation) => allocation.deliveryId)))) {
        const deliveryAllocations = await db.select().from(relaySettlementAllocations).where(eq(relaySettlementAllocations.deliveryId, deliveryId));
        if (deliveryAllocations.length > 0 && deliveryAllocations.every((allocation) => allocation.status === 'paid')) await markParcelLedgerSettled(deliveryId);
      }
      await db.insert(notifications).values({ userId: payout.courierId, type: 'payment', title: 'Relay payout processing', message: `Your parcel-level courier earnings of R${payout.amount} are processing through Paystack.`, relatedDeliveryId: null });
      results.push({ payoutId, status: 'processing', reference: transfer.reference, testMode: input.testMode });
    }
    return { success: true, results };
  }),
  verifyCourierTransfer: adminProcedure.input(z.object({ reference: z.string().min(3) })).mutation(async ({ input }) => verifyTransfer(input.reference)),
  requestCourierPayout: protectedProcedure.input(z.object({ amount: z.number().min(100), bank_account_id: z.number() })).mutation(async () => {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'On-demand payouts are disabled. Verified courier earnings are processed once a week through Paystack, normally on Thursday or Friday.' });
  }),
  getCourierPayoutHistory: protectedProcedure.input(z.object({ limit: z.number().default(10) })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    const payouts = await db.select().from(courierPayouts).where(eq(courierPayouts.courierId, ctx.user.id)).limit(input.limit);
    return { success: true, payouts };
  }),
});
