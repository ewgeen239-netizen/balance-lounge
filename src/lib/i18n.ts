// Languages + UI dictionaries. Translatable DB fields use the same Lang keys.

// Main languages (always shown in the switcher) + extra languages (behind the arrow,
// filled in by on-demand machine translation).
export const MAIN_LANGS = ["pl", "ru", "en", "de"] as const;
export const EXTRA_LANGS = ["ua", "es", "fr", "it", "pt", "tr", "cs", "nl", "zh"] as const;
export const LANGS = [...MAIN_LANGS, ...EXTRA_LANGS] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "pl";

// Languages that have hand-written translations. Everything else is auto-translated
// (and cached in the DB via /api/translate).
export const HAND_LANGS: Lang[] = ["pl", "ru", "en", "ua"];

export const LANG_LABEL: Record<Lang, string> = {
  pl: "PL", ru: "RU", en: "EN", de: "DE", ua: "UA",
  es: "ES", fr: "FR", it: "IT", pt: "PT", tr: "TR", cs: "CS", nl: "NL", zh: "ZH",
};

// ISO codes for the translation API (MyMemory).
export const LANG_ISO: Record<Lang, string> = {
  pl: "pl", ru: "ru", en: "en", de: "de", ua: "uk",
  es: "es", fr: "fr", it: "it", pt: "pt", tr: "tr", cs: "cs", nl: "nl", zh: "zh",
};

export const LANG_FULL: Record<Lang, string> = {
  pl: "Polski", ru: "Русский", en: "English", de: "Deutsch", ua: "Українська",
  es: "Español", fr: "Français", it: "Italiano", pt: "Português", tr: "Türkçe",
  cs: "Čeština", nl: "Nederlands", zh: "中文",
};

// Translatable value stored in DB as JSON string { pl, ru, en, ua }.
export type Translatable = Partial<Record<Lang, string>>;

/** Resolve a translatable field (parsed object OR JSON string) for a language, with fallbacks. */
export function tr(value: unknown, lang: Lang): string {
  let obj: Translatable = {};
  if (typeof value === "string") {
    try {
      obj = JSON.parse(value);
    } catch {
      return value; // plain string fallback
    }
  } else if (value && typeof value === "object") {
    obj = value as Translatable;
  }
  return obj[lang] || obj[DEFAULT_LANG] || obj.en || Object.values(obj)[0] || "";
}

export function makeTranslatable(t: Translatable): string {
  return JSON.stringify(t);
}

/** Parse a translatable field and return its English (or default) base — the source
 *  used for auto-translation into languages without a hand-written value. */
export function trBase(value: unknown): string {
  let obj: Translatable = {};
  if (typeof value === "string") {
    try { obj = JSON.parse(value); } catch { return value; }
  } else if (value && typeof value === "object") {
    obj = value as Translatable;
  }
  return obj.en || obj[DEFAULT_LANG] || Object.values(obj)[0] || "";
}

/** Does a translatable value already contain a hand value for this language? */
export function hasHand(value: unknown, lang: Lang): boolean {
  let obj: Translatable = {};
  if (typeof value === "string") {
    try { obj = JSON.parse(value); } catch { return true; }
  } else if (value && typeof value === "object") {
    obj = value as Translatable;
  }
  return Boolean(obj[lang]);
}

type Dict = Record<string, Partial<Record<Lang, string>>>;

