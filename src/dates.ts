const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function toIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function today(): string {
  return toIso(new Date())
}

export function addDays(iso: string, days: number): string {
  const date = fromIso(iso)
  date.setDate(date.getDate() + days)
  return toIso(date)
}

export function startOfWeek(iso: string): string {
  const weekday = fromIso(iso).getDay()
  return addDays(iso, weekday === 0 ? -6 : 1 - weekday)
}

export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export function monthDay(iso: string): string {
  const date = fromIso(iso)
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}

export function dayLabel(iso: string): string {
  return `${WEEKDAYS[fromIso(iso).getDay()]} ${monthDay(iso)}`
}
