// Loyalty programme: what guests can buy with points in their account.
// Edit freely — `key` must stay stable once coupons with it exist.
//
// ⚠️ EXAMPLE DATA — invented rewards and costs, adjust to the venue's offer.

export type Txt = { pl: string; ru?: string; en?: string; de?: string; ua?: string };
export type Reward = { key: string; cost: number; title: Txt; desc: Txt };

/**
 * false = the programme is announced as "Soon": guests see the rewards and the
 * install bonus marked as coming soon, but nothing is granted or redeemed and
 * the admin "Kupony" tab is hidden. Switch to true to launch.
 */
export const LOYALTY_LIVE = false;

/** Points for installing the app (granted once per account). */
export const INSTALL_BONUS = 35;

/** How long a coupon stays valid after it is bought. */
export const COUPON_VALID_DAYS = 30;

export const REWARDS: Reward[] = [
  {
    key: "ice-bazooka",
    cost: 35,
    title: { pl: "Ice bazooka gratis", ru: "Ice bazooka в подарок", en: "Free ice bazooka", de: "Ice Bazooka gratis", ua: "Ice bazooka в подарунок" },
    desc: { pl: "Chłodzący dodatek do shishy.", ru: "Охлаждающая добавка к кальяну.", en: "A cooling add-on for your shisha.", de: "Kühlendes Extra für die Shisha.", ua: "Охолоджувальна добавка до кальяну." },
  },
  {
    key: "shot",
    cost: 50,
    title: { pl: "Shot gratis", ru: "Шот в подарок", en: "Free shot", de: "Shot gratis", ua: "Шот у подарунок" },
    desc: { pl: "Dowolny shot z karty.", ru: "Любой шот из меню.", en: "Any shot from the menu.", de: "Ein beliebiger Shot aus der Karte.", ua: "Будь-який шот із меню." },
  },
  {
    key: "tea",
    cost: 80,
    title: { pl: "Herbata autorska gratis", ru: "Авторский чай в подарок", en: "Free signature tea", de: "Hausgemachter Tee gratis", ua: "Авторський чай у подарунок" },
    desc: { pl: "Dzbanek herbaty autorskiej do shishy.", ru: "Чайник авторского чая к кальяну.", en: "A pot of signature tea with your shisha.", de: "Eine Kanne Haustee zur Shisha.", ua: "Чайник авторського чаю до кальяну." },
  },
  {
    key: "discount-10",
    cost: 150,
    title: { pl: "−10% na rachunek", ru: "−10% на счёт", en: "10% off the bill", de: "10 % Rabatt auf die Rechnung", ua: "−10% на рахунок" },
    desc: { pl: "Jednorazowo na cały rachunek stolika.", ru: "Один раз на весь счёт столика.", en: "Once, on the whole table's bill.", de: "Einmalig auf die gesamte Tischrechnung.", ua: "Один раз на весь рахунок столика." },
  },
];
