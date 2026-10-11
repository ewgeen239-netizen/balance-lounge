import { NextResponse } from "next/server";
import { translateMany } from "@/lib/translate";

// On-demand machine translation for non-hand-written languages (cached in the DB).

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const texts: string[] = Array.isArray(body?.texts) ? body.texts.slice(0, 60) : [];
  const source: string = typeof body?.source === "string" ? body.source : "en";
  const target: string = typeof body?.target === "string" ? body.target : "en";
  if (!texts.length) return NextResponse.json({ translations: {} });

  return NextResponse.json({ translations: await translateMany(texts, source, target) });
}
