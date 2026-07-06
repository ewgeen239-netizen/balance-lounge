"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useLang } from "@/components/LangProvider";
import { parseJSON } from "@/lib/utils";

type AboutData = {
  heading: string;
  subheading: string;
  body: string;
  images: string;
};

export function AboutSection({ about }: { about: AboutData }) {
  const { tr } = useLang();
  const images = parseJSON<string[]>(about.images, []);
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

        {/* RIGHT — photo collage, offset lower */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative lg:mt-16 lg:pl-10"
        >
          {images[0] && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/10 shadow-card shadow-ember">
              <Image src={images[0]} alt="Balance wnętrze" fill className="object-cover" sizes="(max-width:1024px) 100vw, 40vw" />
            </div>
          )}
          {images[1] && (
            <div className="relative -mt-16 ml-auto aspect-[4/3] w-3/4 overflow-hidden rounded-3xl border border-neon/30 shadow-card shadow-glow lg:-mt-20">
              <Image src={images[1]} alt="Balance lounge" fill className="object-cover" sizes="(max-width:1024px) 75vw, 30vw" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neon/10 to-transparent" />
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
