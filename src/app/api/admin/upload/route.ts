import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { requireOwner } from "@/lib/adminGuard";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });
  if (file.size > 6 * 1024 * 1024) return NextResponse.json({ error: "too_large" }, { status: 400 });

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // 1) Vercel Blob when configured (best: CDN-served, keeps the DB small).
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${filename}`, file, {
      access: "public",
      contentType: file.type || undefined,
    });
    return NextResponse.json({ ok: true, url: blob.url });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // 2) Serverless (Vercel) has a read-only filesystem — store the bytes in the
  //    database instead and serve them from /api/uploads/[id].
  if (process.env.VERCEL) {
    const id = filename.replace(/\.[a-z0-9]+$/, "");
    await prisma.upload.create({
      data: { id, mime: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`, data: bytes },
    });
    return NextResponse.json({ ok: true, url: `/api/uploads/${id}` });
  }

  // 3) Local dev: plain file in public/uploads.
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
}
