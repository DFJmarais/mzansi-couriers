import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

/**
 * Geocoding Router
 * Provides address search and geocoding services
 * Uses Photon API (free, fast, autocomplete-friendly)
 */

interface PhotonFeature {
  geometry: {
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    name: string;
    street?: string;
    city?: string;
    district?: string;
    state?: string;
    postcode?: string;
    country?: string;
    osm_id?: number;
    osm_type?: string;
  };
}

interface GeocodedAddress {
  address: string;
  latitude: number;
  longitude: number;
  street?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  confidence: number;
}

/**
 * Search for addresses using Photon API
 * Fast, free, autocomplete-friendly
 */
async function searchPhoton(query: string): Promise<GeocodedAddress[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en&bbox=16.45,-34.84,32.89,-22.13`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Photon API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return [];
    }

    return data.features.map((feature: PhotonFeature) => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      // Build full address string
      const parts = [];
      if (props.street) parts.push(props.street);
      if (props.district) parts.push(props.district);
      if (props.city) parts.push(props.city);
      if (props.state) parts.push(props.state);
      if (props.postcode) parts.push(props.postcode);

      const fullAddress = parts.join(", ");

      return {
        address: fullAddress || props.name,
        latitude: coords[1],
        longitude: coords[0],
        street: props.street,
        suburb: props.district,
        city: props.city,
        province: props.state,
        postalCode: props.postcode,
        confidence: 0.85
      };
    });
  } catch (error) {
    console.error('Photon search error:', error);
    return [];
  }
}

/**
 * Fallback to Nominatim if Photon fails
 */
async function searchNominatim(query: string): Promise<GeocodedAddress[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=za`,
      {
        headers: {
          'User-Agent': 'Mzansi-Couriers/1.0'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data.map((result: any) => ({
      address: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      street: result.address?.road,
      suburb: result.address?.suburb || result.address?.village,
      city: result.address?.city || result.address?.town,
      province: result.address?.state,
      postalCode: result.address?.postcode,
      confidence: parseFloat(result.importance || 0.7)
    }));
  } catch (error) {
    console.error('Nominatim search error:', error);
    return [];
  }
}

export const geocodingRouter = router({
  /**
   * Search for addresses
   * Input: search query (e.g., "124 Main Road, Kleinmond")
   * Output: Array of matching addresses with coordinates
   */
  search: publicProcedure
    .input(z.object({
      query: z.string().min(3, "Search query must be at least 3 characters").max(200)
    }))
    .query(async ({ input }) => {
      const { query } = input;

      // Try Photon first (fast, free, autocomplete-friendly)
      let results = await searchPhoton(query);

      // If Photon returns nothing, try Nominatim (slower but more comprehensive)
      if (results.length === 0) {
        results = await searchNominatim(query);
      }

      return {
        query,
        results,
        count: results.length,
        source: results.length > 0 ? 'photon' : 'nominatim'
      };
    }),

  /**
   * Reverse geocode coordinates to get address
   * Input: latitude, longitude
   * Output: Formatted address
   */
  reverseGeocode: publicProcedure
    .input(z.object({
      latitude: z.number().min(-34.84).max(-22.13),
      longitude: z.number().min(16.45).max(32.89)
    }))
    .query(async ({ input }) => {
      const { latitude, longitude } = input;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              'User-Agent': 'Mzansi-Couriers/1.0'
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          return null;
        }

        const data = await response.json();

        return {
          address: data.display_name,
          latitude,
          longitude,
          street: data.address?.road,
          suburb: data.address?.suburb || data.address?.village,
          city: data.address?.city || data.address?.town,
          province: data.address?.state,
          postalCode: data.address?.postcode
        };
      } catch (error) {
        console.error('Reverse geocode error:', error);
        return null;
      }
    }),

  /**
   * Validate address and get coordinates
   * Input: full address string
   * Output: Validated address with coordinates
   */
  validate: publicProcedure
    .input(z.object({
      address: z.string().min(5).max(500)
    }))
    .query(async ({ input }) => {
      const { address } = input;

      // Search for the address
      const results = await searchPhoton(address);

      if (results.length === 0) {
        return {
          valid: false,
          error: 'Address not found'
        };
      }

      const result = results[0];

      // Validate coordinates are in South Africa
      const isInSA =
        result.latitude >= -34.84 &&
        result.latitude <= -22.13 &&
        result.longitude >= 16.45 &&
        result.longitude <= 32.89;

      if (!isInSA) {
        return {
          valid: false,
          error: 'Address is outside South Africa'
        };
      }

      return {
        valid: true,
        address: result.address,
        latitude: result.latitude,
        longitude: result.longitude,
        street: result.street,
        suburb: result.suburb,
        city: result.city,
        province: result.province,
        postalCode: result.postalCode,
        confidence: result.confidence
      };
    })
});
