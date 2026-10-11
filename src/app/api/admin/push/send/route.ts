import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/adminGuard";
import { sendCustom, sendPreset } from "@/lib/push";
import { PROMO_PRESETS, PUSH_TOPICS } from "@/lib/pushTopics";

const LINKS = ["/", "/menu", "/wydarzenia", "/booking", "/about"] as const;

const body = z.union([
  // A ready-made invitation, sent in each subscriber's language as written.
  z.object({ preset: z.number().int().min(0).max(PROMO_PRESETS.length - 1), url: z.enum(LINKS).default("/") }),
  // Own text in Polish (other languages are machine-translated).
  z.object({
    topic: z.enum(PUSH_TOPICS),
    title: z.string().trim().min(2).max(80),
    body: z.string().trim().min(2).max(200),
    url: z.enum(LINKS).default("/"),
  }),
]);

export async function POST(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const b = parsed.data;

  const result = "preset" in b
    ? await sendPreset(PROMO_PRESETS[b.preset], b.url)
    : await sendCustom(b.topic, { title: b.title, body: b.body, url: b.url, tag: b.topic });
  if (!result.configured) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  return NextResponse.json(result);
}
