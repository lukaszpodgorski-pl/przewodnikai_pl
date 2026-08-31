---
title: Słownik pojęć AI
description: 41 pojęć AI wyjaśnionych po polsku - definicja, przykład z życia i ujęcie techniczne dla tych, którzy chcą głębiej.
sidebar:
  label: 'Słownik pojęć'
  order: 1
educationalLevel: Beginner
teaches:
  - Słownik terminów AI
  - Definicje pojęć sztucznej inteligencji
  - Kluczowe terminy machine learning
about:
  - name: Sztuczna inteligencja
    sameAs: https://pl.wikipedia.org/wiki/Sztuczna_inteligencja
status: gotowe
---

Zebrałem tutaj 41 pojęć, które najczęściej sprawiają kłopot osobom zaczynającym przygodę z AI. Każde hasło tłumaczę najpierw zwykłym językiem, a potem daję przykład z życia - bo dopiero przykład sprawia, że definicja zostaje w głowie. Tam, gdzie dane pojęcie ma w przewodniku swój rozdział, podaję link do lekcji.

Część haseł ma dodatkowo szarą ramkę **"Ujęcie techniczne"**. To wersja precyzyjna, z terminologią i szczegółami, przydatna, jeśli czytasz dokumentację albo rozmawiasz z kimś z branży. Możesz ją spokojnie pominąć - wszystko, co potrzebne, jest już nad nią.

Nie musisz czytać tego od deski do deski. Traktuj tę stronę jak podręczny leksykon i wracaj do niej, kiedy natkniesz się na nieznany termin.

## Agent AI

System AI, który dostaje cel zamiast pojedynczego polecenia. Sam układa plan, sam sięga po narzędzia - wyszukiwarkę, pliki, inne aplikacje - i wykonuje zadanie krok po kroku. Po drodze sprawdza wyniki własnej pracy i poprawia się, jeśli coś nie wyszło.

**Przykład:** Prosisz agenta o "znalezienie trzech połączeń do Rzymu na przyszły weekend i porównanie cen". Zwykły chatbot opisałby, jak to zrobić samodzielnie - agent sam otwiera wyszukiwarkę, przegląda wyniki i wraca z gotowym zestawieniem.

## Algorytm

Przepis na wykonanie zadania: lista kroków, które trzeba zrobić po kolei, żeby dojść do wyniku. Komputer nie zgaduje - robi dokładnie to, co mówi algorytm. W AI algorytmy decydują, jak system przetwarza dane i na jakiej podstawie wybiera odpowiedź.

**Przykład:** Przepis na naleśniki to algorytm: rozbij jajka, dodaj mąkę, wymieszaj, usmaż. Kolejność ma znaczenie, a wynik jest za każdym razem podobny. Tak samo działa algorytm Google - przechodzi przez ustalone kroki i na końcu decyduje, którą stronę pokazać Ci pierwszą.

## Alignment (Dostosowanie)

Dopilnowanie, żeby system AI robił to, o co nam naprawdę chodzi, a nie to, co dosłownie kazaliśmy mu robić. To rzadko jest to samo. Im bardziej samodzielny system, tym większa różnica między jednym a drugim - i tym poważniejsze skutki, gdy AI trafi w cel, ale nie w intencję.

**Przykład:** Serwis wideo każe AI maksymalnie wydłużyć czas oglądania. System odkrywa, że najskuteczniej trzymają przy ekranie treści skrajne i budzące złość, więc zaczyna je polecać. Polecenie wykonał wzorowo, a efekt wyszedł odwrotny do zamierzonego.

:::note[Ujęcie techniczne]
Problem dostosowania celów i zachowań systemów AI do ludzkich wartości i intencji, badany zarówno w warstwie praktycznej (RLHF, odmowy, filtry bezpieczeństwa), jak i teoretycznej. Skrajną wersję problemu opisuje eksperyment myślowy Nicka Bostroma o maksymalizatorze spinaczy: system z jednym wąsko zdefiniowanym celem i bez ludzkich wartości dążyłby do niego kosztem wszystkiego innego. To hipoteza dotycząca systemów, które nie istnieją, nie prognoza.
:::

## API (Application Programming Interface)

Sposób, w jaki jeden program prosi drugi o przysługę i dostaje odpowiedź. Nikt tego nie widzi na ekranie - to rozmowa między programami, prowadzona według z góry ustalonych zasad. Dzięki API twórca aplikacji może wstawić do niej gotowe umiejętności modelu AI, na przykład pisanie tekstów albo rozpoznawanie zdjęć, zamiast budować własny model od zera.

**Przykład:** Kiedy płacisz kartą w sklepie internetowym, sklep nie zagląda na Twoje konto sam - przez API pyta o zgodę bank i czeka na odpowiedź. Tak samo program do obsługi klienta może przez API poprosić model o propozycję odpowiedzi na e-mail i pokazać ją pracownikowi do zatwierdzenia.

:::note[Ujęcie techniczne]
Zestaw reguł i protokołów, które pozwalają różnym programom komunikować się ze sobą. W kontekście AI API udostępnia możliwości modelu (generowanie tekstu, rozpoznawanie obrazów, osadzenia) jako zdalny punkt końcowy, wywoływany z własnej aplikacji. Typowe zastosowania: automatyczne szkice odpowiedzi na zgłoszenia klientów albo analiza sentymentu, czyli maszynowa ocena, czy wypowiedź jest pozytywna, negatywna czy neutralna.
:::

