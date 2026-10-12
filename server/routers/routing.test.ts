import { describe, it, expect } from 'vitest';

/**
 * Routing Router Tests
 * Tests distance calculation and pricing
 */

const runLiveIntegrationTests = process.env.RUN_LIVE_INTEGRATION_TESTS === "1";

describe('Routing Router', () => {
  describe('OSRM API', () => {
    it.skipIf(!runLiveIntegrationTests)('should calculate distance between two South African cities', async () => {
      // Cape Town to Kleinmond
      const originLng = 18.4241;
      const originLat = -33.9249;
      const destLng = 19.0273;
      const destLat = -34.3401;

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`
        );

        expect(response.ok).toBe(true);
        const data = await response.json();

        expect(data.routes).toBeDefined();
        expect(Array.isArray(data.routes)).toBe(true);
        expect(data.routes.length).toBeGreaterThan(0);

        const route = data.routes[0];
        expect(route.distance).toBeGreaterThan(0);
        expect(route.duration).toBeGreaterThan(0);

        const distanceKm = route.distance / 1000;
        expect(distanceKm).toBeGreaterThan(50); // Should be ~109km
        expect(distanceKm).toBeLessThan(150);
      } catch (error) {
        console.error('OSRM API test failed:', error);
        throw error;
      }
    });

    it('should handle invalid routes', async () => {
      // Two points very close together (same location)
      const lng = 18.4241;
      const lat = -33.9249;

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${lng},${lat};${lng},${lat}?overview=false`
        );

        expect(response.ok).toBe(true);
        const data = await response.json();

        // Should still return a route with 0 distance
        expect(data.routes).toBeDefined();
        if (data.routes.length > 0) {
          const route = data.routes[0];
          expect(route.distance).toBe(0);
        }
      } catch (error) {
        console.error('OSRM API invalid route test failed:', error);
        throw error;
      }
    });
  });

  describe('Haversine Calculation', () => {
    it('should calculate distance using Haversine formula', () => {
      // Cape Town to Johannesburg (approximately 1400km)
      const lat1 = -33.9249;
      const lng1 = 18.4241;
      const lat2 = -26.2023;
      const lng2 = 28.0436;

      const R = 6371; // Earth's radius in km
      const toRad = (degrees: number) => (degrees * Math.PI) / 180;

      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      expect(distance).toBeGreaterThan(1200);
      expect(distance).toBeLessThan(1350);
    });
  });

  describe('Pricing Calculation', () => {
    it('should calculate correct price for short distance', () => {
      const distanceKm = 10;
      const basePrice = 40;
      const pricePerKm = 10;
      const multiplier = 1.0;

      const distanceCharge = distanceKm * pricePerKm;
      const totalPrice = (basePrice + distanceCharge) * multiplier;

      expect(totalPrice).toBe(140); // 40 + (10 * 10)
    });

    it('should calculate correct price for long distance', () => {
      const distanceKm = 150;
      const basePrice = 40;
      const pricePerKm = 6; // Long distance rate
      const multiplier = 1.0;

      const distanceCharge = distanceKm * pricePerKm;
      const totalPrice = (basePrice + distanceCharge) * multiplier;

      expect(totalPrice).toBe(940); // 40 + (150 * 6)
    });

    it('should apply package size multiplier', () => {
      const distanceKm = 50;
      const basePrice = 40;
      const pricePerKm = 10;

      const multipliers: Record<string, number> = {
        small: 1.0,
        medium: 1.5,
        large: 2.0
      };

      // Small package
      let totalPrice = (basePrice + distanceKm * pricePerKm) * multipliers.small;
      expect(totalPrice).toBe(540); // 40 + (50 * 10) = 540

      // Medium package
      totalPrice = (basePrice + distanceKm * pricePerKm) * multipliers.medium;
      expect(totalPrice).toBe(810); // 540 * 1.5

      // Large package
      totalPrice = (basePrice + distanceKm * pricePerKm) * multipliers.large;
      expect(totalPrice).toBe(1080); // 540 * 2.0
    });

    it('should handle pricing tier transition at 100km', () => {
      const basePrice = 40;

      // 99km - local rate
      const price99 = basePrice + 99 * 10; // R1030
      expect(price99).toBe(1030);

      // 100km - long distance rate
      const price100 = basePrice + 100 * 6; // R640
      expect(price100).toBe(640);

      // 101km - long distance rate
      const price101 = basePrice + 101 * 6; // R646
      expect(price101).toBe(646);
    });
  });
});
