"use client";

import { useState } from "react";
import type { AdminItem, AdminCategory } from "./types";
import { TranslatableInput } from "./TranslatableInput";
import { ImageUpload } from "./ImageUpload";
import { tr, DEFAULT_LANG } from "@/lib/i18n";
import { parseJSON } from "@/lib/utils";

const BADGES = ["nowosc", "popularne", "18+"];

export function ItemEditor({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item: AdminItem;
  categories: AdminCategory[];
  onClose: () => void;
  onSaved: (updated: AdminItem) => void;
}) {
  const [draft, setDraft] = useState<AdminItem>(item);
  const [saving, setSaving] = useState(false);
  const badges = parseJSON<string[]>(draft.badges, []);

  function set<K extends keyof AdminItem>(key: K, value: AdminItem[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggleBadge(b: string) {
    const next = badges.includes(b) ? badges.filter((x) => x !== b) : [...badges, b];
    set("badges", JSON.stringify(next));
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/items/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        description: draft.description,
        price: draft.price,
        photo: draft.photo,
        available: draft.available,
        badges: draft.badges,
        categoryId: draft.categoryId,
      }),
    });
    setSaving(false);
    if (res.ok) onSaved(await res.json());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-card">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="wordmark text-xl text-neutral-50">Edit item</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neon">✕</button>
        </div>

        <div className="space-y-5">
          <TranslatableInput label="Name" value={draft.name} onChange={(v) => set("name", v)} />
          <TranslatableInput label="Description" value={draft.description} onChange={(v) => set("description", v)} multiline />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Price (zł)</label>
              <input type="number" step="0.5" value={draft.price} onChange={(e) => set("price", Number(e.target.value))} className="input" />
            </div>
            <div>
              <label className="label">Category</label>
              <select value={draft.categoryId} onChange={(e) => set("categoryId", Number(e.target.value))} className="input">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{tr(c.name, DEFAULT_LANG)}</option>
                ))}
              </select>
            </div>
          </div>

          <ImageUpload value={draft.photo} onChange={(url) => set("photo", url)} />

          <div className="flex flex-wrap items-center gap-6">
            <div>
              <label className="label">Badges</label>
              <div className="flex gap-2">
                {BADGES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBadge(b)}
                    className={`rounded-full border px-3 py-1 text-xs ${badges.includes(b) ? "border-neon bg-neon/15 text-neon" : "border-white/15 text-neutral-400"}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
              <input type="checkbox" checked={draft.available} onChange={(e) => set("available", e.target.checked)} className="h-4 w-4 accent-[#ff2d3a]" />
              Available
            </label>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
