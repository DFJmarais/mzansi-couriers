import { describe, expect, it } from "vitest";
import { assertMobileSurfaceContrast, contrastRatio } from "./mobile-surface-contrast";

describe("mobile surface contrast", () => {
  it("keeps every declared light and dark surface pairing readable", () => {
    const results = assertMobileSurfaceContrast();
    expect(results).toHaveLength(8);
    expect(results.every((result) => result.passes)).toBe(true);
    expect(Math.min(...results.map((result) => result.ratio))).toBeGreaterThanOrEqual(4.5);
  });

  it("calculates WCAG contrast ratios consistently", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });
});
