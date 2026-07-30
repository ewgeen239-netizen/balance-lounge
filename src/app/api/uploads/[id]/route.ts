import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Serves images stored in the database (see /api/admin/upload). Content is
// immutable — the id is unique per upload — so it can be cached hard.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const row = await prisma.upload.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return new NextResponse(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
