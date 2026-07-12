"use client";

import { useMemo, useState } from "react";
import type { AdminReservation } from "./types";
import { cn } from "@/lib/utils";
import { TABLES, INDOOR_TABLES, TERRACE_TABLES, TERRACE_LABEL, LARGE_GROUP, ACTIVE_STATUSES, type TableDef } from "@/lib/tables";

const STATUSES = ["all", "pending", "confirmed", "seated", "cancelled"] as const;
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  confirmed: "bg-emerald-500/15 text-emerald-300",
  seated: "bg-sky-500/15 text-sky-300",
  cancelled: "bg-neutral-600/20 text-neutral-400",
};

const occupies = (status: string) => (ACTIVE_STATUSES as readonly string[]).includes(status);

export function ReservationsPanel({ initial }: { initial: AdminReservation[] }) {
  const [rows, setRows] = useState(initial);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [date, setDate] = useState("");
  const [picker, setPicker] = useState<AdminReservation | null>(null);

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

  // Which table each occupied reservation sits at, per date (from ALL rows, not just filtered).
  const occupancyByDate = useMemo(() => {
    const map = new Map<string, Map<number, AdminReservation>>();
    for (const r of rows) {
      if (r.tableNo && occupies(r.status)) {
        if (!map.has(r.date)) map.set(r.date, new Map());
        map.get(r.date)!.set(r.tableNo, r);
      }
    }
    return map;
  }, [rows]);

  async function patch(id: number, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      return true;
    }
    return false;
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
        <div className="space-y-10">
          {byDay.map(([day, list]) => {
            const occ = occupancyByDate.get(day) ?? new Map<number, AdminReservation>();
            return (
              <section key={day}>
                <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-ember">{day} · {list.length}</h3>
                  <span className="text-xs text-neutral-500">{occ.size}/{TABLES.length} stołów zajętych</span>
                </div>

                {/* Occupancy grid: all tables, occupied ones highlighted; terrace split off. */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {INDOOR_TABLES.map((t) => <OccChip key={t.no} t={t} taken={occ.get(t.no)} />)}
                  <span className="mt-1 w-full text-[10px] font-semibold uppercase tracking-widest text-ember/80">
                    {TERRACE_LABEL}
                  </span>
                  {TERRACE_TABLES.map((t) => <OccChip key={t.no} t={t} taken={occ.get(t.no)} />)}
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="bg-ink-800/60 text-left text-xs uppercase tracking-wider text-neutral-500">
                      <tr>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Guest</th>
                        <th className="px-4 py-3">Pax</th>
                        <th className="px-4 py-3">Table</th>
                        <th className="px-4 py-3">Notes</th>
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
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setPicker(r)}
                              className={cn(
                                "rounded-lg border px-2.5 py-1 text-xs transition",
                                r.tableNo
                                  ? "border-neon/40 bg-neon/10 text-neon hover:bg-neon/20"
                                  : "border-white/10 text-neutral-400 hover:border-white/25 hover:text-neutral-200"
                              )}
                            >
                              {r.tableNo ? `Stół ${r.tableNo}` : "przydziel"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-neutral-400">
                            {r.comment || <span className="text-neutral-600">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("rounded-full px-2.5 py-1 text-xs capitalize", STATUS_STYLE[r.status])}>{r.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              {r.status !== "confirmed" && <ActBtn onClick={() => setPicker(r)} title="Confirm & assign table" color="emerald">✓</ActBtn>}
                              {r.status !== "seated" && <ActBtn onClick={() => patch(r.id, { status: "seated" })} title="Seated" color="sky">◊</ActBtn>}
                              {r.status !== "cancelled" && <ActBtn onClick={() => patch(r.id, { status: "cancelled", tableNo: null })} title="Cancel" color="amber">✕</ActBtn>}
                              <ActBtn onClick={() => remove(r.id)} title="Delete" color="red">🗑</ActBtn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {picker && (
        <TablePicker
          reservation={picker}
          occupied={occupancyByDate.get(picker.date) ?? new Map()}
          onClose={() => setPicker(null)}
          onAssign={async (tableNo) => {
            const ok = await patch(picker.id, { status: "confirmed", tableNo });
            if (ok) setPicker(null);
          }}
          onConfirmNoTable={async () => {
            const ok = await patch(picker.id, { status: "confirmed" });
            if (ok) setPicker(null);
          }}
        />
      )}
    </div>
  );
}

function OccChip({ t, taken }: { t: TableDef; taken?: AdminReservation }) {
  return (
    <span
      title={taken ? `Stół ${t.no} · ${t.seats} miejsc · ${taken.time} ${taken.name}` : `Stół ${t.no} · ${t.seats} miejsc · wolny`}
      className={cn(
        "flex h-9 w-9 flex-col items-center justify-center rounded-lg border text-[11px] font-semibold leading-none",
        taken ? "border-neon/50 bg-neon/15 text-neon" : "border-white/10 bg-ink-800/40 text-neutral-400"
      )}
    >
      {t.no}
      <span className="mt-0.5 text-[8px] font-normal text-neutral-500">{t.seats}p</span>
    </span>
  );
}

function TablePicker({
  reservation,
  occupied,
  onClose,
  onAssign,
  onConfirmNoTable,
}: {
  reservation: AdminReservation;
  occupied: Map<number, AdminReservation>;
  onClose: () => void;
  onAssign: (tableNo: number) => void;
  onConfirmNoTable: () => void;
}) {
  const bigGroup = reservation.guests >= LARGE_GROUP;

  const renderTile = (t: TableDef) => {
    const taken = occupied.get(t.no);
    const isCurrent = reservation.tableNo === t.no;
    const fits = t.seats >= reservation.guests;
    const disabled = !!taken && !isCurrent;
    // Big companies may take an (otherwise too-small) terrace table.
    const terraceOption = !!t.outdoor && bigGroup && !fits;
    return (
      <button
        key={t.no}
        disabled={disabled}
        onClick={() => onAssign(t.no)}
        title={taken ? `Zajęty: ${taken.time} ${taken.name}` : `${t.seats} miejsc`}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 rounded-xl border py-2.5 transition",
          disabled && "cursor-not-allowed border-neon/30 bg-neon/5 text-neutral-600",
          !disabled && isCurrent && "border-neon bg-neon/20 text-neon",
          !disabled && !isCurrent && fits && "border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/60",
          !disabled && !isCurrent && !fits && terraceOption && "border-amber-400/30 bg-amber-500/10 text-amber-200 hover:border-amber-400/60",
          !disabled && !isCurrent && !fits && !terraceOption && "border-white/10 text-neutral-300 hover:border-white/30"
        )}
      >
        <span className="text-sm font-semibold">{t.no}</span>
        <span className="text-[10px] text-neutral-500">{t.seats} miejsc</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-50">Przydziel stół</h3>
            <p className="text-sm text-neutral-400">
              {reservation.date} · {reservation.time} · {reservation.name} · {reservation.guests} os.
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">✕</button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {INDOOR_TABLES.map(renderTile)}
          <div className="col-span-full mt-1 flex flex-wrap items-center gap-x-2 text-[10px] font-semibold uppercase tracking-widest text-ember/80">
            {TERRACE_LABEL}
            {bigGroup && (
              <span className="font-normal normal-case tracking-normal text-neutral-500">— grupa {LARGE_GROUP}+, można sadzać niezależnie od rozmiaru</span>
            )}
          </div>
          {TERRACE_TABLES.map(renderTile)}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
          <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded border border-emerald-400/40 bg-emerald-500/20" /> mieści grupę</span>
          <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded border border-amber-400/40 bg-amber-500/20" /> ogródek (duża grupa)</span>
          <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded border border-neon/40 bg-neon/20" /> zajęty</span>
        </div>

        <div className="mt-5 flex justify-between gap-3">
          <button onClick={onConfirmNoTable} className="text-sm text-neutral-400 hover:text-neutral-200">
            Potwierdź bez stołu
          </button>
          <button onClick={onClose} className="btn-ghost text-sm">Anuluj</button>
        </div>
      </div>
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
