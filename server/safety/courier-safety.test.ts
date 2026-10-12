import { describe, expect, it } from "vitest";
import { calculateCourierSafety } from "./courier-safety";

const now = new Date("2026-09-29T12:00:00.000Z");

function point(minutesAgo: number, latitude: number, longitude = 28) {
  return { timestamp: new Date(now.getTime() - minutesAgo * 60_000), latitude, longitude };
}

describe("courier safety limits", () => {
  it("keeps a courier eligible when activity is within the protective limits", () => {
    const status = calculateCourierSafety([point(10, -26.2041), point(5, -26.21), point(0, -26.215)], now);
    expect(status.eligibleForOffers).toBe(true);
    expect(status.reason).toBe("within_limits");
    expect(status.dailyDrivingMinutes).toBe(10);
  });

  it("starts a cooldown after the daily driving threshold is reached", () => {
    const points = Array.from({ length: 50 }, (_, index) => point(index * 15, -26.2 + index * 0.001));
    const status = calculateCourierSafety(points, now);
    expect(status.dailyDrivingMinutes).toBeGreaterThanOrEqual(720);
    expect(status.eligibleForOffers).toBe(false);
    expect(status.reason).toBe("daily_time_limit");
    expect(status.cooldownUntil?.getTime()).toBeGreaterThan(now.getTime());
  });

  it("blocks a courier whose weekly distance limit is exceeded", () => {
    const points = Array.from({ length: 30 }, (_, index) => point(index * 20, -26.2 + index * 0.8));
    const status = calculateCourierSafety(points, now);
    expect(status.weeklyKilometres).toBeGreaterThan(2500);
    expect(status.eligibleForOffers).toBe(false);
    expect(status.reason).toBe("weekly_kilometre_limit");
  });
});
