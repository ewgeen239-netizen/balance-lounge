"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/components/LangProvider";
import { parseJSON, formatPrice, cn } from "@/lib/utils";

export type MenuItemDTO = {
  id: number;
  name: string;
  description: string;
  price: number;
  photo: string;
  available: boolean;
  badges: string;
};
export type CategoryDTO = {
  id: number;
  slug: string;
  name: string;
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
      <div className="sticky top-[68px] z-30 -mx-5 mb-8 bg-ink-950/85 px-5 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8">
        <div className="container-x flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <TabBtn active={active === "all"} onClick={() => setActive("all")}>{t("menu.all")}</TabBtn>
            {categories.map((c) => (
              <TabBtn key={c.slug} active={active === c.slug} onClick={() => setActive(c.slug)}>
                {tr(c.name)}
              </TabBtn>
            ))}
          </div>
          <div className="relative lg:w-72">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("menu.search")}
              className="input pl-10"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
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
            visible.map((c) => (
              <section key={c.id} id={c.slug}>
                <h2 className="wordmark accent-underline mb-8 text-3xl text-neutral-50">{tr(c.name)}</h2>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {c.items.map((it, idx) => (
                    <motion.article
                      key={it.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: (idx % 6) * 0.05 }}
                      className={cn("glass card-hover flex overflow-hidden rounded-2xl", !it.available && "opacity-60")}
                    >
                      {it.photo && (
                        <div className="relative hidden w-28 shrink-0 sm:block">
                          <Image src={it.photo} alt={tr(it.name)} fill className="object-cover" sizes="120px" />
                        </div>
                      )}
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-medium text-neutral-50">{tr(it.name)}</h3>
                          <span className="whitespace-nowrap font-semibold text-ember">{formatPrice(it.price)}</span>
                        </div>
                        <p className="mt-1.5 text-sm text-neutral-400">{tr(it.description)}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {parseJSON<string[]>(it.badges, []).map((b) => <Badge key={b} code={b} />)}
                          {!it.available && (
                            <span className="rounded-full border border-neutral-600 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-400">
                              {t("menu.soldout")}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </section>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-4 py-2 text-sm transition",
        active ? "border-neon bg-neon/15 text-neon" : "border-white/10 text-neutral-300 hover:border-white/25"
      )}
    >
      {children}
    </button>
  );
}
