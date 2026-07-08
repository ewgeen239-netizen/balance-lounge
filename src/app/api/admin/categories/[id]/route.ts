import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/adminGuard";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireOwner();
  if (denied) return denied;
  const id = Number(params.id);
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof body.slug === "string") data.slug = body.slug;
  if (body.name !== undefined) data.name = typeof body.name === "string" ? body.name : JSON.stringify(body.name);
  if (typeof body.order === "number") data.order = body.order;
  if (typeof body.scheduled === "boolean") data.scheduled = body.scheduled;

  const cat = await prisma.category.update({ where: { id }, data });
  return NextResponse.json(cat);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = await requireOwner();
  if (denied) return denied;
  await prisma.category.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
