import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

/**
 * Create a public context for testing
 */
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const runLiveIntegrationTests = process.env.RUN_LIVE_INTEGRATION_TESTS === "1";

describe("address search router", () => {
  describe("geocoding.search", () => {
    it("searches for addresses in South Africa", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.search({
        query: "Church Street Ladybrand",
      });

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    }, 15000);

    it("returns address results with coordinates", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.search({
        query: "Main Road Kleinmond",
      });

      if (result.results.length > 0) {
        const address = result.results[0];
        expect(address).toHaveProperty("latitude");
        expect(address).toHaveProperty("longitude");
        expect(typeof address.latitude).toBe("number");
        expect(typeof address.longitude).toBe("number");
      }
    });

    it("returns formatted addresses", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.search({
        query: "Cape Town",
      });

      if (result.results.length > 0) {
        const address = result.results[0];
        expect(address).toHaveProperty("address");
        expect(typeof address.address).toBe("string");
      }
    });

    it("handles empty search results gracefully", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.search({
        query: "xyznonexistentplace123456",
      });

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it("searches for city names", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.search({
        query: "Johannesburg",
      });

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it("searches for street names", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.search({
        query: "Main Street",
      });

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it("searches for suburbs", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.search({
        query: "Soweto",
      });

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it.skipIf(!runLiveIntegrationTests)("handles partial addresses", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.search({
        query: "Church",
      });

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe("geocoding.reverseGeocode", () => {
    it("converts coordinates to address", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Cape Town coordinates
      const result = await caller.geocoding.reverseGeocode({
        latitude: -33.9249,
        longitude: 18.4241,
      });

      expect(result).toBeDefined();
      expect(result.address).toBeDefined();
      expect(typeof result.address).toBe("string");
    });

    it("returns address components from coordinates", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.reverseGeocode({
        latitude: -33.9249,
        longitude: 18.4241,
      });

      expect(result).toHaveProperty("address");
      expect(result.address.length).toBeGreaterThan(0);
    });

    it("handles coordinates in different provinces", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Johannesburg coordinates
      const result = await caller.geocoding.reverseGeocode({
        latitude: -26.2023,
        longitude: 28.0436,
      });

      expect(result).toBeDefined();
      expect(result.address).toBeDefined();
    });
  });

  describe("geocoding.validate", () => {
    it.skipIf(!runLiveIntegrationTests)("validates a complete address", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.validate({
        address: "50 2nd Avenue Kleinmond Western Cape",
      });

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
    });

    it("parses address components", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.validate({
        address: "Church Street Ladybrand",
      });

      expect(result).toBeDefined();
      if (result.valid) {
        expect(result).toHaveProperty("street");
        expect(result).toHaveProperty("city");
      }
    });

    it("detects South African address types", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.validate({
        address: "Erf 123 Khayelitsha",
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("valid");
    });

    it("handles informal addresses", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.validate({
        address: "Church Kleinmond",
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("valid");
    });
  });

  describe("address search real-world scenarios", () => {
    it("searches for residential address", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.search({
        query: "50 2nd Avenue Kleinmond",
      });

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it("searches for business address", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.search({
        query: "Johannesburg CBD",
      });

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it("searches for landmark", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.search({
        query: "Cape Town Stadium",
      });

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it("searches for postal code", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.search({
        query: "8050",
      });

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it("handles long-distance routes", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Search for pickup
      const pickupResult = await caller.geocoding.search({
        query: "Cape Town",
      });

      // Search for dropoff
      const dropoffResult = await caller.geocoding.search({
        query: "Durban",
      });

      expect(pickupResult.results.length).toBeGreaterThan(0);
      expect(dropoffResult.results.length).toBeGreaterThan(0);
    });
  });

  describe("address search performance", () => {
    it("returns results quickly for common searches", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const startTime = Date.now();
      await caller.geocoding.search({
        query: "Cape Town",
      });
      const endTime = Date.now();

      const duration = endTime - startTime;
      // The proxy-backed geocoder is external; allow normal network variance while
      // still catching materially slow responses.
      expect(duration).toBeLessThan(8000); // Should complete within 8 seconds
    });

    it("handles multiple searches in sequence", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const addresses = [
        "Cape Town",
        "Johannesburg",
        "Durban",
        "Pretoria",
        "Bloemfontein",
      ];

      for (const address of addresses) {
        const result = await caller.geocoding.search({
          query: address,
        });
        expect(result.results).toBeDefined();
      }
    }, 30000);
  });

  describe("address search error handling", () => {
    it.skipIf(!runLiveIntegrationTests)("handles network errors gracefully", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // This should not throw, but return results or empty array
      const result = await caller.geocoding.search({
        query: "test",
      });

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
    });

    it("handles special characters in search", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.search({
        query: "St. John's Road",
      });

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
    });

    it("handles very long search queries", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.geocoding.search({
        query: "123 Very Long Street Name With Many Words Cape Town Western Cape South Africa",
      });

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
    });
  });
});
