"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useLang } from "@/components/LangProvider";

type AboutData = {
  heading: string;
  subheading: string;
  body: string;
  images: string;
};

export function AboutSection({ about }: { about: AboutData }) {
  const { tr } = useLang();
  const paragraphs = tr(about.body).split("\n\n").filter(Boolean);

  return (
    <section id="about" className="container-x py-24">
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        {/* LEFT — text */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="wordmark accent-underline text-4xl text-neutral-50 sm:text-5xl">
            {tr(about.heading)}
          </h2>
          <p className="mt-6 text-sm uppercase tracking-[0.3em] text-ember/80">
            {tr(about.subheading)}
          </p>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-neutral-300">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </motion.div>

        {/* RIGHT — two interior photos, shown in full (no crop) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="space-y-6 lg:pl-6"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-card shadow-ember">
            <Image src="/interior-3.webp" alt="Balance wnętrze" width={1920} height={1080} className="h-auto w-full" sizes="(max-width:1024px) 100vw, 45vw" priority />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neon/10 to-transparent" />
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-card">
            <Image src="/gallery/g30.JPG" alt="Balance lounge" width={900} height={1600} className="h-auto w-full" sizes="(max-width:1024px) 100vw, 45vw" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
