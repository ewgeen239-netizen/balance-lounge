import { NextResponse } from "next/server";
import { purgeOldReservations, KEEP_HOURS_AFTER_CLOSING } from "@/lib/reservationCleanup";

export const dynamic = "force-dynamic";

// Hourly cleanup of finished bookings (see vercel.json → crons). Vercel signs
// cron calls with CRON_SECRET; without that env var only Vercel's own cron
// header is accepted, so the endpoint isn't open to the world.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const fromVercelCron = req.headers.get("x-vercel-cron") !== null;

  if (secret ? auth !== `Bearer ${secret}` : !fromVercelCron) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const deleted = await purgeOldReservations();
  return NextResponse.json({ ok: true, deleted, keepHoursAfterClosing: KEEP_HOURS_AFTER_CLOSING });
}
