/**
 * Google Maps service.
 *
 * All server-side Maps traffic goes through the Manus Maps proxy. The Google
 * credential is injected by the platform and never appears in application
 * source, client bundles, URLs returned to clients, or logs.
 */

import {
  makeRequest,
  type DistanceMatrixResult,
  type GeocodingResult as ProxyGeocodingResult,
} from "../_core/map";

export interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
  formattedAddress: string;
  components: {
    streetNumber?: string;
    streetName?: string;
    suburb?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
}

export interface DistanceResult {
  distanceKm: number;
  durationMinutes: number;
  distanceText: string;
  durationText: string;
}

function toGeocodeResult(data: ProxyGeocodingResult): GeocodeResult | null {
  const result = data.results?.[0];
  if (data.status !== "OK" || !result) return null;

  const components: GeocodeResult["components"] = {};
  for (const component of result.address_components ?? []) {
    if (component.types.includes("street_number")) components.streetNumber = component.short_name;
    if (component.types.includes("route")) components.streetName = component.long_name;
    if (component.types.includes("sublocality") || component.types.includes("sublocality_level_1")) {
      components.suburb = component.long_name;
    }
    if (component.types.includes("locality")) components.city = component.long_name;
    if (component.types.includes("administrative_area_level_1")) components.province = component.long_name;
    if (component.types.includes("postal_code")) components.postalCode = component.short_name;
  }

  return {
    address: result.formatted_address,
    formattedAddress: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    components,
  };
}

/** Geocode an address through the server-side Maps proxy. */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const data = await makeRequest<ProxyGeocodingResult>("/maps/api/geocode/json", { address });
    return toGeocodeResult(data);
  } catch (error) {
    console.error("Geocoding proxy request failed:", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}

/** Calculate driving distance and duration through the server-side Maps proxy. */
export async function calculateDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<DistanceResult | null> {
  try {
    const data = await makeRequest<DistanceMatrixResult>("/maps/api/distancematrix/json", {
      origins: `${originLat},${originLng}`,
      destinations: `${destLat},${destLng}`,
      mode: "driving",
      units: "metric",
    });
    const element = data.rows?.[0]?.elements?.[0];
    if (data.status !== "OK" || !element || element.status !== "OK") return null;

    return {
      distanceKm: Math.round((element.distance.value / 1000) * 100) / 100,
      durationMinutes: Math.max(1, Math.round(element.duration.value / 60)),
      distanceText: element.distance.text,
      durationText: element.duration.text,
    };
  } catch (error) {
    console.error("Distance proxy request failed:", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}

/** Reverse geocode coordinates through the server-side Maps proxy. */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  try {
    const data = await makeRequest<ProxyGeocodingResult>("/maps/api/geocode/json", {
      latlng: `${lat},${lng}`,
    });
    return toGeocodeResult(data);
  } catch (error) {
    console.error("Reverse geocoding proxy request failed:", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}
