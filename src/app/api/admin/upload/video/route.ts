import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireOwner } from "@/lib/adminGuard";
import { MAX_VIDEO_BYTES, VIDEO_TYPES } from "@/lib/media";

// Event videos go from the browser straight to Vercel Blob: Vercel refuses
// request bodies over 4.5 MB, which almost every phone video exceeds. This
// route only hands the logged-in owner a short-lived upload token.

/** Whether direct Blob uploads are available (without Blob — local dev — the regular upload route is used). */
export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  return NextResponse.json({ blob: !!process.env.BLOB_READ_WRITE_TOKEN });
}

export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  if (body.type === "blob.generate-client-token") {
    const denied = await requireOwner();
    if (denied) return denied;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "no_blob" }, { status: 501 });

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^uploads\/[\w.-]+\.(mp4|webm|mov|m4v)$/i.test(pathname)) throw new Error("bad_path");
        return { allowedContentTypes: VIDEO_TYPES, maximumSizeInBytes: MAX_VIDEO_BYTES, addRandomSuffix: true };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "upload_failed" }, { status: 400 });
  }
}
