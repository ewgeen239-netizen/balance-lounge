// Shared, client-safe helpers for "Nasze wydarzenia". Times are stored as UTC
// instants and shown in the venue's timezone.

export type EventDTO = {
  id: number;
  title: string;
  summary: string;
  description: string;
  image: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  enabled: boolean;
};

export type EventStatus = "live" | "upcoming" | "past";

export const EVENTS_TZ = "Europe/Warsaw";

export function eventStatus(e: Pick<EventDTO, "startsAt" | "endsAt">, now: number): EventStatus {
  if (now >= new Date(e.endsAt).getTime()) return "past";
  if (now >= new Date(e.startsAt).getTime()) return "live";
  return "upcoming";
}

/** Live first, then upcoming by start time; past ones after, newest first. */
export function sortEvents<T extends Pick<EventDTO, "startsAt" | "endsAt">>(list: T[], now: number) {
  const current = list
    .filter((e) => eventStatus(e, now) !== "past")
    .sort((a, b) => {
      const la = eventStatus(a, now) === "live" ? 0 : 1;
      const lb = eventStatus(b, now) === "live" ? 0 : 1;
      return la - lb || +new Date(a.startsAt) - +new Date(b.startsAt);
    });
  const past = list
    .filter((e) => eventStatus(e, now) === "past")
    .sort((a, b) => +new Date(b.endsAt) - +new Date(a.endsAt));
  return { current, past };
}

/** "pt, 10 paź · 20:00 – 02:00" (end date added when it falls on another day). */
export function formatEventRange(startIso: string, endIso: string, locale: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const day = (d: Date) =>
    new Intl.DateTimeFormat(locale, { timeZone: EVENTS_TZ, weekday: "short", day: "numeric", month: "short" }).format(d);
  const time = (d: Date) =>
    new Intl.DateTimeFormat(locale, { timeZone: EVENTS_TZ, hour: "2-digit", minute: "2-digit" }).format(d);
  const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: EVENTS_TZ }).format(d);

  const sameDay = ymd(s) === ymd(e);
  // Ending before ~06:00 the next morning still reads as "one evening".
  const overnight = !sameDay && +e - +s < 24 * 3600_000 && Number(time(e).slice(0, 2)) < 6;
  return sameDay || overnight
    ? `${day(s)} · ${time(s)} – ${time(e)}`
    : `${day(s)} ${time(s)} – ${day(e)} ${time(e)}`;
}

/** Splits a description into paragraphs, so each one is translated on its own. */
export const paragraphs = (text: string) =>
  text.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);
