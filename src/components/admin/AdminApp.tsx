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
import { MobileContentPanel } from "./MobileContentPanel";
import { EventsAdminPanel } from "./EventsAdminPanel";
import { PushAdminPanel } from "./PushAdminPanel";
import { CouponsPanel } from "./CouponsPanel";
import { LOYALTY_LIVE } from "@/content/rewards";
import type { EventDTO } from "@/lib/events";
import { Wordmark } from "../Wordmark";

type Tab = "reservations" | "menu" | "content" | "members" | "events" | "siteEvents" | "push" | "coupons";
type Role = "owner" | "staff";

export function AdminApp({
  adminName,
  role,
  initialCategories,
  initialReservations,
  bar,
  about,
  initialEvents,
}: {
  adminName: string;
  role: Role;
  initialCategories: AdminCategory[];
  initialReservations: AdminReservation[];
  bar: AdminBar;
  about: AdminAbout;
  initialEvents: EventDTO[];
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
        { id: "siteEvents", label: "Wydarzenia" },
        { id: "push", label: "Powiadomienia" },
        ...(LOYALTY_LIVE ? [{ id: "coupons" as Tab, label: "Kupony" }] : []),
        { id: "events", label: "Events & offers" },
        { id: "content", label: "Site content" },
        { id: "members", label: "Members" },
      ]
    : [{ id: "reservations", label: "Reservations" }, ...(LOYALTY_LIVE ? [{ id: "coupons" as Tab, label: "Kupony" }] : [])];

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
        <div className="mx-auto hidden max-w-6xl gap-1 overflow-x-auto px-5 sm:flex">
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

      <main className="mx-auto max-w-6xl px-5 pb-28 pt-8 sm:pb-8">
        {tab === "reservations" && <ReservationsPanel initial={initialReservations} />}
        {isOwner && tab === "menu" && <MenuPanel initial={initialCategories} />}
        {isOwner && tab === "siteEvents" && <EventsAdminPanel initial={initialEvents} />}
        {isOwner && tab === "push" && <PushAdminPanel />}
        {LOYALTY_LIVE && tab === "coupons" && <CouponsPanel />}
        {isOwner && tab === "events" && <MobileContentPanel />}
        {isOwner && tab === "content" && <ContentPanel bar={bar} about={about} />}
        {isOwner && tab === "members" && <MembersPanel currentName={adminName} />}
      </main>

      <nav aria-label="Admin sections" className="fixed inset-x-0 bottom-0 z-50 flex overflow-x-auto border-t [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-white/10 bg-ink-950/95 px-2 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:hidden">
        {tabs.map(tb => <button key={tb.id} onClick={() => setTab(tb.id)} aria-current={tab === tb.id ? "page" : undefined} className={cn("min-h-12 min-w-max flex-1 shrink-0 whitespace-nowrap rounded-xl px-3 text-[10px] font-medium", tab === tb.id ? "bg-neon/10 text-ember" : "text-neutral-400")}>{tb.label}</button>)}
      </nav>
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </div>
  );
}
