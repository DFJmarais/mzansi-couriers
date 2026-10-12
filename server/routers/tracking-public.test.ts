import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const { getDbMock, getLatestDeliveryLocationMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
  getLatestDeliveryLocationMock: vi.fn(),
}));

vi.mock("../db", () => ({
  getDb: getDbMock,
  getLatestDeliveryLocation: getLatestDeliveryLocationMock,
}));

import { trackingRouter } from "./tracking";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createQueuedDb(rows: unknown[][]) {
  return {
    select: vi.fn(() => {
      const nextRows = rows.shift() ?? [];
      return {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => nextRows),
          })),
        })),
      };
    }),
  };
}

describe("public tracking lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects malformed tracking codes before querying the database", async () => {
    const caller = trackingRouter.createCaller(createPublicContext());

    await expect(caller.getByCode({ code: "DEL-001" })).rejects.toThrow("Enter a valid Mzansi tracking code.");
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("returns addresses, customer-safe courier details, and the latest live location", async () => {
    const delivery = {
      id: 41,
      trackingCode: "#MZ-ABC123-XYZ",
      customerId: 7,
      courierId: 9,
      pickupAddressId: 101,
      dropoffAddressId: 102,
      pickupLatitude: "-26.10760000",
      pickupLongitude: "28.05670000",
      dropoffLatitude: "-25.98950000",
      dropoffLongitude: "28.12840000",
      status: "in-transit" as const,
      packageSize: "medium" as const,
      packageWeight: "3.50",
      packageDescription: "Office documents",
      estimatedDeliveryTime: 24,
      actualDeliveryTime: null,
      createdAt: new Date("2026-08-28T07:00:00Z"),
      updatedAt: new Date("2026-08-28T07:30:00Z"),
    };
    const pickup = { street: "1 Main Road", city: "Sandton", postalCode: "2196" };
    const dropoff = { street: "2 Market Street", city: "Midrand", postalCode: "1685" };
    const courier = { name: "Courier One", phone: "+27820000000" };
    const profile = { vehicleType: "van" as const, rating: "4.75" };
    const latestLocation = {
      latitude: "-26.10000000",
      longitude: "28.07000000",
      accuracy: "12.00",
      timestamp: new Date("2026-08-28T07:35:00Z"),
    };

    getDbMock.mockResolvedValue(createQueuedDb([[delivery], [pickup], [dropoff], [courier], [profile]]));
    getLatestDeliveryLocationMock.mockResolvedValue(latestLocation);

    const caller = trackingRouter.createCaller(createPublicContext());
    const result = await caller.getByCode({ code: delivery.trackingCode });

    expect(result).toMatchObject({
      trackingCode: delivery.trackingCode,
      status: "in-transit",
      pickup: { street: pickup.street, city: pickup.city, latitude: -26.1076, longitude: 28.0567 },
      dropoff: { street: dropoff.street, city: dropoff.city, latitude: -25.9895, longitude: 28.1284 },
      courier: { name: courier.name, phone: courier.phone, vehicleType: "van", rating: 4.75 },
      latestLocation: { latitude: -26.1, longitude: 28.07, accuracy: 12 },
      packageWeight: 3.5,
    });
    expect(getLatestDeliveryLocationMock).toHaveBeenCalledWith(delivery.id);
  });

  it("does not expose a stale courier location after delivery is completed", async () => {
    const delivery = {
      id: 42,
      trackingCode: "#MZ-XYZ987-ABC",
      customerId: 7,
      courierId: null,
      pickupAddressId: 201,
      dropoffAddressId: 202,
      pickupLatitude: "-26.10760000",
      pickupLongitude: "28.05670000",
      dropoffLatitude: "-25.98950000",
      dropoffLongitude: "28.12840000",
      status: "delivered" as const,
      packageSize: "small" as const,
      packageWeight: "1.00",
      packageDescription: null,
      estimatedDeliveryTime: 20,
      actualDeliveryTime: new Date("2026-08-28T08:00:00Z"),
      createdAt: new Date("2026-08-28T07:00:00Z"),
      updatedAt: new Date("2026-08-28T08:00:00Z"),
    };

    getDbMock.mockResolvedValue(createQueuedDb([[delivery], [{ street: "1 Main Road", city: "Sandton" }], [{ street: "2 Market Street", city: "Midrand" }]]));
    getLatestDeliveryLocationMock.mockResolvedValue({ latitude: "-26.1", longitude: "28.07", timestamp: new Date() });

    const caller = trackingRouter.createCaller(createPublicContext());
    const result = await caller.getByCode({ code: delivery.trackingCode });

    expect(result.latestLocation).toBeNull();
  });
});
