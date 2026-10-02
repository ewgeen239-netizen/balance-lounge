// Polityka prywatności (RODO) — treść strony /polityka-prywatnosci.
//
// Edytuj tutaj. Wszystko w [[podwójnych nawiasach]] to miejsce do uzupełnienia —
// na stronie jest podświetlone, żeby nic nie umknęło. Po uzupełnieniu usuń nawiasy.
// Dane firmy wpisz raz w COMPANY poniżej — trafią do całego dokumentu.

export const COMPANY = {
  legalName: "DZIANIS PAPOU",
  brand: "BALANCE Cocktails & Shisha",
  address: "ul. Księcia Bogusława X 1/2, lok. 2/1, 70-440 Szczecin",
  nip: "5423389947",
  regon: "543233726",
  registry: "wpis do CEIDG",
  email: "kontakt@balancecoctails.pl",
  phone: "729 559 179",
};

export const POLICY_EFFECTIVE_DATE = "1 października 2026 r.";

export type PolicyBlock =
  | { p: string }
  | { ul: string[] }
  | { table: { head: string[]; rows: string[][] } };

export type PolicySection = { id: string; title: string; blocks: PolicyBlock[] };

const C = COMPANY;

export const POLICY: PolicySection[] = [
  {
    id: "administrator",
    title: "1. Administrator danych",
    blocks: [
      {
        p: `Administratorem Twoich danych osobowych jest ${C.legalName}, z siedzibą: ${C.address}, NIP: ${C.nip}, REGON: ${C.regon}, ${C.registry}, prowadzący lokal ${C.brand} (dalej: „Administrator”, „my”).`,
      },
      {
        p: `W sprawach dotyczących danych osobowych możesz się z nami skontaktować: e-mailem — ${C.email}, telefonicznie — ${C.phone} lub listownie na adres siedziby.`,
      },
    ],
  },
  {
    id: "cele",
    title: "2. Jakie dane przetwarzamy, w jakim celu i jak długo",
    blocks: [
      {
        table: {
          head: ["Cel", "Dane", "Podstawa prawna", "Okres przechowywania"],
          rows: [
            [
              "Rezerwacja stolika — przez stronę, telefonicznie lub przez obsługę",
              "imię, numer telefonu, e-mail (opcjonalnie), data i godzina, liczba gości, komentarz, numer stolika",
              "art. 6 ust. 1 lit. b RODO — działania na Twoje żądanie przed zawarciem umowy i jej wykonanie",
              "Rezerwacja jest usuwana automatycznie 5 godzin po zamknięciu lokalu w dniu rezerwacji",
            ],
            [
              "Potwierdzenie rezerwacji SMS-em lub e-mailem",
              "imię, numer telefonu, e-mail, szczegóły rezerwacji",
              "art. 6 ust. 1 lit. b RODO",
              "Jak wyżej; kopie wiadomości u dostawców — zgodnie z ich zasadami",
            ],
            [
              "Konto gościa (opcjonalne)",
              "imię, e-mail i/lub numer telefonu, hasło (przechowywane wyłącznie w formie zaszyfrowanej), historia rezerwacji",
              "art. 6 ust. 1 lit. b RODO — świadczenie usługi konta",
              `Do usunięcia konta — usuniemy je na Twoją prośbę przesłaną e-mailem na ${C.email}`,
            ],
            [
              "Kontakt z nami (telefon, e-mail, komunikatory)",
              "dane, które nam przekażesz",
              "art. 6 ust. 1 lit. f RODO — nasz prawnie uzasadniony interes: odpowiedź na wiadomość",
              "Do zakończenia sprawy, a potem do upływu okresu przedawnienia ewentualnych roszczeń",
            ],
            [
              "Bezpieczeństwo i prawidłowe działanie strony",
              "adres IP, dane przeglądarki, logi serwera",
              "art. 6 ust. 1 lit. f RODO — zapewnienie bezpieczeństwa usługi",
              "Krótkotrwale, zgodnie z zasadami dostawcy hostingu",
            ],
            [
              "Statystyki odwiedzin strony",
              "zanonimizowane dane o wizycie (odsłony, kraj, typ urządzenia) — bez plików cookie",
              "art. 6 ust. 1 lit. a RODO — Twoja zgoda",
              "Do cofnięcia zgody; dane statystyczne w formie zbiorczej",
            ],
            [
              "Wyświetlenie mapy Google na stronie",
              "adres IP i dane przeglądarki przekazywane Google",
              "art. 6 ust. 1 lit. a RODO — Twoja zgoda",
              "Do cofnięcia zgody; po stronie Google — zgodnie z jego polityką",
            ],
            [
              "Ustalenie, dochodzenie lub obrona roszczeń",
              "dane niezbędne w danej sprawie",
              "art. 6 ust. 1 lit. f RODO",
              "Do upływu okresu przedawnienia roszczeń",
            ],
          ],
        },
      },
      {
        p: "Podanie danych jest dobrowolne, ale bez imienia i numeru telefonu nie możemy przyjąć rezerwacji. Prosimy nie wpisywać w komentarzu danych o zdrowiu ponad to, co konieczne (np. alergia) — wykorzystamy je wyłącznie do obsługi Twojej wizyty.",
      },
    ],
  },
  {
    id: "odbiorcy",
    title: "3. Komu przekazujemy dane",
    blocks: [
      { p: "Dane mogą otrzymać wyłącznie upoważnieni pracownicy lokalu oraz podmioty, które świadczą dla nas usługi i przetwarzają dane w naszym imieniu:" },
      {
        ul: [
          "Vercel Inc. (USA) — hosting strony internetowej,",
          "Neon Inc. (USA) — baza danych, w której zapisywane są rezerwacje i konta (serwery w UE — Frankfurt),",
          "Sendinblue SAS / Brevo (Francja) — wysyłka e-maili z potwierdzeniem rezerwacji,",
          "LINK Mobility Poland sp. z o.o. (SMSAPI, Polska) — wysyłka SMS-ów z potwierdzeniem rezerwacji,",
          "Telegram (Telegram FZ-LLC, Zjednoczone Emiraty Arabskie) — powiadomienia dla obsługi lokalu o nowej rezerwacji (imię, telefon, termin),",
          "Google Ireland Limited (Irlandia) — mapa na stronie, wyłącznie po wyrażeniu zgody,",
          "biuro rachunkowe — obsługa księgowa.",
        ],
      },
      { p: "Dane możemy też udostępnić organom publicznym, jeżeli wymagają tego przepisy prawa." },
    ],
  },
  {
    id: "poza-eog",
    title: "4. Przekazywanie danych poza Europejski Obszar Gospodarczy",
    blocks: [
      {
        p: "Część dostawców ma siedzibę lub serwery poza EOG. Dane do USA przekazujemy na podstawie decyzji Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony (EU-US Data Privacy Framework) lub standardowych klauzul umownych zatwierdzonych przez Komisję.",
      },
      { p: `Kopię stosowanych zabezpieczeń możesz otrzymać, pisząc na ${C.email}.` },
    ],
  },
  {
    id: "prawa",
    title: "5. Twoje prawa",
    blocks: [
      { p: "W związku z przetwarzaniem danych masz prawo do:" },
      {
        ul: [
          "dostępu do swoich danych i otrzymania ich kopii (art. 15 RODO),",
          "sprostowania danych (art. 16 RODO),",
          "usunięcia danych (art. 17 RODO),",
          "ograniczenia przetwarzania (art. 18 RODO),",
          "przenoszenia danych (art. 20 RODO),",
          "sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie (art. 21 RODO),",
          "cofnięcia zgody w dowolnym momencie — bez wpływu na zgodność z prawem przetwarzania przed jej cofnięciem; zgody na pliki cookie zmienisz w „Ustawieniach cookie” w stopce strony,",
          "wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl).",
        ],
      },
      { p: `Aby skorzystać z praw, napisz na ${C.email}. Odpowiemy bez zbędnej zwłoki, najpóźniej w ciągu miesiąca.` },
      { p: "Nie podejmujemy decyzji opartych wyłącznie na zautomatyzowanym przetwarzaniu, w tym profilowaniu, które wywoływałyby wobec Ciebie skutki prawne." },
    ],
  },
  {
    id: "cookies",
    title: "6. Pliki cookie i podobne technologie",
    blocks: [
      {
        p: "Pliki cookie to małe pliki zapisywane w Twojej przeglądarce. Niezbędne cookie są zawsze aktywne, bo bez nich strona nie działa. Narzędzia opcjonalne uruchamiamy dopiero po Twojej zgodzie — możesz ją w każdej chwili zmienić lub wycofać w „Ustawieniach cookie”.",
      },
      {
        table: {
          head: ["Nazwa", "Dostawca", "Cel", "Rodzaj", "Czas"],
          rows: [
            ["balance_consent", "BALANCE", "zapamiętanie Twojego wyboru dotyczącego cookie", "niezbędne", "12 miesięcy"],
            ["balance_lang", "BALANCE", "zapamiętanie wybranego języka (cookie i pamięć przeglądarki)", "niezbędne", "12 miesięcy"],
            ["balance_guest", "BALANCE", "utrzymanie zalogowania do konta gościa", "niezbędne", "30 dni"],
            ["balance_admin", "BALANCE", "logowanie do panelu obsługi (tylko personel)", "niezbędne", "30 dni"],
            ["— (bez cookie)", "Vercel Web Analytics", "anonimowe statystyki odwiedzin", "statystyki — za zgodą", "nie zapisuje cookie"],
            ["np. NID, AEC", "Google (mapa)", "wyświetlenie mapy Google; Google może zapisać własne cookie", "treści zewnętrzne — za zgodą", "zgodnie z polityką Google"],
          ],
        },
      },
      {
        p: "Pliki cookie możesz też usunąć lub zablokować w ustawieniach swojej przeglądarki. Zablokowanie niezbędnych cookie może uniemożliwić korzystanie z niektórych funkcji, np. logowania.",
      },
    ],
  },
  {
    id: "zmiany",
    title: "7. Zmiany polityki prywatności",
    blocks: [
      {
        p: `Politykę aktualizujemy, gdy zmieniają się przepisy lub sposób działania strony. Aktualna wersja obowiązuje od ${POLICY_EFFECTIVE_DATE}`,
      },
    ],
  },
];
