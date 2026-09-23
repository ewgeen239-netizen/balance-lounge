import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, requireOwner } from "@/lib/adminGuard";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const cats = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { items: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(cats);
}

export async function POST(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const { slug, name } = body as { slug?: string; name?: unknown };
  if (!slug) return NextResponse.json({ error: "slug_required" }, { status: 400 });

  const existing = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "slug_taken" }, { status: 409 });

  const count = await prisma.category.count();
  const cat = await prisma.category.create({
    data: {
      slug,
      name: typeof name === "string" ? name : JSON.stringify(name ?? { pl: slug }),
      order: count,
    },
  });
  return NextResponse.json(cat, { status: 201 });
}

/** Reorder categories: { orders: [{ id, order }] }. Writes the order column only —
 *  names, photos, descriptions and items are never touched here. */
export async function PATCH(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const orders: { id: number; order: number }[] = (Array.isArray(body.orders) ? body.orders : []).filter(
    (o: { id?: unknown; order?: unknown }) => Number.isInteger(o?.id) && Number.isInteger(o?.order)
  );
  if (orders.length === 0) return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });

  await prisma.$transaction(
    orders.map((o) => prisma.category.updateMany({ where: { id: o.id }, data: { order: o.order } }))
  );
  return NextResponse.json({ ok: true, updated: orders.length });
}
