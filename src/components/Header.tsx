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
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "bg-ink-950/90 backdrop-blur-xl border-b border-white/10" : "bg-gradient-to-b from-ink-950/70 to-transparent"
      )}
    >
      <div className="container-x py-3">
        {/* Top row */}
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="shrink-0 leading-none" aria-label="BALANCE">
            <Wordmark className="h-4 w-auto sm:h-5 text-neutral-50" />
          </Link>

          {/* Desktop centered nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((n) => (
              <NavLink key={n.href} href={n.href} active={pathname === n.href} label={t(n.key)} />
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <button
              onClick={openReservation}
              aria-label={t("cta.reserve")}
              className="btn-primary px-3 py-2 sm:px-6 sm:py-3 sm:text-sm"
            >
              <svg className="sm:hidden" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span className="hidden sm:inline">{t("cta.reserve")}</span>
            </button>
          </div>
        </div>

        {/* Mobile nav row (top panel, no hamburger) */}
        <nav className="mt-2.5 flex items-center justify-between gap-1 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm transition",
                pathname === n.href ? "bg-neon/15 text-neon" : "text-neutral-300 hover:text-neutral-50"
              )}
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "relative py-1 text-sm tracking-wide transition",
        active ? "text-neon" : "text-neutral-300 hover:text-neutral-50"
      )}
    >
      {label}
      {active && <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-neon shadow-glow" />}
    </Link>
  );
}
