"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "framer-motion";

/**
 * Panel that slides up from the bottom and covers only part of the screen.
 * Closes on the backdrop, Escape, the ✕ or a downward swipe on the handle
 * (only the handle drags, so the content can still scroll).
 */
export function BottomSheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const drag = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus({ preventScroll: true });
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="sheet"
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          onClick={onClose}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%", transition: { duration: 0.22, ease: "easeIn" } }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            drag={reduce ? false : "y"}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 90 || info.velocity.y > 600) onClose(); }}
            className="relative flex max-h-[78vh] w-full max-w-lg flex-col rounded-t-[28px] border border-b-0 border-white/10 bg-ink-900 shadow-card outline-none sm:mb-4 sm:rounded-[28px] sm:border-b"
          >
            {/* Drag handle */}
            <div
              onPointerDown={(e) => drag.start(e)}
              className="flex shrink-0 cursor-grab touch-none justify-center pb-2 pt-3 active:cursor-grabbing"
            >
              <span className="h-1.5 w-10 rounded-full bg-white/20" />
            </div>
            <button
              onClick={onClose}
              aria-label="Zamknij"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition hover:bg-white/5 hover:text-neon"
            >
              ✕
            </button>
            <div className="overflow-y-auto overscroll-contain px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-2 sm:px-7">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
