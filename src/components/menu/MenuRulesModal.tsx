"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLang } from "@/components/LangProvider";
import { BottomSheet } from "@/components/pwa/BottomSheet";
import { CATEGORY_INTRO, type T } from "./MenuBrowser";
import { LANG_ISO } from "@/lib/i18n";
import { todayHours, type TodayHours } from "@/lib/openingHours";
import type { HoursRow } from "@/lib/utils";

// Shown every time the menu opens. Hand-written in the main languages (like the
// shisha intro it repeats); other languages auto-translate from Polish.
const shisha = CATEGORY_INTRO.shisha;
const TEXT: Record<string, T> = {
  title: { pl: "Zasady zamówienia", ru: "Правила заказа", en: "Ordering rules", de: "Bestellregeln", ua: "Правила замовлення" },
  sub: {
    pl: "Prosimy o zapoznanie się przed zamówieniem",
    ru: "Пожалуйста, ознакомьтесь перед заказом",
    en: "Please read before you order",
    de: "Bitte vor der Bestellung lesen",
    ua: "Будь ласка, ознайомтеся перед замовленням",
  },
  session: {
    pl: "Optymalny czas sesji — około 50–70 minut.",
    ru: "Оптимальное время сессии — около 50–70 минут.",
    en: "The optimal session lasts about 50–70 minutes.",
    de: "Die optimale Sessiondauer beträgt etwa 50–70 Minuten.",
    ua: "Оптимальний час сесії — близько 50–70 хвилин.",
  },
  damages: {
    pl: "Gość ponosi odpowiedzialność materialną za uszkodzenia (szkło, shisha, wyposażenie lokalu) zgodnie z wyceną lokalu.",
    ru: "Гость несёт материальную ответственность за ущерб (посуда, кальян, обстановка заведения) в соответствии с оценкой заведения.",
    en: "Guests are financially liable for damage (glassware, shisha, furnishings) according to the venue's valuation.",
    de: "Gäste haften für Schäden (Gläser, Shisha, Einrichtung) gemäß der Bewertung des Lokals.",
    ua: "Гість несе матеріальну відповідальність за пошкодження (посуд, кальян, обладнання закладу) відповідно до оцінки закладу.",
  },
  details: { pl: "Szczegóły", ru: "Подробнее", en: "Details", de: "Details", ua: "Детальніше" },
  hours: { pl: "Godziny otwarcia dziś", ru: "Часы работы сегодня", en: "Opening hours today", de: "Öffnungszeiten heute", ua: "Години роботи сьогодні" },
  closedToday: { pl: "Dziś zamknięte", ru: "Сегодня закрыто", en: "Closed today", de: "Heute geschlossen", ua: "Сьогодні зачинено" },
  openNow: { pl: "Otwarte teraz", ru: "Сейчас открыто", en: "Open now", de: "Jetzt geöffnet", ua: "Зараз відчинено" },
  closedNow: { pl: "Teraz zamknięte", ru: "Сейчас закрыто", en: "Closed now", de: "Jetzt geschlossen", ua: "Зараз зачинено" },
};

const Dot = () => <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />;

export function MenuRulesModal({ hours }: { hours: HoursRow[] }) {
  const { tr, lang } = useLang();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState<TodayHours | null>(null);

  // Every visit to the menu; hours are worked out on the guest's clock at that moment.
  useEffect(() => {
    setToday(todayHours(hours));
    const id = window.setTimeout(() => setOpen(true), 450);
    return () => window.clearTimeout(id);
  }, [hours]);

  const close = () => setOpen(false);
  const weekday = new Intl.DateTimeFormat(LANG_ISO[lang], { weekday: "long", timeZone: "Europe/Warsaw" }).format(new Date());

  function showDamages() {
    close();
    window.setTimeout(() => document.getElementById("uszkodzenia")?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
  }

  const rows: React.ReactNode[] = [
    <p key="rule" className="font-medium text-neutral-100">{tr(shisha.rule)}</p>,
    <div key="min" className="min-w-0">
      <p>{tr(shisha.condition)}</p>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {shisha.tiers!.map((tier) => (
          <div key={tier.price} className="rounded-xl border border-white/10 bg-ink-900/70 px-1 py-1.5 text-center">
            <div className="whitespace-nowrap text-[10.5px] text-neutral-400">{tr(tier.who)}</div>
            <div className="whitespace-nowrap text-[13px] font-semibold text-ember">{tier.price}</div>
          </div>
        ))}
      </div>
    </div>,
    <p key="session">{tr(TEXT.session)}</p>,
    <p key="damages">
      {tr(TEXT.damages)}{" "}
      <button onClick={showDamages} className="text-ember underline-offset-2 hover:underline">{tr(TEXT.details)}</button>
    </p>,
  ];

  return (
    <BottomSheet open={open} onClose={close} label={tr(TEXT.title)}>
      <div className="pr-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ember">Shisha · Balance</p>
        <h2 className="mt-1 text-xl font-medium leading-snug text-neutral-50">{tr(TEXT.title)}</h2>
        <p className="mt-1 text-sm text-neutral-500">{tr(TEXT.sub)}</p>
      </div>

      <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-300">
        {rows.map((row, i) => (
          <motion.li
            key={i}
            initial={reduce ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
            className="flex gap-2.5"
          >
            <Dot />
            {row}
          </motion.li>
        ))}
      </ul>

      {/* Today's hours, from the schedule set in the admin panel. */}
      {today && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-ember/25 bg-ember/5 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-neutral-500">{tr(TEXT.hours)}</p>
            <p className="mt-0.5 text-sm text-neutral-100">
              <span className="capitalize">{weekday}</span>
              {today.open ? (
                <span className="font-semibold text-ember"> · {today.open} – {today.close}</span>
              ) : (
                <span className="text-neutral-400"> · {tr(TEXT.closedToday)}</span>
              )}
            </p>
          </div>
          <span
            className={
              today.openNow
                ? "flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300"
                : "shrink-0 rounded-full border border-white/15 px-2.5 py-1 text-xs text-neutral-400"
            }
          >
            {today.openNow && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />}
            {tr(today.openNow ? TEXT.openNow : TEXT.closedNow)}
          </span>
        </div>
      )}

      <button onClick={close} className="btn-primary mt-5 w-full">OK</button>
    </BottomSheet>
  );
}
