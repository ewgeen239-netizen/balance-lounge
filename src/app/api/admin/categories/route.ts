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
