# GLOSSARY — słownik domeny

<!-- Nazwy w kodzie MUSZĄ pochodzić stąd. Nowy termin w diffie = nowy wiersz tutaj. -->

| Termin w kodzie | PL / IS | Znaczenie / reguła biznesowa |
|---|---|---|
| `form-assist` | asystent formularza | edge function parsująca luźny opis klienta ("przedni wahacz, Octavia 2014") na ustrukturyzowane zgłoszenie |
| search fee / opłata wyszukiwania | leitargjald | 4 960 ISK z VAT, płatna z góry, bezzwrotna; wliczana w cenę zamówienia jeśli klient kupi; znika, jeśli klient sam wklei link do części |
| `vehicleLookup` | lookup pojazdu | bezpośredni odczyt z `autoparts.is` po tablicy rejestracyjnej — VIN, silnik, moc, kod silnika |
| `tecdocId` | ID TecDoc | identyfikator pojazdu w bazie TecDoc (branżowy katalog części zamiennych) |
| `quote_requests` (Supabase) | zgłoszenia wyceny | tabela z polami: `order_num`, `status`, `part`, `part_links`, `photo_urls`, `delivery_preference` |
| `ConversationalForm` | formularz konwersacyjny | krok-po-kroku UI naśladujące czat, zamiast jednego długiego formularza |
| Lovable AI gateway | brama AI Lovable | pośrednik do modeli AI (tu: `google/gemini-2.5-flash`) — klucz nigdy nie trafia do przeglądarki |
| `en` / `pl` / `is` | angielski / polski / islandzki | trzy języki obsługiwane zarówno w UI jak i w odpowiedziach generowanych przez `form-assist` |
