import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "./db";
import type { Prisma } from "@prisma/client";
import { emptyContent, menuGroup, parseJSON, toMinutes, type SharedContent } from "./mobile-contract";

export type MobileMetadata = { content: SharedContent; heroTitle?: string; heroSubtitle?: string };
export async function readMobileMetadata(db: Prisma.TransactionClient = prisma): Promise<{ data: MobileMetadata; updatedAt: Date | null }> {
  try {
    const row = await db.mobileContent.findUnique({ where: { id: 1 } });
    return { data: parseJSON(row?.data, { content: emptyContent }), updatedAt: row?.updatedAt ?? null };
  } catch (error) {
    // A first deployment can safely render before the additive migration runs.
    if ((error as { code?: string }).code !== "P2021") throw error;
    return { data: { content: emptyContent }, updatedAt: null };
  }
}
export async function mobileSnapshot(origin: string, db: Prisma.TransactionClient = prisma) {
  const [categories, bar, metadata] = await Promise.all([
    db.category.findMany({ orderBy: { order: "asc" }, include: { items: { orderBy: { order: "asc" } } } }),
    db.bar.findFirst({ orderBy: { id: "asc" } }), readMobileMetadata(db),
  ]);
  const absolute = (s: string) => s ? new URL(s, origin).href : new URL("/head.jpg", origin).href;
  const menu = categories.flatMap(category => category.items.map(item => {
    const names = parseJSON<Record<string, string>>(item.name, { pl: item.name });
    const descriptions = parseJSON<Record<string, string>>(item.description, { pl: item.description });
    const translations = Object.fromEntries(["pl", "ru", "en", "de"].map(lang => [lang, { name: names[lang] || names.pl || names.en || "", description: descriptions[lang] || descriptions.pl || descriptions.en || "" }]));
    const badges = parseJSON<string[]>(item.badges, []);
    return { id: `site-${item.id}`, remoteID: item.id, remoteCategoryID: category.id, name: translations.pl.name, descriptionKey: translations.pl.description, category: menuGroup(category.slug), price: item.price, image: item.photo ? absolute(item.photo) : "", badgeKey: badges.includes("nowosc") ? "badge.new" : badges.includes("popularne") ? "badge.signature" : "", available: item.available, categoryClosed: category.closed, alwaysOpen: item.alwaysOpen, translations, sectionNames: parseJSON<Record<string, string>>(category.name, { pl: category.name }), sectionSlug: category.slug, options: parseJSON(item.options, []), siteBadges: badges, updatedAt: item.updatedAt.toISOString() };
  }));
  const rawHours = parseJSON<{ day: number; open: string; close: string; closed?: boolean }[]>(bar?.hours, []);
  const hours = Array.from({ length: 7 }, (_, day) => {
    const h = rawHours.find(row => row.day === day);
    const opens = toMinutes(h?.open || "16:00"); let closes = toMinutes(h?.close || "01:00");
    if (closes <= opens) closes += 1440;
    return { weekday: day + 1, opens, closes, enabled: !!h && !h.closed };
  });
  const revision = createHash("sha256").update(JSON.stringify({ bar: bar?.updatedAt, metadata: metadata.updatedAt, categories: categories.map(c => [c.id, c.updatedAt, c.items.map(i => [i.id, i.updatedAt])]) })).digest("hex");
  return { schemaVersion: 1, revision, menu, content: { ...(metadata.data.content || emptyContent), events: (metadata.data.content?.events || []).map(e => ({ ...e, image: absolute(e.image || "/gallery/g30.JPG") })), promotions: (metadata.data.content?.promotions || []).map(p => ({ ...p, image: absolute(p.image || "/head.jpg") })) }, venue: {
    name: bar?.name || "BALANCE", address: bar?.address || "", phone: bar?.phone || "", email: bar?.email || "", instagram: bar?.instagram || "", heroImage: absolute(bar?.heroImage || "/head.jpg"), heroTitle: metadata.data.heroTitle || "home.hero.title", heroSubtitle: metadata.data.heroSubtitle || "home.hero.subtitle", hours,
  } };
}
