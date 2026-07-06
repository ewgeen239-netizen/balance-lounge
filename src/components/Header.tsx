"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "./LangProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useReservation } from "./booking/ReservationModal";
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  if (pathname.startsWith("/admin")) return null; // admin has its own chrome

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "bg-ink-950/85 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
      )}
    >
      <div className="container-x flex items-center justify-between gap-4 py-4">
        <Link href="/" className="leading-none">
          <span className="wordmark text-lg text-neutral-50">BALANCE</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "text-sm tracking-wide transition relative py-1",
                pathname === n.href ? "text-neon" : "text-neutral-300 hover:text-neutral-50"
              )}
            >
              {t(n.key)}
              {pathname === n.href && (
                <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-neon shadow-glow" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher className="hidden sm:flex" />
          <button onClick={openReservation} className="btn-primary hidden sm:inline-flex">
            {t("cta.reserve")}
          </button>
          <button
            className="md:hidden rounded-lg border border-white/15 p-2 text-neutral-200"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-ink-950/95 backdrop-blur-xl">
          <nav className="container-x flex flex-col py-4 gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-lg px-3 py-3 text-base",
                  pathname === n.href ? "text-neon bg-white/5" : "text-neutral-200"
                )}
              >
                {t(n.key)}
              </Link>
            ))}
            <div className="flex items-center justify-between gap-3 pt-3">
              <LanguageSwitcher />
              <button onClick={openReservation} className="btn-primary flex-1 text-center">
                {t("cta.reserve")}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
