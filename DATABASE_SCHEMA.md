# Schema bazy danych dla PWA `FindIT`

## Cel schematu

Ta baza danych obsługuje aplikację PWA, która pokazuje dostępność produktów w pobliskich sklepach. Schemat został zaprojektowany tak, żeby rozdzielać:

- katalog produktów,
- dane o sklepach i partnerach,
- aktualne stany magazynowe,
- rezerwacje klientów,
- analitykę wyszukiwań.

Dzięki temu front PWA może działać szybko, a backend może niezależnie synchronizować dane z sieci handlowych, systemów POS i ERP.

## Jak schemat działa operacyjnie

### 1. Partner handlowy dostarcza dane

Tabela `partners` przechowuje informacje o źródle danych. To może być duża sieć, lokalny sklep albo pośrednik. Każdy partner ma określony sposób integracji:

- `api` dla nowoczesnych integracji online,
- `pos_sync` dla bezpośredniego połączenia z kasami lub systemami sklepowymi,
- `erp_export` dla cyklicznych eksportów z systemów magazynowych,
- `manual_panel` dla ręcznej aktualizacji przez sklep.

Pole `sync_frequency_seconds` mówi, jak często system powinien pobierać dane od danego partnera.

### 2. Partner posiada wiele sklepów

Tabela `stores` przechowuje fizyczne punkty sprzedaży. Każdy sklep jest powiązany z `partners.partner_id`. To ważne, bo jedna sieć może mieć setki lokalizacji.

W tej tabeli znajdują się:

- adres i miasto,
- współrzędne geograficzne do wyszukiwania sklepów w pobliżu,
- godziny otwarcia,
- informacja, czy sklep obsługuje rezerwacje,
- informacja, czy umożliwia płatność online.

Frontend PWA korzysta z `latitude` i `longitude`, aby obliczyć odległość od użytkownika i pokazać sklepy na mapie.

### 3. Produkty są utrzymywane centralnie

Tabela `products` jest głównym katalogiem produktów. Każdy rekord reprezentuje jeden konkretny produkt, na przykład:

- marka: `Nutella`
- nazwa: `Krem czekoladowy`
- wariant: `350g`
- kod kreskowy: EAN

Pole `normalized_name` służy do szybkiego dopasowania wyszukiwanej frazy niezależnie od wielkości liter czy drobnych różnic w zapisie. Dzięki temu zapytanie `nutella 350 g` może trafić w produkt zapisany jako `Nutella 350g`.

Tabela `product_categories` pozwala budować hierarchię kategorii, np. `Nabiał -> Mleko` albo `Napoje -> Napoje gazowane`.

### 4. Jeden sklep może mieć lokalną reprezentację tego samego produktu

Tabela `store_products` łączy `stores` i `products`. To ważna warstwa pośrednia.

Dlaczego jest potrzebna:

- ten sam produkt centralny może mieć różne identyfikatory w różnych sieciach,
- sklep może używać własnej nazwy produktu,
- nie każdy sklep musi oferować każdy produkt z katalogu.

Przykład:

- `products.id` wskazuje ogólny produkt `Pepsi Max 1.5L`,
- `store_products.external_product_id` przechowuje identyfikator z systemu Lidla lub Carrefour,
- `local_name` może zawierać nazwę używaną przez konkretną sieć.

To właśnie ten model umożliwia integrację wielu partnerów bez dublowania całego katalogu.

### 5. Stany magazynowe są zapisywane jako migawki

Tabela `inventory_snapshots` przechowuje aktualne dane o dostępności i cenie dla konkretnego `store_product`.

Najważniejsze pola:

- `quantity_available` mówi, ile sztuk jest dostępnych,
- `availability_status` upraszcza komunikację do klienta,
- `price_amount` trzyma cenę,
- `reserved_quantity` pozwala odjąć już zablokowane sztuki,
- `synced_at` pokazuje moment ostatniej synchronizacji.

Statusy w tej tabeli są gotowe pod UI:

