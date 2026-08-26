# AGENTS.md

Wskazówki dla agentów AI (Claude Code i pokrewnych) pracujących w tym repozytorium.

> `CLAUDE.md` w katalogu głównym jest symlinkiem do tego pliku - edytuj `AGENTS.md`. Sam symlink jest w `.gitignore` i celowo nie trafia do repo.

## Czym jest ten projekt

[przewodnikai.pl](https://przewodnikai.pl) - otwarta baza wiedzy o AI po polsku, zbudowana na **Astro 7 + Starlight**, hostowana na **Cloudflare Workers** (static assets, konfiguracja w `wrangler.jsonc`).

**To repozytorium treści, nie aplikacji.** 57 artykułów w `src/content/docs/`, kilka własnych komponentów, zero logiki biznesowej. Większość zadań to edycja Markdowna.

### Dwa repozytoria - przeczytaj to przed pierwszym commitem

Od 2026-08-26 projekt ma dwa repozytoria i **jednokierunkowy** sync między nimi:

| Gdzie | Rola | Adres |
| --- | --- | --- |
| **Gitea** (lokalna) | źródło prawdy - kod, cała treść, także wycięta | `http://localhost:3000/lukasz/przewodnikai_pl.git` |
| **GitHub** | lustro publiczne - tylko treść dopuszczona do publikacji | `lukaszpodgorski-pl/przewodnikai_pl` |

Katalog roboczy ma `origin` ustawiony na **Giteę**. Tu commitujesz i tu pushujesz.
GitHub dostaje treść wyłącznie przez `npm run publish` - **nigdy nie edytuj go
ręcznie**, następna publikacja nadpisze zmiany. Cloudflare buduje z GitHuba.

### Przegląd redakcyjny - stan na dziś

Serwis jest w trakcie przeglądu artykuł po artykule. Powód: duża część treści
powstała z dużym udziałem AI i właściciel nie publikuje jej pod swoim nazwiskiem
przed sprawdzeniem. **Wszystkie 57 artykułów jest wyciętych z produkcji.**
Publicznie stoi 19 stron: strona główna, dziewięć stron zbiorczych (osiem sekcji
plus ścieżki), `zasoby/kontakt`, `zasoby/o-mnie` i siedem stron newslettera.

Steruje tym pole `status` we frontmatterze (`src/content.config.ts`):

| Wartość | Znaczenie |
| --- | --- |
| `szkic` | nieprzejrzany, **wycięty** z produkcji. Domyślna - nowy plik nie wyjdzie przez zapomnienie |
| `zastane` | nieprzejrzany, ale publikowany. Dziś tylko strony infrastrukturalne |
| `gotowe` | przejrzany przez właściciela, publikowany |

Artykuł wraca na produkcję przez zmianę statusu na `gotowe` i `npm run publish`.
**Nie przywracaj artykułów hurtem** ani "tymczasowo" - to była odrzucona ścieżka.
Postęp: `npm run status`.

## Komendy

```powershell
npm install
npm run dev          # podgląd roboczy: localhost:4321, WSZYSTKO łącznie ze szkicami
npm run build        # build produkcyjny do ./dist/ - to jest nasz "test suite"
npm run preview      # podgląd builda
npm run status       # postęp przeglądu redakcyjnego, sekcja po sekcji
npm run publish      # przygotuj publikację i zweryfikuj (bez wysyłki)
npm run preview:prod # podgląd DOKŁADNIE tego, co zobaczy świat
npm run verify:geo   # 24 asercje na zbudowanym dist/
npm run test:publish # testy transformacji publikacyjnych
```

### Dwa tryby podglądu - nie myl ich

**`npm run dev`** → `http://localhost:4321` - Twoje środowisko przeglądu.
Widzisz **całą** treść, także artykuły wycięte z produkcji. Tu czytasz,
poprawiasz i decydujesz, czy tekst nadaje się do publikacji.

**`npm run preview:prod`** → podgląd wersji publicznej. Uruchamia `npm run publish`,
czyli buduje zawartość `.publish/` i serwuje ją lokalnie. Zobaczysz efekt cięcia:
odnośniki do wyciętych stron zamienione na zwykły tekst, karty z dopiskiem
"w przygotowaniu", zapowiedzi sekcji, przekierowania. **Uruchom to przed każdą
publikacją** - to ostatni moment, żeby zobaczyć, czy zdania po odlinkowaniu
nadal mają sens.

Oba tryby można trzymać otwarte naraz i przełączać się między kartami. Podgląd
produkcyjny zajmie wtedy **pierwszy wolny port** (zwykle `4323`, bo `4321`
trzyma dev) - adres wypisuje przy starcie, nie zgaduj go.

W katalogu głównym leżą dwa skróty dla Windows - klikasz dwukrotnie zamiast
wpisywać komendy: **`podglad-roboczy.cmd`** i **`podglad-produkcyjny.cmd`**.
Oba otwierają przeglądarkę na właściwym adresie, a produkcyjny zatrzymuje się
z czytelnym komunikatem, jeśli publikacja nie przejdzie weryfikacji.

### Publikacja

```powershell
npm run publish              # przygotowanie + build + verify:geo, bez wysyłki
node scripts/publish.mjs --push   # to samo plus commit i push na GitHub
```

Skrypt przerywa, jeśli katalog roboczy nie jest czysty, jeśli publiczna wersja
się nie buduje albo nie przechodzi `verify:geo`. Zepsuta wersja nie wychodzi.

Weryfikacja przed commitem (te same kroki co CI, uruchamiane lokalnie):

```powershell
npm run build
npx --yes markdownlint-cli2 "src/content/**/*.md" "*.md"
```

`npm run build` jest pełnym sprawdzeniem treści - wykrywa złamane linki wewnętrzne, błędy frontmattera (schemat Zod) i błędy MDX. Transformacje publikacyjne mają własne testy (`npm run test:publish`, 11 przypadków).

Serwer deweloperski uruchamiaj w tle: `astro dev --background`; zarządzanie: `astro dev stop`, `astro dev status`, `astro dev logs`.

## CI (GitHub Actions)

| Workflow | Kiedy | Co sprawdza |
| --- | --- | --- |
| `lint.yml` | zmiany w `**/*.md(x)` | markdownlint-cli2 wg `.markdownlint.jsonc` |
| `links.yml` | PR + cotygodniowy cron | lychee - linki zewnętrzne i wewnętrzne |
| `media.yml` | zmiany w `src/assets/**`, `public/media/**` | obraz ≤ 1 MB, wideo ≤ 5 MB, **GIF-y odrzucane** |

Workflow biegną w publicznym repozytorium, czyli **po** publikacji. Właściwą
bramką jest `npm run publish`: build i `verify:geo` liczą się na zawartości
`.publish/` przed wysyłką, więc zepsuta wersja nie opuszcza komputera. CI na
GitHubie jest siatką bezpieczeństwa, nie pierwszą linią.

Pull requesty od osób z zewnątrz nie są ścieżką wnoszenia zmian - lustro zostałoby
nadpisane przy następnej publikacji. Traktuj taki PR jak zgłoszenie: przenieś
zmianę do źródła prawdy, PR zamknij z podziękowaniem i odnośnikiem do
opublikowanej wersji.

## Architektura

### Routing i treść

Jedna kolekcja `docs` (`src/content.config.ts`) ładowana przez `docsLoader()` Starlight. **Folder w `src/content/docs/` = sekcja w menu bocznym**, ale sidebar nie jest w pełni automatyczny: lista ośmiu sekcji siedzi w `src/config/sections.ts` (`podstawy`, `jak-dziala-ai`, `prompt-engineering`, `narzedzia`, `suwerenne-ai`, `praktyka`, `etyka`, `zasoby`) i stamtąd idzie do `astro.config.mjs`. Każda ma `autogenerate` w środku. **Nowy folder najwyższego poziomu nie pojawi się w menu, dopóki nie dopiszesz go do `SECTIONS`.**

Każda sekcja ma stronę zbiorczą `<sekcja>/index.mdx` - wstęp, `CardGrid` z artykułami i `faq`. To ona jest środkowym poziomem breadcrumba i celem linków z ekranu głównego. W menu bocznym widnieje jako ręcznie dopisany wpis "Przegląd"; sam plik ma `sidebar.hidden: true`, żeby `autogenerate` nie dodał go po raz drugi. **Nowa sekcja bez `index.mdx` zapali `verify-geo.mjs` na czerwono** - asercja "każdy katalog sekcji ma stronę zbiorczą" pilnuje, żeby breadcrumb nie wskazywał na nieistniejący adres.

`sciezki/` jest celowo poza sidebarem - to strony `template: splash` z `sidebar.hidden: true`, wchodzi się do nich przez `sciezki/index.mdx` (CardGrid).

### Trzy pułapki, o które łatwo się potknąć

1. **`trailingSlash: 'always'`** - wszystkie linki wewnętrzne muszą kończyć się ukośnikiem (`/podstawy/wstep/`).
2. **`public/_redirects`** - mapa 301 ze starych płaskich URL-i. Reguły mają pierwszeństwo przed plikami statycznymi, więc **nie dodawaj tam reguły pod adresem sekcji** (`/podstawy/`, `/narzedzia/` itd.) - przesłoniłaby stronę zbiorczą tej sekcji. Trzy takie kolizje (`/podstawy/`, `/prompt-engineering/`, `/etyka/`) usunięto przy wprowadzaniu stron zbiorczych; stare adresy prowadzą teraz na stronę sekcji zamiast na dawny artykuł.
3. **Łańcuch "Następny krok"** - treść artykułów prowadzi czytelnika liniowo przez sekcje w kolejności `podstawy → jak-dziala-ai → prompt-engineering → narzedzia → suwerenne-ai → praktyka → etyka → zasoby`. `sidebar.order` w każdym pliku odzwierciedla tę ścieżkę. Zmiana kolejności wymaga aktualizacji linków "Następny krok" w sąsiednich plikach.

### Frontmatter GEO/AEO

`src/content.config.ts` rozszerza `docsSchema()` o pola pod dane strukturalne: `educationalLevel`, `teaches`, `about[]`, `mentions[]`, `faq[]`. Pola trafiają do `<script type="application/ld+json">` przez `src/components/Head.astro`, który składa bloki czystymi funkcjami z `src/lib/structured-data.ts`: `TechArticle` dla artykułu, `CollectionPage` dla strony zbiorczej, `WebSite` dla strony głównej, do tego `BreadcrumbList` i `FAQPage`. Dodając nowy artykuł, uzupełnij te pola wzorem istniejących (np. `src/content/docs/podstawy/czym-jest-ai.md`).

Pole `faq` renderuje też widoczną sekcję "Częste pytania" (`MarkdownContent.astro`) - Google wymaga, by treść z `FAQPage` była widoczna na stronie. `scripts/verify-geo.mjs` sprawdza obie strony tej zależności.

### Media

- **Obrazy:** `src/assets/<sekcja>/<artykul>/`, osadzane zwykłym Markdownem po ścieżce względnej (`../../../assets/...`) - Astro optymalizuje je do WebP/AVIF.
- **Wideo:** `public/media/<sekcja>/<artykul>/`, serwowane 1:1, osadzane komponentem `<Video />` (`src/components/Video.astro` - WebM + fallback MP4, respektuje `prefers-reduced-motion`).
- **GIF-y są zakazane** i odrzucane przez CI. Komendy konwersji ffmpeg: `CONTRIBUTING.md`.
- `alt` jest obowiązkowy przy każdym obrazie i animacji.

### Dane autora (repo-profil)

Biogram, dane `Person` (JSON-LD) i zdjęcie autora są **zvendorowanymi kopiami** z repo
[lukaszpodgorski-pl/author-profile](https://github.com/lukaszpodgorski-pl/author-profile):

- `src/data/autor.json` i `src/data/autor-krotki.html` - generowane przez `npm run profile:sync`
  (`scripts/fetch-profile.mjs`); **nie edytuj ich ręcznie**, zmiany rób w repo-profilu,
- `src/components/AutorKrotki.astro` renderuje `autor-krotki.html`; `AUTHOR` w
  `src/lib/structured-data.ts` czyta `autor.json`,
- `src/assets/zasoby/o-mnie/lukasz.jpg` - zdjęcie pobierane tym samym skryptem.

Po pushu do repo-profilu workflow `profile-sync.yml` sam robi sync i otwiera PR z aktualizacją.
Build celowo nie dotyka sieci - działa zawsze na ostatniej zacommitowanej kopii.

### Cloudflare / build

`wrangler.jsonc` serwuje statyczne `./dist`. W `astro.config.mjs` blok `vite.build.rolldownOptions.external` wyrzuca `@bruits/satteri-wasm32-wasi` z bundla - **nie usuwaj tego**, bez tego build na Cloudflare pada (opcjonalna zależność `cpu: ["wasm32"]` nigdy się nie instaluje, a bundler próbuje ją rozwiązać).

`starlight-llms-txt` generuje `llms.txt`. `public/robots.txt` świadomie wpuszcza wszystkie crawlery AI (GPTBot, ClaudeBot, PerplexityBot itd.).

**Wdrożenie następuje przy pushu do `main` w publicznym repozytorium**, czyli
w praktyce przy `npm run publish -- --push`. Cloudflare Workers Builds ma
ustawioną gałąź produkcyjną `main`. Konfiguracja siedzi w panelu Cloudflare,
więc nie da się jej wyczytać z repo; `wrangler.jsonc` opisuje tylko route'y.

Praca w źródle prawdy (Gitea) **nie wdraża niczego** - commit i push tam są
bezpieczne. Na produkcję wychodzi wyłącznie to, co przepuścisz przez skrypt
publikacji, a ten sam odmówi wysyłki, jeśli build albo `verify:geo` nie przejdą.

Nazwa Workera to `przewodnikai` (`wrangler.jsonc`) i nie ma związku z nazwą
repozytorium - `.github/workflows/deploy-check.yml` odwołuje się właśnie do niej.

Jedna rzecz, która przetrwała przepięcie repozytorium i wymaga uwagi:
`profile-sync.yml` nasłuchuje `repository_dispatch` z repo-profilu autora
i otwiera PR z aktualizacją danych. W lustrze taki PR zostanie nadpisany przy
następnej publikacji - sync danych autora trzeba zrobić w źródle prawdy
(`npm run profile:sync`), nie przez ten workflow.

## Konwencje treści

Grupa docelowa: **osoby nietechniczne**. Ton ciepły, bezpośredni (per "Ty"), bez żargonu; terminy angielskie w nawiasie przy pierwszym użyciu. Głos autora w pierwszej osobie.

Typografia (ujednolicona w audycie 2026-07; raport w `docs/audyt-tresci-2026-07-20.md` - katalog `docs/` jest lokalny, poza repo):

- **Pauza to zwykły dywiz `-`** - nie `—` ani `–`.
- **Cudzysłowy proste `"…"`** - nie `„…”` ani `“…”`.
- Separator tysięcy: spacja (`50 000`); przecinek dziesiętny (`1,5 h`).

Ta konwencja obowiązuje też w plikach repo (`AGENTS.md`, `README.md`, `CONTRIBUTING.md`), nie tylko w artykułach.

Markdown:

- Kursywa podkreślnikami `_kursywa_`, bold gwiazdkami `**bold**` (MD049/MD050).
- Wyróżnienia przez asides Starlight (`:::tip`, `:::note`, `:::caution`, `:::danger`), nie własny HTML.
- Nazwy plików: małe litery, myślniki, bez polskich znaków.
- Zmiany merytoryczne (fakty, liczby, twierdzenia) wymagają linku do źródła - to zabezpieczenie przeciw halucynacjom. Pisząc o świecie zewnętrznym (ceny, wersje modeli, regulaminy) zweryfikuj u źródła zamiast polegać na wiedzy modelu.
- **Dane podawane jako aktualne nie mogą być starsze niż 2 lata** (licząc od daty edycji strony). Wyjątek: fakty historyczne i trwałe metody (np. SIFT z 2019). Statystyka z 2023 podana w 2026 jako "tak jest teraz" to błąd redakcyjny, nie kontekst.

## Stan projektu

`TODO.md` jest aktualną listą otwartych zadań i decyzji właściciela (Cloudflare Pages, analityka, cutover DNS, JSON-LD, Mermaid, formularz kontaktowy, newsletter, dwa interaktywne widgety pominięte przy migracji). Przeczytaj go przed proponowaniem nowej funkcjonalności - część rzeczy jest świadomie odłożona.

**Uwaga:** `TODO.md` i katalog `docs/` są w `.gitignore` - istnieją tylko lokalnie u właściciela i nie ma ich w publicznym repo. Jeśli pracujesz z klona, po prostu ich nie zobaczysz.

## Dokumentacja

Pełna dokumentacja: <https://docs.astro.build>

- [Trasy, strony, middleware](https://docs.astro.build/en/guides/routing/)
- [Komponenty Astro](https://docs.astro.build/en/basics/astro-components/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Style i Tailwind](https://docs.astro.build/en/guides/styling/)
- [Starlight](https://starlight.astro.build/)
