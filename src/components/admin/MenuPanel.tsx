"use client";

import { useMemo, useState } from "react";
import type { AdminCategory, AdminItem } from "./types";
import { ItemEditor } from "./ItemEditor";
import { TranslatableInput } from "./TranslatableInput";
import { tr, DEFAULT_LANG } from "@/lib/i18n";
import { parseJSON, cn, categoryClosedNow } from "@/lib/utils";

export function MenuPanel({ initial }: { initial: AdminCategory[] }) {
  const [cats, setCats] = useState<AdminCategory[]>(initial);
  const [editing, setEditing] = useState<AdminItem | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({});
  const [savingPrices, setSavingPrices] = useState(false);
  const [newCat, setNewCat] = useState({ slug: "", name: "{}" });
  const [showNewCat, setShowNewCat] = useState(false);
  const [query, setQuery] = useState("");

  // Filter by item or category name — the menu is long, so search keeps edits quick.
  const q = query.trim().toLowerCase();
  const visibleCats = useMemo(() => {
    if (!q) return cats;
    return cats
      .map((c) => {
        const catHit = tr(c.name, DEFAULT_LANG).toLowerCase().includes(q) || c.slug.includes(q);
        const items = catHit ? c.items : c.items.filter((i) => tr(i.name, DEFAULT_LANG).toLowerCase().includes(q));
        return { ...c, items };
      })
      .filter((c) => c.items.length > 0);
  }, [cats, q]);
  const shownCount = visibleCats.reduce((n, c) => n + c.items.length, 0);

  function replaceItem(updated: AdminItem) {
    setCats((cs) =>
      cs.map((c) => ({ ...c, items: c.items.map((i) => (i.id === updated.id ? updated : i)) }))
    );
  }

  async function addItem(categoryId: number) {
    const res = await fetch("/api/admin/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
    if (res.ok) {
      const item: AdminItem = await res.json();
      setCats((cs) => cs.map((c) => (c.id === categoryId ? { ...c, items: [...c.items, item] } : c)));
      setEditing(item);
    }
  }

  async function deleteItem(id: number) {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`/api/admin/items/${id}`, { method: "DELETE" });
    if (res.ok) setCats((cs) => cs.map((c) => ({ ...c, items: c.items.filter((i) => i.id !== id) })));
  }

  async function saveAllPrices() {
    const prices = Object.entries(priceDrafts)
      .filter(([, v]) => v !== "")
      .map(([id, v]) => ({ id: Number(id), price: Number(v) }));
    if (prices.length === 0) return;
    setSavingPrices(true);
    const res = await fetch("/api/admin/items/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prices }),
    });
    setSavingPrices(false);
    if (res.ok) {
      setCats((cs) =>
        cs.map((c) => ({
          ...c,
          items: c.items.map((i) => (priceDrafts[i.id] != null && priceDrafts[i.id] !== "" ? { ...i, price: Number(priceDrafts[i.id]) } : i)),
        }))
      );
      setPriceDrafts({});
    }
  }

  async function addCategory() {
    if (!newCat.slug) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCat),
    });
    if (res.ok) {
      const cat = await res.json();
      setCats((cs) => [...cs, { ...cat, items: [] }]);
      setNewCat({ slug: "", name: "{}" });
      setShowNewCat(false);
    }
  }

  async function deleteCategory(id: number) {
    if (!confirm("Delete category and all its items?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) setCats((cs) => cs.filter((c) => c.id !== id));
  }

  // Reorder within a category: swap with the neighbour and renumber the whole
  // list, so ordering stays consistent even if the DB had gaps or duplicates.
  async function moveItem(categoryId: number, itemId: number, dir: -1 | 1) {
    const cat = cats.find((c) => c.id === categoryId);
    if (!cat) return;
    const list = [...cat.items].sort((a, b) => a.order - b.order);
    const idx = list.findIndex((i) => i.id === itemId);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= list.length) return;

    [list[idx], list[to]] = [list[to], list[idx]];
    const renumbered = list.map((it, n) => ({ ...it, order: n }));
    setCats((cs) => cs.map((c) => (c.id === categoryId ? { ...c, items: renumbered } : c))); // optimistic

    const res = await fetch("/api/admin/items/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: renumbered.map((it) => ({ id: it.id, order: it.order })) }),
    });
    if (!res.ok) setCats((cs) => cs.map((c) => (c.id === categoryId ? cat : c))); // revert
  }

  // Per-item override: keep selling it on days the category is auto-closed.
  async function toggleAlwaysOpen(id: number, alwaysOpen: boolean) {
    setCats((cs) => cs.map((c) => ({ ...c, items: c.items.map((i) => (i.id === id ? { ...i, alwaysOpen } : i)) }))); // optimistic
    const res = await fetch(`/api/admin/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alwaysOpen }),
    });
    if (!res.ok) {
      setCats((cs) => cs.map((c) => ({ ...c, items: c.items.map((i) => (i.id === id ? { ...i, alwaysOpen: !alwaysOpen } : i)) }))); // revert
    }
  }

  async function toggleSchedule(id: number, scheduled: boolean) {
    setCats((cs) => cs.map((c) => (c.id === id ? { ...c, scheduled } : c))); // optimistic
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduled }),
    });
    if (!res.ok) setCats((cs) => cs.map((c) => (c.id === id ? { ...c, scheduled: !scheduled } : c))); // revert
  }

  const dirtyPrices = Object.values(priceDrafts).some((v) => v !== "");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="wordmark text-2xl text-neutral-50">Menu</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj pozycji…"
            className="input w-48 py-1.5 text-sm sm:w-64"
          />
          {q && <span className="text-xs text-neutral-500">{shownCount} znaleziono</span>}
        </div>
        <div className="flex gap-2">
          {dirtyPrices && (
            <button onClick={saveAllPrices} disabled={savingPrices} className="btn-primary text-sm">
              {savingPrices ? "Saving…" : "Save all prices"}
            </button>
          )}
          <button onClick={() => setShowNewCat((s) => !s)} className="btn-ghost text-sm">+ Category</button>
        </div>
      </div>

      {showNewCat && (
        <div className="mb-6 space-y-3 rounded-2xl border border-white/10 bg-ink-800/40 p-5">
          <input
            value={newCat.slug}
            onChange={(e) => setNewCat((c) => ({ ...c, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
            placeholder="slug (e.g. deserts)"
            className="input text-sm"
          />
          <TranslatableInput label="Category name" value={newCat.name} onChange={(v) => setNewCat((c) => ({ ...c, name: v }))} />
          <button onClick={addCategory} className="btn-primary text-sm">Create category</button>
        </div>
      )}

      <div className="space-y-10">
        {visibleCats.map((cat) => (
          <section key={cat.id}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-medium text-ember">{tr(cat.name, DEFAULT_LANG)} <span className="text-xs text-neutral-600">/{cat.slug}</span></h3>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => toggleSchedule(cat.id, !cat.scheduled)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition",
                    cat.scheduled ? "border-neon/40 bg-neon/10 text-neon" : "border-white/15 text-neutral-400 hover:text-neutral-200"
                  )}
                  title="Auto-off Tue–Thu, on Fri–Mon. Off days blur this category on the site."
                >
                  <span className={cn("h-2 w-2 rounded-full", cat.scheduled ? "bg-neon" : "bg-neutral-600")} />
                  Auto-schedule: {cat.scheduled ? "ON" : "OFF"}
                  {cat.scheduled && <span className="text-neutral-400">({categoryClosedNow(true) ? "closed now" : "open now"})</span>}
                </button>
                <button onClick={() => addItem(cat.id)} className="text-xs text-neutral-400 hover:text-neon">+ item</button>
                <button onClick={() => deleteCategory(cat.id)} className="text-xs text-neutral-500 hover:text-neon">delete category</button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[520px] text-sm">
                <tbody>
                  {cat.items.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-600">No items yet.</td></tr>
                  )}
                  {[...cat.items].sort((a, b) => a.order - b.order).map((it, idx, arr) => (
                    <tr key={it.id} className="border-t border-white/5">
                      <td className="py-3 pl-3 pr-0 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveItem(cat.id, it.id, -1)}
                            disabled={idx === 0}
                            title="W górę"
                            className="rounded border border-white/10 px-1.5 leading-none text-neutral-400 transition hover:border-neon hover:text-neon disabled:cursor-not-allowed disabled:opacity-25"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveItem(cat.id, it.id, 1)}
                            disabled={idx === arr.length - 1}
                            title="W dół"
                            className="rounded border border-white/10 px-1.5 leading-none text-neutral-400 transition hover:border-neon hover:text-neon disabled:cursor-not-allowed disabled:opacity-25"
                          >
                            ↓
                          </button>
                        </div>
                      </td>
                      <td className="w-full px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-100">{tr(it.name, DEFAULT_LANG)}</span>
                          {!it.available && <span className="rounded-full bg-neutral-700/40 px-2 py-0.5 text-[10px] text-neutral-400">sold out</span>}
                          {parseJSON<string[]>(it.badges, []).map((b) => (
                            <span key={b} className="rounded-full bg-ember/15 px-2 py-0.5 text-[10px] text-ember">{b}</span>
                          ))}
                        </div>
                        <p className="text-xs text-neutral-500">{tr(it.description, DEFAULT_LANG)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            defaultValue={it.price}
                            onChange={(e) => setPriceDrafts((p) => ({ ...p, [it.id]: e.target.value }))}
                            className="input w-24 py-1.5 text-sm"
                          />
                          <span className="text-xs text-neutral-500">zł</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {cat.scheduled && (
                          <button
                            onClick={() => toggleAlwaysOpen(it.id, !it.alwaysOpen)}
                            title="Pozycja w sprzedaży także w dni, gdy kategoria jest zamknięta przez auto-grafik."
                            className={cn(
                              "mr-2 rounded-full border px-2 py-0.5 text-[10px] transition",
                              it.alwaysOpen
                                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                                : "border-white/15 text-neutral-500 hover:text-neutral-300"
                            )}
                          >
                            {it.alwaysOpen ? "zawsze dostępne" : "wg grafiku"}
                          </button>
                        )}
                        <button onClick={() => setEditing(it)} className="mr-2 text-xs text-neutral-400 hover:text-neon">edit</button>
                        <button onClick={() => deleteItem(it.id)} className="text-xs text-neutral-500 hover:text-neon">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {editing && (
        <ItemEditor
          item={editing}
          categories={cats}
          onClose={() => setEditing(null)}
          onSaved={(updated) => { replaceItem(updated); setEditing(null); }}
        />
      )}
    </div>
  );
}
