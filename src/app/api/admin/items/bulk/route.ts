import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/adminGuard";

// Bulk edit: { prices: [{ id, price }], orders: [{ id, order }] }
export async function PATCH(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const prices = Array.isArray(body.prices) ? body.prices : [];
  const orders = Array.isArray(body.orders) ? body.orders : [];

  const ops = [
    ...prices
      .filter((u: { id?: number; price?: number }) => u.id != null && u.price != null)
      .map((u: { id: number; price: number }) =>
        prisma.menuItem.update({ where: { id: Number(u.id) }, data: { price: Number(u.price) } })
      ),
    ...orders
      .filter((u: { id?: number; order?: number }) => u.id != null && u.order != null)
      .map((u: { id: number; order: number }) =>
        prisma.menuItem.update({ where: { id: Number(u.id) }, data: { order: Number(u.order) } })
      ),
  ];

  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true, updated: ops.length });
}
