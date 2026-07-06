"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { LANGS, DEFAULT_LANG, type Lang, t as tRaw, tr as trRaw } from "@/lib/i18n";

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

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Lang | null;
    if (saved && LANGS.includes(saved)) setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, l);
      document.cookie = `${STORAGE_KEY}=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
      document.documentElement.lang = l;
    }
  }, []);

  const value: LangCtx = {
    lang,
    setLang,
    t: (key: string) => tRaw(key, lang),
    tr: (value: unknown) => trRaw(value, lang),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
