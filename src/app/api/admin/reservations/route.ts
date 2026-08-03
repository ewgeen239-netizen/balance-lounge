import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { TABLES } from "@/lib/tables";
import { notifyGuestConfirmed } from "@/lib/reservationActions";

const STATUSES = ["pending", "confirmed", "seated", "cancelled"];
const VALID_TABLES = new Set(TABLES.map((t) => t.no));

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (date) where.date = date;
  if (status && status !== "all") where.status = status;

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
  return NextResponse.json(reservations);
}

/** Walk-in / phone booking taken by staff. Unlike the public form this accepts
 *  any time slot, an assigned table and a status chosen up front. */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const b = await req.json().catch(() => ({}));
  const date = String(b.date ?? "");
  const time = String(b.time ?? "");
  const guests = Number(b.guests);
  const name = String(b.name ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  if (!/^\d{2}:\d{2}$/.test(time)) return NextResponse.json({ error: "invalid_time" }, { status: 400 });
  if (!Number.isInteger(guests) || guests < 1 || guests > 60) return NextResponse.json({ error: "invalid_guests" }, { status: 400 });
  if (name.length < 2) return NextResponse.json({ error: "invalid_name" }, { status: 400 });

  const status = STATUSES.includes(b.status) ? b.status : "confirmed";
  const tableNo = Number.isInteger(b.tableNo) && VALID_TABLES.has(b.tableNo) ? b.tableNo : null;

  // Warn (don't block) if the table is already taken that day — staff may be
  // deliberately double-seating or fixing an entry.
  let tableBusy = false;
  if (tableNo) {
    tableBusy = (await prisma.reservation.count({
      where: { date, tableNo, status: { in: ["confirmed", "seated"] } },
    })) > 0;
  }

  const reservation = await prisma.reservation.create({
    data: {
      date, time, guests, name,
      phone: String(b.phone ?? "").trim(),
      email: String(b.email ?? "").trim(),
      comment: String(b.comment ?? "").trim(),
      zone: String(b.zone ?? "").trim(),
      tableNo,
      status,
    },
  });

  // Confirmed straight away → tell the guest, same as confirming in the panel.
  if (status === "confirmed" && b.notifyGuest !== false) {
    await notifyGuestConfirmed(reservation);
  }

  return NextResponse.json({ ...reservation, tableBusy }, { status: 201 });
}
