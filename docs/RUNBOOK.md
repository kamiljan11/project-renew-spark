# RUNBOOK — operacje i awarie

<!-- Uzupelnij pola [..] przy wdrozeniu projektu. Ten plik czyta czlowiek o 3 w nocy — zero prozy, same komendy. -->

## Podstawy
- Produkcja: [URL]
- Hosting: [gdzie stoi + link do panelu]
- Repo: github.com/mountainallservice/[repo]
- Sekrety: Infisical "MAS Group" (localhost:8222) — NIE w repo

## Deploy
- Standard: merge do main -> [auto-deploy przez ... / komenda]
- Reczny: `npm run build` -> [gdzie wrzucic dist]

## Rollback (cel: <5 min)
```bash
git revert <sha-zlego-commita> && git push   # -> redeploy automatyczny
# albo: przywroc poprzedni release/tag w panelu hostingu
```

## Monitoring
- Bledy runtime: Sentry [link do projektu] — alerty ida na mountainallservice@gmail.com
- Healthcheck: [URL/status] — sprawdz najpierw to
- CI: zakladka Actions w repo (Quality Gate musi byc zielony)

## Typowe awarie
| Objaw | Pierwszy krok |
|---|---|
| Strona nie wstaje po deploy | rollback (wyzej), potem debug na branchu |
| Blad 500 na akcji X | Sentry -> stack trace -> `systematic-debugging` |
| Wygasly sekret/API key | Infisical -> zrotuj -> redeploy |
| Domena/DNS | panel ISNIC / rejestratora |

## Kontakty
- Wlasciciel: Kamil Jan, mountainallservice@gmail.com
- Klient: [imie, kontakt, SLA jesli jest]
