import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import choiceData from "./choiceDataI18n.json";
import findYourBalance from "./findYourBalance.json";

const J = (o: Record<string, string>) => JSON.stringify(o);

type FybItem = { name: string; desc: string; price: number; image: string; badges: string[] };
const FYB = findYourBalance as FybItem[];

type Translatable = { pl: string; ru: string; en: string; ua: string };
type ChoiceItem = {
  name: string; description: string; price: number; image: string; available: boolean; labels: string[];
  nameI18n: Translatable; descI18n: Translatable; optionsI18n?: unknown[];
};
type ChoiceCategory = { hurl: string; name: string; desc: string; items: ChoiceItem[]; nameI18n: Translatable };
const CHOICE = choiceData as unknown as { categories: ChoiceCategory[]; gallery: string[] };

const ALCOHOL = new Set([
  "signature-cocktails", "classic-cocktails", "shot-menu", "shot-sets",
  "wino-musujace", "biale-wino", "czerwone-wino", "whisky-bourbon", "likiery",
  "wermuty", "koniak-brandy", "rum", "wodka", "gin", "tequila",
  "piwo-z-beczki", "piwo-butelkowe",
]);

function badgesFor(cat: ChoiceCategory, item: ChoiceItem): string[] {
  const b = new Set<string>();
  for (const l of item.labels || []) {
    if (l === "recommended") b.add("popularne");
    if (l === "new") b.add("nowosc");
  }
  if (ALCOHOL.has(cat.hurl)) b.add("18+");
  return [...b];
}

