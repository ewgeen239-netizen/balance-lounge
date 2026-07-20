import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { notifyGuestConfirmed } from "@/lib/reservationActions";
import { reservationSummary, editAllReservationMessages, type TgMessageRef } from "@/lib/notify";
import { TABLES } from "@/lib/tables";

/** Mirror an admin-panel confirm/reject onto the Telegram alerts in every chat. */
async function syncTelegram(
  r: Parameters<typeof reservationSummary>[0] & { tgMessages: string },
  footer: string,
) {
  let refs: TgMessageRef[] = [];
  try { refs = JSON.parse(r.tgMessages || "[]"); } catch { /* ignore */ }
  if (refs.length) await editAllReservationMessages(refs, `${reservationSummary(r)}\n\n${footer}`);
}

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

  // Detect a fresh status change so we only notify once.
  const before =
    typeof data.status === "string"
      ? await prisma.reservation.findUnique({ where: { id: Number(params.id) }, select: { status: true } })
      : null;

  const r = await prisma.reservation.update({ where: { id: Number(params.id) }, data });

  if (data.status === "confirmed" && before?.status !== "confirmed") {
    await notifyGuestConfirmed(r); // SMS + e-mail to the guest
    await syncTelegram(r, `✅ <b>PRZYJĘTA</b>${r.tableNo ? ` · Stół ${r.tableNo}` : ""}`);
  } else if (data.status === "cancelled" && before?.status !== "cancelled") {
    await syncTelegram(r, "❌ <b>ODRZUCONA</b>");
  }
  return NextResponse.json(r);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  // Idempotent: deleteMany won't throw if the row is already gone (double-click, stale UI).
  const { count } = await prisma.reservation.deleteMany({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true, deleted: count });
}
