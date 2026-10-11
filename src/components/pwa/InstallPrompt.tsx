"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLang } from "@/components/LangProvider";
import { fill } from "@/lib/i18n";
import { INSTALL_BONUS, LOYALTY_LIVE } from "@/content/rewards";

// iPhone outline (Dynamic Island, side buttons) with a "+" — vector, transparent background.
const IPhonePlus = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
    <rect x="6.25" y="1.75" width="11.5" height="20.5" rx="3.2" />
    <rect x="10.2" y="3.55" width="3.6" height="1.25" rx="0.62" fill="currentColor" stroke="none" />
    <path d="M18.6 7.2v3.1M5.4 6.4v1.3M5.4 8.9v2.2" strokeWidth="1.2" />
    <path d="M12 10.2v5.2M9.4 12.8h5.2" />
  </svg>
);

/**
 * "Add BALANCE to your home screen" — a card in the bottom-right corner that
 * glides in on the home page. Tapping it opens the instructions; the arrow on
 * its right edge folds it into a small round button that opens them directly.
 */
export function InstallPrompt({
  collapsed,
  onCollapse,
  onOpen,
}: {
  collapsed: boolean;
  onCollapse: () => void;
  onOpen: () => void;
}) {
  const { t } = useLang();
  const reduce = useReducedMotion();
  const spring = { type: "spring" as const, damping: 22, stiffness: 240 };

  return (
    <div className="pointer-events-none fixed bottom-[max(16px,env(safe-area-inset-bottom))] right-4 z-[55] flex justify-end sm:right-6">
      <AnimatePresence mode="popLayout" initial>
        {collapsed ? (
          <motion.button
            key="bubble"
            layoutId={reduce ? undefined : "pwa-install"}
            onClick={onOpen}
            aria-label={t("install.reopen")}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={spring}
            whileTap={{ scale: 0.92 }}
            className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full border border-ember/40 bg-ink-900/90 text-ember shadow-card backdrop-blur-xl"
          >
            {/* Slow halo so the folded button still reads as "something to do here". */}
            {!reduce && (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full border border-ember/50"
                animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", repeatDelay: 1.2 }}
              />
            )}
            <IPhonePlus />
          </motion.button>
        ) : (
          <motion.div
            key="card"
            layoutId={reduce ? undefined : "pwa-install"}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 80, y: 24, scale: 0.92, rotate: 2 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
            transition={{ ...spring, delay: reduce ? 0 : 0.9 }}
            className="pointer-events-auto relative w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-3xl border border-ember/25 bg-ink-900/90 shadow-card backdrop-blur-xl"
          >
            {/* Warm glow sweeping across once the card lands. */}
            {!reduce && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-ember/15 to-transparent"
                initial={{ x: 0 }}
                animate={{ x: "420%" }}
                transition={{ delay: 1.5, duration: 1.4, ease: "easeInOut" }}
              />
            )}
            <div className="flex items-stretch">
              <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-3.5 pr-1 text-left">
                <span className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon-192.png" alt="" className="h-12 w-12 rounded-2xl border border-ember/30" />
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-neon to-ember-deep text-[13px] font-bold leading-none text-white shadow-glow">
                    +
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-snug text-neutral-50">{t("install.title")}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-neutral-400">{LOYALTY_LIVE ? fill(t("install.sub"), { n: INSTALL_BONUS }) : t("install.subPlain")}</span>
                </span>
              </button>
              <button
                onClick={onCollapse}
                aria-label={t("install.collapse")}
                className="flex w-11 shrink-0 items-center justify-center border-l border-white/5 text-neutral-400 transition hover:bg-white/5 hover:text-ember"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
