import Link from "next/link";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const main = size === "lg" ? "text-5xl sm:text-7xl" : size === "sm" ? "text-lg" : "text-2xl";
  const sub = size === "lg" ? "text-xs sm:text-sm" : "text-[9px]";
  return (
    <Link href="/" className="group inline-block text-center leading-none">
      <span className={`wordmark block text-neutral-50 ${main} text-glow-ember`}>BALANCE</span>
      <span className={`wordmark-sub block text-ember/80 mt-2 ${sub}`}>COCTAILS &amp; SHISHA</span>
    </Link>
  );
}
