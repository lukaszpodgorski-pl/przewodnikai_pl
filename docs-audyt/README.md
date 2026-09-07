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
| 2026-08-31 | `podstawy/` (9 stron, 12 965 słów) | 4 | 10 | 19 | Zakres zawężony na życzenie właściciela. Trzy jednostki tematyczne, dziewięć weryfikacji adwersaryjnych: 3 potwierdzone, 5 obalonych w całości, 1 przeważone (P2 → P3), 1 przeklasyfikowane (N → D). Cała sekcja poza stroną zbiorczą ma `status: szkic`, ale dwa z czterech P1 siedzą właśnie w publicznym `index.mdx`. Najcięższe: "Czat to nie sejf (chyba że wyłączysz trening)" wbrew własnej stronie `/etyka/prywatnosc/`; Custom GPT jako narzędzie poziomu 2, choć OpenAI zablokowało tworzenie GPT na kontach osobistych ok. 16 sierpnia 2026; trzy różne wyceny czasu przejścia sekcji (`index.mdx` 6-8 min/stronę, `wstep.mdx` kwadrans, ramki w lekcjach 6-15 min); `index.mdx` obiecuje, że rozmowa z chatbotem jest dopiero po trzeciej lekcji, a ćwiczenie lekcji pierwszej jej wymaga. Wzorzec przewodni: lekcja Podstaw podaje twardą liczbę albo nazwę, którą lekcja właściwa dla tematu świadomie pomija - i to te duplikaty się starzeją. Obalone m.in.: rzekoma nieaktualność definicji AI wobec AI Act, rzekomy rozjazd ćwiczenia z datami odcięcia modeli, rzekomo zawyżone liczby z badania Magesh i in. |
| 2026-08-31 | poprawki P1 + P2 w `podstawy/` | 0 | 0 | 19 | Naniesione po decyzji właściciela w tym samym przebiegu: 23 podmiany w 9 plikach. Kluczowe: zdanie o wyłączeniu treningu przestało obiecywać sejf; Custom GPT zastąpiony opisem stanu na dziś; trzy wyceny czasu sekcji sprowadzone do jednej wyprowadzonej z ramek `**Czas:**`; `index.mdx` nie twierdzi już, że rozmowa z chatbotem czeka do lekcji czwartej; kotwice po cennik przekierowane z `/narzedzia/chatboty/` na `/narzedzia/ile-kosztuje-ai/`; twarde liczby o tokenach usunięte na rzecz odesłania do lekcji, która temat posiada; `id="prompt-engineering"` na słowie "prompt" poprawione na `id="prompt"`. Bramki po poprawkach: build 106 stron, markdownlint 0, verify:geo 23/23, test:publish 17/17. Skan po poprawkach: P1 0 / P2 0 w tej sekcji. Zostaje 19 P3 i 4 pozycje do decyzji właściciela. |
