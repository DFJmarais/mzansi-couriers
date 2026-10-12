import { describe, expect, it } from "vitest";
import { allocateParcels, sequenceAssignmentsForCourier, validateParcelForCourier } from "./assignment-engine";

const parcel = (id: number, area = "Johannesburg", size: "small" | "medium" | "large" = "medium") => ({
  id, trackingCode: `MC-${id}`, pickup: { lat: -26.1, lng: 28.05, area }, dropoff: { lat: -26.0, lng: 28.1, area }, packageSize: size, packageWeightKg: 3, priority: 5,
});

describe("AI dispatch safety allocator", () => {
  it("assigns a parcel to an available courier whose work area matches", () => {
    const result = allocateParcels([parcel(1)], [{ id: 10, name: "Joburg courier", vehicleType: "car", capacityUnits: 12, maxWeightKg: 150, isAvailable: true, currentLocation: { lat: -26.2, lng: 28.0 }, workingAreas: ["Johannesburg"] }]);
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0].courierId).toBe(10);
    expect(result.assignments[0].areaMatch).toBe("Johannesburg");
  });

  it("does not exceed vehicle capacity and reports the parcel for manual review", () => {
    const courier = { id: 10, name: "Motorbike courier", vehicleType: "motorbike" as const, capacityUnits: 1, maxWeightKg: 30, isAvailable: true, currentLocation: null, workingAreas: ["Johannesburg"] };
    const result = allocateParcels([parcel(1, "Johannesburg", "medium")], [courier]);
    expect(result.assignments).toHaveLength(0);
    expect(result.unassigned[0].reason).toContain("capacity");
  });

  it("rejects unavailable couriers before assignment", () => {
    const courier = { id: 10, name: "Offline courier", vehicleType: "car" as const, capacityUnits: 12, maxWeightKg: 150, isAvailable: false, currentLocation: null, workingAreas: ["Johannesburg"] };
    expect(validateParcelForCourier(parcel(1), courier, 0, 0).ok).toBe(false);
  });

  it("rejects parcels outside a configured working zone", () => {
    const courier = { id: 10, name: "Cape Town courier", vehicleType: "car" as const, capacityUnits: 12, maxWeightKg: 150, isAvailable: true, currentLocation: null, workingAreas: ["Cape Town"] };
    const result = allocateParcels([parcel(1, "Johannesburg")], [courier]);
    expect(result.assignments).toHaveLength(0);
    expect(result.unassigned[0].reason).toContain("working zone");
  });

  it("sequences multiple parcels by pickup geography and delivery continuity", () => {
    const parcels = [
      { ...parcel(1, "Johannesburg"), pickup: { lat: -26.2041, lng: 28.0473, area: "Johannesburg" }, dropoff: { lat: -26.1367, lng: 28.2411, area: "Sandton" } },
      { ...parcel(2, "Johannesburg"), pickup: { lat: -26.2023, lng: 28.0436, area: "Johannesburg" }, dropoff: { lat: -26.1076, lng: 28.0567, area: "Rosebank" } },
      { ...parcel(3, "Pretoria"), pickup: { lat: -25.7479, lng: 28.2293, area: "Pretoria" }, dropoff: { lat: -25.7545, lng: 28.1910, area: "Pretoria" } },
    ];
    const assignments = parcels.map((item, index) => ({ parcelId: item.id, sequence: index + 1 }));
    const ordered = sequenceAssignmentsForCourier(assignments, parcels, { lat: -26.2041, lng: 28.0473 });
    expect(ordered.map((item) => item.parcelId)).toEqual([2, 1, 3]);
    expect(ordered.map((item) => item.sequence)).toEqual([1, 2, 3]);
  });

  it("splits a larger parcel pool across multiple couriers without exceeding capacity", () => {
    const parcels = Array.from({ length: 20 }, (_, index) => parcel(index + 1, "Johannesburg", "small"));
    const couriers = [1, 2].map((id) => ({ id, name: `Courier ${id}`, vehicleType: "car" as const, capacityUnits: 12, maxWeightKg: 150, isAvailable: true, currentLocation: { lat: -26.1, lng: 28.05 }, workingAreas: ["Johannesburg"] }));
    const result = allocateParcels(parcels, couriers);
    expect(result.assignments).toHaveLength(20);
    expect(new Set(result.assignments.map((item) => item.courierId)).size).toBe(2);
    expect(result.unassigned).toHaveLength(0);
  });
});
