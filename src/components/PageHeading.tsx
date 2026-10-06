"use client";

import { useLang } from "./LangProvider";

// `compact` suits long titles that would overflow a phone screen at full size.
export function PageHeading({ titleKey, subtitle, compact }: { titleKey: string; subtitle?: string; compact?: boolean }) {
  const { t } = useLang();
  return (
    <div className="container-x mb-6 pt-6">
      <h1 className={`page-title break-words text-neutral-50 text-glow-ember [hyphens:auto] sm:text-5xl ${compact ? "text-[clamp(1.3rem,6.2vw,1.85rem)]" : "text-4xl"}`}>{t(titleKey)}</h1>
      {subtitle && <p className="mt-3 text-neutral-400">{subtitle}</p>}
      <div className="mt-4 h-0.5 w-14 rounded-full bg-neon shadow-glow" />
    </div>
  );
}
