"use client";

import { parseJSON } from "@/lib/utils";

type Props = {
  label: string;
  value: string; // JSON string { pl, ... }
  onChange: (json: string) => void;
  multiline?: boolean;
};

// Single Polish field. Other languages are translated automatically on the site,
// so admins only ever type one language — keeps the panel compact.
export function TranslatableInput({ label, value, onChange, multiline }: Props) {
  const obj = parseJSON<Record<string, string>>(value, {});
  const pl = obj.pl ?? obj.ru ?? obj.en ?? Object.values(obj)[0] ?? "";

  const set = (v: string) => onChange(JSON.stringify({ pl: v }));

  return (
    <div>
      <label className="label flex items-center gap-2">
        {label}
        <span className="rounded bg-ink-700 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-ember">PL · auto-translated</span>
      </label>
      {multiline ? (
        <textarea value={pl} onChange={(e) => set(e.target.value)} className="input min-h-[90px] text-sm" rows={3} />
      ) : (
        <input value={pl} onChange={(e) => set(e.target.value)} className="input text-sm" />
      )}
    </div>
  );
}
