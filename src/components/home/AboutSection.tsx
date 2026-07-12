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
    <section id="about" className="container-x relative py-24">
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

        {/* RIGHT — photo collage: smaller base photo, second overlapping it */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative lg:mt-14 lg:pl-8"
        >
          <div className="relative aspect-[4/5] w-4/5 overflow-hidden rounded-3xl border border-white/10 shadow-card shadow-ember">
            <Image src="/interior-3.webp" alt="Balance wnętrze" fill className="object-cover object-[center_60%]" sizes="(max-width:1024px) 80vw, 32vw" priority />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neon/10 to-transparent" />
          </div>
          <div className="relative -mt-20 ml-auto aspect-[4/5] w-3/5 overflow-hidden rounded-3xl border border-neon/30 shadow-card shadow-glow lg:-mt-24">
            <Image src="/gallery/g30.JPG" alt="Balance lounge" fill className="object-cover object-[center_35%]" sizes="(max-width:1024px) 60vw, 24vw" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neon/10 to-transparent" />
          </div>
        </motion.div>
      </div>

      {/* Soft blur emanating from the photo's left edge (~55%) leftward onto the
          text ends; the photo itself stays sharp. Desktop only. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
      {[
        { blur: 3, left: 12, start: 34, end: 62, right: 82 },
        { blur: 7, left: 20, start: 40, end: 66, right: 86 },
        { blur: 12, left: 28, start: 46, end: 70, right: 90 },
      ].map((l, i) => {
        const mask = `linear-gradient(to right, transparent ${l.left}%, black ${l.start}%, black ${l.end}%, transparent ${l.right}%)`;
    
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${l.blur}px)`,
              WebkitBackdropFilter: `blur(${l.blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
    </div>
    }
