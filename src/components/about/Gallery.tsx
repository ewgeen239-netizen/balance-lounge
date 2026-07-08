"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function Gallery({ images }: { images: string[] }) {
  if (!images.length) return null;
  return (
    <section className="container-x py-12">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {images.map((src, i) => (
          <motion.div
            key={src + i}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: (i % 4) * 0.06 }}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10"
          >
            <Image
              src={src}
              alt={`Balance ${i + 1}`}
              fill
              className="object-cover object-center transition duration-500 group-hover:scale-105"
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/30 to-transparent" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