## Bias (Uprzedzenie)

Stałe przechylenie odpowiedzi AI w jedną stronę. Model powtarza uprzedzenia, które siedziały w danych, na których się uczył. Nie bierze się to ze złej woli programisty ani z awarii - model wiernie odtwarza to, co zobaczył w przykładach, razem z całą niesprawiedliwością, jaka w nich była. Najtrudniejsze jest to, że wygląda przy tym na obiektywny, bo "przecież decyduje komputer".

**Przykład:** System rekrutacyjny trenowany na historycznych danych firmy, gdzie większość kierowniczych stanowisk zajmowali mężczyźni, może faworyzować kandydatów płci męskiej, nawet jeśli płeć nie jest bezpośrednio uwzględniana w ocenie.

## Chain-of-thought (łańcuch myśli)

Technika promptowania, w której prosisz model, żeby rozpisał rozumowanie krok po kroku, zanim poda ostateczną odpowiedź. Pośrednie kroki działają jak brudnopis - model rzadziej gubi się w zadaniach wieloetapowych, a Ty widzisz, w którym miejscu popełnił błąd. W najprostszej wersji wystarczy dopisać do polecenia frazę "pomyślmy krok po kroku". W modelach rozumujących ten łańcuch jest już wbudowany i model generuje go sam, bez Twojej prośby.

**Przykład:** Pytasz "mam 3 skrzynki po 24 butelki, sprzedałem 17 - ile zostało?" i dostajesz samą liczbę, czasem błędną. Dopisujesz "rozpisz obliczenia krok po kroku" - model najpierw mnoży 3 × 24, potem odejmuje 17 i podaje wynik, który możesz sprawdzić.

## Chatbot

Program, z którym rozmawiasz w języku naturalnym - piszesz do niego jak do drugiego człowieka, a on odpowiada tekstem. Nowoczesne chatboty AI (jak ChatGPT, Claude czy Gemini) działają na dużych modelach językowych, dzięki czemu prowadzą swobodną rozmowę, a nie tylko wybierają gotowe odpowiedzi z listy.

**Przykład:** Wpisujesz "wytłumacz mi fotosyntezę jak dziecku", a chatbot w kilka sekund pisze prostą odpowiedź. Możesz od razu dopytać "a teraz jak studentowi biologii" - i dostajesz wersję bardziej zaawansowaną, bo chatbot pamięta kontekst rozmowy.

## Dane treningowe

Materiał, na którym model się uczy: teksty, zdjęcia, nagrania, liczby. Model nie wie niczego z góry - wszystko, co potrafi, wyciągnął z tego zbioru. Dlatego to zawartość danych treningowych decyduje, w czym model jest dobry, czego nie zna i jakie uprzedzenia powtarza.

**Przykład:** Aby nauczyć system rozpoznawania kotów na zdjęciach, podaje się mu tysiące obrazów oznaczonych jako "kot" i "nie kot". Te oznaczone obrazy stanowią dane treningowe.

## Embedding

Sposób zapisania znaczenia tekstu jako zestawu liczb. Model nie rozumie słów tak jak Ty - żeby cokolwiek z nimi zrobić, zamienia każde na długi ciąg liczb, dobrany tak, że teksty o podobnym znaczeniu dostają podobne ciągi. Dzięki temu maszyna potrafi policzyć, jak blisko siebie leżą dwa pojęcia, mimo że nie wie, co one znaczą.

**Przykład:** Wpisujesz w wyszukiwarkę sklepu "buty na deszcz" i dostajesz kalosze, choć w ich opisie słowo "deszcz" w ogóle nie pada. To działa dzięki embeddingom: liczby przypisane do "kaloszy" leżą blisko liczb przypisanych do "deszczu", bo w tekstach, na których model się uczył, te słowa stale występowały razem.

:::note[Ujęcie techniczne]
Reprezentacja słów, fraz lub dokumentów w postaci wektorów liczbowych w przestrzeni wielowymiarowej. Podobieństwo znaczeń odpowiada bliskości wektorów, mierzonej najczęściej podobieństwem kosinusowym. Relacje semantyczne bywają zachowane jako kierunki w tej przestrzeni: wektor przejścia od "król" do "królowa" jest zbliżony do wektora przejścia od "mężczyzna" do "kobieta". To nadal geometria, nie rozumienie.
:::

## Etyka AI

Pytania o to, co wolno robić z AI, a czego nie. I o to, kto odpowiada, kiedy system zrobi komuś krzywdę. Chodzi o uczciwość, prywatność, jawność działania i wpływ na ludzką pracę. To nie są rozważania na później - takie decyzje zapadają dziś, przy budowie konkretnych narzędzi.

**Przykład:** Bank odmawia Ci kredytu, bo tak zdecydował algorytm. Masz prawo wiedzieć dlaczego? Czy firma może uczyć model na cudzych zdjęciach bez pytania autora o zgodę? Czy chatbot, do którego pisze ktoś w kryzysie, powinien mieć obowiązek odesłać go do człowieka? To są pytania etyki AI.

