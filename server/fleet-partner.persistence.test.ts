import { describe, expect, it, vi, beforeEach } from "vitest";
import { fleetRouter } from "./routers/fleet-partner";
import type { TrpcContext } from "./_core/context";

const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb }));

const context = {
  user: { id: 42, openId: "fleet-owner", role: "user" },
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
} as TrpcContext;

const caller = fleetRouter.createCaller(context);

function makeDb({ existingFleet = [] as any[] } = {}) {
  const fleetRows = [...existingFleet];
  const vehicleRows: any[] = [];
  const db = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => fleetRows),
        })),
      })),
    })),
    insert: vi.fn((table: unknown) => ({
      values: vi.fn(async (values: any) => {
        if (values.businessName) {
          fleetRows.push({ id: 101, ...values, status: "pending", totalVehicles: 0 });
          return { insertId: 101 };
        }
        vehicleRows.push({ id: 202, ...values });
        return { insertId: 202 };
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(async () => undefined),
      })),
    })),
    _fleetRows: fleetRows,
    _vehicleRows: vehicleRows,
  };
  return db;
}

describe("fleet persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates and returns a persisted fleet account for the signed-in owner", async () => {
    const db = makeDb();
    getDb.mockResolvedValue(db);

    const result = await caller.createFleetAccount({
      businessName: "Cape Relay Logistics",
      ownerName: "Fleet Owner",
      saIdNumber: "9001015009087",
      contactEmail: "owner@example.com",
      contactPhone: "+27820000000",
      physicalAddress: "12 Main Road, Cape Town",
      operatingProvinces: ["Western Cape"],
      areasServed: ["Cape Town"],
    });

    expect(result).toMatchObject({ fleetId: 101, status: "pending" });
    expect(db._fleetRows[0]).toMatchObject({ userId: 42, businessName: "Cape Relay Logistics" });
  });

  it("does not create a second fleet account for the same owner", async () => {
    const db = makeDb({ existingFleet: [{ id: 7, userId: 42, status: "approved" }] });
    getDb.mockResolvedValue(db);

    const result = await caller.createFleetAccount({
      businessName: "Another Logistics",
      ownerName: "Fleet Owner",
      saIdNumber: "9001015009087",
      contactEmail: "owner@example.com",
      contactPhone: "+27820000000",
      physicalAddress: "12 Main Road, Cape Town",
      operatingProvinces: ["Western Cape"],
      areasServed: ["Cape Town"],
    });

    expect(result).toMatchObject({ fleetId: 7, status: "approved" });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("stores a vehicle against the owner's fleet and returns its identifier", async () => {
    const db = makeDb({ existingFleet: [{ id: 7, userId: 42, totalVehicles: 0 }] });
    getDb.mockResolvedValue(db);

    const result = await caller.addVehicle({
      registrationNumber: "CA 123-456",
      vehicleType: "small_van",
      maxParcelCapacity: 40,
      weightCapacity: 500,
    });

    expect(result).toMatchObject({ vehicleId: 202 });
    expect(db._vehicleRows[0]).toMatchObject({ fleetId: 7, registrationNumber: "CA 123-456" });
    expect(db.update).toHaveBeenCalledOnce();
  });

  it("requires a fleet account before adding a vehicle", async () => {
    getDb.mockResolvedValue(makeDb());

    await expect(caller.addVehicle({
      registrationNumber: "CA 123-456",
      vehicleType: "car",
    })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
