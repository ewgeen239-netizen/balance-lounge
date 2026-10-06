import { prisma } from "./db";

// All wrapped so a missing/unmigrated database never crashes rendering
// (important for the very first Vercel build before `prisma db push` runs).

export async function getBar() {
  try {
    return await prisma.bar.findFirst({ orderBy: { id: "asc" } });
  } catch {
    return null;
  }
}

export async function getAbout() {
  try {
    return await prisma.aboutContent.findFirst({ orderBy: { id: "asc" } });
  } catch {
    return null;
  }
}

export async function getMenu() {
  try {
    return await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: { items: { orderBy: { order: "asc" } } },
    });
  } catch {
    return [];
  }
}

/** Enabled events for the public site, serialised for client components. */
export async function getPublicEvents() {
  try {
    const rows = await prisma.event.findMany({ where: { enabled: true }, orderBy: { startsAt: "asc" } });
    return rows.map((e) => ({ ...e, startsAt: e.startsAt.toISOString(), endsAt: e.endsAt.toISOString(), createdAt: undefined, updatedAt: undefined }));
  } catch {
    return [];
  }
}
