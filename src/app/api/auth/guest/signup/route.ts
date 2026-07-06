import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, createGuestSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  name: z.string().max(80).optional().default(""),
  phone: z.string().max(30).optional().default(""),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 400 });
  const { email, password, name, phone } = parsed.data;

  const existing = await prisma.guestUser.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "email_taken" }, { status: 409 });

  const guest = await prisma.guestUser.create({
    data: {
      email,
      phone: phone || null,
      name: name || "",
      passwordHash: await hashPassword(password),
    },
  });

  await createGuestSession(guest.id, guest.name || guest.email || "");
  return NextResponse.json({ ok: true, name: guest.name, email: guest.email });
}