/** Full (destructive) seed: wipes then loads Bar, About, menu, admin, demo guest & reservations. */
export async function seedDatabase(prisma: PrismaClient) {
  console.log("🌱 Seeding Balance Lounge…");

  await prisma.reservation.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.guestUser.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.aboutContent.deleteMany();
  await prisma.bar.deleteMany();

  await prisma.bar.create({
    data: {
      name: "BALANCE",
      subtitle: "COCTAILS & SHISHA",
      address: "Księcia Bogusława X 2/1, 70-440 Szczecin, Polska",
      phone: "729 559 179",
      email: "kontakt@balancecoctails.pl",
      instagram: "https://instagram.com/balancecoctails",
      facebook: "https://facebook.com/balancecoctails",
      whatsapp: "https://wa.me/48729559179",
      telegram: "https://t.me/balancecoctails",
      lat: 53.430730108255155,
      lng: 14.544568385793067,
      heroImage: "/head.jpg",
      heroNeon: "YOU'RE IN THE RIGHT PLACE",
      gallery: JSON.stringify([
        "/gallery/g16.jpg", "/gallery/g24.jpg", "/gallery/g11.jpg", "/gallery/g9.jpg", "/gallery/g15.jpg",
        "/gallery/g19.jpg", "/gallery/g8.jpg", "/gallery/g7.jpg", "/gallery/g18.jpg", "/gallery/g23.jpg",
        "/gallery/g12.jpg", "/gallery/g5.jpg", "/gallery/g26.jpg", "/gallery/g4.jpg", "/gallery/g10.jpg",
        "/gallery/g25.jpg", "/gallery/g14.jpg",
      ]),
      hours: JSON.stringify([
        { day: 1, open: "16:00", close: "00:00" },
        { day: 2, open: "16:00", close: "00:00" },
        { day: 3, open: "16:00", close: "00:00" },
        { day: 4, open: "16:00", close: "00:00" },
        { day: 5, open: "16:00", close: "02:00" },
        { day: 6, open: "14:00", close: "02:00" },
        { day: 0, open: "14:00", close: "00:00" },
      ]),
    },
  });

  await prisma.aboutContent.create({
    data: {
      heading: J({ pl: "O NAS", ru: "О НАС", en: "ABOUT US", ua: "ПРО НАС" }),
      subheading: J({
        pl: "BALANCE • COCKTAILS & SHISHA",
        ru: "BALANCE • COCKTAILS & SHISHA",
        en: "BALANCE • COCKTAILS & SHISHA",
        ua: "BALANCE • COCKTAILS & SHISHA",
      }),
      images: JSON.stringify(["/interior-3.webp", "/gallery/g24.jpg"]),
      body: J({
        pl:
          "Balance to nowoczesna przestrzeń lounge w Szczecinie z dopracowaną kartą koktajli, szerokim wyborem shishy premium i klimatycznym wnętrzem.\n\n" +
          "Stawiamy na jakość, komfort oraz wyjątkową obsługę, dzięki której każdy gość może poczuć się swobodnie.\n\n" +
          "Zapraszamy na spotkania z przyjaciółmi, wieczory przy dobrym dymie i koktajlach oraz chwile odpoczynku w samym sercu miasta.",
        ru:
          "Balance — это современное лаунж-пространство в Щецине с продуманной картой коктейлей, широким выбором премиальных кальянов и атмосферным интерьером.\n\n" +
          "Мы делаем ставку на качество, комфорт и исключительный сервис, благодаря которому каждый гость чувствует себя свободно.\n\n" +
          "Приглашаем на встречи с друзьями, вечера с хорошим дымом и коктейлями и минуты отдыха в самом сердце города.",
        en:
          "Balance is a modern lounge space in Szczecin with a refined cocktail list, a wide selection of premium shisha and an atmospheric interior.\n\n" +
          "We focus on quality, comfort and exceptional service that lets every guest feel completely at ease.\n\n" +
          "Join us for evenings with friends, good smoke and cocktails, and moments of relaxation in the very heart of the city.",
        ua:
          "Balance — це сучасний лаунж-простір у Щеціні з продуманою картою коктейлів, широким вибором преміальних кальянів та атмосферним інтер'єром.\n\n" +
          "Ми робимо ставку на якість, комфорт і виняткове обслуговування, завдяки якому кожен гість почувається вільно.\n\n" +
          "Запрошуємо на зустрічі з друзями, вечори з добрим димом і коктейлями та хвилини відпочинку в самому серці міста.",
      }),
    },
  });

  let catOrder = 0;
  for (const c of CHOICE.categories) {
    const cat = await prisma.category.create({
      data: {
        slug: c.hurl,
        name: JSON.stringify(c.nameI18n),
        order: catOrder++,
        scheduled: c.hurl === "desery-premium", // desserts on Fri–Mon, off Tue–Thu
      },
    });
    let i = 0;
    for (const item of c.items) {
      await prisma.menuItem.create({
        data: {
          categoryId: cat.id,
          name: JSON.stringify(item.nameI18n),
          description: JSON.stringify(item.descI18n),
          price: item.price,
          photo: item.image || "",
          badges: JSON.stringify(badgesFor(c, item)),
          options: JSON.stringify(item.optionsI18n ?? []),
          available: item.available,
          order: i++,
        },
      });
    }
  }

  // ---- FIND YOUR BALANCE — featured section, pinned above everything (order -1) ----
  const fyb = await prisma.category.create({
    data: {
      slug: "find-your-balance",
      name: J({ pl: "FIND YOUR BALANCE", ru: "FIND YOUR BALANCE", en: "FIND YOUR BALANCE", ua: "FIND YOUR BALANCE" }),
      order: -1,
      scheduled: false,
    },
  });
  let fi = 0;
  for (const it of FYB) {
    await prisma.menuItem.create({
      data: {
        categoryId: fyb.id,
        name: J({ pl: it.name, ru: it.name, en: it.name, ua: it.name }),
        description: J({ pl: it.desc }),
        price: it.price,
        photo: it.image || "",
        badges: JSON.stringify(it.badges),
        options: "[]",
        available: true,
        order: fi++,
      },
    });
  }

  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD || "balance123";
  await prisma.adminUser.create({
    data: { username: adminUser, passwordHash: await bcrypt.hash(adminPass, 10), role: "owner" },
  });
  // Demo staff account (reservations only).
  await prisma.adminUser.create({
    data: { username: "worker", passwordHash: await bcrypt.hash("worker123", 10), role: "staff" },
  });

  const guest = await prisma.guestUser.create({
    data: {
      email: "guest@example.com",
      phone: "500100200",
      name: "Jan Kowalski",
      passwordHash: await bcrypt.hash("guest123", 10),
    },
  });

  const today = new Date();
  const day = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  await prisma.reservation.createMany({
    data: [
      { date: day(0), time: "19:00", guests: 4, name: "Jan Kowalski", phone: "500100200", zone: "Strefa lounge", status: "confirmed", guestId: guest.id, comment: "Urodziny" },
      { date: day(0), time: "21:00", guests: 2, name: "Anna Nowak", phone: "600200300", zone: "Przy barze", status: "pending" },
      { date: day(1), time: "20:00", guests: 6, name: "Piotr Wiśniewski", phone: "700300400", zone: "Sala główna", status: "confirmed" },
      { date: day(2), time: "22:00", guests: 3, name: "Olena Shevchenko", phone: "512345678", zone: "Strefa lounge", status: "pending", comment: "Shisha premium" },
      { date: day(-1), time: "20:30", guests: 2, name: "Marek Zieliński", phone: "888777666", zone: "Przy barze", status: "seated" },
    ],
  });

  console.log(`✅ Seed complete. Admin: ${adminUser} / ${adminPass}  |  Guest: guest@example.com / guest123`);
}
