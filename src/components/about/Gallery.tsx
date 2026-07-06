"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function Gallery({ images }: { images: string[] }) {
  if (!images.length) return null;
  return (
    <section className="container-x py-12">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {images.map((src, i) => (
          <motion.div
            key={src + i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
            className={`relative overflow-hidden rounded-2xl border border-white/10 ${i % 5 === 0 ? "md:col-span-2 md:row-span-2 aspect-square md:aspect-[2/1.4]" : "aspect-[4/3]"}`}
          >
            <Image src={src} alt={`Balance ${i + 1}`} fill className="object-cover transition duration-500 hover:scale-105" sizes="(max-width:768px) 50vw, 33vw" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
