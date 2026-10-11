import "server-only";
import { prisma } from "./db";

// Machine translation for languages without hand-written text, cached in the DB
// (TranslationCache) so each string is translated once and reused everywhere —
// by /api/translate for the site and by push notifications.

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

/** Translates `texts` (ISO codes, e.g. "en" → "uk"). Returns source → translation. */
export async function translateMany(texts: string[], source: string, target: string): Promise<Record<string, string>> {
  const uniq = Array.from(new Set(texts.filter((t) => typeof t === "string" && t.trim())));
  const map: Record<string, string> = {};
  if (!uniq.length) return map;
  if (source === target) {
    uniq.forEach((t) => { map[t] = t; });
    return map;
  }

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
    misses.forEach((src, i) => { map[src] = results[i]; });
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
  return map;
}
