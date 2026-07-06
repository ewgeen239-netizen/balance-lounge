"use client";

import { LANGS, LANG_LABEL } from "@/lib/i18n";
import { useLang } from "./LangProvider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={cn("flex items-center gap-1 rounded-full border border-white/10 bg-ink-800/60 p-1", className)}>
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium tracking-wider transition",
            lang === l ? "bg-neon text-white shadow-glow" : "text-neutral-400 hover:text-neutral-100"
          )}
          aria-pressed={lang === l}
        >
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
