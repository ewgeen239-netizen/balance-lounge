"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/components/LangProvider";
import { parseJSON, formatPrice } from "@/lib/utils";
import type { MenuItemDTO } from "./MenuBrowser";

type OptionItem = { name: unknown; price: number };
type OptionGroup = { name: unknown; required?: boolean; portion?: boolean; list: OptionItem[] };

const BADGE_KEY: Record<string, string> = { nowosc: "badge.nowosc", popularne: "badge.popularne", "18+": "badge.18" };

export function ItemModal({ item, onClose }: { item: MenuItemDTO | null; onClose: () => void }) {
  const { t, tr } = useLang();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (item) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  const groups = item ? parseJSON<OptionGroup[]>(item.options, []) : [];
  const badges = item ? parseJSON<string[]>(item.badges, []) : [];

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm sm:p-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-4 w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-card"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-ink-950/60 text-neutral-200 transition hover:border-neon hover:text-neon"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>

            {item.photo && (
              <div className="relative aspect-[16/10] w-full">
                <Image src={item.photo} alt={tr(item.name)} fill className="object-cover" sizes="(max-width:640px) 100vw, 512px" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900 to-transparent" />
              </div>
            )}

            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-medium text-neutral-50">{tr(item.name)}</h3>
                {item.price > 0 && <span className="whitespace-nowrap text-lg font-semibold text-ember">{formatPrice(item.price)}</span>}
              </div>

              {badges.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {badges.map((b) => (
                    <span key={b} className="rounded-full border border-ember/30 bg-ember/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ember">
                      {t(BADGE_KEY[b] ?? b)}
                    </span>
                  ))}
                </div>
              )}

              {tr(item.description) && (
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-300">{tr(item.description)}</p>
              )}

              {groups.length > 0 && (
                <div className="mt-6 space-y-5">
                  {groups.map((g, gi) => (
                    <div key={gi}>
                      <div className="mb-2.5 flex items-center gap-2">
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-ember">
                          {g.portion ? t("menu.portions") : tr(g.name)}
                        </h4>
                        {g.required && (
                          <span className="rounded-full bg-neon/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neon">
                            {t("menu.required")}
                          </span>
                        )}
                      </div>
                      <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10">
                        {g.list.map((o, oi) => (
                          <li key={oi} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                            <span className="text-neutral-200">{tr(o.name)}</span>
                            {(g.portion || o.price > 0) && (
                              <span className="whitespace-nowrap font-semibold tabular-nums text-ember">
                                {g.portion ? formatPrice(o.price) : `+${formatPrice(o.price)}`}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
