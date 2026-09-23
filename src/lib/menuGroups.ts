// Top-level menu groups: which categories belong together in the site's tab bar.
// Membership lives here; ORDER comes from the database (Category.order), so the
// admin panel decides where each group and category sits. A group sits where its
// first category is; categories missing here become a group of their own, so
// anything added in the admin panel still appears.
export const MENU_GROUPS: { title: { pl: string }; slugs: string[] }[] = [
  { title: { pl: "SHISHA BALANCE" }, slugs: ["shisha"] },
  {
    title: { pl: "MENU BAROWE" },
    slugs: ["signature-cocktails", "classic-cocktails", "shot-menu", "shot-sets", "balance-zero----bezalkoholowe"],
  },
  {
    title: { pl: "ALKOHOL" },
    slugs: [
      "wino-musujace", "biale-wino", "czerwone-wino", "wino-bezalkoholowe",
      "whisky-bourbon", "likiery", "wermuty", "koniak-brandy", "rum", "wodka",
      "gin", "tequila", "piwo-z-beczki", "piwo-butelkowe",
    ],
  },
  { title: { pl: "HERBATA I KAWA" }, slugs: ["herbaty-autorskie", "ceremonia-herbaty", "herbata-klasyczna", "kawa"] },
  { title: { pl: "NAPOJE ZIMNE" }, slugs: ["napoje-zimne"] },
  { title: { pl: "DESERY" }, slugs: ["desery-premium"] },
];

export type MenuGroup<C> = { key: string; title: { pl: string } | string; cats: C[] };

/** Groups categories for display. `categories` must already be sorted by their
 *  DB order; groups follow the position of their first category and keep their
 *  categories in that same order. */
export function buildGroups<C extends { slug: string; name: string }>(categories: C[]): MenuGroup<C>[] {
  const rank = new Map(categories.map((c, i) => [c.slug, i]));
  const groupOf = new Map<string, number>();
  MENU_GROUPS.forEach((g, gi) => g.slugs.forEach((s) => groupOf.set(s, gi)));

  const groups = new Map<string, MenuGroup<C> & { first: number }>();
  for (const c of categories) {
    const gi = groupOf.get(c.slug);
    const key = gi === undefined ? `cat:${c.slug}` : MENU_GROUPS[gi].title.pl;
    let g = groups.get(key);
    if (!g) {
      g = { key, title: gi === undefined ? c.name : MENU_GROUPS[gi].title, cats: [], first: rank.get(c.slug)! };
      groups.set(key, g);
    }
    g.cats.push(c);
  }
  return [...groups.values()].sort((a, b) => a.first - b.first).map(({ first: _first, ...g }) => g);
}
