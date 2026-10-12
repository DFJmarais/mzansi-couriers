import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { parcelFinancialLedgerEntries, parcelFinancialLedgers } from "../../drizzle/schema";

export type LedgerEventType = "customer_payment" | "platform_allocation" | "courier_pool" | "reserve" | "leg_allocation" | "refund" | "refund_requested" | "refund_approved" | "refund_pending" | "refund_processing" | "refund_processed" | "refund_failed" | "platform_reversal" | "courier_pool_reversal" | "cancellation" | "replacement_leg" | "payment_cost" | "payout_cost" | "settlement";
export type LedgerState = {
  customerPayment: number; platformAllocation: number; courierPoolAllocation: number; reservedAmount: number; platformReversals: number; courierPoolReversals: number;
  allocatedToCouriers: number; refunds: number; cancellationAdjustments: number; replacementLegCosts: number;
  paymentCosts: number; payoutCosts: number; finalPlatformContribution: number; finalCourierEarnings: number;
};

const round = (n: number) => Math.round(n * 100) / 100;
const money = (n: number) => { if (!Number.isFinite(n) || n < 0) throw new Error("Ledger amounts must be finite and non-negative"); return round(n); };

export function applyLedgerEvent(state: LedgerState, event: { type: LedgerEventType; amount: number }): LedgerState {
  const amount = money(event.amount);
  const next = { ...state };
  if (event.type === "customer_payment") next.customerPayment += amount;
  if (event.type === "platform_allocation") next.platformAllocation += amount;
  if (event.type === "courier_pool") next.courierPoolAllocation += amount;
  if (event.type === "platform_reversal") next.platformReversals += amount;
  if (event.type === "courier_pool_reversal") next.courierPoolReversals += amount;
  if (event.type === "reserve" || event.type === "replacement_leg") next.reservedAmount += amount;
  if (event.type === "leg_allocation") next.allocatedToCouriers += amount;
  if (event.type === "refund" || event.type === "refund_processed") next.refunds += amount;
  if (event.type === "cancellation") next.cancellationAdjustments += amount;
  if (event.type === "replacement_leg") next.replacementLegCosts += amount;
  if (event.type === "payment_cost") next.paymentCosts += amount;
  if (event.type === "payout_cost") next.payoutCosts += amount;
  next.finalCourierEarnings = round(next.allocatedToCouriers - next.courierPoolReversals - next.cancellationAdjustments);
  next.finalPlatformContribution = round(next.platformAllocation - next.platformReversals - next.cancellationAdjustments - next.replacementLegCosts - next.paymentCosts - next.payoutCosts);
  return Object.fromEntries(Object.entries(next).map(([k, v]) => [k, round(Number(v))])) as LedgerState;
}

export function assertLedgerInvariant(state: LedgerState): void {
  if (state.allocatedToCouriers > state.courierPoolAllocation + 0.01) throw new Error("Courier allocations exceed the funded 80% pool");
  if (state.platformReversals > state.platformAllocation + 0.01) throw new Error("Platform reversals exceed the funded platform allocation");
  if (state.courierPoolReversals > state.courierPoolAllocation + 0.01) throw new Error("Courier-pool reversals exceed the funded courier pool");
  if (state.reservedAmount < state.replacementLegCosts - 0.01) throw new Error("Replacement-leg costs exceed reserved funds");
  if (state.finalCourierEarnings < -0.01) throw new Error("Final courier earnings cannot be negative");
  if (state.finalPlatformContribution < -state.paymentCosts - state.payoutCosts - 0.01) throw new Error("Ledger contribution invariant failed");
}

