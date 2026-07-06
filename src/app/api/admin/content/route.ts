import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";

const asJSON = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v));

// Update Bar info and/or About content in one call.
export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));

  if (body.bar) {
    const b = body.bar;
    const bar = await prisma.bar.findFirst();
    if (bar) {
      const data: Record<string, unknown> = {};
      for (const k of ["name", "subtitle", "address", "phone", "email", "instagram", "whatsapp", "telegram", "heroImage", "heroNeon"]) {
        if (b[k] !== undefined) data[k] = String(b[k]);
      }
      if (b.lat !== undefined) data.lat = Number(b.lat);
      if (b.lng !== undefined) data.lng = Number(b.lng);
      if (b.hours !== undefined) data.hours = asJSON(b.hours);
      if (b.gallery !== undefined) data.gallery = asJSON(b.gallery);
      await prisma.bar.update({ where: { id: bar.id }, data });
    }
  }

  if (body.about) {
    const a = body.about;
    const about = await prisma.aboutContent.findFirst();
    if (about) {
      const data: Record<string, unknown> = {};
      if (a.heading !== undefined) data.heading = asJSON(a.heading);
      if (a.subheading !== undefined) data.subheading = asJSON(a.subheading);
      if (a.body !== undefined) data.body = asJSON(a.body);
      if (a.images !== undefined) data.images = asJSON(a.images);
      await prisma.aboutContent.update({ where: { id: about.id }, data });
    }
  }

  return NextResponse.json({ ok: true });
}
