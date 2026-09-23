"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminCategory } from "./types";
import { tr, DEFAULT_LANG } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { buildGroups, type MenuGroup } from "@/lib/menuGroups";

type Group = MenuGroup<AdminCategory>;

const move = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
};

/** Compact window for arranging the menu: groups (the site's top tabs) and the
 *  categories inside each group. Saving writes Category.order only. */
export function CategoryOrderModal({
  categories,
  onClose,
  onSaved,
}: {
  categories: AdminCategory[];
  onClose: () => void;
  onSaved: (orderById: Map<number, number>) => void;
}) {
  const initial = useMemo(
    () => buildGroups([...categories].sort((a, b) => a.order - b.order)),
    [categories]
  );
  const [groups, setGroups] = useState<Group[]>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const flat = (gs: Group[]) => gs.flatMap((g) => g.cats.map((c) => c.id)).join(",");
  const dirty = flat(groups) !== flat(initial);

  // Moves are keyed by identity and resolved against the latest state, so fast
  // repeated clicks can never act on a stale index.
  const moveGroup = (key: string, to: number | ((cur: number) => number)) =>
    setGroups((gs) => {
      const from = gs.findIndex((g) => g.key === key);
      return move(gs, from, typeof to === "function" ? to(from) : to);
    });
  const moveCat = (key: string, id: number, to: number | ((cur: number) => number)) =>
    setGroups((gs) =>
      gs.map((g) => {
        if (g.key !== key) return g;
        const from = g.cats.findIndex((c) => c.id === id);
        return { ...g, cats: move(g.cats, from, typeof to === "function" ? to(from) : to) };
      })
    );

  async function save() {
    setSaving(true);
    setError("");
    const orders = groups.flatMap((g) => g.cats).map((c, i) => ({ id: c.id, order: i }));
    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders }),
    });
    setSaving(false);
    if (!res.ok) return setError("Nie udało się zapisać kolejności.");
    onSaved(new Map(orders.map((o) => [o.id, o.order])));
  }

  const close = () => {
    if (dirty && !confirm("Zamknąć bez zapisywania zmian?")) return;
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const arrow = "rounded border border-white/10 px-1.5 leading-none text-neutral-400 transition hover:border-neon hover:text-neon disabled:cursor-not-allowed disabled:opacity-25";
  const posSelect = "rounded-md border border-white/10 bg-ink-800 px-1 py-0.5 text-[11px] text-neutral-300";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={close}>
      <div className="my-8 w-full max-w-md rounded-3xl border border-white/10 bg-ink-900 p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-medium text-neutral-50">Kolejność kategorii</h3>
          <button onClick={close} className="text-neutral-400 hover:text-neon">✕</button>
        </div>
        <p className="mb-4 text-xs text-neutral-500">
          Grupy = zakładki na stronie. Strzałki przesuwają o jedno miejsce, lista „nr” przenosi od razu na wybraną pozycję.
        </p>

        <ol className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
          {groups.map((g, gi) => (
            <li key={g.key} className="rounded-2xl border border-white/10 bg-ink-800/40 p-2.5">
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveGroup(g.key, (i) => i - 1)} disabled={gi === 0} className={arrow} title="Grupa w górę">↑</button>
                  <button onClick={() => moveGroup(g.key, (i) => i + 1)} disabled={gi === groups.length - 1} className={arrow} title="Grupa w dół">↓</button>
                </div>
                <span className="flex-1 text-sm font-semibold uppercase tracking-wide text-ember">
                  {typeof g.title === "string" ? tr(g.title, DEFAULT_LANG) : g.title.pl}
                </span>
                <select value={gi} onChange={(e) => moveGroup(g.key, Number(e.target.value))} className={posSelect} title="Pozycja grupy">
                  {groups.map((_, i) => <option key={i} value={i}>nr {i + 1}</option>)}
                </select>
              </div>

              {g.cats.length > 1 && (
                <ul className="mt-2 space-y-1 border-l border-white/10 pl-3">
                  {g.cats.map((c, ci) => (
                    <li key={c.id} className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-white/5">
                      <button onClick={() => moveCat(g.key, c.id, (i) => i - 1)} disabled={ci === 0} className={arrow} title="W górę">↑</button>
                      <button onClick={() => moveCat(g.key, c.id, (i) => i + 1)} disabled={ci === g.cats.length - 1} className={arrow} title="W dół">↓</button>
                      <span className={cn("flex-1 truncate text-sm", c.closed ? "text-neutral-500" : "text-neutral-200")}>
                        {tr(c.name, DEFAULT_LANG)}
                        {c.closed && <span className="ml-1.5 text-[10px] text-neon">zamknięta</span>}
                      </span>
                      <select value={ci} onChange={(e) => moveCat(g.key, c.id, Number(e.target.value))} className={posSelect} title="Pozycja w grupie">
                        {g.cats.map((_, i) => <option key={i} value={i}>nr {i + 1}</option>)}
                      </select>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>

        {error && <p className="mt-3 rounded-xl border border-neon/40 bg-neon/10 px-3 py-2 text-sm text-neon">{error}</p>}

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-amber-300">{dirty ? "● niezapisane zmiany" : ""}</span>
          <div className="flex gap-2">
            <button onClick={() => setGroups(initial)} disabled={!dirty} className="btn-ghost text-sm disabled:opacity-40">Cofnij</button>
            <button onClick={save} disabled={!dirty || saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? "Zapisywanie…" : "Zapisz"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
