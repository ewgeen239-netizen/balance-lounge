import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { notifyReservationConfirmed } from "@/lib/notify";
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
    await notifyReservationConfirmed(r);
  }
  return NextResponse.json(r);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  await prisma.reservation.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
