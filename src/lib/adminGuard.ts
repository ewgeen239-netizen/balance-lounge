import "server-only";
import { NextResponse } from "next/server";
import { getAdminSession, isOwner } from "./auth";

/** Returns null if authorized (any admin), or a 401 NextResponse. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return null;
}

/** Returns null if the admin is an OWNER, else 401/403. Use on data-editing endpoints. */
export async function requireOwner(): Promise<NextResponse | null> {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isOwner(session)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return null;
}
