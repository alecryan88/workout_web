import { addDays, startOfWeek } from './dates'

/** Weekday offsets from Monday: 0 = Mon … 6 = Sun. */
export const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/**
 * Dates on the chosen weekdays across `weeks` Monday-based weeks, starting with the
 * week that contains `start`. Days before `start` in that first week are skipped.
 */
export function weeklyDates(start: string, weekdays: number[], weeks: number): string[] {
  if (!start || weeks < 1) return []
  const monday = startOfWeek(start)
  const dates: string[] = []
  for (let week = 0; week < weeks; week++) {
    for (const day of [...weekdays].sort((a, b) => a - b)) {
      const date = addDays(monday, week * 7 + day)
      if (date >= start) dates.push(date)
    }
  }
  return dates
}
