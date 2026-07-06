"use client";

import { useLang } from "./LangProvider";
import { cn } from "@/lib/utils";

const STYLE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  confirmed: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  seated: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  cancelled: "bg-neutral-600/20 text-neutral-400 border-neutral-500/30",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  return (
    <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", STYLE[status] ?? STYLE.pending)}>
      {t(`status.${status}`)}
    </span>
  );
}
