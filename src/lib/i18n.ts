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
  "nav.events": { pl: "Wydarzenia", ru: "События", en: "Events", ua: "Заходи" },
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
  "menu.availableToday": { pl: "Dziś dostępne", ru: "Сегодня доступно", en: "Available today", ua: "Сьогодні доступно" },
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
  "book.email": { pl: "E-mail", ru: "E-mail", en: "Email", ua: "E-mail" },
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
  "events.title": { pl: "Nasze wydarzenia", ru: "Наши мероприятия", en: "Our events", ua: "Наші заходи" },
  "events.subtitle": {
    pl: "Wieczory tematyczne, muzyka i wyjątkowe okazje w Balance.",
    ru: "Тематические вечера, музыка и особые события в Balance.",
    en: "Themed nights, music and special occasions at Balance.",
    ua: "Тематичні вечори, музика та особливі події в Balance.",
  },
  "events.past": { pl: "Minione wydarzenia", ru: "Прошедшие мероприятия", en: "Past events", ua: "Минулі заходи" },
  "events.live": { pl: "Trwa teraz", ru: "Идёт сейчас", en: "Happening now", ua: "Триває зараз" },
  "events.soon": { pl: "Wkrótce", ru: "Скоро", en: "Coming up", ua: "Незабаром" },
  "events.ended": { pl: "Zakończone", ru: "Завершено", en: "Ended", ua: "Завершено" },
  "events.empty": {
    pl: "Wkrótce ogłosimy nowe wydarzenia — zajrzyj tu niedługo.",
    ru: "Скоро мы объявим новые мероприятия — загляните сюда позже.",
    en: "New events are coming soon — check back shortly.",
    ua: "Незабаром ми оголосимо нові заходи — зазирніть сюди пізніше.",
  },
  "events.more": { pl: "Szczegóły", ru: "Подробнее", en: "Details", ua: "Детальніше" },
  "events.book": { pl: "Zarezerwuj stolik", ru: "Забронировать столик", en: "Book a table", ua: "Забронювати столик" },
  "events.strip": {
    pl: "Zobacz, co dzieje się w Balance",
    ru: "Узнайте, что происходит в Balance",
    en: "See what's on at Balance",
    ua: "Дізнайтеся, що відбувається в Balance",
  },
  "events.next": { pl: "Najbliższe", ru: "Ближайшее", en: "Next up", ua: "Найближчий" },
  "footer.privacy": { pl: "Polityka prywatności", ru: "Политика конфиденциальности", en: "Privacy policy", ua: "Політика конфіденційності" },
  "footer.cookies": { pl: "Ustawienia cookie", ru: "Настройки cookie", en: "Cookie settings", ua: "Налаштування cookie" },
  "cookie.title": { pl: "Szanujemy Twoją prywatność", ru: "Мы уважаем вашу конфиденциальность", en: "We respect your privacy", ua: "Ми поважаємо вашу приватність" },
  "cookie.text": {
    pl: "Używamy niezbędnych plików cookie, aby strona działała. Za Twoją zgodą użyjemy też statystyk odwiedzin i treści zewnętrznych (mapa Google). Wybór zmienisz w każdej chwili w „Ustawieniach cookie”.",
    ru: "Мы используем необходимые cookie для работы сайта. С вашего согласия — также статистику посещений и внешний контент (карта Google). Выбор можно изменить в любой момент в «Настройках cookie».",
    en: "We use necessary cookies to make the site work. With your consent we also use visit statistics and external content (Google Maps). You can change your choice at any time in “Cookie settings”.",
    ua: "Ми використовуємо необхідні cookie для роботи сайту. За вашою згодою — також статистику відвідувань і зовнішній вміст (карта Google). Вибір можна змінити будь-коли в «Налаштуваннях cookie».",
  },
  "cookie.acceptAll": { pl: "Akceptuj wszystkie", ru: "Принять все", en: "Accept all", ua: "Прийняти всі" },
  "cookie.rejectAll": { pl: "Odrzuć opcjonalne", ru: "Отклонить необязательные", en: "Reject optional", ua: "Відхилити необов'язкові" },
  "cookie.settings": { pl: "Ustawienia", ru: "Настройки", en: "Settings", ua: "Налаштування" },
  "cookie.save": { pl: "Zapisz wybór", ru: "Сохранить выбор", en: "Save choice", ua: "Зберегти вибір" },
  "cookie.alwaysOn": { pl: "Zawsze aktywne", ru: "Всегда активны", en: "Always on", ua: "Завжди активні" },
  "cookie.necessary": { pl: "Niezbędne", ru: "Необходимые", en: "Necessary", ua: "Необхідні" },
  "cookie.necessaryDesc": {
    pl: "Logowanie do konta, zapamiętanie języka i Twojego wyboru cookie. Bez nich strona nie działa poprawnie.",
    ru: "Вход в аккаунт, запоминание языка и вашего выбора cookie. Без них сайт работает некорректно.",
    en: "Account sign-in, remembering your language and cookie choice. The site doesn't work properly without them.",
    ua: "Вхід до акаунта, запам'ятовування мови та вашого вибору cookie. Без них сайт працює некоректно.",
  },
  "cookie.analytics": { pl: "Statystyki", ru: "Статистика", en: "Statistics", ua: "Статистика" },
  "cookie.analyticsDesc": {
    pl: "Anonimowe statystyki odwiedzin (Vercel Web Analytics) — pomagają nam ulepszać stronę.",
    ru: "Анонимная статистика посещений (Vercel Web Analytics) — помогает нам улучшать сайт.",
    en: "Anonymous visit statistics (Vercel Web Analytics) — help us improve the site.",
    ua: "Анонімна статистика відвідувань (Vercel Web Analytics) — допомагає нам покращувати сайт.",
  },
  "cookie.external": { pl: "Treści zewnętrzne", ru: "Внешний контент", en: "External content", ua: "Зовнішній вміст" },
  "cookie.externalDesc": {
    pl: "Mapa Google na stronie głównej. Google może przy tym zapisywać własne pliki cookie.",
    ru: "Карта Google на главной странице. Google может сохранять свои cookie.",
    en: "The Google map on the home page. Google may set its own cookies.",
    ua: "Карта Google на головній сторінці. Google може зберігати власні cookie.",
  },
  "cookie.marketing": { pl: "Marketing", ru: "Маркетинг", en: "Marketing", ua: "Маркетинг" },
  "cookie.marketingDesc": {
    pl: "Obecnie nie używamy narzędzi marketingowych.",
    ru: "Сейчас мы не используем маркетинговые инструменты.",
    en: "We don't use any marketing tools at the moment.",
    ua: "Наразі ми не використовуємо маркетингових інструментів.",
  },
  "map.blocked": {
    pl: "Mapa Google jest wyłączona, dopóki nie zgodzisz się na treści zewnętrzne.",
    ru: "Карта Google отключена, пока вы не разрешите внешний контент.",
    en: "The Google map stays off until you allow external content.",
    ua: "Карта Google вимкнена, доки ви не дозволите зовнішній вміст.",
  },
  "map.show": { pl: "Pokaż mapę", ru: "Показать карту", en: "Show map", ua: "Показати карту" },
  "rodo.note": {
    pl: "Dane z formularza przetwarzamy wyłącznie w celu obsługi rezerwacji i konta. Administrator, Twoje prawa i szczegóły:",
    ru: "Данные из формы обрабатываются только для обслуживания бронирования и аккаунта. Администратор, ваши права и подробности:",
    en: "We process the form data only to handle your booking and account. Controller, your rights and details:",
    ua: "Дані з форми обробляються лише для обслуговування бронювання та акаунта. Адміністратор, ваші права та деталі:",
  },
  "privacy.binding": {
    pl: "",
    ru: "Юридически обязывающей является польская версия документа.",
    en: "The Polish version of this document is the legally binding one.",
    ua: "Юридично обов'язковою є польська версія документа.",
  },
  // ---- PWA: "add to home screen" card + instructions ----
  "install.title": { pl: "Dodaj BALANCE na ekran", ru: "Добавьте BALANCE на экран", en: "Add BALANCE to your home screen", ua: "Додайте BALANCE на екран" },
  "install.subPlain": {
    pl: "Aplikacja z powiadomieniami o wydarzeniach i nowościach",
    ru: "Приложение с уведомлениями о событиях и новинках",
    en: "An app that tells you about events and what's new",
    ua: "Застосунок зі сповіщеннями про події та новинки",
  },
  "install.sub": {
    pl: "+{n} punktów na start i powiadomienia o wydarzeniach",
    ru: "+{n} баллов на старт и уведомления о событиях",
    en: "+{n} welcome points and event notifications",
    ua: "+{n} балів на старт і сповіщення про події",
  },
  "install.collapse": { pl: "Zwiń", ru: "Свернуть", en: "Collapse", ua: "Згорнути" },
  "install.reopen": { pl: "Jak dodać aplikację BALANCE", ru: "Как добавить приложение BALANCE", en: "How to add the BALANCE app", ua: "Як додати застосунок BALANCE" },
  "install.sheetTitle": { pl: "BALANCE na Twoim ekranie", ru: "BALANCE на вашем экране", en: "BALANCE on your home screen", ua: "BALANCE на вашому екрані" },
  "install.why": {
    pl: "Otwiera się jak zwykła aplikacja — bez App Store, bez zajmowania miejsca. Dostaniesz powiadomienia o wydarzeniach i nowościach w menu.",
    ru: "Открывается как обычное приложение — без App Store и почти без места на телефоне. Будут приходить уведомления о событиях и новинках меню.",
    en: "Opens like a regular app — no App Store, next to no storage. You'll get notified about events and what's new on the menu.",
    ua: "Відкривається як звичайний застосунок — без App Store і майже без місця на телефоні. Надходитимуть сповіщення про події та новинки меню.",
  },
  "install.ios1": {
    pl: "W Safari stuknij „•••” obok adresu, a potem „Udostępnij”",
    ru: "В Safari нажмите «•••» рядом с адресом, затем «Поделиться»",
    en: "In Safari, tap “•••” next to the address, then “Share”",
    ua: "У Safari натисніть «•••» біля адреси, потім «Поділитися»",
  },
  "install.ios1alt": {
    pl: "W starszym iOS przycisk „Udostępnij” jest od razu na dolnym pasku.",
    ru: "В старых версиях iOS кнопка «Поделиться» сразу на нижней панели.",
    en: "On older iOS the Share button sits right in the bottom bar.",
    ua: "У старіших iOS кнопка «Поділитися» одразу на нижній панелі.",
  },
  "install.ios2": {
    pl: "Stuknij „Pokaż więcej” i wybierz „Do ekranu początkowego”",
    ru: "Нажмите «Показать больше» и выберите «На экран „Домой“»",
    en: "Tap “Show more” and choose “Add to Home Screen”",
    ua: "Натисніть «Показати більше» і виберіть «На початковий екран»",
  },
  "install.ios3": {
    pl: "Zostaw włączone „Otwórz jako aplikację” i stuknij „Dodaj”",
    ru: "Оставьте включённым «Открыть как веб-приложение» и нажмите «Добавить»",
    en: "Keep “Open as Web App” on and tap “Add”",
    ua: "Залиште ввімкненим «Відкрити як вебзастосунок» і натисніть «Додати»",
  },
  "install.iosOther": {
    pl: "Najprościej zrobisz to w Safari — otwórz w nim balancecocktails.pl.",
    ru: "Проще всего это сделать в Safari — откройте в нём balancecocktails.pl.",
    en: "It's easiest in Safari — open balancecocktails.pl there.",
    ua: "Найпростіше це зробити в Safari — відкрийте в ньому balancecocktails.pl.",
  },
  "install.android1": {
    pl: "Otwórz menu przeglądarki (⋮ w prawym górnym rogu)",
    ru: "Откройте меню браузера (⋮ в правом верхнем углу)",
    en: "Open the browser menu (⋮ in the top-right corner)",
    ua: "Відкрийте меню браузера (⋮ у правому верхньому куті)",
  },
  "install.android2": {
    pl: "Wybierz „Zainstaluj aplikację” lub „Dodaj do ekranu głównego”",
    ru: "Выберите «Установить приложение» или «Добавить на главный экран»",
    en: "Choose “Install app” or “Add to Home screen”",
    ua: "Виберіть «Установити застосунок» або «Додати на головний екран»",
  },
  "install.android3": { pl: "Potwierdź — gotowe", ru: "Подтвердите — готово", en: "Confirm — done", ua: "Підтвердьте — готово" },
  "install.desktop1": {
    pl: "Kliknij ikonę instalacji na końcu paska adresu (lub menu ⋮ → „Zainstaluj BALANCE”)",
    ru: "Нажмите значок установки в конце адресной строки (или меню ⋮ → «Установить BALANCE»)",
    en: "Click the install icon at the end of the address bar (or menu ⋮ → “Install BALANCE”)",
    ua: "Натисніть значок установлення в кінці адресного рядка (або меню ⋮ → «Установити BALANCE»)",
  },
  "install.desktopSafari": {
    pl: "W Safari na Macu: menu Plik → „Dodaj do Docka”",
    ru: "В Safari на Mac: меню «Файл» → «Добавить в Dock»",
    en: "In Safari on a Mac: File menu → “Add to Dock”",
    ua: "У Safari на Mac: меню «Файл» → «Додати в Dock»",
  },
  "install.last": {
    pl: "Otwórz BALANCE z ekranu i włącz powiadomienia",
    ru: "Откройте BALANCE с экрана и включите уведомления",
    en: "Open BALANCE from your home screen and turn on notifications",
    ua: "Відкрийте BALANCE з екрана та увімкніть сповіщення",
  },
  "install.now": { pl: "Zainstaluj aplikację", ru: "Установить приложение", en: "Install the app", ua: "Установити застосунок" },
  "install.done": { pl: "Rozumiem", ru: "Понятно", en: "Got it", ua: "Зрозуміло" },

  // ---- PWA: notification consent + settings ----
  "push.text": {
    pl: "Wybierz, o czym mamy Ci dać znać. Zgodę możesz zmienić lub wycofać w każdej chwili w „Powiadomieniach” w stopce.",
    ru: "Выберите, о чём нам сообщать. Согласие можно изменить или отозвать в любой момент в разделе «Уведомления» внизу сайта.",
    en: "Choose what we should tell you about. You can change or withdraw this any time under “Notifications” in the footer.",
    ua: "Виберіть, про що нам повідомляти. Згоду можна змінити або відкликати будь-коли в розділі «Сповіщення» внизу сайту.",
  },
  "push.topic.events": { pl: "Wydarzenia", ru: "События", en: "Events", ua: "Події" },
  "push.topic.eventsDesc": {
    pl: "nowe imprezy, DJ-e i wieczory tematyczne",
    ru: "новые вечеринки, DJ-сеты и тематические вечера",
    en: "new parties, DJ sets and themed nights",
    ua: "нові вечірки, DJ-сети й тематичні вечори",
  },
  "push.topic.menu": { pl: "Menu i ceny", ru: "Меню и цены", en: "Menu & prices", ua: "Меню та ціни" },
  "push.topic.menuDesc": {
    pl: "nowe pozycje, nowe kategorie i zmiany cen",
    ru: "новые позиции, новые категории и изменения цен",
    en: "new dishes and drinks, new categories and price changes",
    ua: "нові позиції, нові категорії та зміни цін",
  },
  "push.topic.promo": { pl: "Zaproszenia i oferty", ru: "Приглашения и предложения", en: "Invitations & offers", ua: "Запрошення та пропозиції" },
  "push.topic.promoDesc": {
    pl: "od czasu do czasu zaproszenie na wieczór w BALANCE (informacja handlowa)",
    ru: "время от времени приглашение провести вечер в BALANCE (рекламная информация)",
    en: "now and then an invitation to spend an evening at BALANCE (marketing)",
    ua: "час від часу запрошення провести вечір у BALANCE (рекламна інформація)",
  },
  "push.allowAll": { pl: "Włącz wszystkie", ru: "Включить все", en: "Turn all on", ua: "Увімкнути всі" },
  "push.allowSelected": { pl: "Włącz wybrane", ru: "Включить выбранные", en: "Turn on selected", ua: "Увімкнути вибрані" },
  "push.onTitle": { pl: "Powiadomienia włączone", ru: "Уведомления включены", en: "Notifications are on", ua: "Сповіщення увімкнено" },
  "push.onText": { pl: "Wydarzenia, nowości w menu i zaproszenia", ru: "События, новинки меню и приглашения", en: "Events, menu news and invitations", ua: "Події, новинки меню та запрошення" },
  "push.change": { pl: "Zmień", ru: "Изменить", en: "Change", ua: "Змінити" },
  "push.nudgeTitle": { pl: "Włącz powiadomienia", ru: "Включите уведомления", en: "Turn on notifications", ua: "Увімкніть сповіщення" },
  "push.nudgeText": {
    pl: "Nie przegap wydarzeń i nowości w menu",
    ru: "Не пропустите события и новинки меню",
    en: "Don't miss events and menu news",
    ua: "Не пропустіть події та новинки меню",
  },
  "push.nudgeDenied": {
    pl: "Powiadomienia są zablokowane w ustawieniach telefonu",
    ru: "Уведомления заблокированы в настройках телефона",
    en: "Notifications are blocked in your phone settings",
    ua: "Сповіщення заблоковано в налаштуваннях телефона",
  },
  "push.enable": { pl: "Włącz", ru: "Включить", en: "Turn on", ua: "Увімкнути" },
  "push.howTo": { pl: "Jak włączyć", ru: "Как включить", en: "How to", ua: "Як увімкнути" },
  "push.save": { pl: "Zapisz", ru: "Сохранить", en: "Save", ua: "Зберегти" },
  "push.off": { pl: "Wyłącz wszystkie powiadomienia", ru: "Отключить все уведомления", en: "Turn all notifications off", ua: "Вимкнути всі сповіщення" },
  "push.saved": { pl: "Zapisano.", ru: "Сохранено.", en: "Saved.", ua: "Збережено." },
  "push.settings": { pl: "Powiadomienia", ru: "Уведомления", en: "Notifications", ua: "Сповіщення" },
  "push.statusOn": { pl: "Powiadomienia są włączone na tym urządzeniu.", ru: "Уведомления включены на этом устройстве.", en: "Notifications are on for this device.", ua: "Сповіщення увімкнено на цьому пристрої." },
  "push.statusOff": { pl: "Powiadomienia są wyłączone na tym urządzeniu.", ru: "Уведомления отключены на этом устройстве.", en: "Notifications are off for this device.", ua: "Сповіщення вимкнено на цьому пристрої." },
  "push.denied": {
    pl: "Powiadomienia są zablokowane w ustawieniach telefonu. Włącz je w Ustawieniach → Powiadomienia → BALANCE.",
    ru: "Уведомления заблокированы в настройках телефона. Включите их в «Настройки» → «Уведомления» → BALANCE.",
    en: "Notifications are blocked in your phone settings. Turn them on in Settings → Notifications → BALANCE.",
    ua: "Сповіщення заблоковано в налаштуваннях телефона. Увімкніть їх у «Параметри» → «Сповіщення» → BALANCE.",
  },
  "push.needInstall": {
    pl: "Na iPhonie powiadomienia działają po dodaniu BALANCE na ekran początkowy.",
    ru: "На iPhone уведомления работают после добавления BALANCE на экран «Домой».",
    en: "On iPhone, notifications work once BALANCE is added to your home screen.",
    ua: "На iPhone сповіщення працюють після додавання BALANCE на початковий екран.",
  },
  "push.unsupported": {
    pl: "Ta przeglądarka nie obsługuje powiadomień.",
    ru: "Этот браузер не поддерживает уведомления.",
    en: "This browser doesn't support notifications.",
    ua: "Цей браузер не підтримує сповіщення.",
  },
  "push.privacy": {
    pl: "Zapisujemy tylko techniczny adres powiadomień tego urządzenia, język i wybrane tematy.",
    ru: "Мы храним только технический адрес уведомлений этого устройства, язык и выбранные темы.",
    en: "We only store this device's technical notification address, your language and the topics you chose.",
    ua: "Ми зберігаємо лише технічну адресу сповіщень цього пристрою, мову та вибрані теми.",
  },

  // ---- Notification texts (server side; {placeholders} are filled in) ----
  "push.msg.eventTitle": { pl: "Nowe wydarzenie w BALANCE", ru: "Новое событие в BALANCE", en: "New event at BALANCE", ua: "Нова подія в BALANCE" },
  "push.msg.itemTitle": { pl: "Nowość w menu", ru: "Новинка в меню", en: "New on the menu", ua: "Новинка в меню" },
  "push.msg.itemsTitle": { pl: "Nowości w menu", ru: "Новинки в меню", en: "New on the menu", ua: "Новинки в меню" },
  "push.msg.priceTitle": { pl: "Zaktualizowaliśmy ceny", ru: "Мы обновили цены", en: "We've updated our prices", ua: "Ми оновили ціни" },
  "push.msg.priceBody": { pl: "Sprawdź aktualne ceny: {names}", ru: "Актуальные цены: {names}", en: "See the current prices: {names}", ua: "Актуальні ціни: {names}" },
  "push.msg.categoryTitle": { pl: "Nowa kategoria w menu", ru: "Новая категория в меню", en: "New menu category", ua: "Нова категорія в меню" },
  "push.msg.categoryBody": { pl: "{names} — zajrzyj do karty", ru: "{names} — загляните в меню", en: "{names} — take a look at the menu", ua: "{names} — зазирніть у меню" },
  "push.msg.more": { pl: "i jeszcze {n}", ru: "и ещё {n}", en: "and {n} more", ua: "і ще {n}" },

  // ---- Loyalty: points + coupons in the guest account ({n}, {cost}, {title} are filled in) ----
  "loy.soon": { pl: "Wkrótce", ru: "Скоро", en: "Soon", ua: "Незабаром" },
  "loy.soonText": {
    pl: "Program punktowy startuje wkrótce: zbieraj punkty i wymieniaj je na kupony. Za instalację aplikacji dostaniesz {n} pkt.",
    ru: "Программа баллов скоро запустится: копите баллы и обменивайте их на купоны. За установку приложения — {n} баллов.",
    en: "Our points programme is coming soon: collect points and turn them into coupons. Installing the app earns {n} pts.",
    ua: "Програма балів незабаром стартує: збирайте бали й обмінюйте їх на купони. За встановлення застосунку — {n} балів.",
  },
  "loy.title": { pl: "Punkty i kupony", ru: "Баллы и купоны", en: "Points & coupons", ua: "Бали та купони" },
  "loy.balance": { pl: "Twoje punkty", ru: "Ваши баллы", en: "Your points", ua: "Ваші бали" },
  "loy.unit": { pl: "pkt", ru: "баллов", en: "pts", ua: "балів" },
  "loy.rewards": { pl: "Wymień punkty na kupon", ru: "Обменяйте баллы на купон", en: "Turn points into a coupon", ua: "Обміняйте бали на купон" },
  "loy.redeem": { pl: "Wymień", ru: "Обменять", en: "Redeem", ua: "Обміняти" },
  "loy.missing": { pl: "Brakuje {n} pkt", ru: "Не хватает {n}", en: "{n} pts to go", ua: "Бракує {n}" },
  "loy.confirm": {
    pl: "Wymienić {cost} pkt na „{title}”?",
    ru: "Обменять {cost} баллов на «{title}»?",
    en: "Spend {cost} pts on “{title}”?",
    ua: "Обміняти {cost} балів на «{title}»?",
  },
  "loy.notEnough": { pl: "Za mało punktów.", ru: "Недостаточно баллов.", en: "Not enough points.", ua: "Недостатньо балів." },
  "loy.coupons": { pl: "Moje kupony", ru: "Мои купоны", en: "My coupons", ua: "Мої купони" },
  "loy.noCoupons": {
    pl: "Nie masz jeszcze kuponów — wymień punkty powyżej.",
    ru: "Купонов пока нет — обменяйте баллы выше.",
    en: "No coupons yet — redeem your points above.",
    ua: "Купонів поки немає — обміняйте бали вище.",
  },
  "loy.show": { pl: "Pokaż ten kod obsłudze", ru: "Покажите этот код персоналу", en: "Show this code to the staff", ua: "Покажіть цей код персоналу" },
  "loy.validUntil": { pl: "Ważny do", ru: "Действует до", en: "Valid until", ua: "Дійсний до" },
  "loy.active": { pl: "Aktywny", ru: "Активен", en: "Active", ua: "Активний" },
  "loy.used": { pl: "Wykorzystany", ru: "Использован", en: "Used", ua: "Використаний" },
  "loy.expired": { pl: "Wygasł", ru: "Истёк", en: "Expired", ua: "Минув" },
  "loy.history": { pl: "Historia punktów", ru: "История баллов", en: "Points history", ua: "Історія балів" },
  "loy.reason.install": { pl: "Bonus za aplikację", ru: "Бонус за приложение", en: "App bonus", ua: "Бонус за застосунок" },
  "loy.reason.coupon": { pl: "Kupon", ru: "Купон", en: "Coupon", ua: "Купон" },
  "loy.reason.admin": { pl: "Od BALANCE", ru: "От BALANCE", en: "From BALANCE", ua: "Від BALANCE" },
  "loy.bonusTitle": {
    pl: "Zainstaluj aplikację — zdobądź {n} punktów",
    ru: "Установите приложение — получите {n} баллов",
    en: "Install the app — get {n} points",
    ua: "Встановіть застосунок — отримайте {n} балів",
  },
  "loy.bonusText": {
    pl: "Dodaj BALANCE na ekran telefonu i zaloguj się w aplikacji — {n} punktów dopiszemy automatycznie. Wymienisz je na kupony w swoim koncie.",
    ru: "Добавьте BALANCE на экран телефона и войдите в приложении — {n} баллов начислятся автоматически. Их можно обменять на купоны в кабинете.",
    en: "Add BALANCE to your home screen and log in inside the app — we'll add {n} points automatically. Turn them into coupons in your account.",
    ua: "Додайте BALANCE на екран телефона й увійдіть у застосунку — {n} балів нарахуються автоматично. Їх можна обміняти на купони в кабінеті.",
  },
  "loy.bonusLogin": {
    pl: "Zaloguj się lub załóż konto w aplikacji, aby odebrać punkty.",
    ru: "Войдите или зарегистрируйтесь в приложении, чтобы получить баллы.",
    en: "Log in or sign up inside the app to collect the points.",
    ua: "Увійдіть або зареєструйтеся в застосунку, щоб отримати бали.",
  },
  "loy.bonusDone": { pl: "Bonus za aplikację otrzymany: +{n} pkt", ru: "Бонус за приложение получен: +{n}", en: "App bonus received: +{n} pts", ua: "Бонус за застосунок отримано: +{n}" },
  "loy.toastTitle": { pl: "+{n} punktów", ru: "+{n} баллов", en: "+{n} points", ua: "+{n} балів" },
  "loy.toastText": { pl: "Dziękujemy za instalację aplikacji", ru: "Спасибо за установку приложения", en: "Thanks for installing the app", ua: "Дякуємо за встановлення застосунку" },
  "loy.see": { pl: "Zobacz", ru: "Открыть", en: "View", ua: "Відкрити" },

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

/** Fills {placeholders} in a UI string: fill("+{n} pkt", { n: 35 }). */
export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
