import { cn } from "@/lib/utils";

// BALANCE brand mark: Montserrat ExtraBold, wide tracking, uppercase, with a
// custom crossbar-less "A" (inverted V) and a three-bar "E". Size it with a
// font-size class (e.g. text-2xl); the custom glyphs scale in em.

function AGlyph() {
  return (
    <svg viewBox="0 0 78 100" style={{ height: "0.72em" }} className="inline-block shrink-0" fill="none" aria-hidden>
      <path d="M11 96 L39 6 L67 96" stroke="currentColor" strokeWidth="22" strokeLinejoin="miter" strokeLinecap="butt" />
    </svg>
  );
}

function EGlyph() {
  return (
    <svg viewBox="0 0 66 100" style={{ height: "0.72em" }} className="inline-block shrink-0" fill="none" aria-hidden>
      <path d="M9 11 H58 M9 50 H58 M9 89 H58" stroke="currentColor" strokeWidth="21" strokeLinecap="butt" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      aria-label="BALANCE"
      className={cn("inline-flex items-baseline leading-none", className)}
      style={{ fontFamily: "var(--font-mont), sans-serif", fontWeight: 800, columnGap: "0.24em" }}
    >
      <span>B</span>
      <AGlyph />
      <span>L</span>
      <AGlyph />
      <span>N</span>
      <span>C</span>
      <EGlyph />
    </span>
  );
}
