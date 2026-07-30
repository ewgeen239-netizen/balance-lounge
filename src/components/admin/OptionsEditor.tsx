"use client";

import { parseJSON } from "@/lib/utils";

type Choice = { name: unknown; price: number };
type Group = { name: unknown; required?: boolean; portion?: boolean; list: Choice[] };

const plOf = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as Record<string, string>;
    return o.pl ?? o.en ?? Object.values(o)[0] ?? "";
  }
  return "";
};

/** Add-on groups (Dodatki / Porcje) — the same structure the menu renders.
 *  Typed in Polish only; other languages are translated automatically. */
export function OptionsEditor({ value, onChange }: { value: string; onChange: (json: string) => void }) {
  const groups = parseJSON<Group[]>(value, []);
  const commit = (next: Group[]) => onChange(JSON.stringify(next));

  const patchGroup = (gi: number, patch: Partial<Group>) =>
    commit(groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)));

  const patchChoice = (gi: number, ci: number, patch: Partial<Choice>) =>
    patchGroup(gi, { list: groups[gi].list.map((c, i) => (i === ci ? { ...c, ...patch } : c)) });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="label mb-0">Dodatki / opcje</label>
        <button
          type="button"
          onClick={() => commit([...groups, { name: { pl: "Dodatki" }, required: false, list: [] }])}
          className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-neutral-300 hover:border-neon hover:text-neon"
        >
          + grupa
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 px-3 py-3 text-xs text-neutral-500">
          Brak opcji. Dodaj grupę, np. „Dodatki” lub „Porcje”.
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((g, gi) => (
            <div key={gi} className="rounded-xl border border-white/10 bg-ink-800/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={plOf(g.name)}
                  onChange={(e) => patchGroup(gi, { name: { pl: e.target.value } })}
                  placeholder="Nazwa grupy"
                  className="input flex-1 py-1.5 text-sm"
                />
                <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-neutral-400">
                  <input
                    type="checkbox"
                    checked={!!g.required}
                    onChange={(e) => patchGroup(gi, { required: e.target.checked })}
                    className="h-3.5 w-3.5 accent-[#ff2d3a]"
                  />
                  wymagane
                </label>
                <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-neutral-400">
                  <input
                    type="checkbox"
                    checked={!!g.portion}
                    onChange={(e) => patchGroup(gi, { portion: e.target.checked })}
                    className="h-3.5 w-3.5 accent-[#ff2d3a]"
                  />
                  porcje
                </label>
                <button
                  type="button"
                  onClick={() => commit(groups.filter((_, i) => i !== gi))}
                  title="Usuń grupę"
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs text-neutral-500 hover:border-neon hover:text-neon"
                >
                  ✕
                </button>
              </div>

              <div className="mt-2 space-y-1.5">
                {g.list.map((c, ci) => (
                  <div key={ci} className="flex items-center gap-2">
                    <input
                      value={plOf(c.name)}
                      onChange={(e) => patchChoice(gi, ci, { name: { pl: e.target.value } })}
                      placeholder="Nazwa opcji"
                      className="input flex-1 py-1.5 text-sm"
                    />
                    <input
                      type="number"
                      step="1"
                      value={c.price}
                      onChange={(e) => patchChoice(gi, ci, { price: Number(e.target.value) })}
                      className="input w-24 py-1.5 text-sm"
                      placeholder="zł"
                    />
                    <button
                      type="button"
                      onClick={() => patchGroup(gi, { list: g.list.filter((_, i) => i !== ci) })}
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs text-neutral-500 hover:border-neon hover:text-neon"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => patchGroup(gi, { list: [...g.list, { name: { pl: "" }, price: 0 }] })}
                  className="text-xs text-neutral-400 hover:text-neon"
                >
                  + opcja
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
