"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "./LangProvider";
import { Wordmark } from "./Wordmark";
import { SocialLinks } from "./SocialLinks";

type FooterProps = {
  address: string;
  phone: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
  telegram: string;
};

export function Footer(props: FooterProps) {
  const { t } = useLang();
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-24 border-t border-white/10 bg-ink-950/60">
      <div className="container-x grid gap-10 py-14 md:grid-cols-3">
        <div>
          <Wordmark className="text-xl text-neutral-50" />
          <p className="wordmark-sub mt-2 text-[10px] text-ember/70">COCTAILS &amp; SHISHA</p>
          <p className="mt-4 max-w-xs text-sm text-neutral-400">
            {props.address}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="label">{t("home.contact")}</p>
          <a href={`tel:${props.phone.replace(/\s/g, "")}`} className="block text-neutral-200 hover:text-neon">
            {props.phone}
          </a>
          <SocialLinks instagram={props.instagram} facebook={props.facebook} whatsapp={props.whatsapp} telegram={props.telegram} size="sm" className="pt-3" />
        </div>

        <div className="space-y-2 text-sm md:text-right">
          <Link href="/menu" className="block text-neutral-300 hover:text-neon">{t("nav.menu")}</Link>
          <Link href="/booking" className="block text-neutral-300 hover:text-neon">{t("nav.booking")}</Link>
          <Link href="/about" className="block text-neutral-300 hover:text-neon">{t("nav.about")}</Link>
          <Link href="/account" className="block text-neutral-300 hover:text-neon">{t("nav.account")}</Link>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} BALANCE — Szczecin. {t("footer.rights")}
      </div>
    </footer>
  );
}
