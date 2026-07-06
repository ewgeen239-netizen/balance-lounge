"use client";

import { useState } from "react";
import type { AdminBar, AdminAbout } from "./types";
import { TranslatableInput } from "./TranslatableInput";
import { ImageUpload } from "./ImageUpload";
import { parseJSON, type HoursRow } from "@/lib/utils";
import { WEEKDAYS } from "@/lib/i18n";

export function ContentPanel({ bar, about }: { bar: AdminBar; about: AdminAbout }) {
  const [b, setB] = useState<AdminBar>(bar);
  const [a, setA] = useState<AdminAbout>(about);
  const [hours, setHours] = useState<HoursRow[]>(() => {
    const parsed = parseJSON<HoursRow[]>(bar.hours, []);
    return [1, 2, 3, 4, 5, 6, 0].map((d) => parsed.find((h) => h.day === d) ?? { day: d, open: "16:00", close: "00:00", closed: true });
  });
  const [gallery, setGallery] = useState<string[]>(parseJSON<string[]>(bar.gallery, []));
  const [aboutImages, setAboutImages] = useState<string[]>(parseJSON<string[]>(about.images, []));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function setBar<K extends keyof AdminBar>(k: K, v: AdminBar[K]) { setB((x) => ({ ...x, [k]: v })); }
  function setAbout<K extends keyof AdminAbout>(k: K, v: AdminAbout[K]) { setA((x) => ({ ...x, [k]: v })); }
  function setHour(day: number, patch: Partial<HoursRow>) {
    setHours((hs) => hs.map((h) => (h.day === day ? { ...h, ...patch } : h)));
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bar: {
          address: b.address, phone: b.phone, email: b.email,
          instagram: b.instagram, whatsapp: b.whatsapp, telegram: b.telegram,
          heroImage: b.heroImage, heroNeon: b.heroNeon,
          lat: b.lat, lng: b.lng,
          hours, gallery,
        },
        about: {
          heading: a.heading, subheading: a.subheading, body: a.body, images: aboutImages,
        },
      }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="wordmark text-2xl text-neutral-50">Site content</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
          <button onClick={save} disabled={saving} className="btn-primary text-sm disabled:opacity-50">{saving ? "Saving…" : "Save all changes"}</button>
        </div>
      </div>

      {/* Contact & hero */}
      <Section title="Contact & hero">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Address"><input value={b.address} onChange={(e) => setBar("address", e.target.value)} className="input" /></Field>
          <Field label="Phone"><input value={b.phone} onChange={(e) => setBar("phone", e.target.value)} className="input" /></Field>
          <Field label="Email"><input value={b.email} onChange={(e) => setBar("email", e.target.value)} className="input" /></Field>
          <Field label="Hero neon text"><input value={b.heroNeon} onChange={(e) => setBar("heroNeon", e.target.value)} className="input" /></Field>
          <Field label="Instagram URL"><input value={b.instagram} onChange={(e) => setBar("instagram", e.target.value)} className="input" /></Field>
          <Field label="WhatsApp URL"><input value={b.whatsapp} onChange={(e) => setBar("whatsapp", e.target.value)} className="input" /></Field>
          <Field label="Telegram URL"><input value={b.telegram} onChange={(e) => setBar("telegram", e.target.value)} className="input" /></Field>
          <Field label="Latitude"><input type="number" step="0.0001" value={b.lat} onChange={(e) => setBar("lat", Number(e.target.value))} className="input" /></Field>
          <Field label="Longitude"><input type="number" step="0.0001" value={b.lng} onChange={(e) => setBar("lng", Number(e.target.value))} className="input" /></Field>
        </div>
        <div className="mt-4">
          <ImageUpload label="Hero image" value={b.heroImage} onChange={(url) => setBar("heroImage", url)} />
        </div>
      </Section>

      {/* Hours */}
      <Section title="Opening hours">
        <div className="space-y-2">
          {hours.map((h) => (
            <div key={h.day} className="flex flex-wrap items-center gap-3">
              <span className="w-28 text-sm text-neutral-300">{WEEKDAYS.en[h.day]}</span>
              <label className="flex items-center gap-2 text-xs text-neutral-400">
                <input type="checkbox" checked={!h.closed} onChange={(e) => setHour(h.day, { closed: !e.target.checked })} className="h-4 w-4 accent-[#ff2d3a]" />
                Open
              </label>
              <input type="time" disabled={h.closed} value={h.open} onChange={(e) => setHour(h.day, { open: e.target.value })} className="input w-32 py-1.5 text-sm disabled:opacity-40" />
              <span className="text-neutral-500">–</span>
              <input type="time" disabled={h.closed} value={h.close} onChange={(e) => setHour(h.day, { close: e.target.value })} className="input w-32 py-1.5 text-sm disabled:opacity-40" />
            </div>
          ))}
        </div>
      </Section>

      {/* About */}
      <Section title="About (O NAS)">
        <div className="space-y-5">
          <TranslatableInput label="Heading" value={a.heading} onChange={(v) => setAbout("heading", v)} />
          <TranslatableInput label="Subheading" value={a.subheading} onChange={(v) => setAbout("subheading", v)} />
          <TranslatableInput label="Body (paragraphs separated by empty line)" value={a.body} onChange={(v) => setAbout("body", v)} multiline />
          <ImageList label="About images" images={aboutImages} setImages={setAboutImages} />
        </div>
      </Section>

      {/* Gallery */}
      <Section title="Gallery">
        <ImageList label="Gallery images" images={gallery} setImages={setGallery} />
      </Section>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">{saving ? "Saving…" : "Save all changes"}</button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-ink-800/30 p-6">
      <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-ember">{title}</h3>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}

function ImageList({ label, images, setImages }: { label: string; images: string[]; setImages: (v: string[]) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="space-y-3">
        {images.map((src, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex-1">
              <ImageUpload label="" value={src} onChange={(url) => setImages(images.map((s, idx) => (idx === i ? url : s)))} />
            </div>
            <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="text-neutral-500 hover:text-neon">✕</button>
          </div>
        ))}
        <button onClick={() => setImages([...images, ""])} className="btn-ghost text-xs">+ Add image</button>
      </div>
    </div>
  );
}
