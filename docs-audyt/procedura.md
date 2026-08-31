# Procedura audytu merytorycznego treści

Metoda cyklicznego sprawdzania, czy treść przewodnikai.pl jest prawdziwa, aktualna, kompletna, zrozumiała i wewnętrznie spójna. Ten plik jest źródłem prawdy o metodzie - agent prowadzący audyt czyta go zamiast polegać na tym, co pamięta model.

## Po co to jest

CI pilnuje warstwy technicznej: martwych linków (`links.yml`), Markdowna (`lint.yml`), danych strukturalnych i sitemapy (`verify-geo.yml`), rozmiaru mediów (`media.yml`). Żaden z tych workflow nie zauważy, że artykuł opisuje wycofany produkt jako aktywny albo że dwa teksty podają sprzeczne liczby.

To jest luka, którą zamyka ten audyt. Historia projektu pokazuje, że jest realna: w lipcu 2026 sekcja "Narzędzia AI" opisywała rynek sprzed dwóch lat, mimo że stopka każdej strony pokazywała bieżącą datę.

## Kiedy uruchamiać

- **Co kwartał** jako przegląd planowy.
- **Po większej zmianie w treści**, jeśli dotknęła kilku sekcji naraz.
- **Gdy w świecie zewnętrznym zmienia się coś, o czym piszemy** - nowa generacja modeli, wygaszenie narzędzia, zmiana nazw planów.

Dziennik przebiegów prowadzi `docs-audyt/README.md`.

## Zasady nadrzędne

1. **Audyt raportuje, nie poprawia.** Wynikiem jest `TODO_AUDYT_INT.md`, nie commit z edycjami treści. Poprawki to osobny przebieg, po decyzji właściciela.
2. **Twierdzenie o świecie zewnętrznym wymaga źródła u dostawcy.** Nie u agregatora, nie z pamięci modelu. Jeśli piszemy, że Claude ma wyszukiwanie w internecie, potwierdzeniem jest dokumentacja Anthropic, a nie artykuł branżowy.
3. **Niepewność oznacza odrzucenie ustalenia.** Audytor, który halucynuje o wersjach modeli, jest gorszy niż brak audytu - wprowadza fałszywe poprawki do tekstu, który był poprawny. Raporty zewnętrzne mylą się w obie strony: zgłaszają nieistniejące błędy i wymyślają nieistniejące wersje produktów.
4. **Nie zgłaszaj tego, co pilnuje CI.** Martwy link zewnętrzny to robota dla lychee. Złamany Markdown - dla markdownlinta.
5. **Nie proponuj funkcjonalności.** `TODO.md` (lokalny, poza repo) zawiera świadomie odłożone decyzje właściciela.

## Rubryka - sześć wymiarów

| Kod | Wymiar | Pytanie kontrolne |
| --- | --- | --- |
| **D** | Poprawność danych | Czy twierdzenie jest prawdziwe dziś? Czy liczby, nazwy i nazwiska się zgadzają? |
| **A** | Aktualność | Czy opisany produkt, wersja, plan lub funkcja nadal istnieje pod tą nazwą? |
| **K** | Kompletność | Czy artykuł domyka temat obiecany w tytule, `description`, `teaches` i FAQ? |
| **J** | Jasność | Czy osoba nietechniczna to zrozumie? Czy termin angielski ma wyjaśnienie przy pierwszym użyciu? |
| **S** | Spójność | Czy ten sam fakt jest opowiedziany tak samo w innych artykułach? Czy terminologia i typografia trzymają konwencję? |
| **N** | Nawigacja | Czy linki wychodzące trafiają tam, gdzie obiecuje kotwica? Czy "Następny krok" prowadzi we właściwe miejsce? |

Ocena wymiaru: **OK** / **UWAGA** / **BŁĄD**.

### Priorytety

| Waga | Znaczenie | Przykład |
| --- | --- | --- |
| **P1** | Nieprawda lub złamana nawigacja | "Claude nie ma dostępu do internetu"; "Następny krok" prowadzi na nieistniejącą stronę |
| **P2** | Nieaktualne lub mylące | opisany plan pod starą nazwą; kotwica obiecuje co innego niż strona docelowa |
| **P3** | Styl, kosmetyka, niewykorzystana szansa | brak pola `faq`; niekonsekwentne nazewnictwo linku |

## Przebieg

### Faza A - skan (deterministyczna)

```powershell
node docs-audyt/skanuj.mjs --json skan.json
```

Skrypt liczy to, czego nie trzeba zgadywać, i zapisuje `TODO_AUDYT_INT.md` z sekcjami A (tabela stron) i B (ustalenia mechaniczne). Kontroluje:

