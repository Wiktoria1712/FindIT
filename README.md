# FindIT

Prototyp strony internetowej i PWA do sprawdzania dostępności produktów w sklepach w okolicy.

## Co jest gotowe

- responsywna strona landing + demo wyszukiwania,
- lista sklepów z dostępnością, ceną i dystansem,
- panel mapy w wersji demonstracyjnej,
- manifest PWA i service worker,
- przykładowy schemat bazy danych dla backendu,
- szczegółowy opis działania schematu w `DATABASE_SCHEMA.md`.

## Pliki

- `index.html` - główna strona aplikacji,
- `styles.css` - stylowanie,
- `app.js` - logika wyszukiwania i renderowania wyników,
- `manifest.webmanifest` - konfiguracja PWA,
- `service-worker.js` - cache offline dla podstawowych plików,
- `schema.sql` - propozycja schematu bazy danych,
- `DATABASE_SCHEMA.md` - opis działania bazy i przepływu danych.

## Jak uruchomić lokalnie

Najprościej otwórz `index.html` w przeglądarce.

Jeżeli chcesz pełniej przetestować PWA i service workera, uruchom lokalny serwer HTTP, na przykład:

```powershell
python -m http.server 8080
```

Potem otwórz:

`http://localhost:8080`

## Jak wrzucić na GitHub Pages

1. Zainicjalizuj repozytorium:

```powershell
git init
git add .
git commit -m "Add FindIT PWA prototype"
```

2. Utwórz repo na GitHub i podłącz remote:

```powershell
git remote add origin https://github.com/TWOJ_LOGIN/TWOJE_REPO.git
git branch -M main
git push -u origin main
```

3. Na GitHub wejdź w:

- `Settings`
- `Pages`
- wybierz `Deploy from a branch`
- ustaw branch `main` i folder `/root`

Po chwili strona będzie dostępna publicznie.

## Co warto zrobić dalej

- podpiąć prawdziwe API z danymi sklepów,
- dodać geolokalizację użytkownika,
- podmienić demo mapy na Google Maps lub OpenStreetMap,
- dodać panel logowania i prawdziwe rezerwacje,
- przenieść dane demo z `app.js` do backendu.
