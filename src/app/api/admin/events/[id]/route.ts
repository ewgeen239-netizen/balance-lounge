import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/adminGuard";
import { parseEventInput } from "@/lib/eventInput";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireOwner();
  if (denied) return denied;
  const id = Number(params.id);
  const current = await prisma.event.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = parseEventInput(await req.json().catch(() => ({})), false);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  // The window must stay valid when only one end of it changes.
  const startsAt = (parsed.data.startsAt as Date | undefined) ?? current.startsAt;
  const endsAt = (parsed.data.endsAt as Date | undefined) ?? current.endsAt;
  if (endsAt <= startsAt) return NextResponse.json({ error: "end_before_start" }, { status: 400 });

  const event = await prisma.event.update({ where: { id }, data: parsed.data });
  return NextResponse.json(event);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = await requireOwner();
  if (denied) return denied;
  // Idempotent: a double click or stale list must not 500.
  const { count } = await prisma.event.deleteMany({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true, deleted: count });
}
