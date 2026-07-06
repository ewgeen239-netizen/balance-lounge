import "server-only";
import { NextResponse } from "next/server";
import { getAdminSession } from "./auth";

/** Returns null if authorized, or a 401 NextResponse to short-circuit the handler. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return null;
}
