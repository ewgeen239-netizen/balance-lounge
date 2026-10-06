"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { cn } from "@/lib/utils";
import { eventStatus, formatEventRange, sortEvents, type EventDTO, type EventStatus } from "@/lib/events";

// Times are entered in the admin's local time (the venue's, in practice).
const pad = (n: number) => String(n).padStart(2, "0");
const toDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fromLocal = (date: string, time: string) => new Date(`${date}T${time || "00:00"}`);

const STATUS_LABEL: Record<EventStatus, string> = { live: "Trwa teraz", upcoming: "Nadchodzące", past: "Zakończone" };

function relative(e: Pick<EventDTO, "startsAt" | "endsAt">, now: number): string {
  const rtf = new Intl.RelativeTimeFormat("pl", { numeric: "auto" });
  const fmt = (ms: number) => {
    const min = Math.round(ms / 60_000);
    if (Math.abs(min) < 60) return rtf.format(min, "minute");
    const h = Math.round(min / 60);
    if (Math.abs(h) < 48) return rtf.format(h, "hour");
    return rtf.format(Math.round(h / 24), "day");
  };
  const st = eventStatus(e, now);
  if (st === "upcoming") return `zacznie się ${fmt(+new Date(e.startsAt) - now)}`;
  if (st === "live") return `skończy się ${fmt(+new Date(e.endsAt) - now)}`;
  return `zakończone ${fmt(+new Date(e.endsAt) - now)}`;
}

function Badge({ status, enabled }: { status: EventStatus; enabled: boolean }) {
  return (
    <span className="flex flex-wrap gap-1">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
          status === "live" && "bg-emerald-500/20 text-emerald-200",
          status === "upcoming" && "bg-ember/15 text-ember",
          status === "past" && "bg-white/10 text-neutral-400"
        )}
      >
        {STATUS_LABEL[status]}
      </span>
      {!enabled && <span className="rounded-full bg-neon/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neon">Ukryte</span>}
    </span>
  );
}

