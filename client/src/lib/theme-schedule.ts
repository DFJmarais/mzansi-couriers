export const NIGHT_SCHEDULE_LABEL = "18:00–06:00 local time";

/** Uses the user's device local clock; no network or location permission is required. */
export function isNightScheduleActive(date = new Date(), startHour = 18, endHour = 6): boolean {
  const hour = date.getHours();
  return startHour > endHour ? hour >= startHour || hour < endHour : hour >= startHour && hour < endHour;
}
