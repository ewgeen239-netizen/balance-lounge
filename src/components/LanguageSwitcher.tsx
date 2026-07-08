"use client";

import { useEffect, useRef, useState } from "react";
import { MAIN_LANGS, EXTRA_LANGS, LANG_LABEL, LANG_FULL, type Lang } from "@/lib/i18n";
import { useLang } from "./LangProvider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pill = (l: Lang) => (
    <button
      key={l}
      onClick={() => { setLang(l); setOpen(false); }}
      className={cn(
        "rounded-full px-2 py-1 text-xs font-medium tracking-wider transition sm:px-2.5",
        lang === l ? "bg-neon text-white shadow-glow" : "text-neutral-400 hover:text-neutral-100"
      )}
      aria-pressed={lang === l}
    >
      {LANG_LABEL[l]}
    </button>
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-ink-800/60 p-1">
        {MAIN_LANGS.map(pill)}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="More languages"
          className={cn(
            "flex items-center rounded-full px-1.5 py-1 text-neutral-400 transition hover:text-neon",
            EXTRA_LANGS.includes(lang as (typeof EXTRA_LANGS)[number]) && "text-neon"
          )}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={cn("transition-transform", open && "rotate-180")}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-[60vh] w-44 overflow-y-auto rounded-xl border border-white/10 bg-ink-900/95 p-1.5 shadow-card backdrop-blur-xl">
          <p className="px-2 py-1 text-[10px] uppercase tracking-widest text-neutral-500">auto-translate</p>
          {EXTRA_LANGS.map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                lang === l ? "bg-neon/15 text-neon" : "text-neutral-300 hover:bg-white/5"
              )}
            >
              <span className="w-6 text-xs font-semibold">{LANG_LABEL[l]}</span>
              <span className="text-neutral-400">{LANG_FULL[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
