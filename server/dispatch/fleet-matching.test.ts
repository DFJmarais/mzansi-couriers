import { describe, expect, it } from "vitest";
import { capacityUnits, isVehicleFit } from "./fleet-matching";

describe("fleet capacity matching", () => {
  it("maps parcel sizes to capacity units", () => {
    expect(capacityUnits("small")).toBe(1);
    expect(capacityUnits("medium")).toBe(2);
    expect(capacityUnits("large")).toBe(3);
  });

  it("only recommends vehicles that fit parcel units and weight", () => {
    expect(isVehicleFit({ maxParcelCapacity: 2, weightCapacity: "10.00" }, "medium", 5)).toBe(true);
    expect(isVehicleFit({ maxParcelCapacity: 1, weightCapacity: "50.00" }, "medium", 5)).toBe(false);
    expect(isVehicleFit({ maxParcelCapacity: 5, weightCapacity: "2.00" }, "small", 5)).toBe(false);
  });

  it("supports honest unknown capacity without over-promising fit", () => {
    expect(isVehicleFit({ maxParcelCapacity: null, weightCapacity: null }, "small", 1)).toBe(true);
    expect(isVehicleFit({ maxParcelCapacity: null, weightCapacity: null }, "large", 1)).toBe(false);
  });
});
