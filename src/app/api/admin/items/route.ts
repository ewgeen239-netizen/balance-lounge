import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/adminGuard";

const asJSON = (v: unknown, fb: string) =>
  v === undefined ? fb : typeof v === "string" ? v : JSON.stringify(v);

export async function POST(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const categoryId = Number(body.categoryId);
  if (!categoryId) return NextResponse.json({ error: "category_required" }, { status: 400 });

  const count = await prisma.menuItem.count({ where: { categoryId } });
  const item = await prisma.menuItem.create({
    data: {
      categoryId,
      name: asJSON(body.name, JSON.stringify({ pl: "Nowa pozycja" })),
      description: asJSON(body.description, JSON.stringify({ pl: "" })),
      price: Number(body.price) || 0,
      photo: typeof body.photo === "string" ? body.photo : "",
      available: body.available !== false,
      badges: asJSON(body.badges, "[]"),
      order: count,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