export function EventsAdminPanel({ initial }: { initial: EventDTO[] }) {
  const [events, setEvents] = useState<EventDTO[]>(initial);
  const [editing, setEditing] = useState<EventDTO | "new" | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const { current, past } = useMemo(() => sortEvents(events, now), [events, now]);

  async function toggle(e: EventDTO) {
    const enabled = !e.enabled;
    setEvents((list) => list.map((x) => (x.id === e.id ? { ...x, enabled } : x))); // optimistic
    const res = await fetch(`/api/admin/events/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) setEvents((list) => list.map((x) => (x.id === e.id ? { ...x, enabled: !enabled } : x)));
  }

  async function remove(e: EventDTO) {
    if (!confirm(`Usunąć wydarzenie „${e.title}”? Tego nie da się cofnąć.`)) return;
    const res = await fetch(`/api/admin/events/${e.id}`, { method: "DELETE" });
    if (res.ok) {
      setEvents((list) => list.filter((x) => x.id !== e.id));
      setEditing(null);
    }
  }

  function saved(e: EventDTO) {
    setEvents((list) => (list.some((x) => x.id === e.id) ? list.map((x) => (x.id === e.id ? e : x)) : [...list, e]));
    setEditing(null);
  }

  const card = (e: EventDTO) => {
    const st = eventStatus(e, now);
    return (
      <article
        key={e.id}
        className={cn(
          "flex flex-col overflow-hidden rounded-2xl border bg-ink-900/60 transition",
          e.enabled ? "border-white/10" : "border-dashed border-white/15 opacity-60"
        )}
      >
        <button onClick={() => setEditing(e)} className="group relative aspect-[16/9] bg-ink-800 text-left" title="Edytuj">
          {e.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.image} alt="" className={cn("h-full w-full object-cover", st === "past" && "brightness-[0.45] grayscale")} />
          ) : (
            <span className="flex h-full items-center justify-center text-3xl text-ember/30">✦</span>
          )}
          <span className="absolute left-2 top-2"><Badge status={st} enabled={e.enabled} /></span>
        </button>
        <div className="flex flex-1 flex-col p-3">
          <button onClick={() => setEditing(e)} className="text-left">
            <p className="text-[11px] font-medium text-ember/90">{formatEventRange(e.startsAt, e.endsAt, "pl")}</p>
            <h3 className="mt-0.5 font-medium text-neutral-100">{e.title}</h3>
            {e.summary && <p className="mt-1 line-clamp-2 text-xs text-neutral-400">{e.summary}</p>}
            <p className="mt-1.5 text-[11px] text-neutral-500">{relative(e, now)}</p>
          </button>
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-300" title="Pokaż / ukryj na stronie">
              <input type="checkbox" role="switch" checked={e.enabled} onChange={() => toggle(e)} className="h-4 w-4 accent-[#ff2d3a]" />
              {e.enabled ? "Widoczne" : "Ukryte"}
            </label>
            <div className="flex gap-3 text-xs">
              <button onClick={() => setEditing(e)} className="text-neutral-300 hover:text-neon">edytuj</button>
              <button onClick={() => remove(e)} className="text-neutral-500 hover:text-neon">usuń</button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="wordmark text-2xl text-neutral-50">Wydarzenia</h2>
          <p className="mt-1 text-xs text-neutral-500">Strona „Nasze wydarzenia”. Teksty wpisuj po polsku — na stronie tłumaczą się automatycznie.</p>
        </div>
        <button onClick={() => setEditing("new")} className="btn-primary text-sm">+ Nowe wydarzenie</button>
      </div>

      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">Aktualne i nadchodzące · {current.length}</h3>
      {current.length === 0 ? (
        <p className="mb-10 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-neutral-500">
          Brak zaplanowanych wydarzeń. Dodaj pierwsze przyciskiem „+ Nowe wydarzenie”.
        </p>
      ) : (
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{current.map(card)}</div>
      )}

      {past.length > 0 && (
        <>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">Zakończone · {past.length}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{past.map(card)}</div>
        </>
      )}

      {editing && (
        <EventEditor
          event={editing === "new" ? null : editing}
          now={now}
          onClose={() => setEditing(null)}
          onSaved={saved}
          onDelete={editing === "new" ? undefined : () => remove(editing)}
        />
      )}
    </div>
  );
}

const DURATIONS = [2, 3, 4, 6] as const;

function EventEditor({
  event,
  now,
  onClose,
  onSaved,
  onDelete,
}: {
  event: EventDTO | null;
  now: number;
  onClose: () => void;
  onSaved: (e: EventDTO) => void;
  onDelete?: () => void;
}) {
  // New events default to tonight 20:00–00:00.
  const init = useMemo(() => {
    if (event) return { start: new Date(event.startsAt), end: new Date(event.endsAt) };
    const s = new Date(now);
    s.setHours(20, 0, 0, 0);
    if (+s < now) s.setDate(s.getDate() + 1);
    return { start: s, end: new Date(+s + 4 * 3600_000) };
  }, [event, now]);

  const [f, setF] = useState({
    title: event?.title ?? "",
    summary: event?.summary ?? "",
    description: event?.description ?? "",
    image: event?.image ?? "",
    enabled: event?.enabled ?? true,
    startDate: toDate(init.start),
    startTime: toTime(init.start),
    endDate: toDate(init.end),
    endTime: toTime(init.end),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const start = fromLocal(f.startDate, f.startTime);
  const end = fromLocal(f.endDate, f.endTime);
  const validWindow = !Number.isNaN(+start) && !Number.isNaN(+end) && end > start;
  const hours = validWindow ? (+end - +start) / 3600_000 : 0;

  // Moving the start keeps the same duration, so the end follows along.
  function setStart(date: string, time: string) {
    const prevDur = validWindow ? +end - +start : 4 * 3600_000;
    const s = fromLocal(date, time);
    if (Number.isNaN(+s)) return setF((x) => ({ ...x, startDate: date, startTime: time }));
    const e = new Date(+s + prevDur);
    setF((x) => ({ ...x, startDate: date, startTime: time, endDate: toDate(e), endTime: toTime(e) }));
  }
  function setDuration(h: number) {
    const e = new Date(+start + h * 3600_000);
    setF((x) => ({ ...x, endDate: toDate(e), endTime: toTime(e) }));
  }
  // End time alone: if it's earlier than the start, it means after midnight.
  function setEndTime(time: string) {
    let e = fromLocal(f.startDate, time);
    if (+e <= +start) e = new Date(+e + 24 * 3600_000);
    setF((x) => ({ ...x, endTime: time, endDate: toDate(e) }));
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    setError("");
    if (f.title.trim().length < 2) return setError("Podaj nazwę wydarzenia.");
    if (!validWindow) return setError("Koniec musi być później niż początek.");
    setSaving(true);
    const body = {
      title: f.title, summary: f.summary, description: f.description, image: f.image, enabled: f.enabled,
      startsAt: start.toISOString(), endsAt: end.toISOString(),
    };
    const res = await fetch(event ? `/api/admin/events/${event.id}` : "/api/admin/events", {
      method: event ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) return setError("Nie udało się zapisać. Sprawdź pola i spróbuj ponownie.");
    const e = await res.json();
    onSaved({ ...e, startsAt: new Date(e.startsAt).toISOString(), endsAt: new Date(e.endsAt).toISOString() });
  }

  const preview = validWindow ? { startsAt: start.toISOString(), endsAt: end.toISOString() } : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-6 w-full max-w-2xl rounded-3xl border border-white/10 bg-ink-900 p-5 shadow-card sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-medium text-neutral-50">{event ? "Edytuj wydarzenie" : "Nowe wydarzenie"}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neon">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Nazwa *</label>
            <input value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={140} placeholder="np. Wieczór latino z DJ-em" className="input text-sm" />
          </div>

          <div>
            <label className="label">Krótki opis (na karcie) · {f.summary.length}/300</label>
            <textarea value={f.summary} onChange={(e) => set("summary", e.target.value)} maxLength={300} rows={2} placeholder="Jedno-dwa zdania zachęty." className="input text-sm" />
          </div>

          <div>
            <label className="label">Pełny opis (po otwarciu karty)</label>
            <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={5} placeholder={"Program wieczoru, line-up, dress code…\nKażdy akapit w nowej linii."} className="input text-sm" />
          </div>

          <ImageUpload value={f.image} onChange={(url) => set("image", url)} label="Zdjęcie" />

          {/* Time window */}
          <div className="rounded-2xl border border-white/10 bg-ink-800/40 p-4">
            <p className="label">Czas trwania</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="mb-1 block text-xs text-neutral-400">Początek</span>
                <div className="flex gap-2">
                  <input type="date" value={f.startDate} onChange={(e) => setStart(e.target.value, f.startTime)} className="input text-sm" />
                  <input type="time" value={f.startTime} onChange={(e) => setStart(f.startDate, e.target.value)} className="input w-28 text-sm" />
                </div>
              </div>
              <div>
                <span className="mb-1 block text-xs text-neutral-400">Koniec</span>
                <div className="flex gap-2">
                  <input type="date" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} className="input text-sm" />
                  <input type="time" value={f.endTime} onChange={(e) => setEndTime(e.target.value)} className="input w-28 text-sm" />
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-neutral-500">Szybko:</span>
              {DURATIONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setDuration(h)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition",
                    Math.abs(hours - h) < 0.01 ? "border-ember bg-ember/15 text-ember" : "border-white/15 text-neutral-300 hover:border-white/30"
                  )}
                >
                  {h} h
                </button>
              ))}
              <button type="button" onClick={() => setEndTime("02:00")} className="rounded-full border border-white/15 px-3 py-1 text-xs text-neutral-300 hover:border-white/30">
                do 02:00
              </button>
            </div>
            <p className={cn("mt-3 text-xs", validWindow ? "text-neutral-400" : "text-neon")}>
              {preview
                ? <>{formatEventRange(preview.startsAt, preview.endsAt, "pl")} · {hours % 1 ? hours.toFixed(1) : hours} h · <span className="text-neutral-300">{STATUS_LABEL[eventStatus(preview, now)]}</span>, {relative(preview, now)}</>
                : "Koniec musi być później niż początek."}
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" checked={f.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-4 w-4 accent-[#ff2d3a]" />
            Widoczne na stronie
          </label>

          {error && <p className="rounded-xl border border-neon/40 bg-neon/10 px-3 py-2 text-sm text-neon">{error}</p>}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {onDelete ? <button onClick={onDelete} className="text-sm text-neutral-500 hover:text-neon">Usuń wydarzenie</button> : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost text-sm">Anuluj</button>
            <button onClick={save} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? "Zapisywanie…" : event ? "Zapisz" : "Dodaj"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
