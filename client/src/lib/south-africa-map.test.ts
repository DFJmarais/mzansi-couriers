import { describe, expect, it } from "vitest";
import {
  SOUTH_AFRICA_CENTER,
  isSouthAfricanCoordinate,
  normalizeSouthAfricanCoordinate,
} from "./south-africa-map";

describe("South African map coordinates", () => {
  it("uses Johannesburg as the regional fallback", () => {
    expect(SOUTH_AFRICA_CENTER).toEqual({ lat: -26.2041, lng: 28.0473 });
  });

  it("accepts Johannesburg and Midrand coordinates", () => {
    expect(isSouthAfricanCoordinate({ lat: -26.1076, lng: 28.0567 })).toBe(true);
    expect(isSouthAfricanCoordinate({ lat: -25.9895, lng: 28.1284 })).toBe(true);
  });

  it("rejects the old overseas fallback and normalizes it to Johannesburg", () => {
    const sanFrancisco = { lat: 37.7749, lng: -122.4194 };
    expect(isSouthAfricanCoordinate(sanFrancisco)).toBe(false);
    expect(normalizeSouthAfricanCoordinate(sanFrancisco)).toEqual(SOUTH_AFRICA_CENTER);
    expect(normalizeSouthAfricanCoordinate(undefined)).toEqual(SOUTH_AFRICA_CENTER);
  });
});