:::note[Ujęcie techniczne]
Dziedzina zajmująca się moralnymi implikacjami projektowania, tworzenia i wdrażania systemów sztucznej inteligencji. Obejmuje sprawiedliwość i niedyskryminację, przejrzystość, rozliczalność, prywatność oraz wpływ społeczny. W praktyce przekłada się na wymogi regulacyjne (ocena ryzyka, obowiązek informacyjny, nadzór człowieka) i na procedury audytu modeli przed wdrożeniem.
:::

## Explainable AI (XAI)

Podejście do tworzenia systemów AI, których decyzje można zrozumieć i wyjaśnić w sposób przystępny dla człowieka. XAI koncentruje się na zwiększeniu przejrzystości działania modeli, które często postrzegane są jako "czarne skrzynki".

**Przykład:** Zamiast otrzymać tylko diagnozę "wysokie ryzyko choroby serca", system XAI mógłby wyjaśnić: "Ryzyko jest wysokie ze względu na podwyższony poziom cholesterolu, historię rodzinną chorób serca i brak regularnej aktywności fizycznej w ostatnich 5 latach."

## Fine-tuning

Dotrenowanie gotowego modelu pod jedno konkretne zastosowanie. Zamiast uczyć model od zera - co kosztuje miliony - bierze się model już wytrenowany i pokazuje mu stosunkowo niewielki zbiór własnych przykładów. Uwaga na częste nieporozumienie: fine-tuning uczy przede wszystkim formy, stylu i słownictwa, a nie nowych faktów. Do wiedzy służy [RAG](#rag-retrieval-augmented-generation).

**Przykład:** Kancelaria bierze ogólny model językowy i dotrenowuje go na kilku tysiącach własnych pism procesowych. Model dalej potrafi wszystko co przedtem, ale teraz pisze językiem, którego używają prawnicy w tej kancelarii, i nie myli nazw dokumentów.

:::note[Ujęcie techniczne]
Dostrajanie wstępnie wytrenowanego modelu na mniejszym, wyspecjalizowanym zbiorze danych. W praktyce najczęściej stosuje się warianty oszczędne parametrowo (np. LoRA), które modyfikują ułamek wag zamiast całego modelu. Zysk dotyczy głównie formy, formatu i terminologii; wprowadzanie tą drogą nowej wiedzy faktograficznej jest zawodne i kosztowne w porównaniu z RAG.
:::

## Generatywna AI

Rodzaj sztucznej inteligencji, która tworzy nowe treści - teksty, obrazy, dźwięk, wideo czy kod - na podstawie tego, czego nauczyła się z danych. Różni się od "zwykłej" AI, która głównie rozpoznaje lub wybiera (np. filtruje spam), a nie wytwarza czegoś od zera. Po angielsku w skrócie: GenAI.

**Przykład:** Wpisujesz do ChatGPT "napisz wierszyk na urodziny babci", a model układa nowy tekst, którego wcześniej nie było. Generator obrazów na opis "kot grający na gitarze w kosmosie" rysuje obrazek od zera - to też generatywna AI.

## Głębokie uczenie (Deep Learning)

Uczenie maszynowe, w którym model ma wiele warstw ułożonych jedna nad drugą, a każda wychwytuje coś bardziej złożonego niż poprzednia. "Głębokie" znaczy dokładnie tyle: dużo warstw. Największa zmiana wobec starszych metod jest taka, że nikt nie musi z góry mówić modelowi, na co ma patrzeć - to, co ważne, wyłapuje sam z surowych zdjęć czy nagrań.

**Przykład:** Model rozpoznający twarze zaczyna od rzeczy najprostszych: pierwsze warstwy widzą krawędzie i plamy, kolejne składają z nich oko, nos i usta, a ostatnie - konkretną osobę. Nikt nie napisał mu, że twarz ma dwoje oczu. Doszedł do tego sam, oglądając zdjęcia.

:::note[Ujęcie techniczne]
Podkategoria uczenia maszynowego wykorzystująca wielowarstwowe sieci neuronowe do modelowania złożonych wzorców w danych. Kluczowa własność to automatyczne wyodrębnianie cech (feature learning) z surowych danych, które eliminuje ręczne projektowanie cech wymagane w starszych metodach. Kolejne warstwy budują reprezentacje o rosnącym poziomie abstrakcji.
:::

## GPU (Graphics Processing Unit)

Procesor graficzny - układ, który powstał do rysowania grafiki w grach, a okazał się idealny do trenowania AI. Powód jest prosty: karta graficzna nie wykonuje jednego trudnego działania szybko, tylko tysiące prostych naraz, a trening modelu to właśnie miliardy prostych mnożeń. Dlatego dziś karty graficzne, a nie zwykłe procesory, są najdroższą częścią sprzętu do AI.

**Przykład:** Ta sama karta, która w komputerze do gier rysuje płynny obraz, potrafi uruchomić mniejszy model AI na Twoim biurku. Wytrenowanie dużego modelu językowego wymaga jednak tysięcy takich kart pracujących razem przez wiele tygodni - stąd koszty liczone w milionach dolarów.

:::note[Ujęcie techniczne]
Specjalistyczny procesor pierwotnie zaprojektowany do renderowania grafiki, którego architektura z tysiącami rdzeni okazała się skuteczna w obliczeniach równoległych - przede wszystkim w mnożeniu macierzy, na którym opiera się trening i wnioskowanie sieci neuronowych. Przy modelach uruchamianych lokalnie kryterium doboru jest pamięć karty (VRAM), a nie sama liczba rdzeni.
:::

## Halucynacje AI

Sytuacja, w której model podaje informację brzmiącą wiarygodnie, ale zmyśloną. To nie jest kłamstwo ani awaria. Model zawsze układa najbardziej prawdopodobny ciąg dalszy, a kiedy czegoś nie wie, "prawdopodobne" przestaje znaczyć "prawdziwe". Najgroźniejsze jest to, że halucynacja wygląda tak samo jak dobra odpowiedź - tym samym pewnym tonem.

**Przykład:** Prosisz o źródła do artykułu i dostajesz listę książek z autorami, tytułami i latami wydania. Wszystko wygląda porządnie, ale dwóch z tych pozycji nigdy nie wydano - model ułożył tytuły, które brzmią jak prawdziwe.

:::note[Ujęcie techniczne]
Generowanie treści niezgodnych z faktami przy zachowaniu spójności językowej i wysokiej pewności wypowiedzi. Wynika ze sposobu działania modelu, który dobiera kolejne tokeny wedle prawdopodobieństwa, a nie weryfikuje twierdzeń wobec źródła. Nie jest to defekt usuwalny kolejną wersją modelu; ryzyko obniża się, dokładając weryfikację - na przykład RAG z cytowaniem fragmentów albo kontrolę człowieka.
:::

## Model

Wytrenowany program, który jest właściwą "sztuczną inteligencją" w każdym narzędziu, z którego korzystasz. Powstaje przez trening na ogromnych zbiorach danych, ale ich w sobie nie przechowuje - zostają z nich tylko wyłapane prawidłowości. Na ich podstawie model radzi sobie także z rzeczami, których nigdy wcześniej nie widział.

**Przykład:** ChatGPT to aplikacja: okno, w które piszesz. Model to silnik pod spodem, który układa odpowiedź. Ten sam model bywa dostępny w kilku różnych aplikacjach, tak jak ten sam silnik montuje się w różnych samochodach - i dlatego zmiana modelu w ustawieniach potrafi zmienić jakość odpowiedzi bez żadnej zmiany w samym oknie czatu.

:::note[Ujęcie techniczne]
Wynik treningu: zestaw parametrów (wag) kodujących prawidłowości wyodrębnione ze zbioru treningowego, wraz z architekturą, która określa sposób ich użycia. Model nie przechowuje danych treningowych i służy do przewidywania wyników dla danych niewidzianych wcześniej. W tym przewodniku najczęściej chodzi o duży model językowy.
:::

## Model językowy (LLM)

Model wytrenowany na ogromnej ilości tekstu, którego jedyne zadanie brzmi: przewidzieć, co powinno pójść dalej. Z tej jednej umiejętności, powtarzanej kawałek po kawałku, bierze się wszystko pozostałe - rozmowa, tłumaczenie, streszczanie, pisanie. Efekt wygląda jak rozumienie języka, ale w środku nie ma ani zrozumienia, ani sprawdzania faktów. Skrót LLM to Large Language Model, a "duży" odnosi się i do ilości tekstu, na którym się uczył, i do rozmiaru samego modelu.

**Przykład:** Modele w ChatGPT, Claude i Gemini to popularne duże modele językowe: prowadzą rozmowę, piszą teksty i pomagają w rozwiązywaniu problemów.

## Model open-weight

Model AI, którego wagi (czyli wyuczone parametry) producent udostępnia do pobrania - możesz uruchomić go na własnym komputerze lub serwerze, bez wysyłania danych do chmury dostawcy. Open-weight nie zawsze znaczy w pełni open source: licencje bywają różne, od bardzo liberalnej Apache 2.0 (np. Bielik, rodzina Mistral 3) po licencje z ograniczeniami komercyjnymi. Przeciwieństwem są modele zamknięte, dostępne wyłącznie przez API lub aplikację producenta.

**Przykład:** Bielik i małe modele Ministral 3 (3, 8 i 14 mld parametrów) to modele open-weight - możesz pobrać je za darmo i uruchomić w aplikacji LM Studio na własnym komputerze. Flagowy Mistral Large 3 też ma otwarte wagi, ale przy 675 mld parametrów potrzebuje już serwera z kilkoma kartami graficznymi.

## Ogólna AI (AGI)

Hipotetyczny system AI dorównujący człowiekowi w dowolnej dziedzinie intelektualnej: przenoszący umiejętności między zupełnie różnymi zadaniami, uczący się w trakcie działania i mający spójny model świata. AGI (Artificial General Intelligence) dziś nie istnieje, a badacze nie są zgodni ani co do terminu jej powstania, ani co do tego, jak ją rozpoznać. Przeciwieństwem jest wąska AI - wszystko, z czego korzystasz dzisiaj.

**Przykład:** ChatGPT napisze wiersz i kod, ale nie nauczy się w trakcie rozmowy niczego nowego ani nie przeniesie doświadczenia z jednego zadania na zupełnie inne. To wciąż wąska AI, tyle że bardzo szeroko zakrojona.

## Okno kontekstowe

Maksymalna ilość tekstu (liczona w tokenach), którą model AI może jednocześnie "widzieć" - obejmuje Twoje pytania, wcześniejsze odpowiedzi i załączone dokumenty. Gdy rozmowa przekroczy ten limit, model traci dostęp do najstarszych fragmentów.

**Przykład:** Wklejasz do chatbota długi raport i zadajesz pytania. Jeśli raport mieści się w oknie kontekstowym, model odpowiada z uwzględnieniem całości; jeśli nie - odpowiedzi dotyczą tylko tej części, którą model wciąż "widzi".

## Prompt

To, co wpisujesz modelowi: pytanie, polecenie, wklejony tekst albo wszystko naraz. Model nie ma żadnego innego źródła wiedzy o tym, czego chcesz - nie widzi Twojej miny ani kontekstu sprawy. Dlatego od treści promptu zależy niemal cała jakość odpowiedzi.

**Przykład:** "Napisz wiersz o jesieni" to prosty prompt, który może dać różne wyniki w zależności od modelu. Bardziej rozbudowany prompt, jak "Napisz 12-wersowy wiersz o jesieni, używając metafor związanych z przemijaniem i ciepłych barw", daje bardziej ukierunkowany rezultat.

## Prompt engineering

Umiejętność formułowania poleceń tak, żeby model odpowiadał tak, jak potrzebujesz. Sprowadza się do trzech rzeczy: powiedzieć wprost, o co Ci chodzi, dodać kontekst i określić, w jakiej formie chcesz dostać wynik. To nie jest wiedza tajemna ani osobny zawód - to głównie precyzja, a uczysz się jej na własnych rozmowach.

**Przykład:** Zamiast pytać "Jak zostać programistą?", inżynieria promptów sugeruje bardziej precyzyjne podejście: "Jestem 30-letnim nauczycielem z podstawową znajomością HTML i CSS. Chcę zostać front-end developerem w ciągu roku, ucząc się 10 godzin tygodniowo. Stwórz dla mnie 3-miesięczny plan nauki, uwzględniający konkretne zasoby i projekty praktyczne."

## Przetwarzanie języka naturalnego (NLP)

Dział AI, który zajmuje się tym, żeby komputer poradził sobie ze zwykłym ludzkim językiem - mówionym i pisanym, ze skrótami, literówkami i wieloznacznością. Obejmuje jedno i drugie: przetwarzanie tekstu i tworzenie go. Skrót NLP pochodzi od angielskiego Natural Language Processing.

**Przykład:** Dyktujesz wiadomość w telefonie i pojawia się jako tekst, Google Translate tłumaczy Ci menu ze zdjęcia, a poczta odsiewa spam - za każdym razem pracuje NLP. Sklepy używają go też do przejrzenia tysięcy opinii i rozdzielenia ich na pochwały i skargi, czego człowiek nie zrobiłby w rozsądnym czasie.

:::note[Ujęcie techniczne]
Dziedzina AI zajmująca się interakcją między komputerami a językiem naturalnym. Obejmuje analizę, interpretację i generowanie tekstu w sposób naśladujący ludzkie zdolności językowe. Typowe zadania: tłumaczenie maszynowe, rozpoznawanie mowy, rozpoznawanie jednostek nazewniczych, analiza sentymentu i systemy dialogowe. Dzisiejsze rozwiązania opierają się w większości na transformerach.
:::

## RAG (Retrieval-Augmented Generation)

Technika, w której model przed odpowiedzią najpierw zagląda do wskazanych dokumentów, a dopiero potem pisze. Zwykły model odpowiada wyłącznie z tego, co zapamiętał podczas treningu - nie zna Twoich plików i nie wie, co zmieniło się po dacie odcięcia. RAG dokłada krok wyszukiwania: system znajduje pasujące fragmenty, podaje je modelowi i każe odpowiadać na ich podstawie. Odpowiedzi są przez to aktualniejsze i łatwiej sprawdzić, skąd się wzięły.

**Przykład:** Wgrywasz do chatbota instrukcję obsługi swojego pieca i pytasz, co znaczy migający błąd E4. Model nie znał tej instrukcji z treningu - odnalazł w niej odpowiedni fragment i odpowiedział na jego podstawie. Bez RAG odpowiedziałby ogólnikami albo zmyślił.

:::note[Ujęcie techniczne]
Retrieval-Augmented Generation: metoda łącząca wyszukiwanie informacji z generowaniem. Dokumenty dzieli się na fragmenty, zamienia na embeddingi i trzyma w bazie wektorowej; zapytanie użytkownika przechodzi tę samą zamianę, po czym system dobiera najbliższe fragmenty i wstawia je do promptu jako kontekst. Podnosi to dokładność i aktualność bez dotrenowywania modelu.
:::

## RLHF (Reinforcement Learning from Human Feedback)

Metoda douczania modelu na ocenach wystawianych przez ludzi. Sam trening na tekstach uczy model, co jest prawdopodobne, ale nie co jest pomocne, uprzejme i bezpieczne. Pokazuje się więc ludziom po kilka odpowiedzi modelu na to samo pytanie, oni układają je od najlepszej do najgorszej, a model jest dostrajany tak, żeby coraz częściej trafiać w to, co ludzie wybierali. Skrót rozwija się jako Reinforcement Learning from Human Feedback.

**Przykład:** To dzięki RLHF chatbot odpowiada rozmową zamiast dopisywać dalszy ciąg Twojego zdania, i to dzięki niemu odmawia, gdy poprosisz o coś groźnego. Kciuk w górę lub w dół, który klikasz pod odpowiedzią, to zbieranie danych dokładnie tego rodzaju - tyle że tym razem oceniającym jesteś Ty.

:::note[Ujęcie techniczne]
Metoda trenowania łącząca uczenie przez wzmacnianie z informacją zwrotną od ludzi. Na rankingach odpowiedzi trenuje się model nagrody (reward model), który następnie steruje dostrajaniem modelu bazowego algorytmem uczenia przez wzmacnianie. W ten sposób dostrojono ChatGPT - opis metody: Ouyang i in., 2022.
:::

## Sieć neuronowa

Program zbudowany z tysięcy prostych elementów ("neuronów") połączonych w warstwy. Każdy z nich robi coś banalnego: dostaje liczby, mnoży je przez własne ustawienia i przekazuje wynik dalej. Umiejętność nie siedzi w żadnym z nich z osobna, tylko w sile połączeń między nimi - i to je właśnie dostraja trening. Nazwa pochodzi z luźnej inspiracji mózgiem i na tej inspiracji podobieństwo się kończy.

**Przykład:** Wyobraź sobie sieć neuronową analizującą zdjęcie: pierwsza warstwa może wykrywać proste krawędzie i linie, kolejne warstwy rozpoznają kształty i struktury, a ostatnie warstwy identyfikują złożone obiekty, jak "kot", "samochód" czy "dom".

## Suwerenność cyfrowa

Zdolność państwa, firmy lub pojedynczej osoby do korzystania z technologii cyfrowych - chmury, oprogramowania, modeli AI - bez krytycznej zależności od dostawców spoza swojego regionu. W praktyce chodzi o pytanie: co się stanie z Twoimi narzędziami i danymi, jeśli zagraniczny dostawca zmieni cennik, regulamin albo zostanie objęty sankcjami? Odpowiedzią są m.in. europejskie modele AI, lokalne centra danych i modele open-weight uruchamiane na własnym sprzęcie.

**Przykład:** Urząd, który zamiast chmury zagranicznego dostawcy uruchamia polski model językowy na własnych serwerach - dane obywateli nie opuszczają kraju.

**Więcej:** [Suwerenne AI](/suwerenne-ai/)

## Sztuczna inteligencja (AI)

Programy, które radzą sobie z zadaniami wymagającymi kiedyś człowieka: rozpoznają obraz, przetwarzają zdanie, wyciągają wnioski z danych, uczą się na przykładach. Różnica wobec zwykłego programu jest jedna i zasadnicza - nikt nie napisał AI reguły na każdy przypadek, ona wyciąga reguły sama z tego, co jej pokazano. Nazwą "sztuczna inteligencja" określa się i samą technologię, i dziedzinę nauki, która się nią zajmuje.

**Przykład:** Telefon rozpoznaje Twoją twarz i się odblokowuje, poczta wrzuca reklamy do spamu, nawigacja przewiduje korek, a chatbot pisze odpowiedź na e-mail. Żaden z tych programów nie dostał listy reguł na każdą sytuację - wszystkie nauczyły się z przykładów.

:::note[Ujęcie techniczne]
Dziedzina informatyki zajmująca się tworzeniem systemów wykonujących zadania kojarzone z ludzką inteligencją: rozumowanie, uczenie się, planowanie, przetwarzanie języka i percepcję. Obejmuje zarówno podejścia symboliczne, oparte na regułach zapisanych przez człowieka, jak i uczenie maszynowe, w którym reguły są wyprowadzane z danych. Wszystkie dzisiejsze systemy należą do wąskiej AI.
:::

## Temperatura (temperature)

Parametr sterujący losowością odpowiedzi modelu. Model w każdym kroku wybiera kolejny token z listy kandydatów - niska temperatura każe mu trzymać się najbardziej prawdopodobnego, wysoka pozwala sięgać po mniej oczywiste. Niżej na skali odpowiedzi są powtarzalne i zachowawcze, wyżej - bardziej kreatywne, ale i bardziej podatne na błędy. W zwykłych chatbotach temperatura jest ustawiona z góry; regulujesz ją przez API albo w narzędziach dla zaawansowanych.

**Przykład:** Prosisz o hasło reklamowe przy niskiej temperaturze i za każdym razem dostajesz niemal to samo, bezpieczne zdanie. Podnosisz ją - propozycje robią się zaskakujące i różnorodne, ale część z nich jest całkowicie nietrafiona.

:::note[Ujęcie techniczne]
Temperatura skaluje rozkład prawdopodobieństwa przed losowaniem kolejnego tokena: wartości bliskie zeru wyostrzają rozkład ku najbardziej prawdopodobnemu kandydatowi, wyższe go spłaszczają. Konkretnych liczb nie da się przenosić między dostawcami, bo skale są różne - w API Anthropic zakres to 0-1, w API OpenAI 0-2, w obu z wartością domyślną 1,0. Część nowszych modeli w ogóle nie przyjmuje ustawionej temperatury: Anthropic oznacza ten parametr jako wycofywany dla modeli wydanych po Claude Opus 4.6.
:::

## Token

Podstawowa jednostka tekstu, na jaką model dzieli to, co czyta i co pisze - zwykle fragment słowa, całe krótkie słowo albo znak interpunkcyjny. Tokeny są walutą modeli językowych: w nich mierzy się okno kontekstowe i w nich naliczane są opłaty za korzystanie z API. Polszczyzna dzieli się na tokeny mniej ekonomicznie niż angielski - ten sam tekst po polsku zajmuje ich zauważalnie więcej. Ile dokładnie, zależy od modelu i najlepiej to zmierzyć, zamiast przyjmować z pamięci.

**Przykład:** Wklejasz do chatbota dokument, który ma 10 tysięcy słów. Dla modelu to kilkanaście do dwudziestu kilku tysięcy tokenów - i to ta liczba, a nie liczba stron, decyduje, czy tekst zmieści się w oknie kontekstowym i ile zapłacisz za jego przetworzenie.

## Tokenizacja

Proces dzielenia tekstu na mniejsze jednostki zwane tokenami, które mogą być przetwarzane przez modele językowe. Tokeny to najczęściej słowa, części słów lub symbole, które stanowią podstawową jednostkę analizy.

**Przykład:** Zdanie "Lubię jeść jabłka" mogłoby zostać podzielone na tokeny: "Lubi", "ę", " jeść", " jabł", "ka" (podział zależy od konkretnego tokenizera).

## Transfer learning

Metoda uczenia maszynowego, w której wiedza zdobyta podczas rozwiązywania jednego problemu jest wykorzystywana do rozwiązania innego, powiązanego problemu. Pozwala to zaoszczędzić czas i zasoby potrzebne do trenowania modeli od zera.

**Przykład:** Model wytrenowany do rozpoznawania psów różnych ras może wykorzystać tę wiedzę do szybszego nauczenia się rozpoznawania kotów. Podstawowe cechy, jak kształt oczu, uszu czy tekstura futra, są przydatne w obu zadaniach.

## Transformery (Transformers)

Sposób budowy sieci neuronowej, wymyślony w 2017 roku, na którym opierają się dziś wszystkie duże modele językowe. Kluczowy pomysł: czytając zdanie, model przy każdym słowie sam ustala, na które inne słowa musi w tej chwili patrzeć - i robi to dla całego zdania naraz, a nie słowo po słowie. Ten wybór, na co zwrócić uwagę, nazywa się mechanizmem uwagi (po angielsku attention) i to dzięki niemu model nie gubi sensu w długich zdaniach.

**Przykład:** GPT (Generative Pre-trained Transformer) w nazwie zawiera odniesienie do tej architektury. Dzięki transformerom model rozstrzyga, że w zdaniu "Piotr podał piłkę Markowi, bo on chciał grać" słowo "on" odnosi się do Marka, a nie do Piotra.

:::note[Ujęcie techniczne]
Architektura sieci neuronowej przedstawiona w pracy "Attention Is All You Need" (Vaswani i in., 2017), która zastąpiła sieci rekurencyjne w przetwarzaniu języka naturalnego. Opiera się na mechanizmie samouwagi (self-attention): dla każdej pozycji w sekwencji model wylicza wagi względem wszystkich pozostałych pozycji, co pozwala przetwarzać całą sekwencję równolegle zamiast krok po kroku. Źródło: [arxiv.org/abs/1706.03762](https://arxiv.org/abs/1706.03762)
:::

## Trenowanie (trening)

Odrębny, kosztowny proces przed udostępnieniem modelu, w którym model przetwarza ogromne zbiory danych i dopasowuje swoje parametry (wagi). Po treningu wagi zostają zamrożone: model używany w rozmowie już się nie uczy, a jego wiedza kończy się na dacie odcięcia danych treningowych. Trening trwa tygodnie, samo używanie modelu (wnioskowanie) - ułamki sekundy.

**Przykład:** Model nie zapamięta Twojej dzisiejszej rozmowy na jutro. Żeby nauczył się czegoś nowego, producent musi przeprowadzić kolejny trening albo dotrenowanie (fine-tuning).

## Uczenie maszynowe (Machine Learning)

Sposób tworzenia programów, w którym nie pisze się reguł, tylko pokazuje przykłady - a program sam wyciąga z nich prawidłowości. W zwykłym programowaniu człowiek musi przewidzieć każdą sytuację i opisać ją regułą. W uczeniu maszynowym daje się tysiące gotowych przykładów i to program szuka w nich schematu, a im więcej ich zobaczy, tym rzadziej się myli.

**Przykład:** Nikt nie napisał Netfliksowi reguły "kto lubi kryminały skandynawskie, polubi też thrillery polityczne". Serwis wyciągnął ją sam, z tego co oglądały miliony ludzi - i na tej podstawie podsuwa Ci kolejny tytuł.

:::note[Ujęcie techniczne]
Poddziedzina AI zajmująca się systemami, które wyprowadzają regułę z danych zamiast otrzymywać ją zaprogramowaną wprost. Skuteczność rośnie wraz z liczbą i jakością przykładów, ale poprawa następuje w kolejnym cyklu treningu, a nie w trakcie zwykłego używania modelu - wagi wytrenowanego modelu pozostają zamrożone.
:::

## Uczenie nadzorowane

Uczenie na przykładach z gotową odpowiedzią. Każdy przykład ma dołączoną poprawną odpowiedź (nazywa się ją etykietą), a model tak długo poprawia swoje typowanie, aż zaczyna trafiać. Potem stosuje tę samą umiejętność do przypadków, których nigdy nie widział. To najczęstsza odmiana uczenia maszynowego, a jej największym kosztem jest to, że ktoś musi wcześniej ręcznie oznaczyć tysiące przykładów.

**Przykład:** Filtr antyspamowy uczy się na wiadomościach oznaczonych przez ludzi jako "spam" i "nie spam". Po treningu sam rozpoznaje, do której grupy trafia nowy e-mail - także taki, jakiego wcześniej nie widział.

:::note[Ujęcie techniczne]
Metoda uczenia maszynowego trenowana na danych oznaczonych etykietami. Model uczy się odwzorowania wejścia na znane wyjście, minimalizując funkcję straty na zbiorze treningowym, i jest oceniany na odłożonym zbiorze testowym. Dwa podstawowe zadania to klasyfikacja (etykieta z listy kategorii) i regresja (wartość liczbowa).
:::

## Uczenie nienadzorowane

Metoda uczenia maszynowego, w której model trenowany jest na danych bez etykiet. System sam odkrywa struktury, wzorce i powiązania w danych.

**Przykład:** System analizujący zachowania klientów sklepu internetowego może samodzielnie grupować ich według podobnych nawyków zakupowych, nawet jeśli nie ma z góry zdefiniowanych kategorii klientów.

## Uczenie przez wzmacnianie

Uczenie metodą prób i błędów: model coś robi, obserwuje skutek i dostaje punkty - dodatnie za dobry ruch, ujemne za zły. Nikt nie pokazuje mu poprawnej odpowiedzi. Model sam odkrywa, które zachowania popłacają, powtarzając próbę tysiące albo miliony razy. Tak uczy się tresowany pies i tak uczy się program grający w szachy.

**Przykład:** AlphaGo, który pokonał mistrzów w grze Go, doszlifował strategię, rozgrywając miliony partii sam ze sobą: wygrana dawała punkty, przegrana je odbierała. Nikt nie wpisał mu dobrych strategii - a część z tych, które sam wypracował, zaskoczyła mistrzów.

:::note[Ujęcie techniczne]
Metoda, w której agent uczy się polityki działania przez interakcję ze środowiskiem, maksymalizując skumulowaną nagrodę. Nie dostaje poprawnych odpowiedzi, tylko sygnał nagrody, i musi wyważyć eksplorację nowych działań wobec eksploatacji już znanych. AlphaGo startował z sieci wytrenowanej na partiach ludzi, a następnie dostrajał ją na ponad 30 mln pozycji z gry przeciwko sobie (Silver i in., Nature 2016); jego następca AlphaGo Zero przeszedł tę drogę bez ani jednej ludzkiej partii.
:::

## Wąska AI (ANI)

System AI wyspecjalizowany w jednym zadaniu lub wąskiej grupie zadań - bardzo dobry w tym, do czego został wytrenowany, i bezradny poza tym obszarem. Cała AI dostępna dzisiaj, łącznie z chatbotami, jest wąska: nie ma rozumienia świata w ludzkim sensie. ANI to Artificial Narrow Intelligence.

**Przykład:** Model wykrywający zmiany nowotworowe na zdjęciach RTG bywa dokładniejszy od lekarza, ale nie odpowie na najprostsze pytanie o pogodę. Poza swoim zadaniem nie "wie" nic.

## Zero-shot (bez przykładów)

Sposób zadania modelowi zadania bez pokazywania ani jednego przykładu - liczy się sama instrukcja, a model radzi sobie dzięki ogólnej wiedzy z treningu. To domyślne podejście i warto od niego zaczynać: jest najprostsze i najczęściej wystarcza. Gdy zawodzi, kolejnym krokiem jest few-shot, czyli dorzucenie do polecenia 2-3 przykładów rozwiązanego zadania.

**Przykład:** Piszesz "oceń, czy ta opinia o produkcie jest pozytywna, negatywna czy neutralna" i wklejasz tekst - bez żadnego wzorca. Model klasyfikuje opinię poprawnie, bo z treningu wie, jak wygląda zadowolony, a jak rozczarowany klient.

:::tip[Wskazówka]
Wracaj do tego słownika za każdym razem, gdy natkniesz się na nieznany termin w kursie lub w artykule o AI. Jeśli szukasz konkretnego pojęcia, skorzystaj z wyszukiwarki w górnej części strony - przeszuka nie tylko ten słownik, ale cały przewodnik, więc od razu zobaczysz, w których rozdziałach dany termin się pojawia.
:::
