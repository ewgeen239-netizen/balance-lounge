import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, createGuestSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 400 });
  const { email, password } = parsed.data;

  const guest = await prisma.guestUser.findUnique({ where: { email } });
  if (!guest || !(await verifyPassword(password, guest.passwordHash))) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await createGuestSession(guest.id, guest.name || guest.email || "");
  return NextResponse.json({ ok: true, name: guest.name, email: guest.email });
}
