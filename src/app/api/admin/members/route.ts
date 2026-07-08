import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/adminGuard";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  const members = await prisma.adminUser.findMany({
    orderBy: { id: "asc" },
    select: { id: true, username: true, role: true, createdAt: true },
  });
  return NextResponse.json(members);
}

const schema = z.object({
  username: z.string().min(2).max(40),
  password: z.string().min(6).max(100),
  role: z.enum(["owner", "staff"]).default("staff"),
});

export async function POST(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 400 });
  const { username, password, role } = parsed.data;

  const exists = await prisma.adminUser.findUnique({ where: { username } });
  if (exists) return NextResponse.json({ error: "username_taken" }, { status: 409 });

  const member = await prisma.adminUser.create({
    data: { username, role, passwordHash: await hashPassword(password) },
    select: { id: true, username: true, role: true, createdAt: true },
  });
  return NextResponse.json(member, { status: 201 });
}
