import type { HoursRow } from "./utils";

// Opening hours from the admin "Site content" schedule (day 0 = Sunday), always
// read in the venue's time zone so a guest abroad still sees Szczecin hours.

const TZ = "Europe/Warsaw";
const DAY_NO: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function venueClock(now: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { day: DAY_NO[get("weekday")] ?? 0, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** [start, end) in minutes from that day's midnight; end may pass 24:00 (e.g. until 02:00). */
function span(row: HoursRow | undefined): [number, number] | null {
  if (!row || row.closed || !row.open || !row.close) return null;
  const start = toMin(row.open);
  let end = toMin(row.close);
  if (end <= start) end += 24 * 60;
  return [start, end];
}

export type TodayHours = { day: number; open: string | null; close: string | null; openNow: boolean };

/**
 * Today's hours and whether the venue is open right now. Between midnight and
 * the late closing time it still counts as open (yesterday's session runs on).
 */
export function todayHours(hours: HoursRow[], now = new Date()): TodayHours {
  const { day, minutes } = venueClock(now);
  const row = hours.find((h) => h.day === day);
  const today = span(row);
  const yesterday = span(hours.find((h) => h.day === (day + 6) % 7));

  const openNow =
    (!!today && minutes >= today[0] && minutes < today[1]) ||
    (!!yesterday && yesterday[1] > 24 * 60 && minutes < yesterday[1] - 24 * 60);

  return { day, open: today ? row!.open : null, close: today ? row!.close : null, openNow };
}