export const UI: Dict = {
  "nav.home": { pl: "Główna", ru: "Главная", en: "Home", ua: "Головна" },
  "nav.menu": { pl: "Menu", ru: "Меню", en: "Menu", ua: "Меню" },
  "nav.booking": { pl: "Rezerwacja", ru: "Бронь", en: "Booking", ua: "Бронювання" },
  "nav.about": { pl: "O nas", ru: "О нас", en: "About", ua: "Про нас" },
  "nav.account": { pl: "Konto", ru: "Кабинет", en: "Account", ua: "Кабінет" },
  "cta.reserve": { pl: "Rezerwacja", ru: "Забронировать", en: "Reserve", ua: "Забронювати" },
  "cta.viewMenu": { pl: "Zobacz menu", ru: "Смотреть меню", en: "View menu", ua: "Дивитись меню" },
  "cta.bookTable": { pl: "Zarezerwuj stolik", ru: "Забронировать столик", en: "Book a table", ua: "Забронювати столик" },
  "cta.route": { pl: "Wyznacz trasę", ru: "Построить маршрут", en: "Build route", ua: "Прокласти маршрут" },

  "home.aboutHeading": { pl: "O NAS", ru: "О НАС", en: "ABOUT US", ua: "ПРО НАС" },
  "home.contact": { pl: "Kontakt", ru: "Контакты", en: "Contact", ua: "Контакти" },
  "home.address": { pl: "Adres", ru: "Адрес", en: "Address", ua: "Адреса" },
  "home.phone": { pl: "Telefon", ru: "Телефон", en: "Phone", ua: "Телефон" },
  "home.hours": { pl: "Godziny otwarcia", ru: "Часы работы", en: "Opening hours", ua: "Години роботи" },
  "home.socials": { pl: "Znajdź nas", ru: "Мы в сети", en: "Find us", ua: "Знайди нас" },
  "home.reserveTitle": { pl: "Zarezerwuj stolik", ru: "Забронируйте столик", en: "Reserve a table", ua: "Забронюй столик" },
  "home.reserveText": {
    pl: "Zarezerwuj miejsce w samym sercu Szczecina. Szybko i bez konta.",
    ru: "Забронируйте место в самом сердце Щецина. Быстро и без аккаунта.",
    en: "Reserve your spot in the heart of Szczecin. Fast, no account needed.",
    ua: "Забронюй місце в самому серці Щеціна. Швидко і без акаунту.",
  },

  "menu.title": { pl: "Menu", ru: "Меню", en: "Menu", ua: "Меню" },
  "menu.search": { pl: "Szukaj w menu…", ru: "Поиск в меню…", en: "Search the menu…", ua: "Пошук у меню…" },
  "menu.all": { pl: "Wszystko", ru: "Всё", en: "All", ua: "Все" },
  "menu.soldout": { pl: "Wyprzedane", ru: "Нет в наличии", en: "Sold out", ua: "Немає" },
  "menu.available": { pl: "Dostępne", ru: "В наличии", en: "Available", ua: "В наявності" },
  "menu.empty": { pl: "Brak pozycji.", ru: "Ничего не найдено.", en: "Nothing found.", ua: "Нічого не знайдено." },
  "menu.closedToday": { pl: "Dziś niedostępne", ru: "Сегодня недоступно", en: "Unavailable today", ua: "Сьогодні недоступно" },
  "menu.closedTodayLong": { pl: "Ta kategoria jest dziś niedostępna", ru: "Эта категория сегодня недоступна", en: "This category is unavailable today", ua: "Ця категорія сьогодні недоступна" },
  "lang.more": { pl: "Więcej języków", ru: "Ещё языки", en: "More languages", ua: "Більше мов" },
  "menu.required": { pl: "Wymagane", ru: "Обязательно", en: "Required", ua: "Обов'язково" },
  "menu.free": { pl: "W cenie", ru: "Включено", en: "Included", ua: "Включено" },
  "menu.addons": { pl: "Dodatki", ru: "Дополнения", en: "Add-ons", ua: "Додатки" },
  "menu.portions": { pl: "Porcje", ru: "Порции", en: "Servings", ua: "Порції" },
  "menu.from": { pl: "od", ru: "от", en: "from", ua: "від" },
  "menu.eshishaNote": {
    pl: "Możesz wybrać zamiast klasycznej shishy",
    ru: "Можно выбрать вместо обычного кальяна",
    en: "Can be chosen instead of a classic shisha",
    ua: "Можна обрати замість звичайного кальяну",
  },

  "badge.nowosc": { pl: "Nowość", ru: "Новинка", en: "New", ua: "Новинка" },
  "badge.popularne": { pl: "Popularne", ru: "Популярное", en: "Popular", ua: "Популярне" },
  "badge.18": { pl: "18+", ru: "18+", en: "18+", ua: "18+" },

  "book.title": { pl: "Rezerwacja stolika", ru: "Бронирование столика", en: "Table reservation", ua: "Бронювання столика" },
  "book.date": { pl: "Data", ru: "Дата", en: "Date", ua: "Дата" },
  "book.time": { pl: "Godzina", ru: "Время", en: "Time", ua: "Час" },
  "book.guests": { pl: "Liczba gości", ru: "Количество гостей", en: "Guests", ua: "Кількість гостей" },
  "book.name": { pl: "Imię", ru: "Имя", en: "Name", ua: "Ім'я" },
  "book.phone": { pl: "Telefon", ru: "Телефон", en: "Phone", ua: "Телефон" },
  "book.zone": { pl: "Strefa (opcjonalnie)", ru: "Зона (необязательно)", en: "Zone (optional)", ua: "Зона (необов'язково)" },
  "book.comment": { pl: "Komentarz (opcjonalnie)", ru: "Комментарий (необязательно)", en: "Comment (optional)", ua: "Коментар (необов'язково)" },
  "book.submit": { pl: "Zarezerwuj", ru: "Забронировать", en: "Reserve", ua: "Забронювати" },
  "book.zoneAny": { pl: "Dowolna", ru: "Любая", en: "Any", ua: "Будь-яка" },
  "book.zoneHall": { pl: "Sala główna", ru: "Основной зал", en: "Main hall", ua: "Головна зала" },
  "book.zoneLounge": { pl: "Strefa lounge", ru: "Лаунж-зона", en: "Lounge", ua: "Лаунж-зона" },
  "book.zoneBar": { pl: "Przy barze", ru: "У бара", en: "At the bar", ua: "Біля бару" },
  "book.success": { pl: "Rezerwacja przyjęta!", ru: "Бронь принята!", en: "Reservation received!", ua: "Бронь прийнято!" },
  "book.successText": {
    pl: "Skontaktujemy się, aby potwierdzić rezerwację.",
    ru: "Мы свяжемся с вами для подтверждения.",
    en: "We'll contact you to confirm your booking.",
    ua: "Ми зв'яжемось для підтвердження.",
  },
  "book.saveAccount": { pl: "Zapisz swoje dane na przyszłość?", ru: "Сохранить данные на будущее?", en: "Save your details for next time?", ua: "Зберегти дані на майбутнє?" },
  "book.createAccount": { pl: "Załóż konto", ru: "Создать аккаунт", en: "Create account", ua: "Створити акаунт" },
  "book.dismiss": { pl: "Nie teraz", ru: "Не сейчас", en: "Not now", ua: "Не зараз" },
  "book.closed": { pl: "Zamknięte w wybranym dniu.", ru: "Закрыто в выбранный день.", en: "Closed on the selected day.", ua: "Зачинено в обраний день." },

  "acc.title": { pl: "Twoje konto", ru: "Ваш кабинет", en: "Your account", ua: "Твій кабінет" },
  "acc.login": { pl: "Zaloguj się", ru: "Войти", en: "Log in", ua: "Увійти" },
  "acc.signup": { pl: "Załóż konto", ru: "Регистрация", en: "Sign up", ua: "Реєстрація" },
  "acc.logout": { pl: "Wyloguj", ru: "Выйти", en: "Log out", ua: "Вийти" },
  "acc.email": { pl: "E-mail", ru: "E-mail", en: "Email", ua: "E-mail" },
  "acc.password": { pl: "Hasło", ru: "Пароль", en: "Password", ua: "Пароль" },
  "acc.history": { pl: "Historia rezerwacji", ru: "История броней", en: "Reservation history", ua: "Історія бронювань" },
  "acc.noHistory": { pl: "Brak rezerwacji.", ru: "Броней пока нет.", en: "No reservations yet.", ua: "Бронювань поки немає." },
  "acc.hello": { pl: "Witaj", ru: "Привет", en: "Welcome", ua: "Вітаємо" },

  "status.pending": { pl: "Oczekuje", ru: "Ожидает", en: "Pending", ua: "Очікує" },
  "status.confirmed": { pl: "Potwierdzona", ru: "Подтверждена", en: "Confirmed", ua: "Підтверджена" },
  "status.seated": { pl: "Zajęty stolik", ru: "Гость за столом", en: "Seated", ua: "За столом" },
  "status.cancelled": { pl: "Anulowana", ru: "Отменена", en: "Cancelled", ua: "Скасована" },

  "footer.rights": { pl: "Wszelkie prawa zastrzeżone.", ru: "Все права защищены.", en: "All rights reserved.", ua: "Всі права захищені." },
  "common.loading": { pl: "Ładowanie…", ru: "Загрузка…", en: "Loading…", ua: "Завантаження…" },
  "common.error": { pl: "Coś poszło nie tak.", ru: "Что-то пошло не так.", en: "Something went wrong.", ua: "Щось пішло не так." },
};

export function t(key: string, lang: Lang): string {
  const e = UI[key];
  if (!e) return key;
  return e[lang] ?? e.en ?? e[DEFAULT_LANG] ?? key;
}

/** English source string for a UI key (used as the base for auto-translation). */
export function tBase(key: string): string {
  const e = UI[key];
  return e?.en ?? e?.[DEFAULT_LANG] ?? key;
}

export const WEEKDAYS: Partial<Record<Lang, string[]>> = {
  pl: ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"],
  ru: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ua: ["Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота"],
};
export function weekdays(lang: Lang): string[] {
  return WEEKDAYS[lang] ?? WEEKDAYS.en!;
}
