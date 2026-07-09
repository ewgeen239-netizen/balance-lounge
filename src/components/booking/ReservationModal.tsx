"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookingForm } from "./BookingForm";
import { useLang } from "@/components/LangProvider";
import type { HoursRow } from "@/lib/utils";

type Ctx = { open: () => void; close: () => void };
const ReservationCtx = createContext<Ctx | null>(null);

export function ReservationProvider({
  hours,
  loggedIn,
  children,
}: {
  hours: HoursRow[];
  loggedIn: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLang();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    if (isOpen) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  return (
    <ReservationCtx.Provider value={{ open, close }}>
      {children}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-ink-950/95 p-4 sm:p-8"
            onClick={close}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative my-4 w-full max-w-2xl transform-gpu will-change-transform"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="wordmark text-2xl text-neutral-50 text-glow-ember">{t("book.title")}</h2>
                <button
                  onClick={close}
                  aria-label="Close"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-neutral-300 transition hover:border-neon hover:text-neon"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <BookingForm hours={hours} loggedIn={loggedIn} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ReservationCtx.Provider>
  );
}

export function useReservation(): Ctx {
  const ctx = useContext(ReservationCtx);
  if (!ctx) throw new Error("useReservation must be used within ReservationProvider");
  return ctx;
}
