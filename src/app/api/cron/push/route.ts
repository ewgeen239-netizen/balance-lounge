import { NextResponse } from "next/server";
import { runDailyPush } from "@/lib/push";

export const dynamic = "force-dynamic";

// Daily at 15:00 UTC (17:00 summer / 16:00 winter in Szczecin), see vercel.json:
// sends anything left in the change queue, the automatic invitation on the
// chosen weekdays, and removes subscriptions that have been dead for a year.
// Same auth as the other cron: CRON_SECRET, or Vercel's own cron header.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const fromVercelCron = req.headers.get("x-vercel-cron") !== null;
  if (secret ? auth !== `Bearer ${secret}` : !fromVercelCron) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ...(await runDailyPush()) });
}
