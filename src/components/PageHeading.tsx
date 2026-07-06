"use client";

import { useLang } from "./LangProvider";

export function PageHeading({ titleKey, subtitle }: { titleKey: string; subtitle?: string }) {
  const { t } = useLang();
  return (
    <div className="container-x mb-6 pt-6">
      <h1 className="wordmark text-4xl text-neutral-50 text-glow-ember sm:text-5xl">{t(titleKey)}</h1>
      {subtitle && <p className="mt-3 text-neutral-400">{subtitle}</p>}
      <div className="mt-4 h-0.5 w-14 rounded-full bg-neon shadow-glow" />
    </div>
  );
}
