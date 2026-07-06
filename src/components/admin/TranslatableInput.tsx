"use client";

import { LANGS, LANG_LABEL, type Lang } from "@/lib/i18n";
import { parseJSON } from "@/lib/utils";

type Props = {
  label: string;
  value: string; // JSON string
  onChange: (json: string) => void;
  multiline?: boolean;
};

export function TranslatableInput({ label, value, onChange, multiline }: Props) {
  const obj = parseJSON<Record<string, string>>(value, {});

  function update(lang: Lang, v: string) {
    onChange(JSON.stringify({ ...obj, [lang]: v }));
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="grid gap-2 sm:grid-cols-2">
        {LANGS.map((l) => (
          <div key={l} className="relative">
            <span className="absolute left-2 top-2 rounded bg-ink-700 px-1.5 py-0.5 text-[10px] font-semibold text-ember">
              {LANG_LABEL[l]}
            </span>
            {multiline ? (
              <textarea
                value={obj[l] ?? ""}
                onChange={(e) => update(l, e.target.value)}
                className="input min-h-[90px] pt-8 text-sm"
                rows={3}
              />
            ) : (
              <input
                value={obj[l] ?? ""}
                onChange={(e) => update(l, e.target.value)}
                className="input pl-12 text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
