"use client";
import { useEffect, useState } from "react";
import type { SharedContent } from "@/lib/mobile-contract";

const field = "w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm text-neutral-100 outline-none focus:border-ember";
type Kind = "events" | "promotions" | "discounts";
type Snapshot = { revision: string; content: SharedContent };
export function MobileContentPanel() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [kind, setKind] = useState<Kind>("events");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function load() {
    setBusy(true);
    try { const r = await fetch("/api/mobile/content", { cache: "no-store" }); if (!r.ok) throw Error("Nie udało się pobrać danych."); setSnapshot(await r.json()); setMessage(""); }
    catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);
  function edit(group: Kind, index: number, key: string, value: unknown) {
    setSnapshot(current => current && ({ ...current, content: { ...current.content, [group]: current.content[group].map((row, i) => i === index ? { ...row, [key]: value } : row) } }));
  }
  function add() {
    if (!snapshot) return;
    const common = { id: crypto.randomUUID(), active: false };
    const row = kind === "events" ? { ...common, title: "Nowe wydarzenie", detail: "", date: new Date().toISOString(), image: "/gallery/g30.JPG" } : kind === "promotions" ? { ...common, title: "Nowa aktualność", detail: "", image: "/head.jpg" } : { ...common, name: "Nowy rabat", percent: 10, birthdayOnly: false };
    setSnapshot({ ...snapshot, content: { ...snapshot.content, [kind]: [...snapshot.content[kind], row] } });
  }
  async function upload(group: "events" | "promotions", index: number, file?: File) {
    if (!file) return; setBusy(true);
    try {
      if (!file.type.startsWith("image/") || file.size > 6 * 1024 * 1024) throw Error("Wybierz zdjęcie do 6 MB.");
      const form = new FormData(); form.append("file", file);
      const r = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!r.ok) throw Error("Nie udało się przesłać zdjęcia.");
      const body = await r.json(); edit(group, index, "image", body.url);
    } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  async function save() {
    if (!snapshot) return; setBusy(true); setMessage("");
    try {
      const r = await fetch("/api/mobile/content", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation: "content", expectedRevision: snapshot.revision, content: snapshot.content }) });
      if (r.status === 409) throw Error("Dane zmieniły się na innym urządzeniu. Odśwież dane przed ponowną edycją.");
      if (r.status === 503) throw Error("Baza wymaga migracji MobileContent. Instrukcja: MOBILE-INTEGRATION.md.");
      if (!r.ok) throw Error("Nie zapisano. Sprawdź pola i uprawnienia właściciela.");
      setSnapshot(await r.json()); setMessage("Zapisano. Zmiany dostępne na stronie i w aplikacji.");
    } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  return <section className="space-y-6 pb-20">
    <div><h1 className="text-2xl font-medium text-neutral-100">Wydarzenia i oferty</h1><p className="mt-2 max-w-2xl text-sm text-neutral-400">Wspólna treść strony i aplikacji BALANCE. Nowe wpisy są nieaktywne — włącz je, gdy będą gotowe.</p></div>
    <div className="flex flex-wrap gap-3">{([['events','Wydarzenia'],['promotions','Aktualności'],['discounts','Rabaty']] as const).map(([value,label]) => <button key={value} onClick={() => setKind(value)} className={kind === value ? "btn-primary" : "btn-ghost"}>{label}</button>)}</div>
    <div className="flex flex-wrap gap-3"><button onClick={add} disabled={!snapshot || busy} className="btn-ghost">+ Dodaj</button><button onClick={save} disabled={!snapshot || busy} className="btn-primary">{busy ? "Zapisywanie…" : "Zapisz zmiany"}</button><button onClick={load} disabled={busy} className="btn-ghost">Odśwież dane</button></div>
    {message && <p role="status" className="rounded-xl border border-ember/30 bg-ember/5 p-4 text-sm text-ember">{message}</p>}
    {snapshot && kind === "events" && snapshot.content.events.map((row,index) => <article key={row.id} className="glass grid gap-5 rounded-2xl p-5 md:grid-cols-[220px_1fr]">
      <div><img src={row.image || "/head.jpg"} alt="" className="h-40 w-full rounded-xl object-cover"/><label className="mt-3 block text-xs text-neutral-300">Zmień zdjęcie<input aria-label="Zdjęcie wydarzenia" type="file" accept="image/*" disabled={busy} className="mt-2 block w-full text-xs" onChange={e => upload("events",index,e.target.files?.[0])}/></label></div>
      <div className="space-y-3"><label className="block text-xs text-neutral-400">Tytuł<input className={field} value={row.title} onChange={e => edit("events",index,"title",e.target.value)}/></label><label className="block text-xs text-neutral-400">Opis<textarea className={field} value={row.detail} onChange={e => edit("events",index,"detail",e.target.value)}/></label><label className="block text-xs text-neutral-400">Data i czas (strefa urządzenia)<input type="datetime-local" className={field} value={new Date(new Date(row.date).getTime() - new Date(row.date).getTimezoneOffset()*60000).toISOString().slice(0,16)} onChange={e => { if(e.target.value) edit("events",index,"date",new Date(e.target.value).toISOString()); }}/></label><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={row.active} onChange={e => edit("events",index,"active",e.target.checked)}/>Widoczne na stronie i w aplikacji</label></div>
    </article>)}
    {snapshot && kind === "promotions" && snapshot.content.promotions.map((row,index) => <article key={row.id} className="glass grid gap-5 rounded-2xl p-5 md:grid-cols-[220px_1fr]">
      <div><img src={row.image || "/head.jpg"} alt="" className="h-40 w-full rounded-xl object-cover"/><label className="mt-3 block text-xs text-neutral-300">Zmień zdjęcie<input aria-label="Zdjęcie aktualności" type="file" accept="image/*" disabled={busy} className="mt-2 block w-full text-xs" onChange={e => upload("promotions",index,e.target.files?.[0])}/></label></div>
      <div className="space-y-3"><label className="block text-xs text-neutral-400">Tytuł<input className={field} value={row.title} onChange={e => edit("promotions",index,"title",e.target.value)}/></label><label className="block text-xs text-neutral-400">Opis<textarea className={field} value={row.detail} onChange={e => edit("promotions",index,"detail",e.target.value)}/></label><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={row.active} onChange={e => edit("promotions",index,"active",e.target.checked)}/>Widoczne</label></div>
    </article>)}
    {snapshot && kind === "discounts" && snapshot.content.discounts.map((row,index) => <article key={row.id} className="glass space-y-4 rounded-2xl p-5">
      <label className="block text-xs text-neutral-400">Nazwa<input className={field} value={row.name} onChange={e => edit("discounts",index,"name",e.target.value)}/></label>
      <label className="block text-xs text-neutral-400">Rabat (%)<input type="number" min={1} max={100} className={field} value={row.percent} onChange={e => edit("discounts",index,"percent",Number(e.target.value))}/></label>
      <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={row.birthdayOnly} onChange={e => edit("discounts",index,"birthdayOnly",e.target.checked)}/>Tylko w dniu urodzin</label>
      <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={row.active} onChange={e => edit("discounts",index,"active",e.target.checked)}/>Aktywny</label>
    </article>)}
  </section>;
}
