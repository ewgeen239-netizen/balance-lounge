"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/components/LangProvider";
import { useReservation } from "@/components/booking/ReservationModal";

export function Hero({ image, neon }: { image: string; neon: string }) {
  const { t } = useLang();
  const { open } = useReservation();
  return (
    <section className="relative h-[92vh] min-h-[560px] w-full overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${image || "/hero.webp"})` }}
      />
      {/* Dark cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/50 to-ink-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(10,7,8,0.85)_100%)]" />

      {/* Neon sign in background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.2 }}
        className="absolute left-1/2 top-[26%] -translate-x-1/2 select-none"
      >
        <span className="neon animate-flicker block text-center text-lg font-semibold uppercase tracking-[0.35em] sm:text-2xl">
          {neon}
        </span>
      </motion.div>

      {/* Center content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <h1 className="wordmark text-[2.75rem] leading-none text-neutral-50 text-glow-ember sm:text-8xl">BALANCE</h1>
          <p className="wordmark-sub mt-4 text-[10px] text-ember/90 sm:text-base">COCTAILS &amp; SHISHA</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.9 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link href="/menu" className="btn-ghost min-w-[180px]">{t("cta.viewMenu")}</Link>
          <button onClick={open} className="btn-primary min-w-[180px]">{t("cta.reserve")}</button>
        </motion.div>
      </div>

      {/* scroll hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-neutral-500">
        <svg className="animate-floaty" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
