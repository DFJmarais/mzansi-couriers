export const COURIER_SAFETY_LIMITS = {
  maxWeeklyKilometres: 2500,
  maxWeeklyDrivingMinutes: 60 * 60,
  maxDailyDrivingMinutes: 12 * 60,
  cooldownHours: 10,
} as const;

type DrivingPoint = {
  latitude: number;
  longitude: number;
  timestamp: Date | string;
};

export type CourierSafetyStatus = {
  weeklyKilometres: number;
  weeklyDrivingMinutes: number;
  dailyDrivingMinutes: number;
  lastDrivingAt: Date | null;
  cooldownUntil: Date | null;
  eligibleForOffers: boolean;
  reason: "within_limits" | "weekly_kilometre_limit" | "weekly_time_limit" | "daily_time_limit" | "cooldown";
};

export function haversineKm(a: DrivingPoint, b: DrivingPoint) {
  const earthRadiusKm = 6371;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const deltaLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const deltaLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function calculatePathKilometres(points: DrivingPoint[]) {
  const ordered = points.map((point) => ({ ...point, timestamp: new Date(point.timestamp) })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  let kilometres = 0;
  for (let index = 1; index < ordered.length; index += 1) kilometres += haversineKm(ordered[index - 1], ordered[index]);
  return Math.round(kilometres * 10) / 10;
}

export function calculatePathDrivingMinutes(points: DrivingPoint[]) {
  const ordered = points.map((point) => ({ ...point, timestamp: new Date(point.timestamp) })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  let minutes = 0;
  for (let index = 1; index < ordered.length; index += 1) minutes += Math.max(0, Math.min(15, (ordered[index].timestamp.getTime() - ordered[index - 1].timestamp.getTime()) / 60_000));
  return Math.round(minutes);
}

function startOfUtcWeek(now: Date) {
  const start = new Date(now);
  const day = start.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function startOfUtcDay(now: Date) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function calculateCourierSafety(points: DrivingPoint[], now = new Date()): CourierSafetyStatus {
  const weekStart = startOfUtcWeek(now).getTime();
  const dayStart = startOfUtcDay(now).getTime();
  const ordered = points
    .map((point) => ({ ...point, timestamp: new Date(point.timestamp) }))
    .filter((point) => !Number.isNaN(point.timestamp.getTime()) && point.timestamp.getTime() >= weekStart && point.timestamp.getTime() <= now.getTime())
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  let weeklyKilometres = 0;
  let weeklyDrivingMinutes = 0;
  let dailyDrivingMinutes = 0;
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    const minutes = Math.max(0, Math.min(15, (current.timestamp.getTime() - previous.timestamp.getTime()) / 60_000));
    weeklyKilometres += haversineKm(previous, current);
    weeklyDrivingMinutes += minutes;
    if (current.timestamp.getTime() >= dayStart) dailyDrivingMinutes += minutes;
  }

  const lastDrivingAt = ordered.at(-1)?.timestamp ?? null;
  const weeklyLimitReached = weeklyKilometres >= COURIER_SAFETY_LIMITS.maxWeeklyKilometres;
  const weeklyTimeLimitReached = weeklyDrivingMinutes >= COURIER_SAFETY_LIMITS.maxWeeklyDrivingMinutes;
  const dailyTimeLimitReached = dailyDrivingMinutes >= COURIER_SAFETY_LIMITS.maxDailyDrivingMinutes;
  const cooldownUntil = weeklyLimitReached || weeklyTimeLimitReached
    ? new Date(startOfUtcWeek(now).getTime() + 7 * 24 * 60 * 60 * 1000)
    : dailyTimeLimitReached && lastDrivingAt
      ? new Date(lastDrivingAt.getTime() + COURIER_SAFETY_LIMITS.cooldownHours * 60 * 60 * 1000)
      : null;
  const cooldown = Boolean(cooldownUntil && cooldownUntil.getTime() > now.getTime());
  const reason = weeklyLimitReached
    ? "weekly_kilometre_limit"
    : weeklyTimeLimitReached
      ? "weekly_time_limit"
      : dailyTimeLimitReached
        ? "daily_time_limit"
        : cooldown
          ? "cooldown"
          : "within_limits";

  return {
    weeklyKilometres: Math.round(weeklyKilometres * 10) / 10,
    weeklyDrivingMinutes: Math.round(weeklyDrivingMinutes),
    dailyDrivingMinutes: Math.round(dailyDrivingMinutes),
    lastDrivingAt,
    cooldownUntil,
    eligibleForOffers: reason === "within_limits",
    reason,
  };
}
