import { describe, expect, it } from "vitest";
import { allocateSmartParcels, buildSmartStack, defaultSmartStackConfig, evaluateAddOn, evaluateMatch, evaluateStackAddition, type SmartCourier, type SmartParcel } from "./smartstack-engine";

const parcel = (id: number, overrides: Partial<SmartParcel> = {}): SmartParcel => ({
  id,
  trackingCode: `MC-TEST-${id}`,
  pickup: { lat: -33.92 + id * 0.01, lng: 18.42 + id * 0.01, area: "Cape Town" },
  dropoff: { lat: -34.05 + id * 0.01, lng: 18.75 + id * 0.01, area: "Somerset West" },
  packageSize: "small",
  packageWeightKg: 2,
  priority: 3,
  estimatedPriceZar: 100,
  deadlineAt: null,
  ...overrides,
});

const courier = (overrides: Partial<SmartCourier> = {}): SmartCourier => ({
  id: 1,
  name: "Test courier",
  vehicleType: "car",
  capacityUnits: 8,
  maxWeightKg: 150,
  isAvailable: true,
  currentLocation: { lat: -33.92, lng: 18.42 },
  workingAreas: ["Cape Town", "Somerset West"],
  ...overrides,
});

describe("SmartStack engine", () => {
  it("scores a compatible courier and preserves a transparent reason", () => {
    const result = evaluateMatch(parcel(1), courier());
    expect(result.eligible).toBe(true);
    expect(result.score).toBeGreaterThan(50);
    expect(result.reason).toContain("Eligible");
  });

  it("rejects a parcel that exceeds vehicle capacity", () => {
    const result = evaluateMatch(parcel(1, { packageSize: "large" }), courier({ capacityUnits: 2 }), 0, 0);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("capacity");
  });

  it("rejects a parcel outside the courier working area", () => {
    const result = evaluateMatch(parcel(1, { pickup: { lat: -26.2, lng: 28.04, area: "Johannesburg" }, dropoff: { lat: -26.1, lng: 28.2, area: "Johannesburg" } }), courier());
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("working area");
  });

  it("never recommends a stack that creates critical deadline risk", () => {
    const urgent = parcel(1, { deadlineAt: Date.now() + 60_000 });
    const result = buildSmartStack([urgent], courier());
    expect(result.stack).toHaveLength(0);
    expect(result.metrics.deadlineRisk).toBe("low");
  });

  it("evaluates route insertion and exposes incremental distance and time", () => {
    const base = parcel(1);
    const candidate = parcel(2, { pickup: { lat: -33.93, lng: 18.43, area: "Cape Town" }, dropoff: { lat: -34.06, lng: 18.76, area: "Somerset West" }, estimatedPriceZar: 120 });
    const result = evaluateStackAddition([base], candidate, courier());
    expect(result.addedDistanceKm).toBeGreaterThanOrEqual(0);
    expect(result.addedTimeMinutes).toBeGreaterThanOrEqual(0);
    expect(result.metrics.route.length).toBe(4);
  });

  it("builds a feasible stack within the configured size and capacity", () => {
    const result = buildSmartStack(Array.from({ length: 6 }, (_, index) => parcel(index + 1, { estimatedPriceZar: 500 })), courier({ capacityUnits: 4 }), defaultSmartStackConfig);
    expect(result.stack.length).toBeLessThanOrEqual(4);
    expect(result.metrics.capacityUsedUnits).toBeLessThanOrEqual(4);
    expect(result.metrics.estimatedCourierNet).toBeGreaterThan(0);
  });

  it("offers a profitable add-on and does not require acceptance", () => {
    const result = evaluateAddOn([parcel(1)], parcel(2, { estimatedPriceZar: 150 }), courier({ minimumAdditionalPayout: 100 }));
    expect(result.acceptedByRules).toBe(true);
    expect(result.additionalPayout).toBe(150);
  });

  it("does not offer an add-on below the courier minimum", () => {
    const result = evaluateAddOn([parcel(1)], parcel(2, { estimatedPriceZar: 50 }), courier({ minimumAdditionalPayout: 100 }));
    expect(result.acceptedByRules).toBe(false);
    expect(result.reason).toContain("minimum");
  });

  it("allocates across the network and keeps unassigned parcels explicit", () => {
    const result = allocateSmartParcels([parcel(1), parcel(2), parcel(3)], [courier({ capacityUnits: 2 }), courier({ id: 2, name: "Second courier", capacityUnits: 1 })]);
    expect(result.assignments.length).toBeGreaterThan(0);
    expect(result.stacks.length).toBeGreaterThan(0);
    expect(result.assignments.length + result.unassigned.length).toBe(3);
  });

  it("keeps an unavailable courier out of matching", () => {
    const result = allocateSmartParcels([parcel(1)], [courier({ isAvailable: false })]);
    expect(result.assignments).toHaveLength(0);
    expect(result.unassigned[0]?.reason).toContain("No eligible");
  });
});
