"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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

/**
 * Photo field: drop a file onto it, click to pick one, or paste a link.
 * `onBusyChange` lets a form hold its save button while the photo uploads.
 */
export function ImageUpload({
  value,
  onChange,
  label = "Photo",
  onBusyChange,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const depth = useRef(0); // dragenter/leave fire for every child element

  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);

  async function upload(raw: File | undefined) {
    if (!raw) return;
    setError("");
    if (!raw.type.startsWith("image/") && !/\.(heic|heif|jpe?g|png|webp|gif|avif)$/i.test(raw.name)) {
      setError("To nie jest zdjęcie — przeciągnij plik JPG, PNG lub WEBP.");
      return;
    }
    setBusy(true);
    try {
      const file = await shrink(raw);
      if (file.size > MAX_UPLOAD) {
        setError("Zdjęcie jest za duże (ponad 4 MB). Zapisz je w mniejszym rozmiarze i spróbuj ponownie.");
        return;
      }
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (res.ok) {
        onChange((await res.json()).url);
        return;
      }
      setError(
        res.status === 401 || res.status === 403
          ? "Sesja wygasła — zaloguj się ponownie w nowej karcie i wgraj zdjęcie jeszcze raz."
          : res.status === 413
            ? "Zdjęcie jest za duże. Zapisz je w mniejszym rozmiarze."
            : "Nie udało się wgrać zdjęcia. Spróbuj ponownie."
      );
    } catch {
      setError("Brak połączenia — zdjęcie nie zostało wgrane. Spróbuj ponownie.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

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
          title="Przeciągnij zdjęcie tutaj lub kliknij"
          className="relative flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-ink-800 text-neutral-500 transition hover:border-ember/50"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.5" /><path d="M21 16l-5-5-8 8" />
            </svg>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-ink-950/70">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-ember border-t-transparent" />
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs text-neutral-400">
            {busy ? "Wgrywanie…" : over ? "Upuść, aby wgrać" : "Przeciągnij zdjęcie tutaj albo kliknij miniaturę"}
          </p>
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/…  or  https://…" className="input text-sm" />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-ghost px-4 py-1.5 text-xs disabled:opacity-50">
              {busy ? "Wgrywanie…" : "Wybierz plik"}
            </button>
            {value && !busy && (
              <button type="button" onClick={() => onChange("")} className="px-2 text-xs text-neutral-500 hover:text-neon">usuń zdjęcie</button>
            )}
          </div>
          <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </div>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-neon">{error}</p>}
    </div>
  );
}
