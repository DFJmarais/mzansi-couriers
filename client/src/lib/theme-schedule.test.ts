import { describe, expect, it } from "vitest";
import { isNightScheduleActive } from "./theme-schedule";

describe("theme schedule", () => {
  it("enables dark mode during the evening", () => {
    expect(isNightScheduleActive(new Date(2026, 8, 20, 18, 0))).toBe(true);
    expect(isNightScheduleActive(new Date(2026, 8, 20, 23, 59))).toBe(true);
  });

  it("keeps dark mode active after midnight until morning", () => {
    expect(isNightScheduleActive(new Date(2026, 8, 20, 0, 30))).toBe(true);
    expect(isNightScheduleActive(new Date(2026, 8, 20, 5, 59))).toBe(true);
  });

  it("returns to light mode during the day", () => {
    expect(isNightScheduleActive(new Date(2026, 8, 20, 6, 0))).toBe(false);
    expect(isNightScheduleActive(new Date(2026, 8, 20, 12, 0))).toBe(false);
    expect(isNightScheduleActive(new Date(2026, 8, 20, 17, 59))).toBe(false);
  });
});
