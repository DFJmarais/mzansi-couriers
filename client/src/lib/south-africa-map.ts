export type MapCoordinate = { lat: number; lng: number };

/** Johannesburg is the safe regional center for South African delivery views. */
export const SOUTH_AFRICA_CENTER: MapCoordinate = { lat: -26.2041, lng: 28.0473 };
export const SANDTON_COORDINATE: MapCoordinate = { lat: -26.1076, lng: 28.0567 };
export const MIDRAND_COORDINATE: MapCoordinate = { lat: -25.9895, lng: 28.1284 };

/** A broad South Africa bounding box used to reject accidental overseas fallbacks. */
export function isSouthAfricanCoordinate(coordinate: MapCoordinate): boolean {
  return (
    Number.isFinite(coordinate.lat) &&
    Number.isFinite(coordinate.lng) &&
    coordinate.lat >= -35.2 &&
    coordinate.lat <= -22.0 &&
    coordinate.lng >= 16.0 &&
    coordinate.lng <= 33.1
  );
}

export function normalizeSouthAfricanCoordinate(
  coordinate: MapCoordinate | null | undefined,
): MapCoordinate {
  return coordinate && isSouthAfricanCoordinate(coordinate)
    ? coordinate
    : SOUTH_AFRICA_CENTER;
}
