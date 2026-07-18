# Reguly pracy w tym repo (obowiazuja kazdego agenta AI i czlowieka)

## Zanim napiszesz JAKIKOLWIEK nowy kod
1. **Grep first.** Przeszukaj repo czy istniejaca funkcja/util/komponent robi to samo. Jesli tak — uzyj albo rozszerz. Duplikacja logiki = odrzucona zmiana.
2. Przeczytaj sasiednie pliki modulu, ktory zmieniasz. Trzymaj sie ich konwencji, nie swoich preferencji.
3. Zmiana architektoniczna (nowy modul, zaleznosc, wzorzec, schemat danych) -> najpierw ADR w `docs/adr/`, potem implementacja.

## Podczas pisania
4. **Male atomowe zmiany.** Jedna logiczna zmiana naraz. Nie mieszaj refaktoru z feature. Nie przepisuj plikow spoza zadania.
5. **Testy sa czescia zadania.** Nowa logika = testy w tej samej zmianie (happy path + najgrozniejsze edge case'y).
6. Bezpieczenstwo zawsze: parametryzowane zapytania, walidacja kazdego inputu, authz na poziomie rekordu, zadnych sekretow w kodzie — tylko env.
7. Nie wylaczaj lintera i nie uzywaj `any` / `@ts-ignore` / `eslint-disable` zeby "przeszlo". Napraw przyczyne.

## Zanim powiesz "gotowe"
8. Uruchom lint + typecheck + testy. Czerwone = nie jest gotowe.
9. Self-review diffa oczami wrogiego recenzenta: co tu sie wysypie o 3 w nocy?
10. Nie commituj z `--no-verify`. Czerwone CI to nie sugestia, to sciana.

## Kontekst projektu
<!-- UZUPELNIJ per repo: stack, komendy, pliki wzorcowe -->
- Stack:
- Komendy: `npm run dev` / `npm run build` / `npm run lint` / `npm test`
- Plik wzorcowy komponentu:
- Plik wzorcowy API/serwisu:
