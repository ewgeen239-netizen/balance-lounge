import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// On-demand machine translation for non-hand-written languages.
// Cached in the DB (TranslationCache) so each string is translated once and reused
// across requests/restarts — this is the persistent German (and extras) cache.

async function machine(text: string, source: string, target: string): Promise<string> {
  if (!text.trim() || source === target) return text;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 480))}&langpair=${source}|${target}`;
    const res = await fetch(url, { headers: { "User-Agent": "balance-lounge" } });
    const json = await res.json();
    return (json?.responseData?.translatedText as string) || text;
  } catch {
    return text;
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const texts: string[] = Array.isArray(body?.texts) ? body.texts.slice(0, 60) : [];
  const source: string = typeof body?.source === "string" ? body.source : "en";
  const target: string = typeof body?.target === "string" ? body.target : "en";
  if (!texts.length) return NextResponse.json({ translations: {} });

  const uniq = Array.from(new Set(texts.filter((t) => typeof t === "string" && t.trim())));
  const map: Record<string, string> = {};

  // 1) DB cache
  let cached: { source: string; text: string }[] = [];
  try {
    cached = await prisma.translationCache.findMany({
      where: { lang: target, source: { in: uniq } },
      select: { source: true, text: true },
    });
  } catch {
    cached = [];
  }
  const have = new Set(cached.map((c) => c.source));
  cached.forEach((c) => { map[c.source] = c.text; });

  // 2) translate the misses, then persist
  const misses = uniq.filter((t) => !have.has(t));
  if (misses.length) {
    const results = await Promise.all(misses.map((t) => machine(t, source, target)));
    for (let i = 0; i < misses.length; i++) {
      map[misses[i]] = results[i];
    }
    try {
      await prisma.$transaction(
        misses.map((src, i) =>
          prisma.translationCache.upsert({
            where: { lang_source: { lang: target, source: src } },
            create: { lang: target, source: src, text: results[i] },
            update: { text: results[i] },
          })
        )
      );
    } catch {
      /* cache write best-effort */
    }
  }

  return NextResponse.json({ translations: map });
}
