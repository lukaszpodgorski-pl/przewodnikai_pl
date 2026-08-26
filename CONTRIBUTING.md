# Jak pomóc przy Przewodniku AI

Dziękuję, że chcesz pomóc. Nie musisz być programistą ani znać GitHuba na wylot - wystarczy konto i opis problemu własnymi słowami.

## Najpierw jedna rzecz o tym repozytorium

To repozytorium jest **lustrem**, nie warsztatem. Treść powstaje w prywatnym repozytorium, przechodzi przez przegląd redakcyjny, a tutaj trafia dopiero to, co zostało dopuszczone do publikacji. Pliki są przy tym generowane skryptem publikacji: odnośniki do stron w przebudowie, karty sekcji i przekierowania powstają automatycznie.

Dlatego **poprawka wniesiona bezpośrednio tutaj zostałaby nadpisana** przy następnej publikacji - i to bez śladu dla osoby, która poświęciła na nią czas. Wolę powiedzieć to wprost, niż przyjąć pull request i po cichu go zgubić.

Ścieżka, która działa, prowadzi więc przez zgłoszenie:

```text
Twoje zgłoszenie  →  poprawka w źródle  →  publikacja  →  na stronie
```

Jeśli mimo to wyślesz pull request - nie zignoruję go. Potraktuję jak zgłoszenie: przeniosę zmianę do źródła, a PR zamknę z podziękowaniem i odnośnikiem do opublikowanej wersji.

## Zgłaszanie (Issues)

