import { makeRequest, type DirectionsResult, type LatLng } from "../_core/map";

export type RoadRoute = { distanceKm: number; durationMinutes: number; polyline: string | null };

export async function getDrivingRoute(origin: LatLng, destination: LatLng): Promise<RoadRoute> {
  const result = await makeRequest<DirectionsResult>("/maps/api/directions/json", {
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: "driving",
    alternatives: false,
  });
  const route = result.routes?.[0];
  const leg = route?.legs?.[0];
  if (result.status !== "OK" || !route || !leg) throw new Error(`Road route unavailable (${result.status ?? "unknown"})`);
  return {
    distanceKm: Math.round((leg.distance.value / 1000) * 100) / 100,
    durationMinutes: Math.max(1, Math.round(leg.duration.value / 60)),
    polyline: route.overview_polyline?.points ?? null,
  };
}
