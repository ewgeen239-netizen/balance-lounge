// Event media can be a photo or a short video; the URL's extension tells which.
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

export function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(url.split(/[?#]/)[0]);
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || VIDEO_EXT.test(file.name);
}

/** Largest video the admin may upload (sent straight to Vercel Blob, so Vercel's 4.5 MB request limit doesn't apply). */
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];
