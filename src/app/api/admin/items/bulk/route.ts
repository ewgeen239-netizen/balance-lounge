import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/adminGuard";

// Bulk price edit: [{ id, price }]
export async function PATCH(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const updates = Array.isArray(body.prices) ? body.prices : [];

  const ops = updates
    .filter((u: { id?: number; price?: number }) => u.id != null && u.price != null)
    .map((u: { id: number; price: number }) =>
      prisma.menuItem.update({ where: { id: Number(u.id) }, data: { price: Number(u.price) } })
    );

  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true, updated: ops.length });
}
