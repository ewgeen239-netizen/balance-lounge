"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AdminCategory, AdminReservation, AdminBar, AdminAbout } from "./types";
import { ReservationsPanel } from "./ReservationsPanel";
import { MenuPanel } from "./MenuPanel";
import { ContentPanel } from "./ContentPanel";
import { ChangePasswordModal } from "./ChangePasswordModal";

type Tab = "reservations" | "menu" | "content";

export function AdminApp({
  adminName,
  initialCategories,
  initialReservations,
  bar,
  about,
}: {
  adminName: string;
  initialCategories: AdminCategory[];
  initialReservations: AdminReservation[];
  bar: AdminBar;
  about: AdminAbout;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("reservations");
  const [showChangePw, setShowChangePw] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "reservations", label: "Reservations" },
    { id: "menu", label: "Menu" },
    { id: "content", label: "Site content" },
  ];

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <span className="wordmark text-lg text-neutral-50">BALANCE</span>
            <span className="rounded-full border border-ember/30 px-2 py-0.5 text-[10px] uppercase tracking-widest text-ember">Admin</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" target="_blank" className="text-neutral-400 hover:text-neon">View site ↗</Link>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-300">{adminName}</span>
            <button onClick={() => setShowChangePw(true)} className="btn-ghost px-4 py-1.5 text-xs">Change password</button>
            <button onClick={logout} className="btn-ghost px-4 py-1.5 text-xs">Log out</button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 px-5">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={cn(
                "border-b-2 px-4 py-3 text-sm transition",
                tab === tb.id ? "border-neon text-neon" : "border-transparent text-neutral-400 hover:text-neutral-200"
              )}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {tab === "reservations" && <ReservationsPanel initial={initialReservations} />}
        {tab === "menu" && <MenuPanel initial={initialCategories} />}
        {tab === "content" && <ContentPanel bar={bar} about={about} />}
      </main>

      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </div>
  );
}
