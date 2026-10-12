export type MapMarkerKind = "courier" | "destination";

export const MAP_MARKER_CONFIG: Record<MapMarkerKind, {
  label: string;
  color: string;
  glyph: string;
}> = {
  courier: {
    label: "Courier location",
    color: "#0a9f55",
    glyph: "🚚",
  },
  destination: {
    label: "Delivery destination",
    color: "#e4572e",
    glyph: "📦",
  },
};

export function getMapMarkerConfig(kind: MapMarkerKind) {
  return MAP_MARKER_CONFIG[kind];
}
