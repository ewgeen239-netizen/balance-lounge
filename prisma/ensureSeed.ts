import { PrismaClient } from "@prisma/client";
import { seedDatabase, syncMenu } from "./seedData";

// Runs during the Vercel build (see vercel.json).
//
// Live data is never replaced: seeding is destructive (it wipes every table
// first), so it only happens on a database that is completely empty, and on
// production it additionally requires ALLOW_SEED=1. A redeploy therefore keeps
// everything edited in the admin panel — it just syncs new menu items.
// Non-fatal: if the DB is unreachable the build still succeeds.
const prisma = new PrismaClient();

async function main() {
  try {
    const [bars, categories, items, reservations, admins] = await Promise.all([
      prisma.bar.count(),
      prisma.category.count(),
      prisma.menuItem.count(),
      prisma.reservation.count(),
      prisma.adminUser.count(),
    ]);
    const isEmpty = bars + categories + items + reservations + admins === 0;

    if (!isEmpty) {
      console.log("↳ Database has data — syncing new menu items only (nothing is overwritten).");
      await syncMenu(prisma);
      return;
    }

    if (process.env.VERCEL && process.env.ALLOW_SEED !== "1") {
      console.warn("↳ Database looks empty, but seeding is disabled in production. Set ALLOW_SEED=1 to seed on purpose.");
      return;
    }

    console.log("↳ Empty database detected — seeding demo data…");
    await seedDatabase(prisma);
  } catch (err) {
    console.warn("↳ ensureSeed skipped (DB not reachable yet):", (err as Error).message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
