"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "./LangProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useReservation } from "./booking/ReservationModal";
import { Wordmark } from "./Wordmark";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", key: "nav.home" },
  { href: "/menu", key: "nav.menu" },
  { href: "/about", key: "nav.about" },
  { href: "/account", key: "nav.account" },
];

export function Header() {
  const pathname = usePathname();
  const { t } = useLang();
  const { open: openReservation } = useReservation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin")) return null; // admin has its own chrome

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled ? "bg-ink-950/80 backdrop-blur-xl" : "bg-gradient-to-b from-ink-950/80 via-ink-950/30 to-transparent"
      )}
    >
      <div className="container-x py-3.5 sm:py-4">
        {/* Top row */}
        <div className="flex items-center justify-between gap-3">
          {/* Brand lockup — premium serif logotype */}
          <Link href="/" aria-label="BALANCE — Coctails & Shisha" className="group flex shrink-0 flex-col items-center justify-center leading-none">
            <Wordmark className="h-[18px] w-auto transition sm:h-[22px]" />
            <span className="mt-2 flex items-center gap-2 text-[7px] uppercase tracking-[0.4em] text-ember/70 transition-colors group-hover:text-ember sm:text-[8px]">
              <span className="h-px w-3 bg-gradient-to-r from-transparent to-ember/60 sm:w-4" />
              Coctails &amp; Shisha
              <span className="h-px w-3 bg-gradient-to-l from-transparent to-ember/60 sm:w-4" />
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((n) => (
              <NavLink key={n.href} href={n.href} active={pathname === n.href} label={t(n.key)} />
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            <LanguageSwitcher />
            <button
              onClick={openReservation}
              aria-label={t("cta.reserve")}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition sm:px-6 sm:py-2.5 sm:text-xs"
              style={{ background: "linear-gradient(135deg, #ff2d3a, #c47a2f)" }}
            >
              <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: "linear-gradient(135deg, #ff5a63, #e6a15a)" }} />
              <svg className="relative sm:hidden" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span className="relative hidden sm:inline">{t("cta.reserve")}</span>
            </button>
          </div>
        </div>

        {/* Mobile / tablet nav row (top panel, no hamburger) */}
        <nav className="mt-3 flex items-center justify-between gap-1 border-t border-white/5 pt-2.5 lg:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-[13px] tracking-wide transition",
                pathname === n.href ? "bg-neon/15 text-neon" : "text-neutral-300 hover:text-neutral-50"
              )}
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>
      </div>

      {/* Refined hairline that fades in on scroll */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-px transition-opacity duration-500",
          scrolled ? "opacity-100" : "opacity-0"
        )}
        style={{ background: "linear-gradient(90deg, transparent, rgba(230,161,90,0.4), rgba(255,45,58,0.35), transparent)" }}
      />
    </header>
  );
}

function NavLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative whitespace-nowrap py-1 text-[13px] uppercase tracking-[0.12em] transition-colors",
        active ? "text-neon" : "text-neutral-300 hover:text-neutral-50"
      )}
    >
      {label}
      <span
        className={cn(
          "absolute -bottom-0.5 left-0 h-px bg-gradient-to-r from-neon to-ember transition-all duration-300",
          active ? "w-full shadow-glow" : "w-0 group-hover:w-full"
        )}
      />
    </Link>
  );
}
