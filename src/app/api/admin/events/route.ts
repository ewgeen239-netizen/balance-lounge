import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/adminGuard";
import { parseEventInput } from "@/lib/eventInput";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  const events = await prisma.event.findMany({ orderBy: { startsAt: "desc" } });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const parsed = parseEventInput(await req.json().catch(() => ({})), true);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const event = await prisma.event.create({ data: parsed.data as Parameters<typeof prisma.event.create>[0]["data"] });
  return NextResponse.json(event, { status: 201 });
}
