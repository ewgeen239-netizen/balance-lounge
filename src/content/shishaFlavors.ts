// Flavours offered for each shisha type, shown in the carousel above the shisha
// cards in the menu. Edit the lists here.
//
// - `type` must match the Polish name of the shisha item in the admin panel
//   (Light, Medium, Strong, Cigar), so the price and the "details" link work.
// - `name` is shown as written in every language (brand / flavour names).
// - `notes` is Polish; other languages are translated automatically.
// - `tags` (optional) are small labels with hand-written translations — see TAGS.
//
// ⚠️ EXAMPLE DATA — invented flavours, replace with the real lists.

/** false = the carousel stays hidden on the site (example data below). Switch to true with the real lists. */
export const SHISHA_FLAVORS_LIVE = false;

export type FlavorTag = "sweet" | "sour" | "fresh" | "fruity" | "dessert" | "spicy" | "herbal" | "creamy";

export type Flavor = { name: string; notes: string; tags?: FlavorTag[] };

export const SHISHA_FLAVORS: { type: string; flavors: Flavor[] }[] = [
  {
    type: "Light",
    flavors: [
      { name: "Arbuz & Mięta", notes: "Soczysty arbuz z chłodną miętą.", tags: ["fruity", "fresh"] },
      { name: "Lemoniada", notes: "Cytryna, limonka i odrobina cukru trzcinowego.", tags: ["sour", "fresh"] },
      { name: "Brzoskwiniowa herbata", notes: "Delikatna brzoskwinia na tle czarnej herbaty.", tags: ["fruity", "sweet"] },
      { name: "Zielone jabłko", notes: "Chrupiące, lekko kwaśne jabłko.", tags: ["fruity", "sour"] },
    ],
  },
  {
    type: "Medium",
    flavors: [
      { name: "Mango Marakuja", notes: "Dojrzałe mango z kwaskową marakują.", tags: ["fruity", "sweet"] },
      { name: "Malinowy sernik", notes: "Kremowy sernik z sosem malinowym.", tags: ["dessert", "creamy"] },
      { name: "Wiśnia Cola", notes: "Wiśnia i klasyczna cola z bąbelkami.", tags: ["sweet", "fruity"] },
      { name: "Czarna porzeczka", notes: "Intensywna porzeczka z nutą mięty.", tags: ["fruity", "fresh"] },
      { name: "Pistacjowe lody", notes: "Słodka pistacja i wanilia.", tags: ["dessert", "creamy"] },
    ],
  },
  {
    type: "Strong",
    flavors: [
      { name: "Grejpfrut & Imbir", notes: "Gorzkawy grejpfrut z ostrym imbirem.", tags: ["sour", "spicy"] },
      { name: "Wiśnia w czekoladzie", notes: "Ciemna czekolada i dojrzała wiśnia.", tags: ["dessert", "sweet"] },
      { name: "Kawa & Karmel", notes: "Mocne espresso z karmelem.", tags: ["dessert", "creamy"] },
      { name: "Śliwka & Cynamon", notes: "Suszona śliwka z ciepłym cynamonem.", tags: ["fruity", "spicy"] },
    ],
  },
  {
    type: "Cigar",
    flavors: [
      { name: "Kubański liść", notes: "Czysty tytoń cygarowy, drewno i skóra.", tags: ["spicy"] },
      { name: "Wanilia & Bourbon", notes: "Słodka wanilia z beczkową nutą bourbonu.", tags: ["sweet", "creamy"] },
      { name: "Cedr & Kakao", notes: "Drewno cedrowe i gorzkie kakao.", tags: ["dessert", "herbal"] },
      { name: "Miód & Tytoń", notes: "Leśny miód na tle szlachetnego tytoniu.", tags: ["sweet"] },
    ],
  },
];
