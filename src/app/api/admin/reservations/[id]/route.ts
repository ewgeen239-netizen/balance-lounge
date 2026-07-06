import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";

const STATUSES = ["pending", "confirmed", "seated", "cancelled"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.status === "string" && STATUSES.includes(body.status)) data.status = body.status;
  if (body.comment !== undefined) data.comment = String(body.comment);
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });

  const r = await prisma.reservation.update({ where: { id: Number(params.id) }, data });
  return NextResponse.json(r);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  await prisma.reservation.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
