"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// Premium bento arrangement: a large lead tile, then a balanced mix of
// wide / tall cells. object-position keeps the important part framed everywhere.
const SPAN: Record<number, string> = {
  0: "col-span-2 row-span-2",
  3: "row-span-2",
  6: "col-span-2",
  9: "row-span-2",
  12: "col-span-2",
};

export function Gallery({ images }: { images: string[] }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, images.length]);

  if (!images.length) return null;

  return (
    <section className="container-x py-12">
      <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:gap-4 md:grid-cols-4">
        {images.map((src, i) => (
          <motion.button
            key={src + i}
            type="button"
            onClick={() => setOpen(i)}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: (i % 5) * 0.05 }}
            aria-label={`Otwórz zdjęcie ${i + 1}`}
            className={`group relative overflow-hidden rounded-2xl border border-white/10 outline-none focus-visible:ring-2 focus-visible:ring-neon ${SPAN[i] ?? ""}`}
          >
            <Image
              src={src}
              alt={`Balance ${i + 1}`}
              fill
              className="object-cover object-[center_40%] transition duration-500 group-hover:scale-[1.06]"
              sizes="(max-width:768px) 50vw, 25vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/40 to-transparent opacity-70 transition group-hover:opacity-25" />
          </motion.button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {open !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(null)}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-ink-950/95 p-4 sm:p-8"
          >
            <button
              onClick={() => setOpen(null)}
              aria-label="Zamknij"
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-neutral-200 transition hover:border-neon hover:text-neon"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>

            <Arrow dir="left" onClick={(e) => { e.stopPropagation(); setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length)); }} />
            <Arrow dir="right" onClick={(e) => { e.stopPropagation(); setOpen((i) => (i === null ? i : (i + 1) % images.length)); }} />

            <motion.div
              key={open}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative h-[80vh] w-full max-w-5xl"
            >
              <Image src={images[open]} alt={`Balance ${open + 1}`} fill className="rounded-2xl object-contain" sizes="100vw" priority />
            </motion.div>

            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-neutral-400">
              {open + 1} / {images.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Arrow({ dir, onClick }: { dir: "left" | "right"; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === "left" ? "Poprzednie" : "Następne"}
      className={`absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-ink-900/60 text-neutral-200 transition hover:border-neon hover:text-neon ${dir === "left" ? "left-3 sm:left-6" : "right-3 sm:right-6"}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {dir === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 6l6 6-6 6" />}
      </svg>
    </button>
  );
}
