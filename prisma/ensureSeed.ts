import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./seedData";

// Runs during the Vercel build (see vercel.json). Seeds ONLY when the database
// is empty, so redeploys never wipe live reservations / admin password changes.
// Non-fatal: if the DB is unreachable the build still succeeds.
const prisma = new PrismaClient();

async function main() {
  try {
    const bars = await prisma.bar.count();
    if (bars > 0) {
      console.log("↳ Database already seeded — skipping.");
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
