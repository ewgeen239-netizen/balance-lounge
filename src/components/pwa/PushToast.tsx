"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLang } from "@/components/LangProvider";

const SHOW_MS = 5500;

type ToastProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
  icon?: React.ReactNode;
};

const Bell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10.3 20a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

/** "Notifications are on" message that slides up and disappears by itself. */
export function PushToast({ open, onClose, onChange }: { open: boolean; onClose: () => void; onChange: () => void }) {
  const { t } = useLang();
  return <Toast open={open} onClose={onClose} title={t("push.onTitle")} text={t("push.onText")} actionLabel={t("push.change")} onAction={onChange} />;
}

/** Short message at the bottom of the screen that hides itself after a few seconds. */
export function Toast({ open, onClose, title, text, actionLabel, onAction, icon }: ToastProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(onClose, SHOW_MS);
    return () => window.clearTimeout(id);
  }, [open, onClose]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(16px,env(safe-area-inset-bottom))] z-[95] flex justify-center px-4">
      <AnimatePresence>
        {open && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, transition: { duration: 0.25 } }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="pointer-events-auto relative flex w-full max-w-sm items-center gap-2.5 overflow-hidden rounded-3xl border border-ember/25 bg-ink-900/95 p-3 shadow-card backdrop-blur-xl"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neon/25 to-ember/20 text-ember">
              {icon ?? <Bell />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold leading-snug text-neutral-50">{title}</span>
              <span className="block text-xs leading-snug text-neutral-400">{text}</span>
            </span>
            <button
              onClick={() => { onClose(); onAction(); }}
              className="shrink-0 rounded-full border border-ember/30 px-2.5 py-1.5 text-xs font-medium text-ember transition hover:bg-white/5"
            >
              {actionLabel}
            </button>
            {/* Time left before it hides itself. */}
            {!reduce && (
              <motion.span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gradient-to-r from-neon to-ember"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: SHOW_MS / 1000, ease: "linear" }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