export async function appendParcelLedgerEvent(input: {
  deliveryId: number; eventKey: string; type: LedgerEventType; amount: number; courierId?: number | null; relayLegId?: number | null; reference?: string | null;
}): Promise<LedgerState> {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const amount = money(input.amount);
  const existing = await db.select().from(parcelFinancialLedgerEntries).where(eq(parcelFinancialLedgerEntries.eventKey, input.eventKey)).limit(1);
  const ledger = (await db.select().from(parcelFinancialLedgers).where(eq(parcelFinancialLedgers.deliveryId, input.deliveryId)).limit(1))[0];
  if (!ledger) throw new Error("Financial ledger must be initialized before events are appended");
  if (!existing[0]) {
    const state = await getParcelLedgerState(input.deliveryId);
    const next = applyLedgerEvent(state, { type: input.type, amount });
    assertLedgerInvariant(next);
    await db.insert(parcelFinancialLedgerEntries).values({ ledgerId: ledger.id, deliveryId: input.deliveryId, eventKey: input.eventKey, eventType: input.type, amount: amount.toFixed(2), courierId: input.courierId ?? null, relayLegId: input.relayLegId ?? null, reference: input.reference ?? null });
    await db.update(parcelFinancialLedgers).set({
      customerPayment: next.customerPayment.toFixed(2), platformAllocation: next.platformAllocation.toFixed(2), courierPoolAllocation: next.courierPoolAllocation.toFixed(2), reservedAmount: next.reservedAmount.toFixed(2), platformReversals: next.platformReversals.toFixed(2), courierPoolReversals: next.courierPoolReversals.toFixed(2), allocatedToCouriers: next.allocatedToCouriers.toFixed(2), refunds: next.refunds.toFixed(2), cancellationAdjustments: next.cancellationAdjustments.toFixed(2), replacementLegCosts: next.replacementLegCosts.toFixed(2), paymentCosts: next.paymentCosts.toFixed(2), payoutCosts: next.payoutCosts.toFixed(2), finalPlatformContribution: next.finalPlatformContribution.toFixed(2), finalCourierEarnings: next.finalCourierEarnings.toFixed(2), version: ledger.version + 1, status: "open",
    }).where(and(eq(parcelFinancialLedgers.id, ledger.id), eq(parcelFinancialLedgers.version, ledger.version)));
    return next;
  }
  return getParcelLedgerState(input.deliveryId);
}

export async function initializeParcelLedger(input: { deliveryId: number; customerPayment: number; paymentCost?: number; reserveAmount?: number; }): Promise<LedgerState> {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const existing = (await db.select().from(parcelFinancialLedgers).where(eq(parcelFinancialLedgers.deliveryId, input.deliveryId)).limit(1))[0];
  if (existing) return getParcelLedgerState(input.deliveryId);
  const payment = money(input.customerPayment); const platform = round(payment * 0.2); const pool = round(payment - platform);
  const [created] = await db.insert(parcelFinancialLedgers).values({ deliveryId: input.deliveryId, customerPayment: payment.toFixed(2), platformAllocation: platform.toFixed(2), courierPoolAllocation: pool.toFixed(2), paymentCosts: money(input.paymentCost ?? 0).toFixed(2), reservedAmount: money(input.reserveAmount ?? 0).toFixed(2), finalPlatformContribution: round(platform - money(input.paymentCost ?? 0)).toFixed(2) }).$returningId();
  if (!created?.id) throw new Error("Could not create parcel financial ledger");
  const events = [
    ["customer_payment", payment], ["platform_allocation", platform], ["courier_pool", pool],
    ...(input.paymentCost ? [["payment_cost", money(input.paymentCost)]] : []),
    ...(input.reserveAmount ? [["reserve", money(input.reserveAmount)]] : []),
  ] as Array<[LedgerEventType, number]>;
  for (const [type, amount] of events) await db.insert(parcelFinancialLedgerEntries).values({ ledgerId: created.id, deliveryId: input.deliveryId, eventKey: `delivery:${input.deliveryId}:initial:${type}`, eventType: type, amount: amount.toFixed(2) });
  return getParcelLedgerState(input.deliveryId);
}

export async function getParcelLedgerState(deliveryId: number): Promise<LedgerState> {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const entries = await db.select().from(parcelFinancialLedgerEntries).where(eq(parcelFinancialLedgerEntries.deliveryId, deliveryId)).orderBy(asc(parcelFinancialLedgerEntries.id));
  let state: LedgerState = { customerPayment: 0, platformAllocation: 0, courierPoolAllocation: 0, reservedAmount: 0, platformReversals: 0, courierPoolReversals: 0, allocatedToCouriers: 0, refunds: 0, cancellationAdjustments: 0, replacementLegCosts: 0, paymentCosts: 0, payoutCosts: 0, finalPlatformContribution: 0, finalCourierEarnings: 0 };
  for (const entry of entries) state = applyLedgerEvent(state, { type: entry.eventType, amount: Number(entry.amount) });
  assertLedgerInvariant(state); return state;
}

export async function markParcelLedgerSettled(deliveryId: number): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const ledger = (await db.select().from(parcelFinancialLedgers).where(eq(parcelFinancialLedgers.deliveryId, deliveryId)).limit(1))[0];
  if (!ledger) throw new Error("Cannot settle a parcel without a financial ledger");
  await appendParcelLedgerEvent({ deliveryId, eventKey: `delivery:${deliveryId}:settlement`, type: "settlement", amount: 0, reference: "All courier allocations paid" });
  await db.update(parcelFinancialLedgers).set({ status: "settled" }).where(and(eq(parcelFinancialLedgers.id, ledger.id), eq(parcelFinancialLedgers.status, "open")));
}
