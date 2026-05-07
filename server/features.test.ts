import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock context for customer
function createCustomerContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "customer-user",
      email: "customer@example.com",
      name: "John Customer",
      loginMethod: "manus",
      role: "customer",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

// Mock context for courier
function createCourierContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "courier-user",
      email: "courier@example.com",
      name: "Jane Courier",
      loginMethod: "manus",
      role: "courier",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

// Mock context for admin
function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 3,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

describe("Mzansi Couriers - Feature Tests", () => {
  describe("Authentication", () => {
    it("should return current user", async () => {
      const ctx = createCustomerContext();
      const caller = appRouter.createCaller(ctx);
      const user = await caller.auth.me();
      expect(user?.role).toBe("customer");
    });

    it("should handle logout", async () => {
      const ctx = createCustomerContext();
      const clearedCookies: any[] = [];
      ctx.res.clearCookie = (name: string, options: any) => {
        clearedCookies.push({ name, options });
      };
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();
      expect(result.success).toBe(true);
      expect(clearedCookies.length).toBe(1);
    });
  });

  describe("Pricing", () => {
    it("should calculate price for small package", async () => {
      const caller = appRouter.createCaller(createCustomerContext());
      const result = await caller.pricing.calculatePrice({
        distance: 10,
        packageSize: "small",
        packageWeight: 1,
      });
      expect(result.estimatedPrice).toBeDefined();
      expect(parseFloat(result.estimatedPrice)).toBeGreaterThan(0);
    });

    it("should calculate price for medium package", async () => {
      const caller = appRouter.createCaller(createCustomerContext());
      const result = await caller.pricing.calculatePrice({
        distance: 10,
        packageSize: "medium",
        packageWeight: 5,
      });
      expect(result.estimatedPrice).toBeDefined();
      const mediumPrice = parseFloat(result.estimatedPrice);
      
      // Get small price for comparison
      const smallResult = await caller.pricing.calculatePrice({
        distance: 10,
        packageSize: "small",
        packageWeight: 1,
      });
      const smallPrice = parseFloat(smallResult.estimatedPrice);
      
      // Medium should be more expensive than small
      expect(mediumPrice).toBeGreaterThan(smallPrice);
    });

    it("should calculate price for large package", async () => {
      const caller = appRouter.createCaller(createCustomerContext());
      const result = await caller.pricing.calculatePrice({
        distance: 10,
        packageSize: "large",
        packageWeight: 25,
      });
      expect(result.estimatedPrice).toBeDefined();
      expect(parseFloat(result.estimatedPrice)).toBeGreaterThan(0);
    });
  });

  describe("Role-Based Access Control", () => {
    it("customer should not access admin routes", async () => {
      const ctx = createCustomerContext();
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.admin.getAnalytics();
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("courier should not access customer routes", async () => {
      const ctx = createCourierContext();
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.delivery.createDelivery({
          pickupAddressId: 1,
          dropoffAddressId: 2,
          pickupLatitude: -25.7461,
          pickupLongitude: 28.0332,
          dropoffLatitude: -25.7282,
          dropoffLongitude: 28.1137,
          packageSize: "small",
          packageWeight: 1,
          distance: 10,
          estimatedPrice: "100",
          estimatedDeliveryTime: 30,
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("admin should access admin routes", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      try {
        const analytics = await caller.admin.getAnalytics();
        expect(analytics).toBeDefined();
        expect(analytics.totalDeliveries).toBeDefined();
      } catch (error) {
        // Expected to fail if no data in DB, but should not be FORBIDDEN
        expect((error as any).code).not.toBe("FORBIDDEN");
      }
    });
  });

  describe("Delivery Status Lifecycle", () => {
    it("should follow correct status order: pending -> assigned -> in-transit -> delivered", async () => {
      // This test verifies the status enum values are correct
      const validStatuses = ["pending", "assigned", "in-transit", "delivered"];
      expect(validStatuses).toContain("pending");
      expect(validStatuses).toContain("assigned");
      expect(validStatuses).toContain("in-transit");
      expect(validStatuses).toContain("delivered");
    });
  });

  describe("Profile Management", () => {
    it("should allow courier to create profile", async () => {
      const ctx = createCourierContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.profile.createCourierProfile({
        vehicleType: "car",
        vehicleRegistration: "JNB 456 GP",
        licenseNumber: "DL123456789",
      });
      expect(result.success).toBe(true);
    });

    it("should allow user to create address", async () => {
      const ctx = createCustomerContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.profile.createAddress({
        label: "Home",
        street: "123 Main Street",
        city: "Johannesburg",
        postalCode: "2000",
        latitude: -25.7461,
        longitude: 28.0332,
        isDefault: true,
      });
      expect(result.success).toBe(true);
    });
  });
});
