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
        "inline-flex h-7 min-w-[24px] items-center justify-center rounded-full px-1 text-xs font-semibold leading-none transition sm:min-w-[30px] sm:px-2",
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
        <span className="mx-0.5 h-4 w-px shrink-0 bg-white/15" aria-hidden />
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="More languages"
          className={cn(
            "flex h-7 w-6 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-neon",
            EXTRA_LANGS.includes(lang as (typeof EXTRA_LANGS)[number]) ? "text-neon" : "text-neutral-200"
          )}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
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
