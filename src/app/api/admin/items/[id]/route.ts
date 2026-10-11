import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/adminGuard";
import { queueChange } from "@/lib/push";

const asJSON = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v));

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireOwner();
  if (denied) return denied;
  const id = Number(params.id);
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = asJSON(body.name);
  if (body.description !== undefined) data.description = asJSON(body.description);
  if (body.price !== undefined) data.price = Number(body.price);
  if (body.photo !== undefined) data.photo = String(body.photo);
  if (body.available !== undefined) data.available = Boolean(body.available);
  if (body.alwaysOpen !== undefined) data.alwaysOpen = Boolean(body.alwaysOpen);
  if (body.badges !== undefined) data.badges = asJSON(body.badges);
  if (body.options !== undefined) data.options = asJSON(body.options);
  if (body.categoryId !== undefined) data.categoryId = Number(body.categoryId);
  if (body.order !== undefined) data.order = Number(body.order);

  const exists = await prisma.menuItem.findUnique({ where: { id }, select: { id: true, price: true } });
  if (!exists) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const item = await prisma.menuItem.update({ where: { id }, data });
  if (item.price !== exists.price) await queueChange("price", id, exists.price);
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = await requireOwner();
  if (denied) return denied;
  // Idempotent: a double click or stale list must not 500.
  const { count } = await prisma.menuItem.deleteMany({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true, deleted: count });
}
