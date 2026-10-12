import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { geocodeAddress, calculateDistance, reverseGeocode } from "../services/google-maps";

/**
 * Google Maps Router
 * Provides tRPC procedures for Google Maps API calls
 */

export const googleMapsRouter = router({
  /**
   * Geocode an address to coordinates
   */
  geocode: publicProcedure
    .input(z.object({
      address: z.string().min(3).max(500)
    }))
    .query(async ({ input }) => {
      const result = await geocodeAddress(input.address);

      if (!result) {
        return {
          success: false,
          error: "Could not geocode address"
        };
      }

      return {
        success: true,
        data: result
      };
    }),

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance: publicProcedure
    .input(z.object({
      originLat: z.number().min(-34.84).max(-22.13),
      originLng: z.number().min(16.45).max(32.89),
      destLat: z.number().min(-34.84).max(-22.13),
      destLng: z.number().min(16.45).max(32.89)
    }))
    .query(async ({ input }) => {
      const result = await calculateDistance(
        input.originLat,
        input.originLng,
        input.destLat,
        input.destLng
      );

      if (!result) {
        return {
          success: false,
          error: "Could not calculate distance"
        };
      }

      return {
        success: true,
        data: result
      };
    }),

  /**
   * Reverse geocode coordinates to address
   */
  reverseGeocode: publicProcedure
    .input(z.object({
      lat: z.number().min(-34.84).max(-22.13),
      lng: z.number().min(16.45).max(32.89)
    }))
    .query(async ({ input }) => {
      const result = await reverseGeocode(input.lat, input.lng);

      if (!result) {
        return {
          success: false,
          error: "Could not reverse geocode"
        };
      }

      return {
        success: true,
        data: result
      };
    })
});
