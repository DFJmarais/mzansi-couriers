export type DeliveryStopStatus = "queued" | "navigating" | "arrived" | "awaiting_customer_confirmation" | "completed" | "failed";

export interface DeliveryStopSummary {
  id: number;
  sequence: number;
  status: DeliveryStopStatus;
}

export function getNextDeliveryStop<T extends DeliveryStopSummary>(stops: T[]): T | undefined {
  return stops.find((stop) => ["queued", "navigating", "arrived", "awaiting_customer_confirmation"].includes(stop.status));
}

export function buildStopNavigationUrl(
  origin: { lat: number; lng: number } | null,
  destination: { lat: number; lng: number },
): string {
  const originValue = origin ? `${origin.lat},${origin.lng}` : "Current Location";
  const destinationValue = `${destination.lat},${destination.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originValue)}&destination=${encodeURIComponent(destinationValue)}&travelmode=driving`;
}
