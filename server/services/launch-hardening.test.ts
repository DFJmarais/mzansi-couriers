import { describe, expect, it } from "vitest";
import { applyLedgerEvent, assertLedgerInvariant, type LedgerState } from "./financial-ledger";
import { planParallelWaves, validateDispatchReadiness } from "./launch-readiness";
import { calculateSharedRelayPool, type RelayPoolLegInput } from "./relay-pool-pricing";

const baseLeg = (distanceKm: number, courierId = "c1"): RelayPoolLegInput => ({ legId: `${courierId}-${distanceKm}`, sequence: 1, courierId, origin: "A", destination: "B", distanceKm, parcelCountOnLeg: 1, parcelWeightKg: 2, parcelVolumeM3: 0.01, vehicleCapacityUnits: 20, vehicleCapacityWeightKg: 150, vehicleCapacityVolumeM3: 1, fuelPricePerLitre: 26, fuelLitresPer100Km: 10, driverCompensationPerKm: 2.5, vehicleAllowancePerKm: 1, routeOverheadPerKm: 0.5 });
const emptyState = (): LedgerState => ({ customerPayment: 0, platformAllocation: 0, courierPoolAllocation: 0, reservedAmount: 0, platformReversals: 0, courierPoolReversals: 0, allocatedToCouriers: 0, refunds: 0, cancellationAdjustments: 0, replacementLegCosts: 0, paymentCosts: 0, payoutCosts: 0, finalPlatformContribution: 0, finalCourierEarnings: 0 });

describe("launch hardening financial invariants", () => {
  it("conserves the 20/80 split and prevents double allocation", () => {
    const result = calculateSharedRelayPool({ customerChargeZar: 10_000, parcelCount: 20, legs: [baseLeg(100, "c1"), { ...baseLeg(120, "c2"), legId: "c2-120", sequence: 2 }] });
    expect(result.platformFeeZar).toBe(2_000); expect(result.courierPoolZar).toBe(8_000);
    expect(result.legs.reduce((sum, leg) => sum + leg.grossAllocationZar, 0)).toBe(8_000);
  });
  it("rejects a route whose funded pool cannot cover reserves", () => {
    const result = validateDispatchReadiness({ customerChargeZar: 100, parcelCount: 1, totalWeightKg: 2, totalVolumeM3: .01, requiredReserveZar: 500, legs: [baseLeg(100)] });
    expect(result.decision).toBe("REPRICE"); expect(result.reasons.join(" ")).toContain("reserve");
  });
  it("splits 100 parcels into capacity-safe parallel waves", () => {
    const result = planParallelWaves({ parcelCount: 100, parcelWeightKg: 2, parcelVolumeM3: .01, maxParcelsPerVehicle: 20, maxWeightKg: 150, maxVolumeM3: 1, courierIds: ["c1", "c2"], customerChargePerParcelZar: 500, routeFactory: (_wave, count) => ({ customerChargeZar: count * 500, parcelCount: count, totalWeightKg: count * 2, totalVolumeM3: count * .01, legs: [baseLeg(100)] }) });
    expect(result.waves).toHaveLength(5); expect(result.waves.every((wave) => wave.parcelCount <= 20)).toBe(true);
  });
  it("keeps reserves distinct from final profit", () => {
    let state = applyLedgerEvent(emptyState(), { type: "customer_payment", amount: 1_000 });
    state = applyLedgerEvent(state, { type: "platform_allocation", amount: 200 });
    state = applyLedgerEvent(state, { type: "courier_pool", amount: 800 });
    state = applyLedgerEvent(state, { type: "reserve", amount: 150 });
    state = applyLedgerEvent(state, { type: "replacement_leg", amount: 100 });
    assertLedgerInvariant(state); expect(state.reservedAmount).toBe(250); expect(state.finalPlatformContribution).toBe(100);
  });
  it("reverses the platform and courier allocations exactly once after a full refund", () => {
    let state = applyLedgerEvent(emptyState(), { type: "customer_payment", amount: 1_000 });
    state = applyLedgerEvent(state, { type: "platform_allocation", amount: 200 });
    state = applyLedgerEvent(state, { type: "courier_pool", amount: 800 });
    state = applyLedgerEvent(state, { type: "leg_allocation", amount: 800 });
    state = applyLedgerEvent(state, { type: "refund_processed", amount: 1_000 });
    state = applyLedgerEvent(state, { type: "platform_reversal", amount: 200 });
    state = applyLedgerEvent(state, { type: "courier_pool_reversal", amount: 800 });
    assertLedgerInvariant(state);
    expect(state.refunds).toBe(1_000); expect(state.finalPlatformContribution).toBe(0); expect(state.finalCourierEarnings).toBe(0);
  });
  it("keeps a partial refund proportional and records post-payout loss as a cost", () => {
    let state = applyLedgerEvent(emptyState(), { type: "customer_payment", amount: 1_000 });
    state = applyLedgerEvent(state, { type: "platform_allocation", amount: 200 });
    state = applyLedgerEvent(state, { type: "courier_pool", amount: 800 });
    state = applyLedgerEvent(state, { type: "leg_allocation", amount: 800 });
    state = applyLedgerEvent(state, { type: "refund_processed", amount: 500 });
    state = applyLedgerEvent(state, { type: "platform_reversal", amount: 100 });
    state = applyLedgerEvent(state, { type: "courier_pool_reversal", amount: 400 });
    state = applyLedgerEvent(state, { type: "payout_cost", amount: 400 });
    assertLedgerInvariant(state);
    expect(state.finalPlatformContribution).toBe(-300); expect(state.finalCourierEarnings).toBe(400);
  });
});

// Boundary matrix: 1,200 deterministic cases across tariff, route distance,
// parcel density, reserve, and capacity. These are intentionally explicit
// regression cases rather than random values so a failure is reproducible.
const cases = Array.from({ length: 1200 }, (_, i) => ({ tariff: 100 + (i % 24) * 75, parcels: 1 + (i % 40), distance: 20 + (i % 16) * 40, reserve: (i % 5) * 50, capacity: 5 + (i % 4) * 5 }));
describe("dispatch hardening boundary matrix", () => {
  it.each(cases)("case $tariff/$parcels/$distance/$reserve/$capacity preserves an explicit decision", ({ tariff, parcels, distance, reserve, capacity }) => {
    const result = validateDispatchReadiness({ customerChargeZar: tariff * parcels, parcelCount: parcels, totalWeightKg: parcels * 2, totalVolumeM3: parcels * .01, requiredReserveZar: reserve, minimumCourierNetZar: 0, legs: [{ ...baseLeg(distance), parcelCountOnLeg: parcels, parcelWeightKg: parcels * 2, parcelVolumeM3: parcels * .01, vehicleCapacityUnits: capacity, vehicleCapacityWeightKg: 150, vehicleCapacityVolumeM3: 1 }] });
    expect(["DISPATCH", "CONSOLIDATE", "REPRICE", "REJECT"]).toContain(result.decision);
    expect(result.pool.platformFeeZar + result.pool.courierPoolZar).toBe(tariff * parcels);
    expect(result.maximumViableCapacity).toBe(capacity);
  });
});
