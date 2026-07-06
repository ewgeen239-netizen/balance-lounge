"use client";

import { useMemo, useState } from "react";
import type { AdminReservation } from "./types";
import { cn } from "@/lib/utils";

const STATUSES = ["all", "pending", "confirmed", "seated", "cancelled"] as const;
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  confirmed: "bg-emerald-500/15 text-emerald-300",
  seated: "bg-sky-500/15 text-sky-300",
  cancelled: "bg-neutral-600/20 text-neutral-400",
};

export function ReservationsPanel({ initial }: { initial: AdminReservation[] }) {
  const [rows, setRows] = useState(initial);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [date, setDate] = useState("");

  const filtered = useMemo(
    () =>
      rows.filter((r) => (status === "all" || r.status === status) && (!date || r.date === date)),
    [rows, status, date]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, AdminReservation[]>();
    for (const r of filtered) {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date)!.push(r);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  async function setStatusFor(id: number, newStatus: string) {
    const res = await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
  }

  async function remove(id: number) {
    if (!confirm("Delete this reservation?")) return;
    const res = await fetch(`/api/admin/reservations/${id}`, { method: "DELETE" });
    if (res.ok) setRows((rs) => rs.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full border border-white/10 p-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn("rounded-full px-3 py-1.5 text-xs capitalize transition", status === s ? "bg-neon text-white" : "text-neutral-400 hover:text-neutral-200")}
            >
              {s}
            </button>
          ))}
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-auto text-sm" />
        {date && <button onClick={() => setDate("")} className="text-xs text-neutral-400 hover:text-neon">clear</button>}
        <span className="ml-auto text-sm text-neutral-500">{filtered.length} shown</span>
      </div>

      {byDay.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-800/40 p-10 text-center text-neutral-500">No reservations.</p>
      ) : (
        <div className="space-y-8">
          {byDay.map(([day, list]) => (
            <section key={day}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ember">{day} · {list.length}</h3>
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-ink-800/60 text-left text-xs uppercase tracking-wider text-neutral-500">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Guest</th>
                      <th className="px-4 py-3">Pax</th>
                      <th className="px-4 py-3">Zone / notes</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.sort((a, b) => a.time.localeCompare(b.time)).map((r) => (
                      <tr key={r.id} className="border-t border-white/5">
                        <td className="px-4 py-3 font-medium text-neutral-100">{r.time}</td>
                        <td className="px-4 py-3">
                          <div className="text-neutral-100">{r.name}</div>
                          <a href={`tel:${r.phone}`} className="text-xs text-neutral-500 hover:text-neon">{r.phone}</a>
                        </td>
                        <td className="px-4 py-3 text-neutral-300">{r.guests}</td>
                        <td className="px-4 py-3 text-neutral-400">
                          {r.zone}{r.comment ? <div className="text-xs text-neutral-500">{r.comment}</div> : null}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded-full px-2.5 py-1 text-xs capitalize", STATUS_STYLE[r.status])}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {r.status !== "confirmed" && <ActBtn onClick={() => setStatusFor(r.id, "confirmed")} title="Confirm" color="emerald">✓</ActBtn>}
                            {r.status !== "seated" && <ActBtn onClick={() => setStatusFor(r.id, "seated")} title="Seated" color="sky">◊</ActBtn>}
                            {r.status !== "cancelled" && <ActBtn onClick={() => setStatusFor(r.id, "cancelled")} title="Cancel" color="amber">✕</ActBtn>}
                            <ActBtn onClick={() => remove(r.id)} title="Delete" color="red">🗑</ActBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ActBtn({ children, onClick, title, color }: { children: React.ReactNode; onClick: () => void; title: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "hover:bg-emerald-500/20 hover:text-emerald-300",
    sky: "hover:bg-sky-500/20 hover:text-sky-300",
    amber: "hover:bg-amber-500/20 hover:text-amber-300",
    red: "hover:bg-neon/20 hover:text-neon",
  };
  return (
    <button onClick={onClick} title={title} className={cn("flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-neutral-400 transition", colors[color])}>
      {children}
    </button>
  );
}
