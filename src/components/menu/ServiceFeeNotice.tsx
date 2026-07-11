"use client";

import { useLang } from "@/components/LangProvider";

// Polish source; auto-translated into the active language via tr().
const FEE = {
  label: { pl: "Informacja" },
  title: { pl: "Opłata serwisowa" },
  text: { pl: "Do rachunków dla grup od 6 osób doliczamy opłatę serwisową w wysokości 5%." },
};

export function ServiceFeeNotice() {
  const { tr } = useLang();
  return (
    <div className="container-x mb-8">
      <div className="flex items-start gap-3 rounded-2xl border border-ember/25 bg-gradient-to-r from-ember/10 to-transparent px-4 py-3.5 sm:px-5">
        <svg className="mt-0.5 shrink-0 text-ember" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" />
        </svg>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ember">
            {tr(FEE.label)} · {tr(FEE.title)}
          </div>
          <p className="mt-0.5 text-sm text-neutral-300">{tr(FEE.text)}</p>
        </div>
      </div>
    </div>
  );
}
