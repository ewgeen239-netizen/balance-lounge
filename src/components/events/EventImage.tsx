/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";
import { isVideoUrl } from "@/lib/media";
import { EventVideo } from "./EventVideo";

/**
 * An event photo (or video) of any proportions shown in full (never cropped).
 * The box keeps its own size; the space the media doesn't cover is filled with
 * a blurred, darkened copy of the same media instead of empty bars.
 */
export function EventImage({ src, dim = false, lazy = false, controls = false, className }: { src: string; dim?: boolean; lazy?: boolean; controls?: boolean; className?: string }) {
  if (isVideoUrl(src)) return <EventVideo src={src} dim={dim} controls={controls} className={className} />;
  return (
    <div className={cn("relative overflow-hidden bg-ink-800", className)}>
      <img
        src={src}
        alt=""
        aria-hidden
        loading={lazy ? "lazy" : undefined}
        className={cn("absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl", dim && "grayscale")}
      />
      <img
        src={src}
        alt=""
        loading={lazy ? "lazy" : undefined}
        className={cn("relative h-full w-full object-contain", dim && "brightness-[0.45] grayscale")}
      />
    </div>
  );
}
