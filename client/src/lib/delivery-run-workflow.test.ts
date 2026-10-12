import { describe, expect, it } from "vitest";
import { buildStopNavigationUrl, getNextDeliveryStop } from "./delivery-run-workflow";

describe("delivery run workflow", () => {
  it("selects the first stop that still needs courier action", () => {
    const stop = getNextDeliveryStop([
      { id: 1, sequence: 1, status: "completed" as const },
      { id: 2, sequence: 2, status: "awaiting_customer_confirmation" as const },
      { id: 3, sequence: 3, status: "queued" as const },
    ]);
    expect(stop?.id).toBe(2);
  });

  it("builds a coordinate-based Google Maps route from current courier GPS", () => {
    const url = buildStopNavigationUrl({ lat: -26.1, lng: 28.05 }, { lat: -25.99, lng: 28.13 });
    expect(url).toContain("origin=-26.1%2C28.05");
    expect(url).toContain("destination=-25.99%2C28.13");
    expect(url).toContain("travelmode=driving");
  });

  it("uses current location when GPS is not available instead of inventing a coordinate", () => {
    const url = buildStopNavigationUrl(null, { lat: -33.92, lng: 18.42 });
    expect(url).toContain("origin=Current%20Location");
    expect(url).not.toContain("0%2C0");
  });
});