Załóż [issue](https://github.com/lukaszpodgorski-pl/przewodnikai_pl/issues/new/choose) - są gotowe szablony:

- **Błąd lub literówka** - coś jest nie tak na istniejącej stronie
- **Propozycja treści** - pomysł na nowy artykuł lub sekcję
- **Aktualizacja** - informacja się zdezaktualizowała (w AI to norma!)

Szablon sam nadaje etykietę, więc nie musisz jej wybierać. Etykiet używamy tylu, ile faktycznie potrzeba:

| Etykieta | Znaczy |
| --- | --- |
| `błąd` | coś jest nie tak na istniejącej stronie |
| `propozycja` | pomysł na nowy artykuł, sekcję lub funkcję |
| `aktualizacja` | informacja się zdezaktualizowała |
| `komponent` | animacja lub element interaktywny do przeniesienia na komponent Astro |
| `dobry pierwszy krok` | dobre na początek, jeśli dopiero zaczynasz |
| `czeka na decyzję` | zablokowane do czasu decyzji właściciela projektu |
| `wymaga źródła` | zmiana merytoryczna bez linku do źródła (patrz zasada 2 niżej) |

Szukasz, od czego zacząć? Filtr [`dobry pierwszy krok`](https://github.com/lukaszpodgorski-pl/przewodnikai_pl/issues?q=is%3Aissue+is%3Aopen+label%3A%22dobry+pierwszy+krok%22) pokazuje zadania nadające się na pierwszy wkład.

## Zasady treści

1. **Ton dla laika.** Piszemy ciepło, bezpośrednio (per "Ty"), bez żargonu. Metafory i przykłady z życia są mile widziane. Grupa docelowa: osoby nietechniczne.
2. **Źródła są obowiązkowe** przy zmianach merytorycznych (nowe fakty, liczby, twierdzenia). Dodaj link do wiarygodnego źródła w sekcji "Źródła i dalsze lektury" lub w zgłoszeniu. To tarcza przeciw halucynacjom i dezinformacji.
3. **Neutralność.** Opisujemy narzędzia i zjawiska rzetelnie - bez kryptoreklamy i linków afiliacyjnych.
4. **Język polski.** Treść piszemy po polsku; terminy angielskie podajemy w nawiasie przy pierwszym użyciu.

## Konwencje techniczne

- **Nazwy plików:** małe litery, myślniki, bez polskich znaków (`weryfikacja-informacji.md`).
- **Struktura:** artykuły leżą w `src/content/docs/<sekcja>/` - folder = sekcja w menu bocznym.
- **Frontmatter:** minimum `title` i `description`; opcjonalnie `sidebar.order` oraz pola GEO (`teaches`, `about`, `faq` - zobacz istniejące artykuły).
- **Wyróżnienia:** używaj bloków `:::tip`, `:::note`, `:::caution`, `:::danger` (asides Starlight) zamiast własnego HTML.

## Co się dzieje ze zgłoszeniem

- Czytam każde. Zgłoszenie merytoryczne z linkiem do źródła idzie najszybciej - nie muszę wtedy sam ustalać, czy nowa informacja jest prawdziwa.
- Poprawka trafia do źródła prawdy, a stamtąd na stronę przy najbliższej publikacji. W issue dostajesz odnośnik do opublikowanej wersji.
- Zanim cokolwiek wyjdzie, publikacja przechodzi automatyczne kontrole: formatowanie Markdown, działanie linków, rozmiary mediów oraz build razem z danymi strukturalnymi (`npm run verify:geo`, 24 asercje). Zepsuta wersja nie opuszcza mojego komputera.
- Jeśli czegoś nie przyjmę, napiszę dlaczego. Milczenie nie jest odpowiedzią.

## Licencja wkładu

Zgłaszając treść (w issue albo pull requeście) oświadczasz, że jest Twojego autorstwa lub masz prawo ją udostępnić, i zgadzasz się na publikację na licencji **[CC BY-SA 4.0](./LICENSE-CONTENT)** (treść) lub **[MIT](./LICENSE)** (kod).

---

## Grafiki, animacje i wideo - zasady dodawania mediów

> Ta sekcja dotyczy każdej zmiany dodającej lub podmieniającej pliki multimedialne.

## Gdzie trafiają pliki

Obrazy mają własny folder na media, nazwany tak samo jak plik artykułu; wideo trafia do `public/media/`:

```text
src/
├── content/docs/podstawy/czym-jest-llm.mdx
└── assets/podstawy/czym-jest-llm/        ← obrazy (Astro je optymalizuje)
    ├── schemat-tokenizacji.svg
    └── porownanie-modeli.png
public/
└── media/podstawy/czym-jest-llm/          ← wideo/animacje (serwowane 1:1)
    ├── demo-promptowania.webm
    └── demo-promptowania.mp4
```

Nazwy plików: **małe litery, bez polskich znaków, myślniki zamiast spacji** (`schemat-tokenizacji.svg`, nie `Schemat Tokenizacji.SVG`).

## Jaki format wybrać?

| Chcesz dodać… | Użyj | Nie używaj |
| --- | --- | --- |
| Zrzut ekranu, zdjęcie | PNG lub JPG (Astro sam zoptymalizuje do WebP/AVIF) | BMP, TIFF |
| Diagram, schemat, ikonę | **SVG** | PNG z tekstem (nieczytelny przy zoomie) |
| Krótką animację (do ~30 s) | **WebM** + opcjonalnie MP4 jako fallback | **GIF** ❌ |
| Dłuższe wideo, tutorial | Embed z YouTube | Plik wideo w repo |

**Dlaczego nie GIF?** GIF-y są 5-10× większe niż WebM przy gorszej jakości i spowalniają stronę na telefonach. Jeśli masz animację jako GIF, przekonwertuj ją (patrz niżej).

**Diagramy:** docelowo planujemy wsparcie bloków ` ```mermaid ` (diagramy edytowalne tekstowo, wersjonowane razem z treścią); dopóki nie zostanie włączone, dodawaj diagramy jako SVG.

## Limity rozmiaru (sprawdzane automatycznie w CI)

- Obrazy: **maks. 1 MB** na plik
- Wideo/animacje: **maks. 5 MB** na plik
- Większe wideo → wrzuć na YouTube i osadź, albo napisz w zgłoszeniu - wgram je na CDN projektu

## Jak osadzić w artykule

**Obraz** (zwykły Markdown - Astro zoptymalizuje go przy buildzie):

```md
![Schemat działania transformera - dane wejściowe przechodzą przez warstwy uwagi](../../../assets/podstawy/czym-jest-llm/schemat-transformera.png)
```

**Animacja** (komponent `<Video />` zamiast GIF-a):

```mdx
import Video from '../../../components/Video.astro';

<Video
  src="/media/podstawy/czym-jest-llm/demo-promptowania.webm"
  fallback="/media/podstawy/czym-jest-llm/demo-promptowania.mp4"
  alt="Nagranie ekranu: wpisywanie promptu i odpowiedź modelu pojawiająca się słowo po słowie"
  caption="Tak wygląda strumieniowanie odpowiedzi w praktyce"
/>
```

## Tekst alternatywny (alt) - obowiązkowy

Każdy obraz i animacja **musi** mieć opis alternatywny. To warunek publikacji.

- ✅ Dobry alt: `Wykres słupkowy porównujący koszt 1 mln tokenów w pięciu modelach - najtańszy jest model X`
- ❌ Zły alt: `wykres`, `obrazek1`, pusty alt

Alt opisuje **co widać i co z tego wynika** - tak, żeby osoba korzystająca z czytnika ekranu nie straciła żadnej informacji.

## Konwersja GIF → WebM/MP4

Masz gotowego GIF-a albo animację nagraną z ekranu? Jedna komenda z [ffmpeg](https://ffmpeg.org/):

```bash
# GIF → WebM (główny format)
ffmpeg -i animacja.gif -c:v libvpx-vp9 -b:v 0 -crf 40 -an animacja.webm

# GIF → MP4 (fallback dla starszych przeglądarek)
ffmpeg -i animacja.gif -movflags faststart -pix_fmt yuv420p \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -an animacja.mp4
```

Nie masz ffmpeg? Nie szkodzi: napisz o tym w zgłoszeniu, przekonwertuję plik przed publikacją.

## Animacje CSS/JS

Jeśli chcesz dodać animację interaktywną (CSS/JS), **nie renderuj jej do wideo** - zgłoś się w Issues z etykietą `komponent`. Przeniosę ją do komponentu Astro - dzięki temu pozostanie ostra, lekka i edytowalna razem z treścią.

## Prawa autorskie do mediów

Dodając plik, oświadczasz, że:

1. jest Twojego autorstwa, **lub**
2. pochodzi ze źródła na wolnej licencji (CC0, CC BY, CC BY-SA) - wtedy podaj źródło i licencję w zgłoszeniu lub w podpisie pod grafiką.

Zrzuty ekranu z narzędzi AI (ChatGPT, Claude, Midjourney itd.) są OK w celach edukacyjnych - zadbaj tylko, by nie zawierały danych osobowych (zamaż adresy e-mail, nazwiska, avatary).

Wszystkie media w repozytorium są publikowane na licencji projektu (CC BY-SA 4.0), chyba że podpis wskazuje inaczej.

## Checklist dla mediów

- [ ] Obraz w `src/assets/<sekcja>/<artykul>/`, wideo w `public/media/<sekcja>/<artykul>/`
- [ ] Nazwa: małe litery, myślniki, bez polskich znaków
- [ ] Format zgodny z tabelą (SVG/PNG/JPG/WebM - nie GIF)
- [ ] Rozmiar w limicie (obraz ≤ 1 MB, wideo ≤ 5 MB)
- [ ] Każdy obraz/animacja ma sensowny `alt`
- [ ] Źródło i licencja podane (jeśli materiał nie jest Twój)
