"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLang } from "@/components/LangProvider";
import { fill } from "@/lib/i18n";
import { INSTALL_BONUS, LOYALTY_LIVE } from "@/content/rewards";
import { isStandalone, openInstallGuide } from "@/lib/pushClient";
import { cn } from "@/lib/utils";

const Gift = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v9H5v-9" />
    <path d="M7.5 8a2.5 2.5 0 1 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 1 1 0 5" />
  </svg>
);

/** "Install the app — get 35 points": a line that opens with its arrow. */
export function InstallBonus({ received, loggedIn }: { received: boolean; loggedIn: boolean }) {
  const { t } = useLang();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [standalone, setStandalone] = useState(false);
  useEffect(() => setStandalone(isStandalone()), []);

  if (received) {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
        <Gift /> {fill(t("loy.bonusDone"), { n: INSTALL_BONUS })}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ember/30 bg-gradient-to-r from-ember/10 via-ink-900/60 to-ink-900/60">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember/15 text-ember"><Gift /></span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-neutral-50">
          {fill(t("loy.bonusTitle"), { n: INSTALL_BONUS })}
          {!LOYALTY_LIVE && (
            <span className="ml-2 inline-block rounded-full border border-ember/40 bg-ember/10 px-2 py-px align-middle text-[10px] font-semibold uppercase tracking-[0.18em] text-ember">
              {t("loy.soon")}
            </span>
          )}
        </span>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
          className={cn("shrink-0 text-ember transition-transform duration-300", open && "rotate-180")}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-4 pb-4 pl-16 text-sm leading-relaxed text-neutral-300">
              <p>{fill(t(!LOYALTY_LIVE ? "loy.soonText" : standalone && !loggedIn ? "loy.bonusLogin" : "loy.bonusText"), { n: INSTALL_BONUS })}</p>
              {!standalone && (
                <button onClick={openInstallGuide} className="btn-ghost mt-3 px-4 py-2 text-xs">{t("install.reopen")}</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
