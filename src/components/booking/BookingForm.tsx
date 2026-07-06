"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/components/LangProvider";
import { slotsForDate, todayStr, type HoursRow } from "@/lib/utils";

export function BookingForm({ hours, loggedIn }: { hours: HoursRow[]; loggedIn: boolean }) {
  const { t } = useLang();
  const [form, setForm] = useState({
    date: todayStr(),
    time: "",
    guests: 2,
    name: "",
    phone: "",
    zone: "",
    comment: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);

  const slots = useMemo(() => slotsForDate(hours, form.date), [hours, form.date]);
  const closed = form.date && slots.length === 0;

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setStatus("done");
      if (!loggedIn) setShowAccountPrompt(true);
    } else {
      const j = await res.json().catch(() => ({}));
      setErrorMsg(j.error || "error");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass mx-auto max-w-xl rounded-3xl p-10 text-center shadow-glow"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neon/15 text-neon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="wordmark text-2xl text-neutral-50">{t("book.success")}</h2>
        <p className="mt-3 text-neutral-400">{t("book.successText")}</p>

        <div className="mt-8 space-y-2 rounded-2xl border border-white/10 bg-ink-800/60 p-6 text-left text-sm">
          <Row label={t("book.date")} value={`${form.date} — ${form.time}`} />
          <Row label={t("book.guests")} value={String(form.guests)} />
          <Row label={t("book.name")} value={form.name} />
          <Row label={t("book.phone")} value={form.phone} />
          {form.zone && <Row label={t("book.zone")} value={form.zone} />}
          {form.comment && <Row label={t("book.comment")} value={form.comment} />}
        </div>

        <AnimatePresence>
          {showAccountPrompt && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 overflow-hidden rounded-2xl border border-ember/30 bg-ember/5 p-5"
            >
              <p className="text-neutral-200">{t("book.saveAccount")}</p>
              <div className="mt-4 flex justify-center gap-3">
                <Link href="/account" className="btn-primary">{t("book.createAccount")}</Link>
                <button onClick={() => setShowAccountPrompt(false)} className="btn-ghost">{t("book.dismiss")}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => { setStatus("idle"); setForm((f) => ({ ...f, time: "", comment: "" })); }} className="btn-ghost mt-6">
          {t("cta.bookTable")}
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="glass mx-auto max-w-2xl rounded-3xl p-8 sm:p-10">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="label">{t("book.date")}</label>
          <input
            type="date"
            min={todayStr()}
            value={form.date}
            onChange={(e) => { set("date", e.target.value); set("time", ""); }}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">{t("book.time")}</label>
          <select value={form.time} onChange={(e) => set("time", e.target.value)} className="input" required disabled={!!closed}>
            <option value="">{closed ? t("book.closed") : "—"}</option>
            {slots.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t("book.guests")}</label>
          <input type="number" min={1} max={30} value={form.guests} onChange={(e) => set("guests", Number(e.target.value))} className="input" required />
        </div>
        <div>
          <label className="label">{t("book.zone")}</label>
          <select value={form.zone} onChange={(e) => set("zone", e.target.value)} className="input">
            <option value="">{t("book.zoneAny")}</option>
            <option value={t("book.zoneHall")}>{t("book.zoneHall")}</option>
            <option value={t("book.zoneLounge")}>{t("book.zoneLounge")}</option>
            <option value={t("book.zoneBar")}>{t("book.zoneBar")}</option>
          </select>
        </div>
        <div>
          <label className="label">{t("book.name")}</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" required minLength={2} />
        </div>
        <div>
          <label className="label">{t("book.phone")}</label>
          <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input" required minLength={6} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">{t("book.comment")}</label>
          <textarea value={form.comment} onChange={(e) => set("comment", e.target.value)} className="input min-h-[90px]" rows={3} />
        </div>
      </div>

      {status === "error" && (
        <p className="mt-4 rounded-xl border border-neon/40 bg-neon/10 px-4 py-3 text-sm text-neon">
          {errorMsg === "closed_day" ? t("book.closed") : t("common.error")}
        </p>
      )}

      <button type="submit" disabled={status === "loading" || !!closed} className="btn-primary mt-8 w-full disabled:opacity-50">
        {status === "loading" ? t("common.loading") : t("book.submit")}
      </button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-200">{value}</span>
    </div>
  );
}
