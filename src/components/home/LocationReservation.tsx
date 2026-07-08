"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/LangProvider";
import { useReservation } from "@/components/booking/ReservationModal";
import { weekdays } from "@/lib/i18n";
import { parseJSON, type HoursRow } from "@/lib/utils";
import { SocialLinks } from "@/components/SocialLinks";

type BarData = {
  address: string;
  phone: string;
  hours: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
  telegram: string;
  lat: number;
  lng: number;
};

export function LocationReservation({ bar }: { bar: BarData }) {
  const { t, lang } = useLang();
  const { open } = useReservation();
  const hours = parseJSON<HoursRow[]>(bar.hours, []);
  const order = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
  const todayDow = new Date().getDay();

  // Pin the exact coordinates (marker) but keep the address as the visible text.
  const mapsEmbed = `https://maps.google.com/maps?q=${bar.lat},${bar.lng}&z=17&output=embed`;
  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${bar.lat},${bar.lng}`;

  return (
    <section className="container-x py-16">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* LEFT — info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl p-8 sm:p-10"
        >
          <h3 className="wordmark accent-underline text-2xl text-neutral-50">{t("home.contact")}</h3>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="label">{t("home.address")}</p>
              <p className="text-neutral-200">{bar.address}</p>

              <p className="label mt-6">{t("home.phone")}</p>
              <a href={`tel:${bar.phone.replace(/\s/g, "")}`} className="text-lg text-ember hover:text-neon">
                {bar.phone}
              </a>

              <p className="label mt-6">{t("home.socials")}</p>
              <SocialLinks instagram={bar.instagram} facebook={bar.facebook} whatsapp={bar.whatsapp} telegram={bar.telegram} />
            </div>

            <div>
              <p className="label">{t("home.hours")}</p>
              <ul className="space-y-1.5 text-sm">
                {order.map((d) => {
                  const row = hours.find((h) => h.day === d);
                  const isToday = d === todayDow;
                  return (
                    <li
                      key={d}
                      className={`flex justify-between gap-4 ${isToday ? "text-neon" : "text-neutral-300"}`}
                    >
                      <span>{weekdays(lang)[d]}</span>
                      <span className="tabular-nums">
                        {!row || row.closed ? "—" : `${row.open}–${row.close}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* RIGHT — reservation CTA card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl border border-neon/30 p-8 sm:p-10 shadow-glow"
          style={{ background: "linear-gradient(160deg, rgba(255,45,58,0.12), rgba(15,11,13,0.9))" }}
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-neon/20 blur-3xl" />
          <div className="relative">
            <h3 className="wordmark text-2xl text-neutral-50">{t("home.reserveTitle")}</h3>
            <p className="mt-4 text-neutral-300">{t("home.reserveText")}</p>
            <button onClick={open} className="btn-primary mt-8 w-full">{t("cta.bookTable")}</button>
          </div>
        </motion.div>
      </div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="mt-6 overflow-hidden rounded-3xl border border-white/10"
      >
        <iframe
          title="Balance map"
          src={mapsEmbed}
          className="h-[340px] w-full grayscale-[0.3] contrast-125"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="flex items-center justify-between gap-4 bg-ink-900/80 px-6 py-4">
          <span className="text-sm text-neutral-400">{bar.address}</span>
          <a href={routeUrl} target="_blank" rel="noreferrer" className="btn-ghost">
            {t("cta.route")}
          </a>
        </div>
      </motion.div>
    </section>
  );
}
