"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MAX_VIDEO_BYTES, isVideoFile, isVideoUrl } from "@/lib/media";

// Vercel refuses request bodies over 4.5 MB, and phone photos are often bigger,
// so large photos are scaled down in the browser before upload.
const MAX_UPLOAD = 4_200_000;
const SHRINK_ABOVE = 1_500_000;
const MAX_SIDE = 2400;

async function shrink(file: File): Promise<File> {
  if (file.size <= SHRINK_ABOVE || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // a format this browser can't decode — upload as is
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

class UploadError extends Error {
  constructor(public status: number) { super(String(status)); }
}

/** Plain upload through our own route (photos, and videos in local dev). */
async function postFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) throw new UploadError(res.status);
  return (await res.json()).url;
}

/** Videos go straight from the browser to Vercel Blob (no 4.5 MB limit); without Blob (local dev) — through our route. */
async function uploadVideo(file: File, onProgress: (pct: number) => void): Promise<string> {
  const cfg = await fetch("/api/admin/upload/video");
  if (!cfg.ok) throw new UploadError(cfg.status);
  if (!(await cfg.json()).blob) return postFile(file);
  const { upload } = await import("@vercel/blob/client");
  const ext = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
  const blob = await upload(`uploads/${Date.now()}.${ext}`, file, {
    access: "public",
    handleUploadUrl: "/api/admin/upload/video",
    contentType: file.type || "video/mp4",
    multipart: file.size > 20 * 1024 * 1024,
    onUploadProgress: ({ percentage }) => onProgress(Math.round(percentage)),
  });
  return blob.url;
}

/**
 * Photo field: drop a file onto it, click to pick one, or paste a link.
 * With `allowVideo` it also takes a short video (MP4 / MOV / WEBM).
 * `onBusyChange` lets a form hold its save button while the file uploads.
 */
export function ImageUpload({
  value,
  onChange,
  label = "Photo",
  allowVideo = false,
  onBusyChange,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  allowVideo?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const depth = useRef(0); // dragenter/leave fire for every child element

  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);

  async function upload(raw: File | undefined) {
    if (!raw) return;
    setError("");
    const video = isVideoFile(raw);
    const image = raw.type.startsWith("image/") || /\.(heic|heif|jpe?g|png|webp|gif|avif)$/i.test(raw.name);
    if (video && !allowVideo) {
      setError("Tutaj można dodać tylko zdjęcie (JPG, PNG lub WEBP).");
      return;
    }
    if (!video && !image) {
      setError(allowVideo ? "To nie jest zdjęcie ani wideo — przeciągnij JPG, PNG, WEBP albo MP4 / MOV." : "To nie jest zdjęcie — przeciągnij plik JPG, PNG lub WEBP.");
      return;
    }
    if (video && raw.size > MAX_VIDEO_BYTES) {
      setError("Wideo jest za duże (ponad 100 MB). Skróć je albo zapisz w mniejszej jakości i spróbuj ponownie.");
      return;
    }
    setBusy(true);
    try {
      if (video) {
        setProgress(0);
        onChange(await uploadVideo(raw, setProgress));
        return;
      }
      const file = await shrink(raw);
      if (file.size > MAX_UPLOAD) {
        setError("Zdjęcie jest za duże (ponad 4 MB). Zapisz je w mniejszym rozmiarze i spróbuj ponownie.");
        return;
      }
      onChange(await postFile(file));
    } catch (e) {
      const status = e instanceof UploadError ? e.status : 0;
      setError(
        status === 401 || status === 403
          ? "Sesja wygasła — zaloguj się ponownie w nowej karcie i wgraj plik jeszcze raz."
          : status === 413
            ? "Plik jest za duży. Zapisz go w mniejszym rozmiarze."
            : status
              ? video ? "Nie udało się wgrać wideo. Spróbuj ponownie." : "Nie udało się wgrać zdjęcia. Spróbuj ponownie."
              : video ? "Wideo nie zostało wgrane — sprawdź połączenie i spróbuj ponownie." : "Brak połączenia — zdjęcie nie zostało wgrane. Spróbuj ponownie."
      );
    } finally {
      setBusy(false);
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  const uploading = progress !== null ? `Wgrywanie… ${progress}%` : "Wgrywanie…";

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div
        onDragEnter={(e) => { e.preventDefault(); depth.current++; setOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
        onDragLeave={() => { depth.current = Math.max(0, depth.current - 1); if (!depth.current) setOver(false); }}
        onDrop={(e) => { e.preventDefault(); depth.current = 0; setOver(false); upload(e.dataTransfer.files?.[0]); }}
        className={cn(
          "flex items-center gap-4 rounded-2xl border border-dashed p-2.5 transition",
          over ? "border-ember bg-ember/10" : "border-white/10"
        )}
      >
        <button
          type="button"
          onClick={() => input.current?.click()}
          title={allowVideo ? "Przeciągnij zdjęcie lub wideo tutaj albo kliknij" : "Przeciągnij zdjęcie tutaj lub kliknij"}
          className="relative flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-ink-800 text-neutral-500 transition hover:border-ember/50"
        >
          {value && isVideoUrl(value) ? (
            <>
              <video src={`${value}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-contain" />
              <span className="absolute bottom-1 right-1 rounded bg-ink-950/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-ember">wideo</span>
            </>
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.5" /><path d="M21 16l-5-5-8 8" />
            </svg>
          )}
          {busy && (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink-950/70">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-ember border-t-transparent" />
              {progress !== null && <span className="text-[10px] font-semibold tabular-nums text-ember">{progress}%</span>}
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs text-neutral-400">
            {busy ? uploading : over ? "Upuść, aby wgrać" : allowVideo ? "Przeciągnij zdjęcie lub wideo (MP4 / MOV, do 100 MB) albo kliknij miniaturę" : "Przeciągnij zdjęcie tutaj albo kliknij miniaturę"}
          </p>
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/…  or  https://…" className="input text-sm" />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-ghost px-4 py-1.5 text-xs disabled:opacity-50">
              {busy ? uploading : "Wybierz plik"}
            </button>
            {value && !busy && (
              <button type="button" onClick={() => onChange("")} className="px-2 text-xs text-neutral-500 hover:text-neon">
                {isVideoUrl(value) ? "usuń wideo" : "usuń zdjęcie"}
              </button>
            )}
          </div>
          <input ref={input} type="file" accept={allowVideo ? "image/*,video/mp4,video/quicktime,video/webm" : "image/*"} className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </div>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-neon">{error}</p>}
    </div>
  );
}
