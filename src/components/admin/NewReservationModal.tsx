"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminReservation } from "./types";
import { cn, todayStr } from "@/lib/utils";
import { INDOOR_TABLES, TERRACE_TABLES, TERRACE_LABEL, LARGE_GROUP } from "@/lib/tables";

/** Staff-entered booking (phone or walk-in): any time, optional table, and a
 *  status chosen up front. Confirmed bookings notify the guest like the panel. */
export function NewReservationModal({
  existing,
  onClose,
  onCreated,
}: {
  existing: AdminReservation[];
  onClose: () => void;
  onCreated: (r: AdminReservation) => void;
}) {
  const [form, setForm] = useState({
    date: todayStr(),
    time: "20:00",
    guests: 2,
    name: "",
    phone: "",
    email: "",
    comment: "",
    tableNo: null as number | null,
    status: "confirmed",
    notifyGuest: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Tables already held that day, so staff don't double-book by accident.
  const taken = useMemo(() => {
    const m = new Map<number, AdminReservation>();
    for (const r of existing) {
      if (r.date === form.date && r.tableNo && (r.status === "confirmed" || r.status === "seated")) m.set(r.tableNo, r);
    }
    return m;
  }, [existing, form.date]);

  async function save() {
    setError("");
    if (form.name.trim().length < 2) { setError("Podaj imię gościa."); return; }
    setSaving(true);
    const res = await fetch("/api/admin/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) onCreated(await res.json());
    else setError((await res.json().catch(() => ({}))).error ?? "Nie udało się zapisać.");
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const bigGroup = form.guests >= LARGE_GROUP;
  const tableBtn = (t: { no: number; seats: number; outdoor?: boolean }) => {
    const busy = taken.get(t.no);
    const picked = form.tableNo === t.no;
    const fits = t.seats >= form.guests || (t.outdoor && bigGroup);
    return (
      <button
        key={t.no}
        type="button"
        onClick={() => set("tableNo", picked ? null : t.no)}
        title={busy ? `Zajęty: ${busy.time} ${busy.name}` : `${t.seats} miejsc`}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 rounded-xl border py-2 transition",
          picked && "border-neon bg-neon/20 text-neon",
          !picked && busy && "border-neon/30 bg-neon/5 text-neutral-500",
          !picked && !busy && fits && "border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/60",
          !picked && !busy && !fits && "border-white/10 text-neutral-300 hover:border-white/30"
        )}
      >
        <span className="text-sm font-semibold">{t.no}</span>
        <span className="text-[10px] text-neutral-500">{t.seats} miejsc</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-8 w-full max-w-xl rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="wordmark text-xl text-neutral-50">Nowa rezerwacja</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neon">✕</button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Data</label>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="input text-sm" />
            </div>
            <div>
              <label className="label">Godzina</label>
              <input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} className="input text-sm" />
            </div>
            <div>
              <label className="label">Goście</label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={60}
                value={form.guests}
                onChange={(e) => set("guests", Math.max(1, Number(e.target.value) || 1))}
                className="input text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Imię *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jan" className="input text-sm" />
            </div>
            <div>
              <label className="label">Telefon</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="500100200" className="input text-sm" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">E-mail (opcjonalnie)</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="input text-sm" />
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="input text-sm">
                <option value="confirmed">Potwierdzona</option>
                <option value="pending">Oczekuje</option>
                <option value="seated">Gość przy stole</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Komentarz</label>
            <input value={form.comment} onChange={(e) => set("comment", e.target.value)} placeholder="Urodziny, alergie…" className="input text-sm" />
          </div>

          <div>
            <label className="label">Stół {form.tableNo ? `· wybrany nr ${form.tableNo}` : "(opcjonalnie)"}</label>
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">{INDOOR_TABLES.map(tableBtn)}</div>
            <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-ember/80">{TERRACE_LABEL}</div>
            <div className="mt-1 grid grid-cols-6 gap-1.5 sm:grid-cols-8">{TERRACE_TABLES.map(tableBtn)}</div>
          </div>

          {form.status === "confirmed" && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
              <input type="checkbox" checked={form.notifyGuest} onChange={(e) => set("notifyGuest", e.target.checked)} className="h-4 w-4 accent-[#ff2d3a]" />
              Wyślij potwierdzenie gościowi (SMS / e-mail)
            </label>
          )}

          {error && <p className="rounded-xl border border-neon/40 bg-neon/10 px-3 py-2 text-sm text-neon">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost text-sm">Anuluj</button>
          <button onClick={save} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
            {saving ? "Zapisywanie…" : "Dodaj rezerwację"}
          </button>
        </div>
      </div>
    </div>
  );
}
