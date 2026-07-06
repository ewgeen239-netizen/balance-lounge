import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./seedData";

const prisma = new PrismaClient();

// Full reset + seed (npm run db:seed / db:reset).
seedDatabase(prisma)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
