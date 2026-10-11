import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { LANGS } from "@/lib/i18n";
import { PUSH_TOPICS } from "@/lib/pushTopics";

// Notification subscriptions of the installed app.
//   { action: "save",   subscription, topics, lang } → store / update the visitor's choice
//   { action: "status", endpoint }                    → which topics this device has on
//   { action: "remove", endpoint }                    → withdraw consent, forget the device
//   { action: "rotate", replaces, subscription }      → browser renewed the subscription (service worker)
//
// The endpoint is where our server will POST notifications, so it must belong
// to a real browser push service — never an arbitrary URL.
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /^android\.googleapis\.com$/,
  /^(web\.)?push\.apple\.com$/,
  /\.push\.apple\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /^push\.services\.mozilla\.com$/,
  /\.notify\.windows\.com$/,
];

const endpoint = z
  .string()
  .max(1000)
  .url()
  .refine((u) => {
    const url = new URL(u);
    return url.protocol === "https:" && PUSH_HOSTS.some((re) => re.test(url.hostname));
  }, "unknown_push_service");

const subscription = z.object({
  endpoint,
  keys: z.object({ p256dh: z.string().min(16).max(200), auth: z.string().min(8).max(100) }),
});

const body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save"),
    subscription,
    topics: z.array(z.enum(PUSH_TOPICS)).max(PUSH_TOPICS.length),
    lang: z.enum(LANGS).default("pl"),
  }),
  z.object({ action: z.literal("rotate"), replaces: endpoint, subscription }),
  z.object({ action: z.literal("status"), endpoint }),
  z.object({ action: z.literal("remove"), endpoint }),
]);

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const b = parsed.data;

  if (b.action === "status") {
    const sub = await prisma.pushSubscription.findUnique({ where: { endpoint: b.endpoint }, select: { topics: true } });
    return NextResponse.json({ subscribed: !!sub, topics: sub ? JSON.parse(sub.topics) : [] });
  }

  if (b.action === "remove") {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: b.endpoint } });
    return NextResponse.json({ ok: true });
  }

  if (b.action === "rotate") {
    // Same device, same consent — only the address changed. Unknown old endpoint: nothing to move.
    const old = await prisma.pushSubscription.findUnique({ where: { endpoint: b.replaces } });
    if (!old || b.replaces === b.subscription.endpoint) return NextResponse.json({ ok: !!old });
    const { endpoint: ep, keys } = b.subscription;
    await prisma.$transaction([
      prisma.pushSubscription.deleteMany({ where: { endpoint: { in: [b.replaces, ep] } } }),
      prisma.pushSubscription.create({
        data: { endpoint: ep, p256dh: keys.p256dh, auth: keys.auth, lang: old.lang, topics: old.topics, consentAt: old.consentAt },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const topics = Array.from(new Set(b.topics)).sort();
  const { endpoint: ep, keys } = b.subscription;

  // No topics left = consent withdrawn: keep nothing.
  if (!topics.length) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: ep } });
    return NextResponse.json({ ok: true, topics: [] });
  }

  const existing = await prisma.pushSubscription.findUnique({ where: { endpoint: ep }, select: { topics: true } });
  const topicsJson = JSON.stringify(topics);
  await prisma.pushSubscription.upsert({
    where: { endpoint: ep },
    create: { endpoint: ep, p256dh: keys.p256dh, auth: keys.auth, lang: b.lang, topics: topicsJson },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      lang: b.lang,
      topics: topicsJson,
      // A new choice is a new consent; a language switch is not.
      ...(existing?.topics !== topicsJson ? { consentAt: new Date() } : {}),
    },
  });
  return NextResponse.json({ ok: true, topics });
}
