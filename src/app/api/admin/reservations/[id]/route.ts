import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { notifyReservationConfirmed } from "@/lib/notify";
import { sendReservationConfirmedEmail } from "@/lib/email";
import { TABLES } from "@/lib/tables";

const STATUSES = ["pending", "confirmed", "seated", "cancelled"];
const VALID_TABLES = new Set(TABLES.map((t) => t.no));

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.status === "string" && STATUSES.includes(body.status)) data.status = body.status;
  if (body.comment !== undefined) data.comment = String(body.comment);
  // tableNo: null clears the assignment, an integer 1–20 assigns a table.
  if (body.tableNo === null) data.tableNo = null;
  else if (Number.isInteger(body.tableNo) && VALID_TABLES.has(body.tableNo)) data.tableNo = body.tableNo;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });

  // Detect a fresh confirmation so we only text the guest once.
  const before =
    data.status === "confirmed"
      ? await prisma.reservation.findUnique({ where: { id: Number(params.id) }, select: { status: true } })
      : null;

  const r = await prisma.reservation.update({ where: { id: Number(params.id) }, data });

  if (data.status === "confirmed" && before?.status !== "confirmed") {
    await notifyReservationConfirmed(r); // SMS

    // Email the guest too, when we have an address (account bookings).
    const [bar, guest] = await Promise.all([
      prisma.bar.findFirst(),
      r.guestId ? prisma.guestUser.findUnique({ where: { id: r.guestId } }) : Promise.resolve(null),
    ]);
    const email = guest?.email ?? "";
    if (email) {
      await sendReservationConfirmedEmail({
        reservationId: r.id,
        name: r.name,
        date: r.date,
        time: r.time,
        guests: r.guests,
        tableNo: r.tableNo,
        phone: r.phone,
        email,
        restaurant: {
          name: bar?.name ?? "Balance",
          address: bar?.address ?? "",
          phone: bar?.phone ?? "",
          instagram: bar?.instagram || undefined,
          facebook: bar?.facebook || undefined,
        },
      });
    }
  }
  return NextResponse.json(r);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  await prisma.reservation.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
