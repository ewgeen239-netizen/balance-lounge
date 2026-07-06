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
