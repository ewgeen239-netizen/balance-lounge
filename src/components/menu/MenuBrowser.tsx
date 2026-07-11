"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/components/LangProvider";
import { parseJSON, formatPrice, cn, categoryClosedNow } from "@/lib/utils";
import { ItemModal } from "./ItemModal";

export type MenuItemDTO = {
  id: number;
  name: string;
  description: string;
  price: number;
  photo: string;
  available: boolean;
  badges: string;
  options: string; // JSON option groups
};
export type CategoryDTO = {
  id: number;
  slug: string;
  name: string;
  scheduled: boolean;
  items: MenuItemDTO[];
};

const BADGE_STYLE: Record<string, string> = {
  nowosc: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  popularne: "bg-ember/15 text-ember border-ember/30",
  "18+": "bg-neon/15 text-neon border-neon/30",
};

function Badge({ code }: { code: string }) {
  const { t } = useLang();
  const key = code === "18+" ? "badge.18" : `badge.${code}`;
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", BADGE_STYLE[code] ?? "border-white/20 text-neutral-300")}>
      {t(key)}
    </span>
  );
}

export function MenuBrowser({ categories }: { categories: CategoryDTO[] }) {
  const { t, tr } = useLang();
  const [active, setActive] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MenuItemDTO | null>(null);

  const q = query.trim().toLowerCase();

  const visible = useMemo(() => {
    return categories
      .filter((c) => active === "all" || c.slug === active)
      .map((c) => ({
        ...c,
        items: c.items.filter((it) => {
          if (!q) return true;
          return (
            tr(it.name).toLowerCase().includes(q) ||
            tr(it.description).toLowerCase().includes(q)
          );
        }),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, active, q, tr]);

  return (
    <div>
      {/* Sticky controls */}
      <div className="sticky top-[92px] z-30 -mx-5 mb-8 bg-ink-950/85 px-5 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8 md:top-[60px]">
        <div className="container-x flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <TabBtn active={active === "all"} onClick={() => setActive("all")}>{t("menu.all")}</TabBtn>
            {categories.map((c) => (
              <TabBtn key={c.slug} active={active === c.slug} onClick={() => setActive(c.slug)}>
                {tr(c.name)}
              </TabBtn>
            ))}
          </div>
          <div className="input flex items-center gap-2.5 lg:w-72">
            <svg className="shrink-0 text-neutral-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("menu.search")}
              className="w-full min-w-0 border-0 bg-transparent p-0 text-neutral-100 outline-none placeholder:text-neutral-500"
            />
          </div>
        </div>
      </div>

      <div className="container-x space-y-16 pb-10">
        <AnimatePresence mode="wait">
          {visible.length === 0 ? (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center text-neutral-500">
              {t("menu.empty")}
            </motion.p>
          ) : (
            visible.map((c) => {
              const closed = categoryClosedNow(c.scheduled);
              return (
                <section key={c.id} id={c.slug} className="relative">
                  <div className="mb-6 flex flex-wrap items-center gap-3 sm:mb-8">
                    <h2 className="wordmark accent-underline text-2xl text-neutral-50 sm:text-3xl">{tr(c.name)}</h2>
                    {closed && (
                      <span className="rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs text-neon">
                        {t("menu.closedToday")}
                      </span>
                    )}
                  </div>

                  <div className={cn("relative", closed && "pointer-events-none select-none")}>
                    <div className={cn("grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3", closed && "blur-[6px] saturate-50 opacity-70")}>
                      {c.items.map((it, idx) => (
                        <motion.article
                          key={it.id}
                          initial={{ opacity: 0, y: 16 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: (idx % 6) * 0.04 }}
                          onClick={() => setSelected(it)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelected(it)}
                          className={cn("glass card-hover flex cursor-pointer flex-col overflow-hidden rounded-2xl", !it.available && "opacity-60")}
                        >
                          {it.photo && (
                            <div className="relative aspect-[4/3] w-full shrink-0">
                              <Image src={it.photo} alt={tr(it.name)} fill className="object-cover" sizes="(max-width:640px) 50vw, 300px" />
                            </div>
                          )}
                          <div className="flex flex-1 flex-col p-3.5 sm:p-5">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-medium text-neutral-50 sm:text-base">{tr(it.name)}</h3>
                              {it.price > 0 && (
                                <span className="whitespace-nowrap text-sm font-semibold text-ember">
                                  {parseJSON<{ portion?: boolean }[]>(it.options, []).some((g) => g.portion) && (
                                    <span className="mr-1 text-[10px] font-normal uppercase tracking-wider text-neutral-500">{t("menu.from")}</span>
                                  )}
                                  {formatPrice(it.price)}
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 line-clamp-3 text-xs text-neutral-400 sm:text-sm sm:line-clamp-none">{tr(it.description)}</p>
                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                              {parseJSON<string[]>(it.badges, []).map((b) => <Badge key={b} code={b} />)}
                              {!it.available && (
                                <span className="rounded-full border border-neutral-600 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-400">
                                  {t("menu.soldout")}
                                </span>
                              )}
                            </div>
                            {tr(it.name).toLowerCase().includes("cybuch") && (
                              <div className="mt-auto pt-3">
                                <div className="flex items-center gap-2 rounded-xl border border-ember/30 bg-gradient-to-r from-ember/10 to-transparent px-3 py-2">
                                  <span className="text-ember">✦</span>
                                  <span className="text-[11px] font-medium italic leading-snug text-ember/90 sm:text-xs">
                                    {t("menu.eshishaNote")}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.article>
                      ))}
                    </div>
                    {closed && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="rounded-2xl border border-white/15 bg-ink-950/70 px-5 py-3 text-sm text-neutral-200 backdrop-blur-sm">
                          {t("menu.closedTodayLong")}
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <ItemModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition",
        active ? "border-neon bg-neon/15 text-neon" : "border-white/10 text-neutral-300 hover:border-white/25"
      )}
    >
      {children}
    </button>
  );
}
