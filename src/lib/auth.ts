import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-fallback-secret-change-me"
);

export const GUEST_COOKIE = "balance_guest";
export const ADMIN_COOKIE = "balance_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

type SessionPayload = { sub: string; role: "guest" | "admin"; name?: string };

async function sign(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret);
}

async function verify(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

function cookieOpts() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

// ---- Guest session ----
export async function createGuestSession(guestId: number, name: string) {
  const token = await sign({ sub: String(guestId), role: "guest", name });
  cookies().set(GUEST_COOKIE, token, cookieOpts());
}
export async function getGuestSession(): Promise<SessionPayload | null> {
  const token = cookies().get(GUEST_COOKIE)?.value;
  if (!token) return null;
  const p = await verify(token);
  return p?.role === "guest" ? p : null;
}
export function clearGuestSession() {
  cookies().delete(GUEST_COOKIE);
}

// ---- Admin session ----
export async function createAdminSession(adminId: number, name: string) {
  const token = await sign({ sub: String(adminId), role: "admin", name });
  cookies().set(ADMIN_COOKIE, token, cookieOpts());
}
export async function getAdminSession(): Promise<SessionPayload | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const p = await verify(token);
  return p?.role === "admin" ? p : null;
}
export function clearAdminSession() {
  cookies().delete(ADMIN_COOKIE);
}
