import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getGuestSession } from "@/lib/auth";
import { notifyNewReservation } from "@/lib/notify";
import { parseJSON, slotsForDate, isPastDate, type HoursRow } from "@/lib/utils";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  guests: z.coerce.number().int().min(1).max(30),
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(30),
  comment: z.string().max(500).optional().default(""),
  zone: z.string().max(60).optional().default(""),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (isPastDate(data.date)) {
    return NextResponse.json({ error: "past_date" }, { status: 400 });
  }

  // Validate the slot is within opening hours for that day
  const bar = await prisma.bar.findFirst();
  const hours = parseJSON<HoursRow[]>(bar?.hours, []);
  const slots = slotsForDate(hours, data.date);
  if (slots.length === 0) {
    return NextResponse.json({ error: "closed_day" }, { status: 400 });
  }
  if (!slots.includes(data.time)) {
    return NextResponse.json({ error: "invalid_time" }, { status: 400 });
  }

  const guest = await getGuestSession();

  const reservation = await prisma.reservation.create({
    data: {
      date: data.date,
      time: data.time,
      guests: data.guests,
      name: data.name,
      phone: data.phone,
      comment: data.comment ?? "",
      zone: data.zone ?? "",
      status: "pending",
      guestId: guest ? Number(guest.sub) : null,
    },
  });

  await notifyNewReservation(reservation);

  return NextResponse.json({ ok: true, reservation }, { status: 201 });
}
