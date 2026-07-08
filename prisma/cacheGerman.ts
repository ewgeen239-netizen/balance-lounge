import { PrismaClient } from "@prisma/client";

// Pre-warms the DB translation cache for German (and any target passed as argv[2]).
// Collects the English base of every content string and stores its machine
// translation in TranslationCache, so the live site serves German instantly.
const prisma = new PrismaClient();

const TARGET = process.argv[2] || "de";
const ISO: Record<string, string> = { de: "de", ua: "uk", es: "es", fr: "fr", it: "it", pt: "pt", tr: "tr", cs: "cs", nl: "nl", zh: "zh" };

function baseEn(json: string): string {
  try {
    const o = JSON.parse(json);
    return o.en || o.pl || "";
  } catch {
    return json || "";
  }
}

async function machine(text: string, target: string): Promise<string> {
  if (!text.trim()) return text;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 480))}&langpair=en|${target}`;
  const res = await fetch(url, { headers: { "User-Agent": "balance-lounge" } });
  const json = await res.json();
  return (json?.responseData?.translatedText as string) || text;
}

async function main() {
  const iso = ISO[TARGET] || TARGET;
  const sources = new Set<string>();

  const cats = await prisma.category.findMany();
  cats.forEach((c) => sources.add(baseEn(c.name)));

  const items = await prisma.menuItem.findMany();
  items.forEach((it) => {
    sources.add(baseEn(it.name));
    sources.add(baseEn(it.description));
  });

  const about = await prisma.aboutContent.findFirst();
  if (about) {
    [about.heading, about.subheading, about.body].forEach((f) => sources.add(baseEn(f)));
  }

  const list = Array.from(sources).filter((s) => s.trim());
  console.log(`Warming ${list.length} strings → ${TARGET} (${iso})…`);

  let done = 0;
  for (const src of list) {
    const existing = await prisma.translationCache.findUnique({ where: { lang_source: { lang: TARGET, source: src } } });
    if (existing) { done++; continue; }
    try {
      const text = await machine(src, iso);
      await prisma.translationCache.upsert({
        where: { lang_source: { lang: TARGET, source: src } },
        create: { lang: TARGET, source: src, text },
        update: { text },
      });
    } catch (e) {
      console.warn("skip:", (e as Error).message);
    }
    done++;
    if (done % 20 === 0) console.log(`  ${done}/${list.length}`);
    await new Promise((r) => setTimeout(r, 120)); // gentle on the free API
  }
  console.log(`✅ Cached ${list.length} strings for ${TARGET}.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
