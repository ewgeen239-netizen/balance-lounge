import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestSession } from "@/lib/auth";
import { buyCoupon, getLoyalty, grantInstallBonus } from "@/lib/loyalty";
import { LOYALTY_LIVE } from "@/content/rewards";

export const dynamic = "force-dynamic";

// Guest's points and coupons.
//   GET                                   → balance, coupons, history
//   POST { action: "install" }            → install-the-app bonus (once per account)
//   POST { action: "buy", reward: key }   → spend points on a coupon
const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("install") }),
  z.object({ action: z.literal("buy"), reward: z.string().min(1).max(60) }),
]);

async function guestId(): Promise<number | null> {
  const s = await getGuestSession();
  return s ? Number(s.sub) : null;
}

export async function GET() {
  const id = await guestId();
  if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await getLoyalty(id));
}

export async function POST(req: Request) {
  const id = await guestId();
  if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!LOYALTY_LIVE) return NextResponse.json({ error: "coming_soon" }, { status: 403 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  if (parsed.data.action === "install") {
    const granted = await grantInstallBonus(id);
    return NextResponse.json({ granted, ...(await getLoyalty(id)) });
  }

  const result = await buyCoupon(id, parsed.data.reward);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ coupon: result.coupon, ...(await getLoyalty(id)) });
}
