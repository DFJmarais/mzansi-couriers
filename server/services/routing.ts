/**
 * Routing Service
 * Provides route calculations using free APIs (OSRM) with Haversine fallback
 */

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  source: 'haversine' | 'osrm';
}

/**
 * Calculate route between two coordinates
 * Uses OSRM API first, then Haversine fallback
 */
export async function calculateRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<RouteResult> {
  try {
    // Try OSRM API (free, 200-400ms)
    const osrmResult = await tryOSRM(originLat, originLng, destLat, destLng);
    if (osrmResult) {
      return osrmResult;
    }

    // Fallback to Haversine (instant, < 5ms)
    return calculateHaversine(originLat, originLng, destLat, destLng);
  } catch (error) {
    console.error('Route calculation error:', error);
    // Fallback to Haversine on error
    return calculateHaversine(originLat, originLng, destLat, destLng);
  }
}

/**
 * Try OSRM API (free, 200-400ms)
 * https://router.project-osrm.org/
 */
async function tryOSRM(
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
    const distanceKm = route.distance / 1000; // Convert meters to km
    const durationMinutes = Math.round(route.duration / 60); // Convert seconds to minutes

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
 * Calculate distance using Haversine formula
 * Instant calculation, accurate within 5-10%
 */
export function calculateHaversine(
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

  // Estimate duration: average speed 50km/hour in South Africa (accounting for traffic)
  const durationMinutes = Math.round((distance / 50) * 60);

  return {
    distanceKm: Math.round(distance * 100) / 100,
    durationMinutes: Math.max(5, durationMinutes), // Minimum 5 minutes
    source: 'haversine'
  };
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Validate that coordinates are within South Africa
 */
export function isValidSACoordinates(lat: number, lng: number): boolean {
  // South Africa bounds
  const minLat = -34.84;
  const maxLat = -22.13;
  const minLng = 16.45;
  const maxLng = 32.89;

  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

/**
 * Calculate price based on distance and package size
 */
export function calculatePrice(distanceKm: number, packageSize: 'small' | 'medium' | 'large'): number {
  const basePrice = 40; // R40 base fare

  // Pricing tiers
  let pricePerKm = 10; // R10/km for local (0-99km)
  if (distanceKm >= 100) {
    pricePerKm = 6; // R6/km for long-distance (100km+)
  }

  // Package multipliers
  const multipliers: Record<string, number> = {
    small: 1.0,
    medium: 1.5,
    large: 2.0
  };

  const multiplier = multipliers[packageSize] || 1.0;

  const totalPrice = (basePrice + distanceKm * pricePerKm) * multiplier;

  return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
}
