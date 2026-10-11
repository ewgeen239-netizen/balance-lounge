// Shared by the browser and the server: notification topics and the ready-made
// "come and visit" invitations the admin can send (or the cron sends by itself).

export const PUSH_TOPICS = ["events", "menu", "promo"] as const;
export type PushTopic = (typeof PUSH_TOPICS)[number];

export const isTopic = (v: unknown): v is PushTopic => (PUSH_TOPICS as readonly unknown[]).includes(v);

/**
 * Topics switched on automatically when the guest allows notifications in the
 * installed app. "promo" is marketing (art. 398 PKE): to make invitations
 * opt-in again, drop it from this list — guests can still add it in settings.
 */
export const AUTO_TOPICS: PushTopic[] = ["events", "menu", "promo"];

/** Hand-written in the four main languages; other languages are machine-translated from English. */
export type PromoText = { title: Record<"pl" | "ru" | "en" | "ua", string>; body: Record<"pl" | "ru" | "en" | "ua", string> };

export const PROMO_PRESETS: PromoText[] = [
  {
    title: { pl: "Piątek wieczór? Mamy plan 🔥", ru: "Пятничный вечер? У нас есть план 🔥", en: "Friday night? We've got a plan 🔥", ua: "Пʼятничний вечір? У нас є план 🔥" },
    body: {
      pl: "Świeża shisha, autorskie koktajle i dobra muzyka. Zarezerwuj stolik, zanim zrobią to inni.",
      ru: "Свежий кальян, авторские коктейли и хорошая музыка. Забронируйте столик, пока не опередили.",
      en: "Fresh shisha, signature cocktails and good music. Book a table before someone else does.",
      ua: "Свіжий кальян, авторські коктейлі та добра музика. Забронюйте столик, поки не випередили.",
    },
  },
  {
    title: { pl: "Twój stolik już czeka", ru: "Ваш столик уже ждёт", en: "Your table is waiting", ua: "Ваш столик уже чекає" },
    body: {
      pl: "Wpadnij dziś do BALANCE — chill, aromatyczny dym i koktajl, który poprawia humor.",
      ru: "Загляните сегодня в BALANCE — чилл, ароматный дым и коктейль для настроения.",
      en: "Drop by BALANCE tonight — chill vibes, aromatic smoke and a cocktail to lift your mood.",
      ua: "Завітайте сьогодні до BALANCE — чіл, ароматний дим і коктейль для настрою.",
    },
  },
  {
    title: { pl: "Weekend zaczyna się u nas", ru: "Выходные начинаются у нас", en: "The weekend starts here", ua: "Вихідні починаються в нас" },
    body: {
      pl: "Zbierz ekipę i przyjdź na wieczór, o którym będziecie gadać do poniedziałku.",
      ru: "Соберите компанию и приходите на вечер, о котором будете говорить до понедельника.",
      en: "Get the crew together for a night you'll be talking about until Monday.",
      ua: "Збирайте компанію й приходьте на вечір, про який говоритимете до понеділка.",
    },
  },
  {
    title: { pl: "Czas na balans 🍸", ru: "Время для баланса 🍸", en: "Time to find your balance 🍸", ua: "Час для балансу 🍸" },
    body: {
      pl: "Po ciężkim dniu należy Ci się dobra shisha i spokojny wieczór. Czekamy na Ciebie.",
      ru: "После тяжёлого дня вы заслужили хороший кальян и спокойный вечер. Ждём вас.",
      en: "After a long day you deserve a good shisha and a slow evening. We're waiting for you.",
      ua: "Після важкого дня ви заслужили добрий кальян і спокійний вечір. Чекаємо на вас.",
    },
  },
  {
    title: { pl: "Dziś najlepsze miejsca są jeszcze wolne", ru: "Лучшие места сегодня ещё свободны", en: "The best seats are still free tonight", ua: "Найкращі місця сьогодні ще вільні" },
    body: {
      pl: "Zarezerwuj stolik w dwie minuty i przyjdź prosto na swój wieczór.",
      ru: "Забронируйте столик за две минуты и приходите прямо к своему вечеру.",
      en: "Book a table in two minutes and walk straight into your evening.",
      ua: "Забронюйте столик за дві хвилини й приходьте просто до свого вечора.",
    },
  },
  {
    title: { pl: "Spróbuj czegoś nowego", ru: "Попробуйте что-то новое", en: "Try something new", ua: "Спробуйте щось нове" },
    body: {
      pl: "Nasi barmani mają dla Ciebie koktajl, którego jeszcze nie znasz. Zajrzyj wieczorem.",
      ru: "У наших барменов есть коктейль, который вы ещё не пробовали. Заходите вечером.",
      en: "Our bartenders have a cocktail you haven't tried yet. Come by tonight.",
      ua: "Наші бармени мають коктейль, якого ви ще не куштували. Заходьте ввечері.",
    },
  },
];

/** Picks a preset for a given day, so the automatic invitation varies from week to week. */
export function presetForDay(date: Date): PromoText {
  const dayNo = Math.floor(date.getTime() / 86_400_000);
  return PROMO_PRESETS[dayNo % PROMO_PRESETS.length];
}
