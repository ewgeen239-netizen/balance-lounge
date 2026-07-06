import { NextResponse } from "next/server";
import { clearGuestSession } from "@/lib/auth";

export async function POST() {
  clearGuestSession();
  return NextResponse.json({ ok: true });
}
