"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PROMO_PRESETS, type PushTopic } from "@/lib/pushTopics";

type Log = { id: number; topic: string; source: string; title: string; body: string; sent: number; failed: number; createdAt: string };
type Overview = {
  configured: boolean;
  total: number;
  topics: Record<PushTopic, number>;
  pending: Partial<Record<"event" | "item" | "price" | "category", number>>;
  logs: Log[];
  config: { autoPromo: boolean; promoDays: number[]; lastPromoAt: string | null };
};

const TOPIC_LABEL: Record<PushTopic, string> = { promo: "Zaproszenia i oferty", events: "Wydarzenia", menu: "Menu i ceny" };
const PENDING_LABEL: Record<string, string> = { event: "wydarzenia", item: "nowe pozycje", price: "zmiany cen", category: "nowe kategorie" };
const SOURCE_LABEL: Record<string, string> = { auto: "automatycznie", manual: "ręcznie", schedule: "harmonogram" };
const LINKS = [
  { url: "/", label: "Strona główna" },
  { url: "/menu", label: "Menu" },
  { url: "/wydarzenia", label: "Wydarzenia" },
  { url: "/booking", label: "Rezerwacja" },
] as const;
const DAYS = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("pl", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export function PushAdminPanel() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<PushTopic>("promo");
  const [preset, setPreset] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState<string>("/");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/push", { cache: "no-store" });
    if (!res.ok) { setError("Nie udało się wczytać danych powiadomień (czy baza ma już nowe tabele?)."); return; }
    setError(null);
    setData(await res.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  function pickPreset(i: number) {
    setPreset(i);
    setTopic("promo");
    setTitle(PROMO_PRESETS[i].title.pl);
    setBody(PROMO_PRESETS[i].body.pl);
  }

  const audience = data ? data.topics[topic] : 0;
  // Unedited preset → send the hand-written translations; edited → own Polish text.
  const presetUntouched = preset !== null && title === PROMO_PRESETS[preset].title.pl && body === PROMO_PRESETS[preset].body.pl;

  async function send() {
    if (!confirm(`Wysłać powiadomienie do ${audience} ${audience === 1 ? "osoby" : "osób"}?`)) return;
    setBusy(true);
    setFlash(null);
    const payload = presetUntouched ? { preset, url } : { topic, title, body, url };
    const res = await fetch("/api/admin/push/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setFlash(`Wysłano: ${json.sent}${json.failed ? `, nie doszło: ${json.failed}` : ""}.`);
      setPreset(null); setTitle(""); setBody("");
      load();
    } else {
      setFlash(json.error === "not_configured" ? "Brak kluczy VAPID na serwerze — powiadomienia są wyłączone." : "Nie udało się wysłać.");
    }
  }

  async function flushNow() {
    setBusy(true);
    const res = await fetch("/api/admin/push", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    setFlash(res.ok ? `Wysłano zmiany (${json.sent ?? 0} powiadomień).` : "Nie udało się wysłać.");
    load();
  }

  async function saveConfig(patch: Partial<Overview["config"]>) {
    if (!data) return;
    setData({ ...data, config: { ...data.config, ...patch } });
    await fetch("/api/admin/push", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
  }

  if (error) return <p className="rounded-2xl border border-neon/30 bg-neon/10 p-4 text-sm text-neon">{error}</p>;
  if (!data) return <p className="text-sm text-neutral-500">Ładowanie…</p>;

  const pendingEntries = Object.entries(data.pending).filter(([, n]) => n);

  return (
    <div className="space-y-8">
      {!data.configured && (
        <p className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
          Brak kluczy VAPID (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY) — goście nie mogą włączyć powiadomień. Zobacz DEPLOY.md.
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Urządzenia" value={data.total} />
        {(Object.keys(TOPIC_LABEL) as PushTopic[]).map((tp) => <Stat key={tp} label={TOPIC_LABEL[tp]} value={data.topics[tp]} />)}
      </section>

      <section className="rounded-3xl border border-white/10 bg-ink-900/60 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">Zmiany w kolejce</h3>
        <p className="mt-2 text-sm text-neutral-400">
          Nowe wydarzenia, pozycje, kategorie i zmiany cen wysyłają się same — 10 minut po Twojej ostatniej zmianie, jako jedno powiadomienie.
        </p>
        {pendingEntries.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {pendingEntries.map(([k, n]) => (
              <span key={k} className="rounded-full bg-ember/10 px-3 py-1 text-xs text-ember">{PENDING_LABEL[k] ?? k}: {n}</span>
            ))}
            <button onClick={flushNow} disabled={busy} className="btn-ghost ml-auto px-4 py-2 text-xs disabled:opacity-50">Wyślij teraz</button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-neutral-500">Brak oczekujących zmian.</p>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-ink-900/60 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">Nowe powiadomienie</h3>

        <p className="label mt-4">Gotowe zaproszenia</p>
        <div className="flex flex-wrap gap-2">
          {PROMO_PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => pickPreset(i)}
              className={cn("rounded-full border px-3 py-1.5 text-xs transition", preset === i ? "border-ember bg-ember/10 text-ember" : "border-white/10 text-neutral-300 hover:border-white/25")}
            >
              {p.title.pl}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Do kogo</label>
            <select value={topic} onChange={(e) => setTopic(e.target.value as PushTopic)} className="input">
              {(Object.keys(TOPIC_LABEL) as PushTopic[]).map((tp) => (
                <option key={tp} value={tp}>{TOPIC_LABEL[tp]} ({data.topics[tp]})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Po kliknięciu otwórz</label>
            <select value={url} onChange={(e) => setUrl(e.target.value)} className="input">
              {LINKS.map((l) => <option key={l.url} value={l.url}>{l.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Tytuł ({title.length}/80)</label>
            <input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="np. Dziś DJ od 21:00" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Treść ({body.length}/200)</label>
            <textarea value={body} maxLength={200} onChange={(e) => setBody(e.target.value)} rows={3} className="input" placeholder="Krótko i konkretnie — na ekranie blokady widać ok. 2 linijki." />
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">
          {presetUntouched
            ? "Gotowe zaproszenie pójdzie w języku gościa (PL/RU/EN/UA ręcznie, pozostałe automatycznie)."
            : "Piszesz po polsku — gościom w innych językach tekst przetłumaczy się automatycznie."}{" "}
          Zaproszenia trafiają tylko do osób, które zgodziły się na „Zaproszenia i oferty”. Nie wysyłaj ich częściej niż 2 razy w tygodniu — tak obiecuje polityka prywatności.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={send} disabled={busy || title.trim().length < 2 || body.trim().length < 2 || audience === 0} className="btn-primary disabled:opacity-40">
            Wyślij do {audience}
          </button>
          {flash && <span role="status" className="text-sm text-ember">{flash}</span>}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-ink-900/60 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">Automatyczne zaproszenia</h3>
            <p className="mt-1 text-sm text-neutral-400">W wybrane dni ok. 17:00 (latem; zimą 16:00) — co tydzień inny tekst z gotowych zaproszeń.</p>
          </div>
          <button
            role="switch"
            aria-checked={data.config.autoPromo}
            onClick={() => saveConfig({ autoPromo: !data.config.autoPromo })}
            className={cn("relative h-7 w-12 shrink-0 rounded-full transition", data.config.autoPromo ? "bg-neon" : "bg-white/15")}
          >
            <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition-all", data.config.autoPromo ? "left-6" : "left-1")} />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {DAYS.map((d, i) => {
            const on = data.config.promoDays.includes(i);
            return (
              <button
                key={i}
                onClick={() => saveConfig({ promoDays: on ? data.config.promoDays.filter((x) => x !== i) : [...data.config.promoDays, i].sort() })}
                className={cn("h-10 w-12 rounded-xl border text-sm transition", on ? "border-ember bg-ember/10 text-ember" : "border-white/10 text-neutral-400")}
              >
                {d}
              </button>
            );
          })}
        </div>
        {data.config.lastPromoAt && <p className="mt-3 text-xs text-neutral-500">Ostatnio: {fmtDate(data.config.lastPromoAt)}</p>}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-neutral-400">Wysłane</h3>
        {data.logs.length === 0 ? (
          <p className="text-sm text-neutral-500">Jeszcze nic nie wysłano.</p>
        ) : (
          <ul className="space-y-2">
            {data.logs.map((l) => (
              <li key={l.id} className="rounded-2xl border border-white/10 bg-ink-900/40 p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                  <span>{fmtDate(l.createdAt)}</span>
                  <span>{TOPIC_LABEL[l.topic as PushTopic] ?? l.topic}</span>
                  <span>{SOURCE_LABEL[l.source] ?? l.source}</span>
                  <span className="ml-auto text-emerald-300">✓ {l.sent}</span>
                  {l.failed > 0 && <span className="text-neon">✕ {l.failed}</span>}
                </div>
                <p className="mt-1.5 text-sm font-medium text-neutral-100">{l.title}</p>
                <p className="text-sm text-neutral-400">{l.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-4">
      <p className="text-2xl font-light text-neutral-50">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{label}</p>
    </div>
  );
}
