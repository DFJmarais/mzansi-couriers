import { describe, expect, it } from "vitest";
import { getMapMarkerConfig, MAP_MARKER_CONFIG } from "./map-marker-config";

describe("map marker configuration", () => {
  it("defines distinct courier and delivery destination markers", () => {
    expect(MAP_MARKER_CONFIG.courier.label).toBe("Courier location");
    expect(MAP_MARKER_CONFIG.destination.label).toBe("Delivery destination");
    expect(MAP_MARKER_CONFIG.courier.color).not.toBe(MAP_MARKER_CONFIG.destination.color);
    expect(MAP_MARKER_CONFIG.courier.glyph).toBe("🚚");
    expect(MAP_MARKER_CONFIG.destination.glyph).toBe("📦");
  });

  it("returns the correct accessible marker metadata", () => {
    expect(getMapMarkerConfig("courier")).toEqual({
      label: "Courier location",
      color: "#0a9f55",
      glyph: "🚚",
    });
    expect(getMapMarkerConfig("destination")).toEqual({
      label: "Delivery destination",
      color: "#e4572e",
      glyph: "📦",
    });
  });
});
