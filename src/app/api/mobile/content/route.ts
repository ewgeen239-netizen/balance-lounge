import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/adminGuard";
import { mobileSnapshot, readMobileMetadata } from "@/lib/mobile-data";
import { mobileItemSchema, contentSchema, venueSchema, menuGroup, clock } from "@/lib/mobile-contract";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const requestSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("menu"), expectedRevision: z.string(), items: z.array(mobileItemSchema).min(1).max(200) }),
  z.object({ operation: z.literal("content"), expectedRevision: z.string(), content: contentSchema }),
  z.object({ operation: z.literal("venue"), expectedRevision: z.string(), venue: venueSchema }),
]);
export async function GET(req: Request) {
  try { return NextResponse.json(await mobileSnapshot(new URL(req.url).origin), { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 }); }
}
export async function PATCH(req: Request) {
  const denied = await requireOwner(); if (denied) return denied;
  const origin = new URL(req.url).origin;
  const sourceOrigin = req.headers.get("origin");
  if (sourceOrigin && sourceOrigin !== origin) return NextResponse.json({ error: "origin_mismatch" }, { status: 403 });
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "content_type" }, { status: 415 });
  const raw = await req.text(); if (raw.length > 1_000_000) return NextResponse.json({ error: "too_large" }, { status: 413 });
  let body: unknown; try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation", fields: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  try {
    await prisma.$transaction(async tx => {
      const current = await mobileSnapshot(origin, tx);
      if (current.revision !== input.expectedRevision) throw new Error("conflict");
      if (input.operation === "menu") {
        const categories = await tx.category.findMany({ orderBy: { order: "asc" } });
        for (const item of input.items) {
          const category = item.remoteCategoryID ? categories.find(c => c.id === item.remoteCategoryID) : categories.find(c => menuGroup(c.slug) === item.category);
          if (!category) throw new Error("category_missing");
          const translations = item.translations || { pl: { name: item.name, description: item.descriptionKey } };
          const names = Object.fromEntries(Object.entries(translations).map(([k, v]) => [k, v.name]));
          const descriptions = Object.fromEntries(Object.entries(translations).map(([k, v]) => [k, v.description]));
          const data = { categoryId: category.id, name: JSON.stringify(names), description: JSON.stringify(descriptions), price: item.price, photo: item.image, available: item.available, badges: JSON.stringify(item.badgeKey === "badge.new" ? ["nowosc"] : item.badgeKey === "badge.signature" ? ["popularne"] : []) };
          if (item.remoteID) {
            const exists = await tx.menuItem.findUnique({ where: { id: item.remoteID } });
            if (!exists) throw new Error("conflict");
            // Preserve site-only translations and option groups when native edits one locale.
            let oldNames: Record<string, string> = {}, oldDescriptions: Record<string, string> = {};
            try { oldNames = JSON.parse(exists.name); oldDescriptions = JSON.parse(exists.description); } catch { }
            data.name = JSON.stringify({ ...oldNames, ...names }); data.description = JSON.stringify({ ...oldDescriptions, ...descriptions });
            let oldBadges: string[] = []; try { oldBadges = JSON.parse(exists.badges); } catch { }
            data.badges = JSON.stringify([...oldBadges.filter(b => b !== "nowosc" && b !== "popularne"), ...JSON.parse(data.badges)]);
            await tx.menuItem.update({ where: { id: item.remoteID }, data });
          } else {
            const order = await tx.menuItem.count({ where: { categoryId: category.id } });
            await tx.menuItem.create({ data: { ...data, order } });
          }
        }
      } else {
        const metadata = (await readMobileMetadata(tx)).data;
        if (input.operation === "content") metadata.content = input.content;
        else {
          const v = input.venue; const bar = await tx.bar.findFirst({ orderBy: { id: "asc" } });
          if (!bar) throw new Error("venue_missing");
          await tx.bar.update({ where: { id: bar.id }, data: { name: v.name, address: v.address, phone: v.phone, email: v.email, instagram: v.instagram, heroImage: v.heroImage, hours: JSON.stringify(v.hours.map(h => ({ day: h.weekday - 1, open: clock(h.opens), close: clock(h.closes), closed: !h.enabled }))) } });
          metadata.heroTitle = v.heroTitle; metadata.heroSubtitle = v.heroSubtitle;
        }
        await tx.mobileContent.upsert({ where: { id: 1 }, create: { id: 1, data: JSON.stringify(metadata) }, update: { data: JSON.stringify(metadata) } });
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json(await mobileSnapshot(origin), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if ((error as Error).message === "conflict" || code === "P2034") return NextResponse.json({ error: "conflict" }, { status: 409 });
    if (code === "P2021") return NextResponse.json({ error: "migration_required" }, { status: 503 });
    if ((error as Error).message.endsWith("_missing")) return NextResponse.json({ error: (error as Error).message }, { status: 422 });
    console.error("Mobile content save failed", code || "unknown");
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
