"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/components/LangProvider";
import { useReservation } from "@/components/booking/ReservationModal";
import { LANG_ISO } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { eventStatus, formatEventRange, paragraphs, sortEvents, type EventDTO, type EventStatus } from "@/lib/events";

/** Re-evaluates statuses every minute, so an event flips to "live"/"past" on its own. */
export function useNow(initial: number) {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function StatusBadge({ status }: { status: EventStatus }) {
  const { t } = useLang();
  const label = status === "live" ? t("events.live") : status === "upcoming" ? t("events.soon") : t("events.ended");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md",
        status === "live" && "border-emerald-400/40 bg-emerald-500/20 text-emerald-200",
        status === "upcoming" && "border-ember/40 bg-ink-950/60 text-ember",
        status === "past" && "border-white/15 bg-ink-950/60 text-neutral-400"
      )}
    >
      {status === "live" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />}
      {label}
    </span>
  );
}

function EventCard({ event, status, onOpen }: { event: EventDTO; status: EventStatus; onOpen: () => void }) {
  const { t, tr, lang } = useLang();
  const past = status === "past";
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className={cn(
        "group flex cursor-pointer flex-col overflow-hidden rounded-3xl border bg-ink-900/60 transition",
        past ? "border-white/5 hover:border-white/15" : "border-white/10 hover:border-ember/40 hover:shadow-card"
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-800">
        {event.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image}
            alt=""
            loading="lazy"
            className={cn(
              "h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]",
              past && "brightness-[0.45] grayscale"
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-ember/30">✦</div>
        )}
        <div className="absolute left-3 top-3"><StatusBadge status={status} /></div>
      </div>
      <div className={cn("flex flex-1 flex-col p-4 sm:p-5", past && "opacity-70")}>
        <p className="text-xs font-medium uppercase tracking-wider text-ember/90">
          {formatEventRange(event.startsAt, event.endsAt, LANG_ISO[lang])}
        </p>
        <h3 className="mt-1.5 text-base font-medium text-neutral-50 sm:text-lg">{tr({ pl: event.title })}</h3>
        {event.summary && <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-neutral-400">{tr({ pl: event.summary })}</p>}
        <span className="mt-auto pt-3 text-xs text-neutral-500 transition group-hover:text-ember">{t("events.more")} →</span>
      </div>
    </motion.article>
  );
}

export function EventModal({ event, status, onClose }: { event: EventDTO; status: EventStatus; onClose: () => void }) {
  const { t, tr, lang } = useLang();
  const { open } = useReservation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0, transition: { duration: 0.18, ease: "easeIn" } }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        role="dialog"
        aria-modal="true"
        aria-label={tr({ pl: event.title })}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-ink-900 shadow-card sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[16/9] bg-ink-800">
          {event.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.image} alt="" className={cn("h-full w-full object-cover", status === "past" && "brightness-50 grayscale")} />
          )}
          <div className="absolute left-4 top-4"><StatusBadge status={status} /></div>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink-950/70 text-neutral-200 backdrop-blur hover:text-neon"
          >
            ✕
          </button>
        </div>
        <div className="p-5 sm:p-7">
          <p className="text-sm font-medium text-ember">{formatEventRange(event.startsAt, event.endsAt, LANG_ISO[lang])}</p>
          <h2 className="mt-2 text-2xl font-medium text-neutral-50">{tr({ pl: event.title })}</h2>
          {event.summary && <p className="mt-3 text-neutral-300">{tr({ pl: event.summary })}</p>}
          {event.description && (
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-400">
              {paragraphs(event.description).map((p, i) => <p key={i}>{tr({ pl: p })}</p>)}
            </div>
          )}
          {status !== "past" && (
            <button onClick={() => { onClose(); open(); }} className="btn-primary mt-6 w-full sm:w-auto">
              {t("events.book")}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** The /wydarzenia page body: current events, then past ones below. */
export function EventsView({ events, serverNow }: { events: EventDTO[]; serverNow: number }) {
  const { t } = useLang();
  const now = useNow(serverNow);
  const { current, past } = useMemo(() => sortEvents(events, now), [events, now]);
  const [openId, setOpenId] = useState<number | null>(null);
  const opened = events.find((e) => e.id === openId) ?? null;

  return (
    <div className="container-x pb-10">
      <p className="-mt-2 mb-8 max-w-2xl text-neutral-400">{t("events.subtitle")}</p>

      {current.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-ink-900/40 px-6 py-12 text-center text-neutral-400">
          <span className="mb-3 block text-3xl text-ember/50">✦</span>
          {t("events.empty")}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {current.map((e) => (
            <EventCard key={e.id} event={e} status={eventStatus(e, now)} onOpen={() => setOpenId(e.id)} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-neutral-500">{t("events.past")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((e) => (
              <EventCard key={e.id} event={e} status="past" onOpen={() => setOpenId(e.id)} />
            ))}
          </div>
        </section>
      )}

      <AnimatePresence>
        {opened && <EventModal event={opened} status={eventStatus(opened, now)} onClose={() => setOpenId(null)} />}
      </AnimatePresence>
    </div>
  );
}
