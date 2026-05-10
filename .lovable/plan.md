## Cel

Klient na samym początku czatu wybiera jedną z trzech ścieżek. Każda kończy się tym samym formularzem kontaktowym, ale różni się tym, co zostaje zapisane do bazy.

## Trzy ścieżki

1. **Mam link(i)** — bez zmian względem dziś. Klient wkleja link, dalej standardowy flow. Tag w bazie: `path = "link"`.
2. **Znajdźcie część za mnie (4 960 ISK)** — klient opisuje czego potrzebuje (i opcjonalnie auto). Komunikat wyjaśniający że płaci 4 960 ISK z góry, kwota zaliczana na poczet zakupu jeśli zamówi. `path = "search_paid"`.
3. **Mam cenę i wagę → policz mi koszt do Islandii** — otwiera kalkulator. Po wyliczeniu klient widzi "Zamów po tej cenie", co przeskakuje pytanie o część (zamiast tego zapisuje listę produktów + podsumowanie kalkulatora) i wchodzi prosto w dane kontaktowe. `path = "calculator"`.

## Komponenty

### Nowy: `src/components/site/PriceCalculator.tsx`

Port HTML-a użytkownika do Reacta + Tailwind, zachowując całą logikę cenową:
- dodawanie/usuwanie pozycji (nazwa, cena PLN, waga kg, opcjonalne wymiary)
- przełącznik wysyłki Poczta vs DHL z tabelami `ppA2` i `dhlTab`
- walidacje rozmiaru/wagi (te same komunikaty)
- mnożniki ×1.65 / ×1.50, kurs 34 ISK/PLN, EUR 0.235
- opcjonalna prowizja 10–30% (zostawiam, schowane pod toggle — przyda się wewnętrznie)
- wynik: kr / PLN / EUR netto i brutto
- tłumaczenia PL/IS/EN czerpane z `useLang()` (przeniesione z obiektu `T` w HTML)
- prop `onOrder(snapshot)` — emituje pełen snapshot (lista pozycji, wysyłka, sumy) do rodzica

### Edytowane: `src/components/site/ConversationalForm.tsx`

- Dodać "intro screen" przed `STEPS[0]`: trzy karty/przyciski opisujące ścieżki. Wybór ustawia stan `path` i:
  - `"link"` → bubble bota z istniejącym promptem o linki, dalej jak teraz
  - `"search_paid"` → bubble z wyjaśnieniem opłaty 4 960 ISK + prośba o opis części
  - `"calculator"` → wstawia inline `<PriceCalculator>` w chat-logu zamiast textarei. Po `onOrder` zapisuje snapshot do stanu, wstawia podsumowanie jako `data.part_links` (czytelny tekst dla admina) + osobne pole `data.calc_summary` (JSON), pomija krok `part_links` i przechodzi do `phone`.
- W `submit()` dołożyć do payloadu `path` oraz, dla kalkulatora, treść snapshotu w `comment` (lub nowej kolumnie — patrz niżej).
- Dodać tag wizualny w UI ("Wybrana ścieżka: …") z możliwością powrotu do wyboru.

### Schema DB

Dodać do tabeli `quotes` dwie nullable kolumny tekstowe:
- `path text default 'link'` — `'link' | 'search_paid' | 'calculator'`
- `calc_snapshot jsonb` — pełen snapshot kalkulatora (pozycje + sumy ISK/PLN/EUR + wybór wysyłki)

RLS bez zmian (insert publiczny, read tylko admin) — istniejące polityki obejmują nowe kolumny.

### i18n

Dodać w `src/i18n/translations.ts` klucze dla:
- nazw trzech ścieżek + ich opisów
- całego UI kalkulatora (tytuły sekcji, etykiety, przyciski, ostrzeżenia, etykiety wyników, "Zamów po tej cenie", "Łącznie z VAT" itp.)

## Zakres tej iteracji

- Refaktor ConversationalForm zachowuje istniejącą logikę walidacji, zapisu, anty-botów, autosave — nie ruszam tego.
- Sam kalkulator nie wysyła nic do bazy — to robi flow czatu po kliknięciu "Zamów po tej cenie".
- Płatność za "Znajdźcie część" pozostaje offline (jak teraz: dane do przelewu mailem). Tekst step'u podkreśla, że 4 960 ISK = 4 000 ISK + 24% VAT, i że kwota jest zaliczana na poczet zakupu.

## Kolejność prac

1. Migracja DB (`path`, `calc_snapshot`).
2. Klucze i18n.
3. `PriceCalculator.tsx`.
4. Intro screen + integracja w `ConversationalForm.tsx`.
5. Wizualny test trzech ścieżek w przeglądarce.
