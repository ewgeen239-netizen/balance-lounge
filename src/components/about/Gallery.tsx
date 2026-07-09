"use client";

import Image from "next/image";
import { motion } from "framer-motion";

// Premium bento arrangement: a large lead tile, then a balanced mix of
// wide / tall / square cells. object-center keeps subjects framed.
const SPAN: Record<number, string> = {
  0: "col-span-2 row-span-2", // hero
  3: "row-span-2",            // tall
  6: "col-span-2",            // wide
  9: "row-span-2",
  12: "col-span-2",
};

export function Gallery({ images }: { images: string[] }) {
  if (!images.length) return null;
  return (
    <section className="container-x py-12">
      <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:gap-4 md:grid-cols-4">
        {images.map((src, i) => (
          <motion.div
            key={src + i}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: (i % 5) * 0.05 }}
            className={`group relative overflow-hidden rounded-2xl border border-white/10 ${SPAN[i] ?? ""}`}
          >
            <Image
              src={src}
              alt={`Balance ${i + 1}`}
              fill
              className="object-cover object-center transition duration-500 group-hover:scale-[1.06]"
              sizes="(max-width:768px) 50vw, 25vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/40 to-transparent opacity-70 transition group-hover:opacity-30" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
