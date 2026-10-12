import { describe, expect, it } from "vitest";
import { calculateSharedRelayPool } from "./relay-pool-pricing";

const jhbCapeTownLegs = [
  { legId: "leg-1", sequence: 1, courierId: "courier-1", origin: "Johannesburg", destination: "Bloemfontein", distanceKm: 140, deadheadKm: 12, returnKm: 35 },
  { legId: "leg-2", sequence: 2, courierId: "courier-2", origin: "Bloemfontein", destination: "Beaufort West", distanceKm: 190, deadheadKm: 18, returnKm: 40, legValueMultiplier: 1.05 },
  { legId: "leg-3", sequence: 3, courierId: "courier-3", origin: "Beaufort West", destination: "Laingsburg", distanceKm: 170, deadheadKm: 15, returnKm: 30 },
  { legId: "leg-4", sequence: 4, courierId: "courier-4", origin: "Laingsburg", destination: "Worcester", distanceKm: 190, deadheadKm: 15, returnKm: 32, legValueMultiplier: 1.05 },
  { legId: "leg-5", sequence: 5, courierId: "courier-5", origin: "Worcester", destination: "Cape Town", distanceKm: 100, deadheadKm: 10, returnKm: 25 },
];

describe("shared relay courier pool", () => {
  it("takes the platform fee once and conserves the one shared 80% courier pool", () => {
    const result = calculateSharedRelayPool({
      parcelCount: 100,
      customerChargeZar: 15_000,
      paymentProcessingFeePct: 2.9,
      legs: jhbCapeTownLegs,
    });

    expect(result.platformFeePct).toBe(20);
    expect(result.platformFeeZar).toBe(3_000);
    expect(result.courierPoolZar).toBe(12_000);
    expect(result.legs.reduce((sum, leg) => sum + leg.grossAllocationZar, 0)).toBe(12_000);
    expect(result.couriers.reduce((sum, courier) => sum + courier.grossEarningsZar, 0)).toBe(12_000);
    expect(result.courierPoolPerParcelZar).toBe(120);
    expect(result.estimatedPlatformNetZar).toBeGreaterThan(0);
  });

  it("charges deadhead, return kilometres, and handover fees to leg economics", () => {
    const result = calculateSharedRelayPool({
      customerChargeZar: 20_000,
      legs: [
        { legId: "a", sequence: 1, courierId: "a", origin: "A", destination: "B", distanceKm: 100, deadheadKm: 20, returnKm: 30 },
        { legId: "b", sequence: 2, courierId: "b", origin: "B", destination: "C", distanceKm: 100, deadheadKm: 10, returnKm: 20 },
      ],
    });

    expect(result.totalDrivenKm).toBe(280);
    expect(result.legs[0].handoverFeeZar).toBe(0);
    expect(result.legs[1].handoverFeeZar).toBe(35);
    expect(result.totalHandoverFeesZar).toBe(35);
    expect(result.legs[0].estimatedNetZar).not.toBe(result.legs[0].grossAllocationZar);
  });

  it("pro-rates an underfunded route instead of paying 80% per courier", () => {
    const result = calculateSharedRelayPool({
      customerChargeZar: 400,
      legs: [
        { legId: "a", sequence: 1, courierId: "a", origin: "A", destination: "B", distanceKm: 100, minimumPayoutZar: 100 },
        { legId: "b", sequence: 2, courierId: "b", origin: "B", destination: "C", distanceKm: 100, minimumPayoutZar: 100 },
        { legId: "c", sequence: 3, courierId: "c", origin: "C", destination: "D", distanceKm: 100, minimumPayoutZar: 100 },
      ],
    });

    expect(result.courierPoolZar).toBe(320);
    expect(result.minimumPayoutsFunded).toBe(true);
    expect(result.routeViable).toBe(false);
    expect(result.poolSurplusAfterCostZar).toBeLessThan(0);
    expect(result.warnings.some((warning) => warning.includes("operating-cost floor"))).toBe(true);
  });

  it("reports courier gross and estimated net per parcel for a loaded corridor", () => {
    const result = calculateSharedRelayPool({
      parcelCount: 100,
      customerChargeZar: 15_000,
      legs: jhbCapeTownLegs,
    });
    const totalGross = result.couriers.reduce((sum, courier) => sum + courier.grossEarningsZar, 0);
    const totalNet = result.couriers.reduce((sum, courier) => sum + courier.estimatedNetZar, 0);

    expect(result.routeDistanceKm).toBe(790);
    expect(totalGross).toBe(12_000);
    expect(totalNet).toBeLessThan(totalGross);
    expect(result.couriers.every((courier) => courier.grossEarningsPerParcelZar > 0)).toBe(true);
    expect(result.couriers.every((courier) => courier.estimatedNetPerParcelZar < courier.grossEarningsPerParcelZar)).toBe(true);
  });

  it("accounts for parcels, weight, volume, capacity, tolls, handover time, and backhaul", () => {
    const result = calculateSharedRelayPool({
      customerChargeZar: 2_000,
      legs: [{
        legId: "loaded-leg", sequence: 1, courierId: "courier-1", origin: "A", destination: "B", distanceKm: 120,
        parcelCountOnLeg: 4, parcelWeightKg: 18, parcelVolumeM3: 0.42, vehicleCapacityUnits: 6,
        vehicleCapacityWeightKg: 25, vehicleCapacityVolumeM3: 0.5, tollsZar: 80, handoverTimeMinutes: 25,
        availableBackhaul: true, backhaulRevenueZar: 40,
      }],
    });
    expect(result.totalParcelWeightKg).toBe(18);
    expect(result.totalParcelVolumeM3).toBe(0.42);
    expect(result.totalTollsZar).toBe(80);
    expect(result.totalHandoverTimeMinutes).toBe(25);
    expect(result.capacityFeasible).toBe(true);
    expect(result.routeViable).toBe(true);
  });

  it("marks a leg non-viable when verified vehicle capacity is exceeded", () => {
    const result = calculateSharedRelayPool({
      customerChargeZar: 2_000,
      legs: [{ legId: "overloaded", sequence: 1, courierId: "courier-1", origin: "A", destination: "B", distanceKm: 50, parcelCountOnLeg: 5, parcelWeightKg: 60, vehicleCapacityUnits: 4, vehicleCapacityWeightKg: 50 }],
    });
    expect(result.capacityFeasible).toBe(false);
    expect(result.routeViable).toBe(false);
    expect(result.warnings.some((warning) => warning.includes("capacity"))).toBe(true);
  });

  it("caps the allocation at the total funded courier pool", () => {
    const result = calculateSharedRelayPool({
      customerChargeZar: 1_000,
      totalCourierPoolAvailableZar: 600,
      legs: [{ legId: "capped", sequence: 1, courierId: "courier-1", origin: "A", destination: "B", distanceKm: 20 }],
    });
    expect(result.courierPoolZar).toBe(600);
    expect(result.totalCourierPoolAvailableZar).toBe(600);
    expect(result.warnings.some((warning) => warning.includes("available courier pool"))).toBe(true);
  });
});
