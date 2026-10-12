import { describe, expect, it } from "vitest";
import { searchOfflineParcels } from "./offline-route-search";

const parcels = [
  {
    stop: { id: 1, sequence: 1, status: "queued" },
    delivery: { trackingCode: "MC-JHB-001", packageDescription: "Blue school bag", packageSize: "medium", packageWeight: 2 },
    pickupAddress: { street: "12 Main Road", city: "Johannesburg", postalCode: "2001" },
    dropoffAddress: { street: "8 Long Street", city: "Cape Town", postalCode: "8001" },
  },
  {
    stop: { id: 2, sequence: 2, status: "awaiting_customer_confirmation" },
    delivery: { trackingCode: "MC-DUR-002", packageDescription: "Grocery parcel", packageSize: "small", packageWeight: 1 },
    pickupAddress: { street: "4 Florida Road", city: "Durban", postalCode: "4001" },
    dropoffAddress: { street: "22 Church Street", city: "Pietermaritzburg", postalCode: "3201" },
  },
];

describe("offline parcel search", () => {
  it("returns every saved parcel for an empty query", () => {
    expect(searchOfflineParcels(parcels, "")).toHaveLength(2);
  });

  it("finds parcels by tracking code, city, and stop status", () => {
    expect(searchOfflineParcels(parcels, "mc-dur-002").map((parcel) => parcel.stop.id)).toEqual([2]);
    expect(searchOfflineParcels(parcels, "cape town").map((parcel) => parcel.stop.id)).toEqual([1]);
    expect(searchOfflineParcels(parcels, "awaiting customer confirmation").map((parcel) => parcel.stop.id)).toEqual([2]);
  });

  it("finds parcels by street and ignores surrounding whitespace", () => {
    expect(searchOfflineParcels(parcels, "  florida  ").map((parcel) => parcel.stop.id)).toEqual([2]);
  });

  it("returns no results without mutating the saved list", () => {
    expect(searchOfflineParcels(parcels, "not-on-this-route")).toEqual([]);
    expect(parcels).toHaveLength(2);
  });
});
