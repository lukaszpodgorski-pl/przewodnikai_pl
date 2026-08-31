# Przewodnik AI

**[przewodnikai.pl](https://przewodnikai.pl)** - otwarta baza wiedzy o sztucznej inteligencji po polsku. Bez żargonu, bez logowania, za darmo.

Dziś problemem nie jest zdobycie wiedzy o AI, tylko jej **przefiltrowanie**. Materiałów są tysiące, a spora część opakowana jest w strach: "pociąg odjeżdża", "wyścig trwa", "zostaniesz w tyle". Ten przewodnik jest odwrotnością tego podejścia. Uczy tego, co realnie przydatne, i daje solidną bazę: kiedy model może zmyślać, dlaczego nie warto ciągnąć jednej rozmowy w nieskończoność, jak nie przepalać tokenów bez potrzeby.

Nie ma tu jednej "jedynie słusznej" drogi. Jest **9 ścieżek nauki** dla różnych osób - ucznia, rodzica, nauczyciela, seniora, managera, właściciela firmy - żeby nikt nie odbił się od nadmiaru informacji na starcie.

---

## Przewodnik jest w przeglądzie redakcyjnym

Sierpień 2026: przechodzę przez cały materiał artykuł po artykule i poprawiam.

**Jak to widać na stronie:** sekcja w trakcie przeglądu pokazuje stronę zbiorczą z listą tego, co się w niej pojawi, a jej artykuły są tymczasowo niedostępne (przekierowanie 302 na stronę sekcji - adresy wrócą pod tym samym URL-em). Sekcje spoza przeglądu działają normalnie.

Postęp: `npm run status`.

---

## Dla czytelników

Nie musisz nic instalować ani zakładać konta. Wejdź na [przewodnikai.pl](https://przewodnikai.pl) i zacznij.

| Chcesz… | Zacznij tutaj |
| --- | --- |
| Zrozumieć, jak to działa pod spodem | [Jak działa AI](https://przewodnikai.pl/jak-dziala-ai/) |
| Dostać gotowy plan dopasowany do siebie | [Ścieżki nauki](https://przewodnikai.pl/sciezki/) |
| Nauczyć się rozmawiać z AI skutecznie | [Prompt Engineering](https://przewodnikai.pl/prompt-engineering/) |
| Sprawdzić konkretne narzędzie | [Narzędzia AI](https://przewodnikai.pl/narzedzia/) |
| Wiedzieć, gdzie są granice i zagrożenia | [Etyka i bezpieczeństwo](https://przewodnikai.pl/etyka/) |

Materiał to **78 stron w 9 sekcjach**, ułożonych w kolejności: podstawy → jak działa AI → prompt engineering → narzędzia → suwerenne AI → praktyka → etyka → Claude Code → zasoby. Każda lekcja kończy się ćwiczeniem na 5 minut i odnośnikiem "Następny krok", więc można iść po kolei albo wskakiwać w środek.

Ostatnia sekcja, [Claude Code](https://przewodnikai.pl/claude-code/), odstaje poziomem od reszty: to kurs pracy z agentem w terminalu, oznaczony jako średnio zaawansowany. Nie trzeba przez niego przechodzić, żeby skorzystać z całej reszty.

Nie ma tu logowania, kont ani ciasteczek śledzących - i dlatego nie zobaczysz banera zgody. Ruch mierzy Cloudflare Web Analytics, które zlicza wyświetlenia bez zapisywania czegokolwiek na Twoim urządzeniu.

## Jak to działa

Treść to zwykłe pliki tekstowe (Markdown). Powstaje w prywatnym repozytorium, przechodzi przez przegląd redakcyjny i dopiero potem trafia tutaj.

```text
pisanie i przegląd (prywatnie)  →  publikacja  →  to repozytorium  →  na stronie
```

**To repozytorium jest lustrem, nie warsztatem.** Pokazuje stan wydany: kod serwisu i treść dopuszczoną do publikacji. Nie ma tu tekstów w przygotowaniu, a pliki są generowane skryptem publikacji - odnośniki do stron w przebudowie, karty sekcji i przekierowania powstają automatycznie.

W praktyce znaczy to jedno: **poprawka wniesiona bezpośrednio tutaj zostałaby nadpisana** przy następnej publikacji, i to bez śladu dla osoby, która poświęciła na nią czas. Dlatego pod każdym artykułem jest "Zgłoś uwagę do tej strony", a nie "Edytuj tę stronę".

## Znalazłeś błąd? To jest dokładnie to, czego szukam

Przy przeglądzie całego materiału **każde zgłoszenie realnie skraca robotę** - Twoje świeże oko widzi to, co mnie umknęło po piątym czytaniu tego samego akapitu.

Zgłoś przez [Issues](https://github.com/lukaszpodgorski-pl/przewodnikai_pl/issues/new/choose). Są trzy gotowe szablony:

- **Błąd lub literówka** - od przecinka po zdanie, które się nie klei.
- **Nieaktualna informacja** - cena, wersja modelu, funkcja, której już nie ma.
- **Propozycja treści** - czego brakuje, o czym warto napisać.

Nie musisz umieć programować ani znać GitHuba. Wystarczy konto i opis problemu własnymi słowami - adres strony plus co jest nie tak w zupełności starcza.

Zgłoszenia merytoryczne najbardziej pomagają, gdy mają **link do źródła**. To ta sama zasada, która obowiązuje mnie przy pisaniu (patrz niżej).

## Zasady

Cztery rzeczy, które decydują o tym, co wchodzi na stronę:

1. **Piszemy dla laika.** Ciepło, bezpośrednio (per "Ty"), bez żargonu. Termin angielski podajemy w nawiasie przy pierwszym użyciu. Grupa docelowa to osoby nietechniczne - jeśli Twoja babcia by tego nie zrozumiała, upraszczamy.
2. **Źródło jest obowiązkowe** przy każdej zmianie merytorycznej - nowym fakcie, liczbie, twierdzeniu. To tarcza przeciw halucynacjom i dezinformacji. Bez linku do źródła zmiana nie wchodzi. Dane podawane jako aktualne nie mogą być starsze niż 2 lata; wyjątkiem są fakty historyczne i trwałe metody.
3. **Neutralność.** Opisujemy narzędzia rzetelnie, z wadami i zaletami. Bez kryptoreklamy i bez linków afiliacyjnych.
4. **Po polsku.** Treść piszemy po polsku, także dla terminów, które mają dobre polskie odpowiedniki.

Do tego konwencje techniczne (nazwy plików, formaty obrazów, obowiązkowy tekst alternatywny, zakaz GIF-ów) - opisane w [CONTRIBUTING.md](./CONTRIBUTING.md) i sprawdzane automatycznie.

## AI w tworzeniu tego przewodnika

**Duża część tej treści powstała przy wsparciu narzędzi AI** - i mówię o tym wprost, bo trudno uczyć transparentności, samemu ją pomijając. Jeden z rozdziałów tego przewodnika radzi: "bądź transparentny o użyciu AI". To dotyczy też mnie.

Trwający przegląd redakcyjny jest bezpośrednim skutkiem tej decyzji. AI dobrze radzi sobie ze szkicem, przeformułowaniem i porządkowaniem struktury. Gorzej z pilnowaniem, czy zdanie faktycznie coś znaczy - i całkiem źle z odróżnianiem tego, co sprawdzone, od tego, co brzmi wiarygodnie. Model potrafi napisać rzecz brzmiącą świetnie i całkowicie nieprawdziwą; ten przewodnik ma [osobny rozdział](https://przewodnikai.pl/podstawy/) o tym, jak takie rzeczy rozpoznawać.

Stąd sztywna zasada o źródłach i stąd przegląd strona po stronie. Narzędzie zostaje, odpowiedzialność za tekst jest moja.

## Kto za tym stoi

Projekt prowadzi **Łukasz Podgórski** - konsultant AI i trener, ponad 15 lat w IT, w tym ponad 5 lat pracy ze sztuczną inteligencją. Dzieli się wiedzą o AI na [kanale YouTube](https://www.youtube.com/@lukaszpodgorski) (ponad 1300 osób) i prowadzi klub zainteresowanych sztuczną inteligencją zrzeszający blisko 1000 osób.

Więcej: [O mnie](https://przewodnikai.pl/zasoby/o-mnie/) · [Kontakt](https://przewodnikai.pl/zasoby/kontakt/)

---

## Dla programistów

Statyczna strona na [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/), hostowana na Cloudflare Workers.

```bash
npm install
npm run dev          # serwer deweloperski na localhost:4321
npm run build        # build produkcyjny do ./dist/ - to jest nasz "test suite"
npm run preview      # podgląd builda
npm run verify:geo   # 24 asercje na zbudowanym dist/ (dane strukturalne, OG, sitemapa)
npm run test:publish # testy transformacji publikacyjnych
```

Nie ma frameworka testowego dla treści. `npm run build` jest pełnym sprawdzeniem - wykrywa złamane linki wewnętrzne, błędy frontmattera (schemat Zod) i błędy MDX.

### Struktura

```text
src/content/docs/            # cała treść; folder = sekcja w menu bocznym
├── podstawy/  jak-dziala-ai/  prompt-engineering/  narzedzia/
├── suwerenne-ai/  praktyka/  etyka/  zasoby/
└── sciezki/                 # ścieżki nauki (celowo poza menu bocznym)
src/assets/<sekcja>/<artykuł>/   # obrazy artykułów (Astro optymalizuje do WebP/AVIF)
public/media/                    # wideo i animacje (serwowane 1:1)
src/components/                  # Video, Faq, Head, MarkdownContent, Footer, ZglosUwage
src/config/                      # sections.ts (menu), repo.ts (adres repozytorium)
src/lib/structured-data.ts       # generowanie JSON-LD z frontmattera
scripts/verify-geo.mjs           # harness weryfikacyjny
scripts/publish.mjs              # publikacja ze źródła prawdy do tego repozytorium
scripts/status.mjs               # postęp przeglądu redakcyjnego
```

### Warto wiedzieć

- **`trailingSlash: 'always'`** - każdy link wewnętrzny kończy się ukośnikiem.
- **`public/_redirects`** ma pierwszeństwo przed plikami statycznymi. Nie twórz stron pod adresem sekcji (`/podstawy/`, `/etyka/` itd.) - przesłoniłyby stronę zbiorczą tej sekcji.
- **Nowy folder najwyższego poziomu nie pojawi się w menu**, dopóki nie dopiszesz sekcji do [`src/config/sections.ts`](./src/config/sections.ts).
- **Pole `status` we frontmatterze** (`szkic` / `zastane` / `gotowe`) decyduje o publikacji strony. Domyślnie `szkic`, żeby nowy plik nie wyszedł na produkcję przez zapomnienie. Schemat: [`src/content.config.ts`](./src/content.config.ts).
- Pola GEO we frontmatterze (`educationalLevel`, `teaches`, `about`, `mentions`, `faq`) zasilają dane strukturalne schema.org.

Szczegóły architektury i pułapki: [AGENTS.md](./AGENTS.md).

## Licencje

- **Treść** - [CC BY-SA 4.0](./LICENSE-CONTENT): możesz kopiować i przerabiać, podając autora i zachowując tę samą licencję.
- **Kod** - [MIT](./LICENSE).
- Font Noto Sans (generowanie obrazów OG) - [OFL-1.1](./src/pages/og/_fonts/OFL.txt).

---

Masz pytanie albo pomysł? [Napisz](https://przewodnikai.pl/zasoby/kontakt/) albo [zgłoś przez Issues](https://github.com/lukaszpodgorski-pl/przewodnikai_pl/issues).