| Kod | Co sprawdza |
| --- | --- |
| `N1` | link wewnętrzny bez strony docelowej (P1) lub trafiający w cel dopiero przez 301 (P2) |
| `N2` | brak ukośnika końcowego przy `trailingSlash: 'always'` |
| `N3` | sierota - strona, do której nie prowadzi żaden link z treści |
| `N4` | ślepy zaułek - strona bez linku wewnętrznego wychodzącego |
| `N5` | łańcuch "Następny krok": brak, martwy cel, pętla, cofnięcie, zbieg dwóch artykułów w jeden |
| `N6` | artykuł nieobecny na stronie zbiorczej własnej sekcji |
| `S1` | duplikat lub brak `sidebar.order` w obrębie sekcji |
| `GEO1` | brak `description` lub `educationalLevel` (rdzeń `TechArticle`) |
| `GEO2` | `description` dłuższy niż 160 znaków |
| `GEO3` | brak `teaches` / `about` / `faq` |
| `C1` | kwota w treści poza artykułem o kosztach - do rozstrzygnięcia przez człowieka |
| `K1` | kotwica nieinformatywna ("tutaj", "kliknij") |
| `K2` | ta sama kotwica prowadząca do różnych stron |
| `T1` | typografia niezgodna z `AGENTS.md` (pauza, cudzysłowy) |

Skrypt świadomie **nie jest bramką CI** - nie zwraca kodu błędu i nie blokuje builda.

### Faza B - audyt stron (subagenty)

Strony grupuje się w jednostki po maksymalnie 4 artykuły **tematycznie sąsiadujące** - agent czytający wszystkie teksty o chatbotach naraz wychwyci sprzeczności między nimi, czego nie zrobi agent czytający jeden artykuł w izolacji.

Każdy subagent dostaje: listę plików swojej jednostki, rubrykę, konwencje z `AGENTS.md` i wyciąg z sekcji B dotyczący jego stron. Zwraca ustalenia w schemacie:

```text
plik, linia, wymiar (D/A/K/J/S/N), waga (P1/P2/P3),
cytat (dosłowny fragment z treści),
problem (co konkretnie jest nie tak),
poprawka (proponowane brzmienie),
zrodlo (URL u dostawcy - obowiązkowy dla wymiarów D i A)
```

Ustalenie wymiaru D lub A **bez `zrodlo` jest odrzucane** na etapie syntezy.

### Faza C - weryfikacja adwersaryjna

Każde ustalenie P1 i P2 trafia do osobnego subagenta, którego zadaniem jest je **obalić**, nie potwierdzić. Agent sprawdza cytat w pliku (czy w ogóle tam jest - halucynowany cytat to najczęstszy błąd audytora), a dla wymiarów D i A niezależnie weryfikuje twierdzenie u dostawcy.

Werdykt: `POTWIERDZONE` / `OBALONE` / `NIEROZSTRZYGNIĘTE`. Domyślnie `OBALONE` przy niepewności. Do raportu wchodzą wyłącznie ustalenia `POTWIERDZONE`; `NIEROZSTRZYGNIĘTE` idą do osobnej listy "do decyzji właściciela".

### Faza D - spójność międzyartykułowa

Bariera: dopiero gdy wszystkie jednostki skończą, agenci syntezy dostają komplet potwierdzonych ustaleń i szukają sprzeczności **między** artykułami - tego nie widać z wnętrza pojedynczej jednostki. Typowe znaleziska: ta sama liczba podana inaczej w dwóch tekstach, termin wyjaśniony dwoma niezgodnymi definicjami, narzędzie opisane jako aktywne w jednym miejscu i wygaszone w drugim.

### Faza E - synteza

Sekcja C w `TODO_AUDYT_INT.md`: ustalenia posortowane wg wagi, każde z cytatem, proponowaną poprawką i źródłem. Na końcu wpis do dziennika w `docs-audyt/README.md`.

## Czego audyt nie robi

- Nie sprawdza dostępności HTTP linków zewnętrznych (robi to `links.yml`).
- Nie weryfikuje wyglądu ani wydajności strony.
- Nie ocenia treści `TODO.md`, `docs/` ani innych plików lokalnych spoza repo.
- Nie edytuje treści.

## Konwencje, których pilnuje wymiar S

Z `AGENTS.md`, w skrócie - pełna lista tam:

- pauza to zwykły dywiz `-`, nie `—` ani `–`;
- cudzysłowy proste `"…"`, nie `„…”`;
- separator tysięcy to spacja (`50 000`), przecinek dziesiętny (`1,5 h`);
- kursywa podkreślnikami, bold gwiazdkami;
- ton per "Ty", bez żargonu, termin angielski wyjaśniony w nawiasie przy pierwszym użyciu;
- konkretne kwoty tylko w `narzedzia/ile-kosztuje-ai.md`; przy narzędziach informacja o planie darmowym i link do cennika dostawcy.
