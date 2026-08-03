import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

// Restores a dump produced by prisma/backup.ts. DESTRUCTIVE: clears the target
// tables first, so it must be asked for explicitly.
//
//   npx tsx prisma/restore.ts backups/backup-….json --yes
//   DATABASE_URL="postgresql://…" npx tsx prisma/restore.ts backups/….json --yes
const prisma = new PrismaClient();

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: tsx prisma/restore.ts <backup.json> --yes");
  if (!process.argv.includes("--yes")) {
    throw new Error("Refusing to run without --yes (this replaces all current data).");
  }

  const dump = JSON.parse(readFileSync(file, "utf8"));
  const d = dump.data;
  console.log("Restoring backup from", dump.takenAt);
  console.table(dump.counts);

  await prisma.$transaction([
    prisma.reservation.deleteMany(),
    prisma.menuItem.deleteMany(),
    prisma.category.deleteMany(),
    prisma.guestUser.deleteMany(),
    prisma.adminUser.deleteMany(),
    prisma.aboutContent.deleteMany(),
    prisma.bar.deleteMany(),
    prisma.upload.deleteMany(),
    prisma.translationCache.deleteMany(),
  ]);

  // Order matters: parents before the rows that reference them.
  if (d.bar?.length) await prisma.bar.createMany({ data: d.bar });
  if (d.about?.length) await prisma.aboutContent.createMany({ data: d.about });
  if (d.categories?.length) await prisma.category.createMany({ data: d.categories });
  if (d.items?.length) await prisma.menuItem.createMany({ data: d.items });
  if (d.guests?.length) await prisma.guestUser.createMany({ data: d.guests });
  if (d.reservations?.length) await prisma.reservation.createMany({ data: d.reservations });
  if (d.admins?.length) await prisma.adminUser.createMany({ data: d.admins });
  if (d.translations?.length) await prisma.translationCache.createMany({ data: d.translations });
  if (d.uploads?.length) {
    await prisma.upload.createMany({
      data: d.uploads.map((u: { id: string; mime: string; data: string; createdAt: string }) => ({
        ...u, data: Buffer.from(u.data, "base64"),
      })),
    });
  }

  console.log("✅ Restore complete.");
}

main()
  .catch((e) => { console.error("❌ Restore failed:", e.message ?? e); process.exit(1); })
  .finally(() => prisma.$disconnect());
