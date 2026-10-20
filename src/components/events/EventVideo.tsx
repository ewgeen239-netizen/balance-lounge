"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Event video shown like EventImage: the whole frame over a blurred copy of
 * itself. Muted and looping (so phones allow autoplay); it plays only while on
 * screen. `controls` adds a sound button for the opened event (native controls
 * would sit under the status badge and the close button).
 */
export function EventVideo({ src, dim = false, controls = false, className }: { src: string; dim?: boolean; controls?: boolean; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const videos = Array.from(el.querySelectorAll("video"));
    const io = new IntersectionObserver(
      ([entry]) => {
        for (const v of videos) {
          if (entry.isIntersecting) v.play().catch(() => undefined);
          else v.pause();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  return (
    <div ref={box} className={cn("relative overflow-hidden bg-ink-800", className)}>
      <video
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
        tabIndex={-1}
        className={cn("absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl", dim && "grayscale")}
      />
      <video
        ref={main}
        src={src}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className={cn("relative h-full w-full object-contain", dim && "brightness-[0.45] grayscale")}
      />
      {controls && (
        <button
          type="button"
          onClick={() => {
            setMuted(!muted);
            if (main.current) { main.current.muted = !muted; main.current.play().catch(() => undefined); }
          }}
          aria-label={muted ? "Włącz dźwięk" : "Wycisz"}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink-950/70 text-neutral-200 backdrop-blur transition hover:text-ember"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            {muted ? <path d="m23 9-6 6M17 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
          </svg>
        </button>
      )}
    </div>
  );
}
