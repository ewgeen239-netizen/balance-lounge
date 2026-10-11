import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { requireAdmin } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

const norm = (raw: string) => {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.startsWith("BAL") ? `BAL-${s.slice(3)}` : `BAL-${s}`;
};

async function find(code: string) {
  return prisma.coupon.findUnique({
    where: { code: norm(code) },
    include: { guest: { select: { name: true, email: true, phone: true } } },
  });
}

function dto(c: NonNullable<Awaited<ReturnType<typeof find>>>) {
  const status = c.usedAt ? "used" : c.expiresAt < new Date() ? "expired" : "active";
  return {
    code: c.code,
    title: c.title,
    cost: c.cost,
    createdAt: c.createdAt,
    expiresAt: c.expiresAt,
    usedAt: c.usedAt,
    usedBy: c.usedBy,
    status,
    guest: c.guest.name || c.guest.email || c.guest.phone || "—",
  };
}

/** Staff looks a guest's coupon up by its code: GET ?code=BAL-XXXXX */
export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const code = new URL(req.url).searchParams.get("code") ?? "";
  const c = code ? await find(code) : null;
  if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(dto(c));
}

/** Marks a coupon as used: { code }. Only an active coupon can be used, and only once. */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const session = await getAdminSession();
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  if (!code) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { count } = await prisma.coupon.updateMany({
    where: { code: norm(code), usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date(), usedBy: session?.name ?? "" },
  });
  const c = await find(code);
  if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!count) return NextResponse.json({ error: c.usedAt ? "already_used" : "expired", ...dto(c) }, { status: 409 });
  return NextResponse.json(dto(c));
}
