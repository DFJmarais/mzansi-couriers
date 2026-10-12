import { describe, expect, it } from "vitest";
import { assertWavePoolInvariant, assertWaveTransition, canTransitionWave, planDurableWaves } from "./dispatch-waves";
import { applyLedgerEvent, assertLedgerInvariant, type LedgerState } from "./financial-ledger";

describe("durable dispatch waves", () => {
  it("splits parcels without exceeding unit, weight, or volume capacity", () => {
    const assignments = Array.from({ length: 7 }, (_, index) => ({ deliveryId: index + 1, courierId: 10, sequence: index + 1 }));
    const parcelById = new Map(assignments.map(({ deliveryId }) => [deliveryId, { weightKg: 2, volumeM3: 0.01, customerChargeZar: 100 }]));
    const waves = planDurableWaves({ dispatchRunId: 42, assignments, capacityByCourier: new Map([[10, { units: 3, weightKg: 6, volumeM3: 0.05 }]]), parcelById });
    expect(waves).toHaveLength(3);
    expect(waves.map((wave) => wave.assignments.length)).toEqual([3, 3, 1]);
    for (const wave of waves) {
      expect(wave.totalWeightKg).toBeLessThanOrEqual(wave.capacityWeightKg ?? Infinity);
      expect(wave.totalVolumeM3).toBeLessThanOrEqual(wave.capacityVolumeM3 ?? Infinity);
      expect(wave.assignments.length).toBeLessThanOrEqual(wave.capacityUnits ?? Infinity);
    }
  });

  it("keeps one 20/80 customer split across multiple waves", () => {
    const assignments = Array.from({ length: 20 }, (_, index) => ({ deliveryId: index + 1, courierId: index % 2 ? 10 : 11, sequence: index + 1 }));
    const parcelById = new Map(assignments.map(({ deliveryId }) => [deliveryId, { weightKg: 1, volumeM3: 0.005, customerChargeZar: 120 }]));
    const waves = planDurableWaves({ dispatchRunId: 5, assignments, capacityByCourier: new Map([[10, { units: 3, weightKg: 20, volumeM3: 1 }], [11, { units: 4, weightKg: 20, volumeM3: 1 }]]), parcelById });
    assertWavePoolInvariant(waves.map((wave) => ({ customerCharge: wave.customerChargeZar, platformAllocation: wave.platformAllocationZar, courierPoolAllocation: wave.courierPoolAllocationZar })));
    expect(waves.reduce((sum, wave) => sum + wave.customerChargeZar, 0)).toBe(2400);
    expect(waves.reduce((sum, wave) => sum + wave.platformAllocationZar, 0)).toBe(480);
    expect(waves.reduce((sum, wave) => sum + wave.courierPoolAllocationZar, 0)).toBe(1920);
  });

  it("rejects invalid lifecycle transitions", () => {
    expect(canTransitionWave("planned", "assigned")).toBe(true);
    expect(canTransitionWave("settled", "recovery")).toBe(false);
    expect(() => assertWaveTransition("settled", "completed")).toThrow("Invalid wave transition");
  });

  it("keeps deterministic idempotency keys and departure offsets", () => {
    const assignments = [1, 2, 3, 4].map((deliveryId) => ({ deliveryId, courierId: deliveryId, sequence: deliveryId }));
    const parcels = new Map(assignments.map(({ deliveryId }) => [deliveryId, { weightKg: 1, volumeM3: 0.01, customerChargeZar: 90 }]));
    const input = { dispatchRunId: 99, assignments, capacityByCourier: new Map(assignments.map(({ courierId }) => [courierId, { units: 1, weightKg: 1, volumeM3: 0.01 }])), parcelById: parcels, departureGapMinutes: 30 };
    const a = planDurableWaves(input);
    const b = planDurableWaves(input);
    expect(a.map((wave) => wave.idempotencyKey)).toEqual(b.map((wave) => wave.idempotencyKey));
    expect(a.map((wave) => wave.departureOffsetMinutes)).toEqual([0, 30, 60, 90]);
  });

  it("handles 1,100 parcel planning cases without allocation drift", () => {
    for (let caseNumber = 1; caseNumber <= 1100; caseNumber += 1) {
      const parcelCount = 1 + (caseNumber % 25);
      const assignments = Array.from({ length: parcelCount }, (_, index) => ({ deliveryId: caseNumber * 1000 + index, courierId: 1 + (index % 3), sequence: index + 1 }));
      const parcelById = new Map(assignments.map(({ deliveryId }) => [deliveryId, { weightKg: 0.5 + (caseNumber % 5) / 10, volumeM3: 0.003, customerChargeZar: 50 + (caseNumber % 7) }]));
      const waves = planDurableWaves({ dispatchRunId: caseNumber, assignments, capacityByCourier: new Map([[1, { units: 10, weightKg: 100, volumeM3: 2 }], [2, { units: 10, weightKg: 100, volumeM3: 2 }], [3, { units: 10, weightKg: 100, volumeM3: 2 }]]), parcelById });
      expect(waves.reduce((sum, wave) => sum + wave.assignments.length, 0)).toBe(parcelCount);
      assertWavePoolInvariant(waves.map((wave) => ({ customerCharge: wave.customerChargeZar, platformAllocation: wave.platformAllocationZar, courierPoolAllocation: wave.courierPoolAllocationZar })));
    }
  });

  it("covers a 50+ parcel, multi-courier, multi-wave relay manifest", () => {
    const assignments = Array.from({ length: 60 }, (_, index) => ({ deliveryId: index + 1, courierId: 100 + (index % 6), sequence: index + 1 }));
    const parcelById = new Map(assignments.map(({ deliveryId }) => [deliveryId, { weightKg: 1.5, volumeM3: 0.008, customerChargeZar: 140 }]));
    const capacityByCourier = new Map(Array.from({ length: 6 }, (_, index) => [100 + index, { units: 5, weightKg: 10, volumeM3: 0.05 }] as const));
    const waves = planDurableWaves({ dispatchRunId: 70, assignments, capacityByCourier, parcelById, departureGapMinutes: 60 });
    expect(waves.length).toBeGreaterThan(10);
    expect(waves.reduce((sum, wave) => sum + wave.assignments.length, 0)).toBe(60);
    expect(new Set(waves.flatMap((wave) => wave.courierIds)).size).toBe(6);
    assertWavePoolInvariant(waves.map((wave) => ({ customerCharge: wave.customerChargeZar, platformAllocation: wave.platformAllocationZar, courierPoolAllocation: wave.courierPoolAllocationZar })));
  });

  it("models courier cancellation before departure and failure after departure as recoverable paths", () => {
    expect(canTransitionWave("assigned", "cancelled")).toBe(true);
    expect(canTransitionWave("departed", "recovery")).toBe(true);
    expect(canTransitionWave("failed", "recovery")).toBe(true);
    expect(canTransitionWave("recovery", "assigned")).toBe(true);
    expect(canTransitionWave("in_progress", "completed")).toBe(true);
    expect(canTransitionWave("completed", "settled")).toBe(true);
  });

  it("keeps refunds and replacement reserves inside the original ledger envelope", () => {
    const initial: LedgerState = { customerPayment: 1000, platformAllocation: 200, courierPoolAllocation: 800, reservedAmount: 0, platformReversals: 0, courierPoolReversals: 0, allocatedToCouriers: 0, refunds: 0, cancellationAdjustments: 0, replacementLegCosts: 0, paymentCosts: 0, payoutCosts: 0, finalPlatformContribution: 200, finalCourierEarnings: 0 };
    let state = applyLedgerEvent(initial, { type: "reserve", amount: 120 });
    state = applyLedgerEvent(state, { type: "leg_allocation", amount: 520 });
    state = applyLedgerEvent(state, { type: "replacement_leg", amount: 80 });
    state = applyLedgerEvent(state, { type: "courier_pool_reversal", amount: 80 });
    state = applyLedgerEvent(state, { type: "platform_reversal", amount: 40 });
    state = applyLedgerEvent(state, { type: "refund_processed", amount: 200 });
    assertLedgerInvariant(state);
    expect(state.allocatedToCouriers).toBe(520);
    expect(state.finalCourierEarnings).toBe(440);
    expect(state.platformReversals).toBe(40);
    expect(state.courierPoolReversals).toBe(80);
    expect(state.courierPoolAllocation).toBe(800);
  });

  it("treats duplicate action keys as safe retries by requiring identical lifecycle decisions", () => {
    const retryable = ["assigned", "ready", "departed", "handover", "in_progress", "completed", "settled"] as const;
    for (const status of retryable) expect(canTransitionWave(status, status)).toBe(true);
    expect(canTransitionWave("settled", "settled")).toBe(true);
    expect(canTransitionWave("cancelled", "cancelled")).toBe(true);
  });
});
