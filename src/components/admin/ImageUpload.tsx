"use client";

import { useState } from "react";
import Image from "next/image";

export function ImageUpload({ value, onChange, label = "Photo" }: { value: string; onChange: (url: string) => void; label?: string }) {
  const [uploading, setUploading] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const j = await res.json();
      onChange(j.url);
    }
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-ink-800">
          {value ? <Image src={value} alt="" fill className="object-cover" sizes="64px" /> : <span className="flex h-full items-center justify-center text-xs text-neutral-600">—</span>}
        </div>
        <div className="flex-1 space-y-2">
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/…  or  https://…" className="input text-sm" />
          <label className="btn-ghost cursor-pointer text-xs">
            {uploading ? "Uploading…" : "Upload file"}
            <input type="file" accept="image/*" className="hidden" onChange={handle} />
          </label>
        </div>
      </div>
    </div>
  );
}
