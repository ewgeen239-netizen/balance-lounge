"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import {
  LANGS, DEFAULT_LANG, HAND_LANGS, LANG_ISO,
  type Lang,
  t as tRaw, tr as trRaw, tBase, trBase, hasHand,
} from "@/lib/i18n";

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  tr: (value: unknown) => string;
};

const Ctx = createContext<LangCtx | null>(null);
const STORAGE_KEY = "balance_lang";

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  // auto[lang][sourceText] = machine translation
  const [auto, setAuto] = useState<Record<string, Record<string, string>>>({});
  const pending = useRef<Set<string>>(new Set());
  const inFlight = useRef(false);

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Lang | null;
    if (saved && (LANGS as readonly string[]).includes(saved)) setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, l);
      document.cookie = `${STORAGE_KEY}=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
      document.documentElement.lang = l;
    }
  }, []);

  const auto_ = auto[lang] ?? {};
  const isHand = HAND_LANGS.includes(lang);

  // Resolve a base English string for the current (non-hand) language.
  const resolveAuto = (base: string): string => {
    if (!base) return base;
    const hit = auto_[base];
    if (hit !== undefined) return hit;
    if (!pending.current.has(base)) pending.current.add(base);
    return base; // show base until translation arrives
  };

  const t = (key: string): string => (isHand ? tRaw(key, lang) : resolveAuto(tBase(key)));
  const tr = (value: unknown): string => {
    if (isHand || hasHand(value, lang)) return trRaw(value, lang);
    return resolveAuto(trBase(value));
  };

  // Flush pending auto-translation requests.
  useEffect(() => {
    if (isHand) return;
    const id = setInterval(async () => {
      if (inFlight.current || pending.current.size === 0) return;
      const texts = Array.from(pending.current).filter((x) => !(auto[lang]?.[x] !== undefined)).slice(0, 50);
      if (texts.length === 0) { pending.current.clear(); return; }
      inFlight.current = true;
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts, source: "en", target: LANG_ISO[lang] }),
        });
        if (res.ok) {
          const { translations } = await res.json();
          setAuto((prev) => ({ ...prev, [lang]: { ...(prev[lang] ?? {}), ...translations } }));
        }
        texts.forEach((x) => pending.current.delete(x));
      } finally {
        inFlight.current = false;
      }
    }, 350);
    return () => clearInterval(id);
  }, [isHand, lang, auto]);

  const value: LangCtx = { lang, setLang, t, tr };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
