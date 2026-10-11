"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { cn, formatPrice, parseJSON } from "@/lib/utils";
import { SHISHA_FLAVORS, type FlavorTag } from "@/content/shishaFlavors";
import type { MenuItemDTO, T } from "./MenuBrowser";

// Flavour guide above the shisha cards: pick a shisha type, scroll through its
// flavours. Lists live in src/content/shishaFlavors.ts.

const LABEL: Record<string, T> = {
  title: { pl: "Smaki", ru: "Вкусы", en: "Flavours", de: "Geschmäcker", ua: "Смаки" },
  prev: { pl: "Poprzedni", ru: "Предыдущий", en: "Previous", de: "Zurück", ua: "Попередній" },
  next: { pl: "Następny", ru: "Следующий", en: "Next", de: "Weiter", ua: "Наступний" },
  details: { pl: "Szczegóły", ru: "Подробнее", en: "Details", de: "Details", ua: "Детальніше" },
};

const TAGS: Record<FlavorTag, T> = {
  sweet: { pl: "słodki", ru: "сладкий", en: "sweet", de: "süß", ua: "солодкий" },
  sour: { pl: "kwaśny", ru: "кислый", en: "sour", de: "sauer", ua: "кислий" },
  fresh: { pl: "świeży", ru: "свежий", en: "fresh", de: "frisch", ua: "свіжий" },
  fruity: { pl: "owocowy", ru: "фруктовый", en: "fruity", de: "fruchtig", ua: "фруктовий" },
  dessert: { pl: "deserowy", ru: "десертный", en: "dessert", de: "Dessert", ua: "десертний" },
  spicy: { pl: "korzenny", ru: "пряный", en: "spicy", de: "würzig", ua: "пряний" },
  herbal: { pl: "ziołowy", ru: "травяной", en: "herbal", de: "kräuterig", ua: "трав'яний" },
  creamy: { pl: "kremowy", ru: "сливочный", en: "creamy", de: "cremig", ua: "вершковий" },
};

const Arrow = ({ dir }: { dir: "l" | "r" }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={dir === "l" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
  </svg>
);

const GAP = 10;

export function ShishaFlavors({ items, onOpen }: { items: MenuItemDTO[]; onOpen: (item: MenuItemDTO) => void }) {
  const { tr } = useLang();
  const track = useRef<HTMLDivElement>(null);
  const [typeIdx, setTypeIdx] = useState(0);
  const [active, setActive] = useState(0);

  const group = SHISHA_FLAVORS[typeIdx];
  const count = group.flavors.length;
  // Matched on the Polish name, so a translated name never breaks the link.
  const item = items.find(
    (it) => (parseJSON<{ pl?: string }>(it.name, {}).pl ?? it.name).trim().toLowerCase() === group.type.toLowerCase()
  );

  // A new type starts from its first flavour.
  useEffect(() => {
    track.current?.scrollTo({ left: 0 });
    setActive(0);
  }, [typeIdx]);

  // Which flavour is in view, for the counter and the arrows.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      setActive(atEnd ? count - 1 : Math.round(el.scrollLeft / (card.offsetWidth + GAP)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [count]);

  function go(delta: number) {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const target = Math.max(0, Math.min(count - 1, active + delta));
    el.scrollTo({ left: target * (card.offsetWidth + GAP), behavior: "smooth" });
  }

  return (
    <div className="mb-6 max-w-3xl">
      {/* Title + flavour arrows */}
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ember">{tr(LABEL.title)}</p>
        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-xs tabular-nums text-neutral-500">{active + 1}/{count}</span>
          <button
            onClick={() => go(-1)}
            disabled={active === 0}
            aria-label={tr(LABEL.prev)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-neutral-200 transition hover:border-ember hover:text-ember disabled:opacity-30 disabled:hover:border-white/15 disabled:hover:text-neutral-200"
          >
            <Arrow dir="l" />
          </button>
          <button
            onClick={() => go(1)}
            disabled={active >= count - 1}
            aria-label={tr(LABEL.next)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-neutral-200 transition hover:border-ember hover:text-ember disabled:opacity-30 disabled:hover:border-white/15 disabled:hover:text-neutral-200"
          >
            <Arrow dir="r" />
          </button>
        </div>
      </div>

      {/* Shisha type */}
      <div role="tablist" className="mb-2.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SHISHA_FLAVORS.map((g, i) => (
          <button
            key={g.type}
            role="tab"
            aria-selected={i === typeIdx}
            onClick={() => setTypeIdx(i)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              i === typeIdx ? "border-ember bg-ember/15 text-ember" : "border-white/10 text-neutral-400 hover:border-white/25 hover:text-neutral-200"
            )}
          >
            {g.type}
          </button>
        ))}
      </div>

      {/* Flavours of the selected type */}
      <div
        ref={track}
        role="tabpanel"
        className="-mx-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-px-5 px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {group.flavors.map((f) => (
          <div key={`${group.type}-${f.name}`} className="flex w-[64%] shrink-0 snap-start flex-col rounded-2xl border border-white/10 bg-ink-900/60 p-3 sm:w-[calc(33.333%-7px)]">
            <p className="text-sm font-semibold leading-snug text-neutral-50">{f.name}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-400">{tr({ pl: f.notes })}</p>
            {f.tags && f.tags.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-1 pt-2">
                {f.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ember/90">
                    {tr(TAGS[tag])}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Price of the selected type + link to its card */}
      {item && (
        <button
          onClick={() => onOpen(item)}
          className="mt-2 flex items-center gap-2 text-xs text-neutral-400 transition hover:text-ember"
        >
          <span className="font-medium text-neutral-200">{group.type}</span>
          {item.price > 0 && <span className="text-ember">{formatPrice(item.price)}</span>}
          <span>· {tr(LABEL.details)} ›</span>
        </button>
      )}
    </div>
  );
}
