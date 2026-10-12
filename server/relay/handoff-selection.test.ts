import { describe, expect, it } from "vitest";
import { chooseHandoffLocation } from "./handoff-selection";

describe("hybrid relay handoff selection", () => {
  it("prefers the closest active designated point near the courier midpoint", () => {
    const result = chooseHandoffLocation({ lat: -26.15, lng: 28.05 }, { lat: -26.2, lng: 28.1 }, [
      { id: 1, name: "Safe Point", address: "1 Main Road, Johannesburg", area: "Johannesburg", lat: -26.175, lng: 28.075, safetyNotes: "Public" },
      { id: 2, name: "Far Point", address: "1 Beach Road, Durban", area: "Durban", lat: -29.85, lng: 31.0, safetyNotes: null },
    ]);
    expect(result.mode).toBe("designated_point");
    expect(result.pointId).toBe(1);
    expect(result.address).toContain("Johannesburg");
  });

  it("falls back to a public courier meeting point when no designated point is nearby", () => {
    const result = chooseHandoffLocation({ lat: -26.15, lng: 28.05 }, { lat: -29.85, lng: 31.0 }, []);
    expect(result.mode).toBe("courier_meeting");
    expect(result.pointId).toBeNull();
    expect(result.address).toContain("agreed");
    expect(result.safetyNotes).toContain("public");
  });
});
