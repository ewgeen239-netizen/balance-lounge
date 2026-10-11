import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/adminGuard";
import { flushOutbox, getPushConfig, pushConfigured } from "@/lib/push";
import { PUSH_TOPICS } from "@/lib/pushTopics";

export const dynamic = "force-dynamic";

/** Overview for the admin "Powiadomienia" tab. */
export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;

  const [total, perTopic, pending, logs, config] = await Promise.all([
    prisma.pushSubscription.count(),
    Promise.all(PUSH_TOPICS.map((t) => prisma.pushSubscription.count({ where: { topics: { contains: `"${t}"` } } }))),
    prisma.pushOutbox.groupBy({ by: ["kind"], where: { sentAt: null }, _count: { _all: true } }),
    prisma.pushLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    getPushConfig(),
  ]);

  return NextResponse.json({
    configured: pushConfigured(),
    total,
    topics: Object.fromEntries(PUSH_TOPICS.map((t, i) => [t, perTopic[i]])),
    pending: Object.fromEntries(pending.map((p) => [p.kind, p._count._all])),
    logs,
    config: { autoPromo: config.autoPromo, promoDays: JSON.parse(config.promoDays), lastPromoAt: config.lastPromoAt },
  });
}

/** Automatic invitations: { autoPromo, promoDays }. */
export async function PATCH(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const data: { autoPromo?: boolean; promoDays?: string } = {};
  if (typeof b.autoPromo === "boolean") data.autoPromo = b.autoPromo;
  if (Array.isArray(b.promoDays)) {
    data.promoDays = JSON.stringify(Array.from(new Set(b.promoDays.map(Number).filter((d: number) => d >= 0 && d <= 6))).sort());
  }
  await getPushConfig();
  const cfg = await prisma.pushConfig.update({ where: { id: 1 }, data });
  return NextResponse.json({ autoPromo: cfg.autoPromo, promoDays: JSON.parse(cfg.promoDays) });
}

/** "Wyślij teraz" for the queued menu/event changes. */
export async function POST() {
  const denied = await requireOwner();
  if (denied) return denied;
  return NextResponse.json(await flushOutbox(true));
}
