"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { useLang } from "@/components/LangProvider";
import { cn } from "@/lib/utils";
import {
  readConsent, saveConsent, ALLOW_ALL, DENY_ALL,
  CONSENT_EVENT, OPEN_SETTINGS_EVENT, type Consent, type ConsentCategory,
} from "@/lib/consent";

/** Current consent (null = not decided yet). Re-renders when it changes. */
export function useConsent(): Consent | null {
  const [c, setC] = useState<Consent | null>(null);
  useEffect(() => {
    setC(readConsent());
    const on = (e: Event) => setC((e as CustomEvent<Consent>).detail);
    window.addEventListener(CONSENT_EVENT, on);
    return () => window.removeEventListener(CONSENT_EVENT, on);
  }, []);
  return c;
}

export const allowed = (c: Consent | null, cat: ConsentCategory) => cat === "necessary" || !!c?.[cat];

type Choice = { analytics: boolean; external: boolean; marketing: boolean };
const OPTIONAL: { key: keyof Choice; label: string; desc: string; disabled?: boolean }[] = [
  { key: "analytics", label: "cookie.analytics", desc: "cookie.analyticsDesc" },
  { key: "external", label: "cookie.external", desc: "cookie.externalDesc" },
  { key: "marketing", label: "cookie.marketing", desc: "cookie.marketingDesc", disabled: true },
];

/** First-visit banner + settings window + consent-gated tools. Mounted once in the layout. */
export function CookieConsent() {
  const { t } = useLang();
  const pathname = usePathname();
  const consent = useConsent();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Choice>({ analytics: false, external: false, marketing: false });

  useEffect(() => {
    setReady(true);
    const onOpen = () => {
      const c = readConsent();
      setDraft({ analytics: !!c?.analytics, external: !!c?.external, marketing: !!c?.marketing });
      setOpen(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const decide = (choice: Choice) => { saveConsent(choice); setOpen(false); };
  const isAdmin = pathname.startsWith("/admin");
  const showBanner = ready && !consent && !open && !isAdmin;

  return (
    <>
      {/* Tools that need consent load only after it is given. */}
      {allowed(consent, "analytics") && <Analytics />}

      {showBanner && (
        <div role="dialog" aria-live="polite" aria-label={t("cookie.title")} className="fixed inset-x-0 bottom-0 z-[60] p-4">
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-ink-900/95 p-5 shadow-card backdrop-blur-xl sm:p-6">
            <p className="text-sm font-semibold text-neutral-50">{t("cookie.title")}</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              {t("cookie.text")}{" "}
              <Link href="/polityka-prywatnosci#cookies" className="text-ember underline-offset-2 hover:underline">
                {t("footer.privacy")}
              </Link>
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* Accept and reject carry equal weight, as RODO guidance expects. */}
              <button onClick={() => decide(ALLOW_ALL)} className="btn-primary text-sm">{t("cookie.acceptAll")}</button>
              <button onClick={() => decide(DENY_ALL)} className="btn-ghost text-sm">{t("cookie.rejectAll")}</button>
              <button
                onClick={() => { setDraft({ analytics: false, external: false, marketing: false }); setOpen(true); }}
                className="text-sm text-neutral-400 underline-offset-2 hover:text-neutral-200 hover:underline sm:ml-auto"
              >
                {t("cookie.settings")}
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("footer.cookies")}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-ink-900 p-5 shadow-card sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-neutral-50">{t("footer.cookies")}</h2>
              <button onClick={() => setOpen(false)} aria-label="Zamknij" className="text-neutral-400 hover:text-neon">✕</button>
            </div>

            <ul className="mt-4 space-y-3">
              <li className="rounded-2xl border border-white/10 bg-ink-800/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-neutral-100">{t("cookie.necessary")}</span>
                  <span className="text-xs text-emerald-300">{t("cookie.alwaysOn")}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">{t("cookie.necessaryDesc")}</p>
              </li>
              {OPTIONAL.map((o) => (
                <li key={o.key} className={cn("rounded-2xl border border-white/10 bg-ink-800/40 p-4", o.disabled && "opacity-60")}>
                  <label className={cn("flex items-center justify-between gap-3", !o.disabled && "cursor-pointer")}>
                    <span className="text-sm font-medium text-neutral-100">{t(o.label)}</span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={draft[o.key]}
                      disabled={o.disabled}
                      onChange={(e) => setDraft((d) => ({ ...d, [o.key]: e.target.checked }))}
                      className="h-5 w-5 accent-[#ff2d3a]"
                    />
                  </label>
                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">{t(o.desc)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button onClick={() => decide(draft)} className="btn-primary text-sm sm:flex-1">{t("cookie.save")}</button>
              <button onClick={() => decide(ALLOW_ALL)} className="btn-ghost text-sm sm:flex-1">{t("cookie.acceptAll")}</button>
              <button onClick={() => decide(DENY_ALL)} className="btn-ghost text-sm sm:flex-1">{t("cookie.rejectAll")}</button>
            </div>
            <p className="mt-4 text-center text-xs text-neutral-500">
              <Link href="/polityka-prywatnosci#cookies" onClick={() => setOpen(false)} className="hover:text-ember">
                {t("footer.privacy")}
              </Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
