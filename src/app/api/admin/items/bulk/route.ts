import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/adminGuard";
import { queueChange } from "@/lib/push";

// Bulk edit: { prices: [{ id, price }], orders: [{ id, order }] }
export async function PATCH(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const prices = Array.isArray(body.prices) ? body.prices : [];
  const orders = Array.isArray(body.orders) ? body.orders : [];

  // Prices before the update, to announce real changes only.
  const before = await prisma.menuItem.findMany({
    where: { id: { in: prices.map((u: { id?: number }) => Number(u.id)).filter(Boolean) } },
    select: { id: true, price: true },
  });

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
  for (const b of before) {
    const next = prices.find((u: { id?: number }) => Number(u.id) === b.id);
    if (next && Number(next.price) !== b.price) await queueChange("price", b.id, b.price);
  }
  return NextResponse.json({ ok: true, updated: ops.length });
}
