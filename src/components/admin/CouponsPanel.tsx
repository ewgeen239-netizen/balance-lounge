"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Coupon = {
  code: string;
  title: string;
  cost: number;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  usedBy: string;
  status: "active" | "used" | "expired";
  guest: string;
};

const STATUS: Record<Coupon["status"], { label: string; cls: string }> = {
  active: { label: "Aktywny", cls: "bg-emerald-500/15 text-emerald-300" },
  used: { label: "Wykorzystany", cls: "bg-white/10 text-neutral-400" },
  expired: { label: "Wygasł", cls: "bg-neon/10 text-neon" },
};

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("pl", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** Staff checks a guest's coupon code and marks it as used. */
export function CouponsPanel() {
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function check(e?: React.FormEvent) {
    e?.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/coupons?code=${encodeURIComponent(code.trim())}`, { cache: "no-store" });
    setBusy(false);
    if (!res.ok) {
      setCoupon(null);
      setMsg("Nie ma kuponu o takim kodzie.");
      return;
    }
    setCoupon(await res.json());
  }

  async function use() {
    if (!coupon) return;
    setBusy(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon.code }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (json.code) setCoupon(json);
    setMsg(res.ok ? "Kupon wykorzystany — wydaj nagrodę gościowi." : json.error === "already_used" ? "Ten kupon był już wykorzystany." : "Kupon wygasł.");
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h2 className="text-lg font-medium text-neutral-50">Kupony gości</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Gość pokazuje kod z zakładki „Punkty i kupony” w swoim koncie. Wpisz go, sprawdź nagrodę i oznacz jako wykorzystany — kupon działa tylko raz.
        </p>
      </div>

      <form onSubmit={check} className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="BAL-XXXXX"
          autoCapitalize="characters"
          autoComplete="off"
          className="input font-mono text-lg tracking-[0.15em]"
        />
        <button type="submit" disabled={busy || !code.trim()} className="btn-primary shrink-0 px-5 disabled:opacity-50">Sprawdź</button>
      </form>

      {coupon && (
        <div className={cn("rounded-3xl border p-5", coupon.status === "active" ? "border-ember/40 bg-ink-900/60" : "border-white/10 bg-ink-900/40")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xl font-semibold tracking-[0.15em] text-ember">{coupon.code}</p>
              <p className="mt-1 text-lg text-neutral-50">{coupon.title}</p>
            </div>
            <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider", STATUS[coupon.status].cls)}>
              {STATUS[coupon.status].label}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-neutral-500">Gość</dt><dd className="text-neutral-200">{coupon.guest}</dd>
            <dt className="text-neutral-500">Punkty</dt><dd className="text-neutral-200">{coupon.cost}</dd>
            <dt className="text-neutral-500">Ważny do</dt><dd className="text-neutral-200">{fmt(coupon.expiresAt)}</dd>
            {coupon.usedAt && (<><dt className="text-neutral-500">Wykorzystany</dt><dd className="text-neutral-200">{fmt(coupon.usedAt)}{coupon.usedBy ? ` · ${coupon.usedBy}` : ""}</dd></>)}
          </dl>
          {coupon.status === "active" && (
            <button onClick={use} disabled={busy} className="btn-primary mt-5 w-full disabled:opacity-50">Oznacz jako wykorzystany</button>
          )}
        </div>
      )}
      {msg && <p role="status" className="text-sm text-ember">{msg}</p>}
    </div>
  );
}
