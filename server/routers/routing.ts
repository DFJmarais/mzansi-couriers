import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { calculateCustomerPricing } from "../services/courier-pricing";

/**
 * Routing Router
 * Provides route calculations and pricing
 */

interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  source: 'osrm' | 'haversine';
}

/**
 * Calculate route between two coordinates using OSRM API
 */
async function calculateRouteOSRM(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<RouteResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const distanceKm = route.distance / 1000;
    const durationMinutes = Math.round(route.duration / 60);

    return {
      distanceKm: Math.round(distanceKm * 100) / 100,
      durationMinutes,
      source: 'osrm'
    };
  } catch (error) {
    console.error('OSRM API error:', error);
    return null;
  }
}

/**
 * Calculate distance using Haversine formula (fallback)
 */
function calculateHaversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): RouteResult {
  const R = 6371; // Earth's radius in km

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

  const durationMinutes = Math.round((distance / 50) * 60);

  return {
    distanceKm: Math.round(distance * 100) / 100,
    durationMinutes: Math.max(5, durationMinutes),
    source: 'haversine'
  };
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export const routingRouter = router({
  /**
   * Calculate route between two coordinates
   */
  calculateRoute: publicProcedure
    .input(z.object({
      originLat: z.number().min(-34.84).max(-22.13),
      originLng: z.number().min(16.45).max(32.89),
      destLat: z.number().min(-34.84).max(-22.13),
      destLng: z.number().min(16.45).max(32.89)
    }))
    .query(async ({ input }) => {
      const { originLat, originLng, destLat, destLng } = input;

      // Try OSRM first
      let result = await calculateRouteOSRM(originLat, originLng, destLat, destLng);

      // Fallback to Haversine
      if (!result) {
        result = calculateHaversine(originLat, originLng, destLat, destLng);
      }

      return result;
    }),

  /**
   * Calculate price based on distance and package size
   */
  calculatePrice: publicProcedure
    .input(z.object({
      distanceKm: z.number().min(0),
      packageSize: z.enum(['small', 'medium', 'large']).default('small'),
      packageWeight: z.number().nonnegative().default(1),
      serviceLevel: z.enum(['economy', 'priority', 'express', 'localSameDay']).default('economy'),
      lengthCm: z.number().positive().optional(),
      widthCm: z.number().positive().optional(),
      heightCm: z.number().positive().optional(),
    }))
    .query(({ input }) => {
      const packageSizeMinimumWeight = { small: 0, medium: 5, large: 15 } as const;
      const pricing = calculateCustomerPricing({
        distanceKm: input.distanceKm,
        actualWeightKg: Math.max(input.packageWeight, packageSizeMinimumWeight[input.packageSize]),
        lengthCm: input.lengthCm,
        widthCm: input.widthCm,
        heightCm: input.heightCm,
        serviceLevel: input.serviceLevel,
      });

      return {
        basePrice: pricing.tariffBase,
        distanceCharge: pricing.routeCharge,
        totalPrice: pricing.finalPrice,
        pricePerKm: null,
        multiplier: pricing.serviceMultiplier,
        distanceKm: input.distanceKm,
        routeBand: pricing.routeBand,
        weightBand: pricing.weightBand,
        billableWeightKg: pricing.billableWeightKg,
        serviceLevel: pricing.serviceLevel,
        breakdown: pricing.breakdown,
      };
    })
});
