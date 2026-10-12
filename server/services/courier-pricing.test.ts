import { describe, expect, it } from "vitest";
import { calculateCourierRouteEconomics, calculateCustomerPricing, PLATFORM_FEE_PCT } from "./courier-pricing";

describe("courier pricing economics", () => {
  it("allocates exactly 20% of every parcel charge to the platform", () => {
    const quote = calculateCustomerPricing({ distanceKm: 80, actualWeightKg: 2, serviceLevel: "economy" });
    const route = calculateCourierRouteEconomics({
      distanceKm: 80,
      parcelCount: 8,
      averageCustomerRevenueZar: quote.finalPrice,
    });

    expect(PLATFORM_FEE_PCT).toBe(20);
    expect(route.platformFeePct).toBe(20);
    expect(route.platformFeeZar).toBeCloseTo(route.customerRevenueZar * 0.2, 2);
    expect(route.courierOfferZar).toBeCloseTo(route.customerRevenueZar * 0.8, 2);
  });

  it("keeps the 20% owner fee even when a route is not yet viable", () => {
    const route = calculateCourierRouteEconomics({
      distanceKm: 30,
      parcelCount: 1,
      averageCustomerRevenueZar: 79,
    });

    expect(route.routeViable).toBe(false);
    expect(route.platformFeeZar).toBe(15.8);
    expect(route.courierOfferZar).toBe(63.2);
  });
});
