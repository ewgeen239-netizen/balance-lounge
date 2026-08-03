import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

// Dumps every table to a timestamped JSON file in backups/.
//
//   npx tsx prisma/backup.ts                      # uses DATABASE_URL from .env
//   DATABASE_URL="postgresql://…" npx tsx prisma/backup.ts   # production
//
// Restore with prisma/restore.ts.
const prisma = new PrismaClient();

async function main() {
  const [bar, about, categories, items, reservations, guests, admins, uploads, translations] = await Promise.all([
    prisma.bar.findMany(),
    prisma.aboutContent.findMany(),
    prisma.category.findMany(),
    prisma.menuItem.findMany(),
    prisma.reservation.findMany(),
    prisma.guestUser.findMany(),
    prisma.adminUser.findMany(),
    prisma.upload.findMany(),
    prisma.translationCache.findMany(),
  ]);

  const dump = {
    takenAt: new Date().toISOString(),
    counts: {
      bar: bar.length, about: about.length, categories: categories.length, items: items.length,
      reservations: reservations.length, guests: guests.length, admins: admins.length,
      uploads: uploads.length, translations: translations.length,
    },
    // Upload blobs are base64 so the dump stays valid JSON.
    data: {
      bar, about, categories, items, reservations, guests, admins, translations,
      uploads: uploads.map((u) => ({ ...u, data: Buffer.from(u.data).toString("base64") })),
    },
  };

  const dir = path.join(process.cwd(), "backups");
  mkdirSync(dir, { recursive: true });
  const stamp = dump.takenAt.replace(/[:.]/g, "-");
  const file = path.join(dir, `backup-${stamp}.json`);
  writeFileSync(file, JSON.stringify(dump, null, 1));

  console.log("✅ Backup written:", path.relative(process.cwd(), file));
  console.table(dump.counts);
}

main()
  .catch((e) => { console.error("❌ Backup failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
