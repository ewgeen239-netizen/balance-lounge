import { PrismaClient } from "@prisma/client";

// Non-destructive: fills photos for menu items that currently have none, matching
// by a distinctive substring of the (Polish) name. Safe to re-run.
// Usage:  DATABASE_URL="postgres://..." npx tsx prisma/applyPhotos.ts

const MAP: Record<string, string> = {
  "Golden Spice": "/menu/m7338.jpg",
  "Mango Heat": "/menu/m7339.jpg",
  "Crimson Smoke": "/menu/m7340.jpg",
  "Dark Berry": "/menu/m7341.jpg",
  "Green Fizz": "/menu/m6779.jpg",
  "Piña Colada Zero": "/menu/m6787.jpg",
  "Berry Fizz": "/menu/m5528.jpg",
  "Raspberry Passion": "/menu/m5531.jpg",
  "Apple Ginger": "/menu/m6792.jpg",
  "Bumble Balance": "/menu/m6784.jpg",
  "B-52": "/menu/m6769.jpg",
  "B-53": "/menu/m6772.jpg",
  "Medusa": "/menu/m6770.jpg",
  "Hiroshima": "/menu/m6768.jpg",
  "Berry Drop": "/menu/m6773.jpg",
  "Honey Lemon": "/menu/m7330.jpg",
};

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.menuItem.findMany({ where: { OR: [{ photo: "" }, { photo: null as unknown as string }] } });
  let n = 0;
  for (const it of items) {
    let pl = "";
    try { pl = JSON.parse(it.name).pl || ""; } catch { pl = it.name; }
    for (const key of Object.keys(MAP)) {
      if (pl.includes(key)) {
        await prisma.menuItem.update({ where: { id: it.id }, data: { photo: MAP[key] } });
        n++;
        break;
      }
    }
  }
  const left = await prisma.menuItem.count({ where: { OR: [{ photo: "" }, { photo: null as unknown as string }] } });
  console.log(`✅ Applied ${n} photos. Remaining without photo: ${left}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
