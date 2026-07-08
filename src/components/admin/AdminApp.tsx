"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AdminCategory, AdminReservation, AdminBar, AdminAbout } from "./types";
import { ReservationsPanel } from "./ReservationsPanel";
import { MenuPanel } from "./MenuPanel";
import { ContentPanel } from "./ContentPanel";
import { MembersPanel } from "./MembersPanel";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { Wordmark } from "../Wordmark";

type Tab = "reservations" | "menu" | "content" | "members";
type Role = "owner" | "staff";

export function AdminApp({
  adminName,
  role,
  initialCategories,
  initialReservations,
  bar,
  about,
}: {
  adminName: string;
  role: Role;
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

  const isOwner = role === "owner";
  const tabs: { id: Tab; label: string }[] = isOwner
    ? [
        { id: "reservations", label: "Reservations" },
        { id: "menu", label: "Menu" },
        { id: "content", label: "Site content" },
        { id: "members", label: "Members" },
      ]
    : [{ id: "reservations", label: "Reservations" }];

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-4">
          <div className="flex items-center gap-3">
            <Wordmark className="h-4 w-auto sm:h-5 text-neutral-50" />
            <span className="rounded-full border border-ember/30 px-2 py-0.5 text-[10px] uppercase tracking-widest text-ember">
              {isOwner ? "Admin" : "Staff"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm sm:gap-3">
            <Link href="/" target="_blank" className="hidden text-neutral-400 hover:text-neon sm:inline">View site ↗</Link>
            <span className="hidden text-neutral-500 sm:inline">·</span>
            <span className="hidden text-neutral-300 sm:inline">{adminName}</span>
            <button onClick={() => setShowChangePw(true)} className="btn-ghost px-3 py-1.5 text-xs sm:px-4">Change password</button>
            <button onClick={logout} className="btn-ghost px-3 py-1.5 text-xs sm:px-4">Log out</button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5">
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
        {isOwner && tab === "menu" && <MenuPanel initial={initialCategories} />}
        {isOwner && tab === "content" && <ContentPanel bar={bar} about={about} />}
        {isOwner && tab === "members" && <MembersPanel currentName={adminName} />}
      </main>

      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </div>
  );
}
