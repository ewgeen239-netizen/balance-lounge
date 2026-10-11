"use client";

import { useCallback, useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { LANG_ISO, fill } from "@/lib/i18n";
import { INSTALL_BONUS, LOYALTY_LIVE, REWARDS } from "@/content/rewards";
import type { LoyaltyDTO, CouponDTO } from "@/lib/loyalty";
import { cn } from "@/lib/utils";
import { InstallBonus } from "./InstallBonus";

export const POINTS_CHANGED = "balance:points-changed";

function status(c: CouponDTO): "active" | "used" | "expired" {
  if (c.usedAt) return "used";
  return new Date(c.expiresAt) < new Date() ? "expired" : "active";
}

export function SoonBadge() {
  const { t } = useLang();
  return (
    <span className="rounded-full border border-ember/40 bg-ember/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">
      {t("loy.soon")}
    </span>
  );
}

/** Announcement shown while the programme is not live yet (LOYALTY_LIVE = false). */
function LoyaltySoon() {
  const { t, tr } = useLang();
  return (
    <section className="mt-12">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h3 className="page-title break-words accent-underline text-xl text-neutral-50">{t("loy.title")}</h3>
        <SoonBadge />
      </div>
      <div className="glass rounded-3xl p-6">
        <p className="text-sm leading-relaxed text-neutral-300">{fill(t("loy.soonText"), { n: INSTALL_BONUS })}</p>
        <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {REWARDS.map((r) => (
            <li key={r.key} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-900/40 px-4 py-3 opacity-80">
              <span className="text-sm text-neutral-200">{tr(r.title)}</span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-ember/80">{r.cost} {t("loy.unit")}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Points balance, rewards to buy with them, the guest's coupons and history. */
export function LoyaltyPanel({ initial }: { initial: LoyaltyDTO }) {
  if (!LOYALTY_LIVE) return <LoyaltySoon />;
  return <LoyaltyLive initial={initial} />;
}

function LoyaltyLive({ initial }: { initial: LoyaltyDTO }) {
  const { t, tr, lang } = useLang();
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null); // just-bought coupon code

  const reload = useCallback(async () => {
    const res = await fetch("/api/account/loyalty", { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }, []);
  // The install bonus may land while this page is open (installed app).
  useEffect(() => {
    window.addEventListener(POINTS_CHANGED, reload);
    return () => window.removeEventListener(POINTS_CHANGED, reload);
  }, [reload]);

  const date = (iso: string) => new Intl.DateTimeFormat(LANG_ISO[lang], { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  const next = REWARDS.filter((r) => r.cost > data.points).sort((a, b) => a.cost - b.cost)[0];

  async function buy(key: string, cost: number, title: string) {
    if (!confirm(fill(t("loy.confirm"), { cost, title }))) return;
    setBusy(key);
    setNote(null);
    const res = await fetch("/api/account/loyalty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "buy", reward: key }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setNote(json.error === "not_enough_points" ? t("loy.notEnough") : t("common.error"));
      return;
    }
    setData(json);
    setFresh(json.coupon.code);
    window.setTimeout(() => document.getElementById(`coupon-${json.coupon.code}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }

  const coupons = [...data.coupons].sort((a, b) => (status(a) === "active" ? 0 : 1) - (status(b) === "active" ? 0 : 1));

  return (
    <section className="mt-12">
      <h3 className="page-title break-words accent-underline mb-6 text-xl text-neutral-50">{t("loy.title")}</h3>

      {/* Balance */}
      <div className="glass rounded-3xl p-6">
        <p className="text-xs uppercase tracking-widest text-neutral-500">{t("loy.balance")}</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-5xl font-light tabular-nums text-neutral-50">{data.points}</span>
          <span className="text-sm text-ember">{t("loy.unit")}</span>
        </p>
        {next && (
          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-ember to-neon" style={{ width: `${Math.min(100, (data.points / next.cost) * 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              {fill(t("loy.missing"), { n: next.cost - data.points })} · {tr(next.title)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <InstallBonus received={data.installBonus} loggedIn />
      </div>

      {/* Rewards */}
      <p className="mb-3 mt-8 text-sm font-semibold uppercase tracking-widest text-neutral-400">{t("loy.rewards")}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {REWARDS.map((r) => {
          const enough = data.points >= r.cost;
          return (
            <div key={r.key} className={cn("flex flex-col rounded-2xl border p-4", enough ? "border-ember/30 bg-ember/5" : "border-white/10 bg-ink-900/40")}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-neutral-50">{tr(r.title)}</p>
                <span className="shrink-0 rounded-full border border-ember/30 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-ember">
                  {r.cost} {t("loy.unit")}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-400">{tr(r.desc)}</p>
              <div className="mt-auto pt-3">
                {enough ? (
                  <button onClick={() => buy(r.key, r.cost, tr(r.title))} disabled={busy !== null} className="btn-primary px-4 py-2 text-xs disabled:opacity-50">
                    {busy === r.key ? "…" : t("loy.redeem")}
                  </button>
                ) : (
                  <span className="text-xs text-neutral-500">{fill(t("loy.missing"), { n: r.cost - data.points })}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {note && <p role="status" className="mt-3 text-sm text-neon">{note}</p>}

      {/* Coupons */}
      <p className="mb-3 mt-8 text-sm font-semibold uppercase tracking-widest text-neutral-400">{t("loy.coupons")}</p>
      {coupons.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-800/40 p-6 text-center text-sm text-neutral-500">{t("loy.noCoupons")}</p>
      ) : (
        <ul className="space-y-3">
          {coupons.map((c) => {
            const st = status(c);
            return (
              <li
                key={c.code}
                id={`coupon-${c.code}`}
                className={cn(
                  "rounded-2xl border p-4 transition",
                  st === "active" ? "border-ember/40 bg-ink-900/60" : "border-white/10 bg-ink-900/30 opacity-60",
                  fresh === c.code && "ring-2 ring-ember/60"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-neutral-50">{tr(REWARDS.find((r) => r.key === c.reward)?.title ?? { pl: c.title })}</p>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                      st === "active" && "bg-emerald-500/15 text-emerald-300",
                      st === "used" && "bg-white/10 text-neutral-400",
                      st === "expired" && "bg-neon/10 text-neon"
                    )}
                  >
                    {t(`loy.${st}`)}
                  </span>
                </div>
                {/* The code the staff types into the admin panel. */}
                <p className="mt-3 select-all rounded-xl border border-dashed border-ember/40 bg-ink-950/60 py-3 text-center font-mono text-2xl font-semibold tracking-[0.2em] text-ember">
                  {c.code}
                </p>
                <p className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-neutral-500">
                  <span>{st === "active" ? t("loy.show") : ""}</span>
                  <span>{t("loy.validUntil")} {date(c.expiresAt)}</span>
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {/* History */}
      {data.history.length > 0 && (
        <>
          <p className="mb-3 mt-8 text-sm font-semibold uppercase tracking-widest text-neutral-400">{t("loy.history")}</p>
          <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-ink-900/30 text-sm">
            {data.history.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 text-neutral-300">
                  {t(`loy.reason.${h.reason}`)}
                  {h.reason === "coupon" && h.note && <span className="text-neutral-500"> · {tr({ pl: h.note })}</span>}
                  <span className="ml-2 text-xs text-neutral-600">{date(h.createdAt)}</span>
                </span>
                <span className={cn("shrink-0 font-semibold tabular-nums", h.amount > 0 ? "text-emerald-300" : "text-neutral-400")}>
                  {h.amount > 0 ? "+" : ""}{h.amount}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
