export function parseJSON<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function formatPrice(price: number): string {
  return `${price.toFixed(2).replace(/\.00$/, "")} zł`;
}

export type HoursRow = { day: number; open: string; close: string; closed?: boolean };

/** Given hours config and a YYYY-MM-DD date, returns array of "HH:mm" slots (30-min) within opening hours. */
export function slotsForDate(hours: HoursRow[], dateStr: string): string[] {
  if (!dateStr) return [];
  const d = new Date(dateStr + "T00:00:00");
  const dow = d.getDay(); // 0=Sun
  const row = hours.find((h) => h.day === dow);
  if (!row || row.closed) return [];
  const slots: string[] = [];
  const [oh, om] = row.open.split(":").map(Number);
  let [ch, cm] = row.close.split(":").map(Number);
  // handle after-midnight closing (e.g. 02:00)
  let endMinutes = ch * 60 + cm;
  if (endMinutes <= oh * 60 + om) endMinutes += 24 * 60;
  let cur = oh * 60 + om;
  // last seating 60 min before close
  for (; cur <= endMinutes - 60; cur += 30) {
    const hh = Math.floor((cur % (24 * 60)) / 60);
    const mm = cur % 60;
    slots.push(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return slots;
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isPastDate(dateStr: string): boolean {
  return dateStr < todayStr();
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
