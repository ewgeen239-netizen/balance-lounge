import "server-only";
import { prisma } from "@/lib/db";
import { parseJSON, type HoursRow } from "@/lib/utils";

// Past bookings are deleted 5 hours after the venue closed on that day, so the
// panel only ever shows what still matters. Closing time comes from the opening
// hours; a closing time at or before opening means it falls on the next day
// (e.g. open 16:00, close 02:00).
export const KEEP_HOURS_AFTER_CLOSING = 5;
const TZ = "Europe/Warsaw";

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Offset (ms) of the timezone at that instant — handles summer/winter time. */
function tzOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
    .formatToParts(at)
    .reduce<Record<string, string>>((acc, p) => (p.type === "literal" ? acc : { ...acc, [p.type]: p.value }), {});

  const asUTC = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
  );
  return asUTC - at.getTime();
}

/** Local wall-clock time in Warsaw → absolute instant. */
function warsawToInstant(dateStr: string, minutes: number): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const naive = Date.UTC(y, m - 1, d, 0, 0, 0) + minutes * 60_000;
  // Two passes settle the DST edge cases.
  let guess = new Date(naive - tzOffsetMs(new Date(naive)));
  guess = new Date(naive - tzOffsetMs(guess));
  return guess;
}

/** When a booking on `date` may be deleted: closing time + KEEP_HOURS_AFTER_CLOSING. */
export function purgeDeadline(date: string, hours: HoursRow[]): Date {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const row = hours.find((h) => Number(h.day) === weekday);

  // No hours configured for that day → fall back to a 04:00 close.
  const openMin = row ? toMinutes(row.open) : 16 * 60;
  const closeMin = row ? toMinutes(row.close) : 4 * 60;
  const overnight = closeMin <= openMin;

  return new Date(
    warsawToInstant(date, closeMin + (overnight ? 24 * 60 : 0)).getTime() +
      KEEP_HOURS_AFTER_CLOSING * 60 * 60_000,
  );
}

/** Deletes bookings whose day is over (closing + 5h). Returns how many went. */
export async function purgeOldReservations(now: Date = new Date()): Promise<number> {
  const bar = await prisma.bar.findFirst({ select: { hours: true } });
  const hours = parseJSON<HoursRow[]>(bar?.hours, []);

  // Only consider days that are already past — cheap pre-filter before the
  // per-day deadline maths.
  const cutoffDate = new Date(now.getTime() - 24 * 60 * 60_000).toISOString().slice(0, 10);
  const candidates = await prisma.reservation.findMany({
    where: { date: { lte: cutoffDate } },
    select: { id: true, date: true },
  });

  const expired = candidates.filter((r) => now >= purgeDeadline(r.date, hours)).map((r) => r.id);
  if (expired.length === 0) return 0;

  const { count } = await prisma.reservation.deleteMany({ where: { id: { in: expired } } });
  return count;
}
