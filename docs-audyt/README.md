# docs-audyt

Narzędzia i metoda cyklicznego audytu merytorycznego treści przewodnikai.pl.

| Plik | Rola |
| --- | --- |
| [`procedura.md`](procedura.md) | metoda audytu - rubryka, fazy, zasady weryfikacji |
| [`skanuj.mjs`](skanuj.mjs) | skaner grafu linków i kontroli mechanicznych |

## Uruchomienie

```powershell
node docs-audyt/skanuj.mjs
```

Zapisuje `TODO_AUDYT_INT.md` w katalogu głównym (plik jest w `.gitignore` - to raport roboczy, nie treść serwisu) i wypisuje podsumowanie. Opcje:

| Opcja | Działanie |
| --- | --- |
| `--json <plik>` | dodatkowo pełne dane skanu jako JSON |
| `--tylko-json` | sam JSON na stdout, bez zapisu raportu |

Pełny audyt (skan + subagenty) uruchamia procedura z [`procedura.md`](procedura.md); lokalnie skrótem `/audyt` w Claude Code.

## Dlaczego to nie jest w CI

Skaner nie jest bramką - nie zwraca kodu błędu i nie blokuje builda. Powód: większość jego ustaleń wymaga ludzkiego rozstrzygnięcia (czy kwota to cennik, czy liczba ilustracyjna; czy sierota to usterka, czy strona pomocnicza). Bramka, która świeci na czerwono przy rzeczach do przemyślenia, zostaje wyciszona i przestaje cokolwiek chronić.

Warstwę, którą da się rozstrzygnąć maszynowo, pokrywają istniejące workflow: `links.yml`, `lint.yml`, `verify-geo.yml`, `media.yml`.

## Dziennik przebiegów

| Data | Zakres | P1 | P2 | P3 | Uwagi |
| --- | --- | ---: | ---: | ---: | --- |
| 2026-07-31 | pełny (80 stron, 24 jednostki) | 14 | 116 | 92 | pierwszy przebieg. 23 sprzeczności międzyartykułowe. Weryfikacja adwersaryjna odrzuciła 13 ustaleń. Zero martwych linków wewnętrznych - higiena po audycie linków (#36) się trzyma. Najcięższe: wycofany tryb agenta ChatGPT, "Claude nie przeszukuje internetu" wbrew własnej treści serwisu, fabryka AI Gaia opisana jako działająca, błędna atrybucja cytatu IBM zamiast Karima Lakhaniego. |
| 2026-07-31 | poprawki P1 + P2 | 0 | 0 | 92 | Naprawiono 14 P1, 116 P2 i 11 sprzeczności międzyartykułowych. Pozostały ustalenia P3 (styl, kosmetyka) i 12 sprzeczności P3. Skan po poprawkach: P1 0 / P2 1. |
| 2026-08-31 | `zasoby/slownik-pojec.md` (1 strona, 41 haseł) | 0 | 21 | 25 | Zakres zawężony na życzenie właściciela; priorytet: zrozumiałość dla osób nietechnicznych. Weryfikacja adwersaryjna obaliła 10 z 18 ustaleń P1/P2 w całości i 3 częściowo - zero P1 przetrwało. Poprawki naniesione w tym samym przebiegu po akceptacji: 24 hasła przepisane, 18 dostało ramkę "Ujęcie techniczne", 10 nowych linków do lekcji. FOG definicji 18,7 -> 14,2; haseł powyżej progu 20: 11 -> 0. Trzy powtarzalne błędy audytorów w sekcji C.5. Katalog `docs-audyt/` odtworzony z osieroconego commita 82036d3 - przepadł przy przepięciu repo na Giteę. |
