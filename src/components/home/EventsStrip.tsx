"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/components/LangProvider";
import { LANG_ISO } from "@/lib/i18n";
import { eventStatus, formatEventRange, sortEvents, type EventDTO } from "@/lib/events";
import { useNow } from "@/components/events/EventsView";

/** Low banner on the home page (same width as the map card) leading to /wydarzenia. */
export function EventsStrip({ events, serverNow }: { events: EventDTO[]; serverNow: number }) {
  const { t, tr, lang } = useLang();
  const now = useNow(serverNow);
  const next = sortEvents(events, now).current[0];
  const live = next && eventStatus(next, now) === "live";

  return (
    <section className="container-x">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-gradient-to-r from-ember/10 via-ink-900/70 to-ink-900/70 px-5 py-4 transition hover:border-ember/40 sm:px-7"
      >
        {/* The whole strip is clickable; the visible button is the explicit target. */}
        <Link href="/wydarzenia" aria-label={t("events.title")} className="absolute inset-0 rounded-3xl" />
        <div className="pointer-events-none relative min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-ember">
            <span aria-hidden>✦</span> {t("events.title")}
          </p>
          <p className="mt-1 truncate text-sm text-neutral-300">
            {next ? (
              <>
                <span className={live ? "text-emerald-300" : "text-neutral-500"}>
                  {live ? t("events.live") : t("events.next")}:
                </span>{" "}
                {tr({ pl: next.title })}
                <span className="hidden text-neutral-500 sm:inline"> · {formatEventRange(next.startsAt, next.endsAt, LANG_ISO[lang])}</span>
              </>
            ) : (
              t("events.strip")
            )}
          </p>
          {/* On phones the date gets its own line so a long title can't push it out of view. */}
          {next && (
            <p className="mt-0.5 truncate text-xs text-neutral-500 sm:hidden">
              {formatEventRange(next.startsAt, next.endsAt, LANG_ISO[lang])}
            </p>
          )}
        </div>
        {/* .btn-ghost is unlayered CSS and beats the `hidden` utility, so the wrapper does the hiding. */}
        <div className="relative hidden shrink-0 sm:block">
          <Link href="/wydarzenia" className="btn-ghost text-sm">
            {t("events.title")} →
          </Link>
        </div>
        <span aria-hidden className="pointer-events-none relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ember/40 text-ember sm:hidden">
          →
        </span>
      </motion.div>
    </section>
  );
}
