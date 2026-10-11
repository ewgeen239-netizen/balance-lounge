"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLang } from "@/components/LangProvider";
import { cn } from "@/lib/utils";

export type NudgeState = "ask" | "blocked" | null;

/**
 * Reminder pinned to the bottom of the installed app until notifications are
 * allowed. "ask": the button triggers the system prompt; "blocked": the phone
 * refused them, so the button explains how to switch them on in Settings.
 */
export function PushNudge({ state, onEnable, onHowTo }: { state: NudgeState; onEnable: () => void; onHowTo: () => void }) {
  const { t } = useLang();
  const reduce = useReducedMotion();
  const blocked = state === "blocked";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom))] z-[54] flex justify-center px-3">
      <AnimatePresence>
        {state && (
          <motion.div
            role="alert"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 30, transition: { duration: 0.2 } }}
            transition={{ type: "spring", damping: 24, stiffness: 260, delay: reduce ? 0 : 0.6 }}
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-ember/30 bg-ink-900/95 p-2.5 pl-3 shadow-card backdrop-blur-xl"
          >
            <span className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", blocked ? "bg-neon/15 text-neon" : "bg-ember/15 text-ember")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10.3 20a1.94 1.94 0 0 0 3.4 0" />
                {blocked && <path d="M3 3l18 18" />}
              </svg>
              {!blocked && !reduce && (
                <motion.span
                  aria-hidden
                  className="absolute right-1 top-1 h-2 w-2 rounded-full bg-neon"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold leading-snug text-neutral-50">{t("push.nudgeTitle")}</span>
              <span className="block text-[11.5px] leading-snug text-neutral-400">{t(blocked ? "push.nudgeDenied" : "push.nudgeText")}</span>
            </span>
            <button
              onClick={blocked ? onHowTo : onEnable}
              className={cn("shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold", blocked ? "border border-white/15 text-neutral-200" : "btn-primary px-4 py-2")}
            >
              {t(blocked ? "push.howTo" : "push.enable")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