- `in_stock` = dostępny,
- `low_stock` = mało sztuk,
- `out_of_stock` = brak,
- `unknown` = brak pewności lub brak świeżych danych.

W praktyce backend zwykle pobiera najnowszy rekord `inventory_snapshots` dla danego `store_product_id`, a potem pokazuje go w aplikacji.

### 6. Rezerwacja opiera się na konkretnej migawce stanu

Tabela `reservations` wiąże użytkownika z konkretną pozycją w `inventory_snapshots`.

To oznacza, że rezerwacja nie dotyczy tylko produktu abstrakcyjnie, ale konkretnej dostępności w konkretnym sklepie i czasie. Dzięki temu można później sprawdzić:

- jaka była cena w chwili rezerwacji,
- jaki był stan magazynu przy tworzeniu rezerwacji,
- czy rezerwacja powinna już wygasnąć.

Pole `reservation_status` kontroluje cykl życia rezerwacji:

- `pending` po utworzeniu,
- `confirmed` po potwierdzeniu przez system/sklep,
- `cancelled` gdy klient rezygnuje,
- `expired` gdy minął czas odbioru,
- `picked_up` gdy zakup został odebrany.

### 7. PWA zapisuje zachowanie użytkowników do analityki

Tabela `search_events` loguje każde wyszukiwanie. To ważne zarówno produktowo, jak i biznesowo.

Przechowuje:

- oryginalną frazę wpisaną przez klienta,
- wersję znormalizowaną,
- dopasowany produkt,
- lokalizację i promień wyszukiwania,
- liczbę wyników.

To daje możliwość budowy raportów typu:

- których produktów użytkownicy najczęściej szukają,
- gdzie najczęściej brakuje danego produktu,
- które dzielnice generują największy popyt,
- jakie wyszukiwania kończą się bez wyników.

### 8. Indeksy przyspieszają najważniejsze operacje

Na końcu schematu są indeksy pod kluczowe przypadki użycia:

- `idx_products_normalized_name` przyspiesza wyszukiwanie po nazwie,
- `idx_stores_location` pomaga przy selekcji sklepów w pobliżu,
- `idx_store_products_lookup` przyspiesza powiązanie sklepu z produktem,
- `idx_inventory_latest` ułatwia pobranie najnowszej migawki,
- `idx_search_events_phrase` wspiera analitykę i raporty.

## Typowy przepływ w aplikacji

1. Użytkownik wpisuje `Nutella 350g` w PWA.
2. Backend normalizuje frazę i szuka dopasowania w `products.normalized_name`.
3. System pobiera sklepy z `stores`, które są blisko lokalizacji użytkownika.
4. Dla tych sklepów sprawdza relacje w `store_products`.
5. Dla każdej relacji pobiera najnowszy rekord z `inventory_snapshots`.
6. Front wyświetla status dostępności, cenę, dystans i opcję rezerwacji.
7. Jeśli użytkownik kliknie rezerwację, tworzony jest wpis w `reservations`.
8. W tle zapisuje się rekord w `search_events`, żeby system znał realny popyt.

## Dlaczego ten schemat jest dobry dla PWA

- Jest skalowalny, bo rozdziela katalog, sklepy i stany magazynowe.
- Nadaje się do integracji z wieloma partnerami jednocześnie.
- Umożliwia szybkie odpowiedzi dla frontu mobilnego.
- Pozwala łatwo dodać ranking sklepów, historię cen i rekomendacje.
- Dobrze wspiera tryb offline w PWA, bo front może cache'ować ostatnie wyniki, a backend trzyma pełne dane źródłowe.

## Co można dodać w następnej wersji

- tabelę `price_history` do śledzenia zmian cen,
- tabelę `favorites` dla ulubionych produktów i sklepów,
- tabelę `notifications` do alertów `produkt znowu dostępny`,
- tabelę `inventory_events` do pełnego audytu zmian magazynowych,
- PostGIS lub geohashe dla szybszego wyszukiwania po mapie przy dużej skali.
