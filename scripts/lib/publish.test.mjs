/**
 * Testy transformacji publikacyjnych (scripts/publish.mjs).
 *
 * Te funkcje przepisuja tresc, ktora idzie na produkcje - blad tutaj to
 * publiczna strona z martwym odnosnikiem albo ze zdaniem zapowiadajacym
 * lekcje, ktorej nie ma. Kazda transformacja ma wiec test na oba przypadki:
 * strona wycieta (transformuj) i strona publikowana (zostaw w spokoju).
 *
 * Uruchomienie: npm run test:publish
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	czytajSekcje,
	dodajRamkeGotowe,
	listaGotowych,
	odlinkujOdnosniki,
	odmianaLekcji,
	oznaczPusteWTabeli,
	plikNaUrl,
	podmienKarty,
	podmienNastepnyKrok,
	transformuj,
	ukryjOdeslania,
	urlSekcji,
	usunMartweWiecej,
	zbierzPliki,
} from '../publish.mjs';

const WYCIETE = new Set(['/podstawy/wstep/', '/podstawy/ograniczenia/']);
const czyWyciety = (url) => WYCIETE.has(url.split('#')[0].split('?')[0]);

test('plikNaUrl mapuje sciezki na adresy z ukosnikiem koncowym', () => {
	assert.equal(plikNaUrl('podstawy/wstep.mdx'), '/podstawy/wstep/');
	assert.equal(plikNaUrl('podstawy/index.mdx'), '/podstawy/');
	assert.equal(plikNaUrl('index.mdx'), '/');
	assert.equal(plikNaUrl('newsletter/blad.md'), '/newsletter/blad/');
});

test('urlSekcji sprowadza adres artykulu do strony zbiorczej', () => {
	assert.equal(urlSekcji('/podstawy/wstep/'), '/podstawy/');
	assert.equal(urlSekcji('/podstawy/'), '/podstawy/');
	assert.equal(urlSekcji('/'), '/');
});

test('odlinkujOdnosniki zostawia sam tekst dla stron wycietych', () => {
	const wejscie = 'Wracamy do [ograniczeń](/podstawy/ograniczenia/) i do [etyki](/etyka/etyczne-aspekty/).';
	assert.equal(
		odlinkujOdnosniki(wejscie, czyWyciety),
		'Wracamy do ograniczeń i do [etyki](/etyka/etyczne-aspekty/).',
	);
});

test('odlinkujOdnosniki nie rusza adresow zewnetrznych', () => {
	const wejscie = 'Zobacz [raport](https://example.com/podstawy/wstep/).';
	assert.equal(odlinkujOdnosniki(wejscie, czyWyciety), wejscie);
});

test('odlinkujOdnosniki radzi sobie z kotwica i parametrem', () => {
	assert.equal(
		odlinkujOdnosniki('Patrz [SIFT](/podstawy/wstep/#sift).', czyWyciety),
		'Patrz SIFT.',
	);
});

test('podmienNastepnyKrok kieruje do strony sekcji, gdy lekcja jest wycieta', () => {
	const wejscie =
		'**Następny krok:** [Wstęp do kursu](/podstawy/wstep/) - mapa ośmiu sekcji i pierwszy prompt.';
	const wynik = podmienNastepnyKrok(wejscie, czyWyciety);
	assert.match(wynik, /jest w przygotowaniu/);
	assert.match(wynik, /\[przeglądu sekcji\]\(\/podstawy\/\)/);
	assert.doesNotMatch(wynik, /\/podstawy\/wstep\//);
});

test('podmienNastepnyKrok nie rusza lekcji publikowanej', () => {
	const wejscie = '**Następny krok:** [Etyka](/etyka/etyczne-aspekty/) - co wolno, a czego nie.';
	assert.equal(podmienNastepnyKrok(wejscie, czyWyciety), wejscie);
});

test('podmienNastepnyKrok podmienia "Zacznij tutaj" z wycietym celem i zachowuje etykiete', () => {
	const wejscie =
		'**Zacznij tutaj:** [Wstęp do kursu AI](/podstawy/wstep/) - poznasz strukturę przewodnika.';
	const wynik = podmienNastepnyKrok(wejscie, czyWyciety, '/etyka/');
	assert.match(wynik, /^\*\*Zacznij tutaj:\*\* lekcja "Wstęp do kursu AI" jest w przygotowaniu/);
	assert.doesNotMatch(wynik, /\/podstawy\/wstep\//);
	assert.doesNotMatch(wynik, /poznasz strukturę/);
});

test('podmienNastepnyKrok nie rusza "Zacznij tutaj" z publikowanym celem', () => {
	const wejscie =
		'**Zacznij tutaj:** [Etyka i prawo](/etyka/etyczne-aspekty/) - kto ponosi odpowiedzialność.';
	assert.equal(podmienNastepnyKrok(wejscie, czyWyciety, '/etyka/'), wejscie);
});

test('podmienNastepnyKrok na stronie zbiorczej nie odsyla do niej samej', () => {
	const wejscie =
		'**Zacznij tutaj:** [Wstęp do kursu AI](/podstawy/wstep/) - poznasz strukturę przewodnika.';
	const wynik = podmienNastepnyKrok(wejscie, czyWyciety, '/podstawy/');
	assert.equal(
		wynik,
		'**Zacznij tutaj:** pierwsza lekcja tej sekcji jest w przygotowaniu - na [stronie głównej](/) zobaczysz, co jest gotowe dziś.',
	);
	assert.doesNotMatch(wynik, /\(\/podstawy\/\)/);
});

test('transformuj przekazuje adres strony do podmiany "Zacznij tutaj"', () => {
	const wejscie = '**Zacznij tutaj:** [Wstęp do kursu AI](/podstawy/wstep/) - opis.';
	const wynik = transformuj(wejscie, czyWyciety, { url: '/podstawy/' });
	assert.match(wynik, /\[stronie głównej\]\(\/\)/);
	assert.doesNotMatch(wynik, /przeglądu sekcji/);
});

test('podmienKarty zamienia LinkCard na Card i dopisuje import', () => {
	const wejscie = [
		"import { CardGrid, LinkCard } from '@astrojs/starlight/components';",
		'',
		'<CardGrid>',
		'\t<LinkCard',
		'\t\ttitle="Wstęp do kursu AI"',
		'\t\tdescription="Mapa ośmiu sekcji."',
		'\t\thref="/podstawy/wstep/"',
		'\t/>',
		'</CardGrid>',
	].join('\n');

	const wynik = podmienKarty(wejscie, czyWyciety);
	assert.match(wynik, /import \{ CardGrid, LinkCard, Card \}/);
	assert.match(wynik, /<Card title="Wstęp do kursu AI">/);
	assert.match(wynik, /w przygotowaniu/);
	assert.doesNotMatch(wynik, /href="\/podstawy\/wstep\/"/);
});

test('podmienKarty zostawia karte do strony publikowanej bez zmian', () => {
	const wejscie = [
		"import { CardGrid, LinkCard } from '@astrojs/starlight/components';",
		'<LinkCard title="Etyka" description="Co wolno." href="/etyka/etyczne-aspekty/" />',
	].join('\n');
	assert.equal(podmienKarty(wejscie, czyWyciety), wejscie);
});

test('transformuj zachowuje kolejnosc: Nastepny krok przed odlinkowaniem', () => {
	// Gdyby odlinkowanie poszlo pierwsze, zostaloby zdanie "Nastepny krok:
	// Wstep do kursu - mapa osmiu sekcji", czyli zapowiedz lekcji, ktorej
	// na stronie nie ma. To najgrozniejszy blad tej kolejnosci.
	const wejscie = '**Następny krok:** [Wstęp do kursu](/podstawy/wstep/) - mapa ośmiu sekcji.';
	const wynik = transformuj(wejscie, czyWyciety);
	assert.match(wynik, /jest w przygotowaniu/);
	assert.doesNotMatch(wynik, /mapa ośmiu sekcji/);
});

test('transformuj nie zmienia tresci bez odnosnikow do wycietych stron', () => {
	const wejscie = 'Zwykły akapit z [odnośnikiem](/etyka/etyczne-aspekty/) i **pogrubieniem**.';
	assert.equal(transformuj(wejscie, czyWyciety), wejscie);
});

test('usunMartweWiecej kasuje wiersz, gdy jedyny odnosnik jest wyciety', () => {
	const wejscie = 'Tekst hasla.\n\n**Więcej:** [Wstęp](/podstawy/wstep/)\n\n## Kolejne haslo\n';
	assert.equal(usunMartweWiecej(wejscie, czyWyciety), 'Tekst hasla.\n\n## Kolejne haslo\n');
});

test('usunMartweWiecej zostawia wiersz z odnosnikiem do strony publikowanej', () => {
	const wejscie = '**Więcej:** [Chatboty](/narzedzia/chatboty/)\n';
	assert.equal(usunMartweWiecej(wejscie, czyWyciety), wejscie);
});

test('usunMartweWiecej zostawia wiersz, gdy choc jeden odnosnik zyje', () => {
	const wejscie = '**Więcej:** [Wstęp](/podstawy/wstep/) i [Chatboty](/narzedzia/chatboty/)\n';
	assert.equal(usunMartweWiecej(wejscie, czyWyciety), wejscie);
});

test('usunMartweWiecej nie rusza wiersza bez odnosnikow', () => {
	const wejscie = '**Więcej:** zajrzyj do sekcji obok\n';
	assert.equal(usunMartweWiecej(wejscie, czyWyciety), wejscie);
});

test('usunMartweWiecej nie rusza zwyklego akapitu z odnosnikiem do wycietej strony', () => {
	const wejscie = 'Zobacz [Wstęp](/podstawy/wstep/) po szczegóły.\n';
	assert.equal(usunMartweWiecej(wejscie, czyWyciety), wejscie);
});

test('transformuj kasuje martwe Wiecej, ale zostawia zywe', () => {
	const wejscie = [
		'## Agent AI',
		'',
		'Definicja.',
		'',
		'**Więcej:** [Wstęp](/podstawy/wstep/)',
		'',
		'## Chatbot',
		'',
		'Definicja.',
		'',
		'**Więcej:** [Chatboty](/narzedzia/chatboty/)',
		'',
	].join('\n');
	const wynik = transformuj(wejscie, czyWyciety);
	assert.ok(!wynik.includes('**Więcej:** Wstęp'), 'martwy wiersz powinien zniknac');
	assert.ok(wynik.includes('**Więcej:** [Chatboty](/narzedzia/chatboty/)'), 'zywy wiersz zostaje');
	assert.ok(wynik.includes('## Agent AI'), 'naglowek nietkniety');
});

test('zbierzPliki pomija dependabot.yml, ale zostawia workflow i reszte .github', () => {
	const { tresc, pozostale } = zbierzPliki([
		'.github/dependabot.yml',
		'.github/workflows/lint.yml',
		'.github/workflows/dependencies.yml',
		'.github/CODEOWNERS',
		'package.json',
		'src/content/docs/podstawy/wstep.md',
	]);
	const wszystkie = [...tresc, ...pozostale];
	assert.ok(!wszystkie.includes('.github/dependabot.yml'));
	assert.ok(pozostale.includes('.github/workflows/lint.yml'));
	assert.ok(pozostale.includes('.github/workflows/dependencies.yml'));
	assert.ok(pozostale.includes('.github/CODEOWNERS'));
	assert.ok(pozostale.includes('package.json'));
	assert.deepEqual(tresc, ['src/content/docs/podstawy/wstep.md']);
});

// ---------------------------------------------------------------------------
// Droga czytelnika wersji publicznej (Z37: D01 = A z dopiskiem B, D03 = B)
// ---------------------------------------------------------------------------

const GOTOWE = [
	{ url: '/podstawy/', nazwa: 'Podstawy', dostepne: 8, wszystkie: 8, dopisek: 'dla początkujących' },
	{
		url: '/claude-code/',
		nazwa: 'Claude Code',
		dostepne: 21,
		wszystkie: 21,
		dopisek: 'poziom średni, wymaga terminala',
	},
];
const STAN = {
	pusteSekcje: new Set(['/jak-dziala-ai/', '/etyka/', '/sciezki/']),
	gotowe: GOTOWE,
	nazwySekcji: new Map([
		['/podstawy/', 'Podstawy'],
		['/jak-dziala-ai/', 'Jak działa AI'],
		['/etyka/', 'Etyka i bezpieczeństwo'],
		['/claude-code/', 'Claude Code'],
	]),
};
// W tym zestawie wyciete sa lekcje pustych sekcji; slownik i biblioteka zyja.
const WYCIETE_D01 = new Set(['/jak-dziala-ai/ai-ml-sieci-neuronowe/', '/etyka/etyczne-aspekty/']);
const czyWycietyD01 = (url) => WYCIETE_D01.has(url.split('#')[0].split('?')[0]);

test('czytajSekcje odczytuje liste z sections.ts w kolejnosci', () => {
	const zrodlo = [
		'export const SECTIONS: ReadonlyArray<Section> = [',
		"\t{ slug: 'podstawy', label: 'Podstawy' },",
		"\t{ slug: 'jak-dziala-ai', label: 'Jak działa AI' },",
		'];',
	].join('\r\n');
	assert.deepEqual(czytajSekcje(zrodlo), [
		{ slug: 'podstawy', label: 'Podstawy' },
		{ slug: 'jak-dziala-ai', label: 'Jak działa AI' },
	]);
});

test('odmianaLekcji odmienia po polsku', () => {
	assert.equal(odmianaLekcji(1), 'lekcja');
	assert.equal(odmianaLekcji(4), 'lekcje');
	assert.equal(odmianaLekcji(8), 'lekcji');
	assert.equal(odmianaLekcji(13), 'lekcji');
	assert.equal(odmianaLekcji(21), 'lekcji');
	assert.equal(odmianaLekcji(22), 'lekcje');
});

test('listaGotowych podaje liczbe lekcji, dopisek poziomu i czesciowa gotowosc', () => {
	assert.equal(
		listaGotowych(GOTOWE),
		'[Podstawy](/podstawy/) (8 lekcji, dla początkujących) i [Claude Code](/claude-code/) (21 lekcji, poziom średni, wymaga terminala)',
	);
	assert.equal(
		listaGotowych([{ url: '/etyka/', nazwa: 'Etyka', dostepne: 1, wszystkie: 4, dopisek: null }]),
		'[Etyka](/etyka/) (1 z 4 lekcje)',
	);
});

test('Nastepny krok do pustej sekcji dostaje tekst zastepczy bez powrotu do biezacej sekcji', () => {
	const wejscie =
		'**Następny krok:** [Jak działa AI](/jak-dziala-ai/) - skoro umiesz sprawdzić wynik, warto zobaczyć, skąd się bierze.';
	const wynik = podmienNastepnyKrok(wejscie, czyWycietyD01, '/podstawy/weryfikacja-informacji/', STAN);
	assert.equal(
		wynik,
		'**Następny krok:** sekcja "Jak działa AI" jest w przebudowie. Do tego czasu sprawdź [słownik pojęć](/zasoby/slownik-pojec/) albo [bibliotekę zasobów](/zasoby/biblioteka/). Dziś możesz też przejść do: [Claude Code](/claude-code/) (21 lekcji, poziom średni, wymaga terminala).',
	);
	assert.doesNotMatch(wynik, /\(\/jak-dziala-ai\/\)/);
	assert.doesNotMatch(wynik, /\(\/podstawy\/\)/);
});

test('Zacznij tutaj na stronie zbiorczej pustej sekcji wskazuje sekcje gotowe dzis', () => {
	const wejscie =
		'**Zacznij tutaj:** [AI, ML, sieci neuronowe](/jak-dziala-ai/ai-ml-sieci-neuronowe/) - uporządkujesz trzy pojęcia.';
	const wynik = transformuj(wejscie, czyWycietyD01, { url: '/jak-dziala-ai/', stan: STAN });
	assert.equal(
		wynik,
		'**Zacznij tutaj:** lekcje tej sekcji wracają po przeglądzie. Dziś możesz czytać: [Podstawy](/podstawy/) (8 lekcji, dla początkujących) i [Claude Code](/claude-code/) (21 lekcji, poziom średni, wymaga terminala). Trudne słowa wyjaśnia [słownik pojęć](/zasoby/slownik-pojec/).',
	);
	assert.doesNotMatch(wynik, /uporządkujesz/);
	assert.doesNotMatch(wynik, /AI, ML, sieci neuronowe/);
});

test('Zacznij tutaj zachowuje CRLF na koncu wiersza', () => {
	const wejscie = ':::note[Następny krok]\r\n**Zacznij tutaj:** [Etyka i prawo](/etyka/etyczne-aspekty/) - opis.\r\n:::\r\n';
	const wynik = transformuj(wejscie, czyWycietyD01, { url: '/etyka/', stan: STAN });
	assert.match(wynik, /Trudne słowa wyjaśnia \[słownik pojęć\]\(\/zasoby\/slownik-pojec\/\)\.\r\n:::\r\n$/);
});

test('Nastepny krok do sekcji z lekcjami zostaje bez zmian mimo stanu', () => {
	const wejscie = '**Następny krok:** [Claude Code](/claude-code/) - agent w terminalu.';
	assert.equal(podmienNastepnyKrok(wejscie, czyWycietyD01, '/podstawy/wstep/', STAN), wejscie);
});

test('dodajRamkeGotowe wstawia ramke nad "Program kursu"', () => {
	const wejscie = 'Wstęp.\r\n\r\n## Program kursu\r\n\r\nKarty.\r\n';
	const wynik = dodajRamkeGotowe(wejscie, GOTOWE);
	assert.match(wynik, /^Wstęp\.\r\n\r\n:::note\[Co jest gotowe dziś\]\r\n/);
	assert.match(wynik, /Dziś możesz czytać: \[Podstawy\]\(\/podstawy\/\) \(8 lekcji, dla początkujących\)/);
	assert.match(wynik, /:::\r\n\r\n## Program kursu\r\n/);
});

test('dodajRamkeGotowe bez naglowka albo bez gotowych sekcji nic nie zmienia', () => {
	assert.equal(dodajRamkeGotowe('## Inny naglowek\n', GOTOWE), '## Inny naglowek\n');
	assert.equal(dodajRamkeGotowe('## Program kursu\n', []), '## Program kursu\n');
});

test('transformuj dodaje ramke tylko na stronie glownej', () => {
	const wejscie = '## Program kursu\n';
	assert.match(transformuj(wejscie, czyWycietyD01, { url: '/', stan: STAN }), /Co jest gotowe dziś/);
	assert.equal(transformuj(wejscie, czyWycietyD01, { url: '/podstawy/wstep/', stan: STAN }), wejscie);
});

test('oznaczPusteWTabeli zamienia liczbe lekcji pustej sekcji na "w przebudowie"', () => {
	const wejscie = [
		'| 1 | [Podstawy](/podstawy/) - 8 lekcji | Czym jest AI |',
		'| 2 | [Jak działa AI](/jak-dziala-ai/) - 13 lekcji | Tokeny |',
		'| 7 | [Etyka i bezpieczeństwo](/etyka/) - 4 lekcje | Dane |',
		'Zwykłe zdanie o [Jak działa AI](/jak-dziala-ai/) - 13 lekcji poza tabelą.',
	].join('\r\n');
	const wynik = oznaczPusteWTabeli(wejscie, STAN.pusteSekcje).split('\r\n');
	assert.equal(wynik[0], '| 1 | [Podstawy](/podstawy/) - 8 lekcji | Czym jest AI |');
	assert.equal(wynik[1], '| 2 | [Jak działa AI](/jak-dziala-ai/) - w przebudowie | Tokeny |');
	assert.equal(wynik[2], '| 7 | [Etyka i bezpieczeństwo](/etyka/) - w przebudowie | Dane |');
	assert.equal(wynik[3], 'Zwykłe zdanie o [Jak działa AI](/jak-dziala-ai/) - 13 lekcji poza tabelą.');
});

const HERO = [
	'---',
	'title: Przewodnik AI',
	'hero:',
	'  actions:',
	'    - text: Zacznij naukę',
	'      link: /podstawy/wstep/',
	'      icon: right-arrow',
	'    - text: Wybierz swoją ścieżkę',
	'      link: /sciezki/',
	'      icon: forward-slash',
	'      variant: secondary',
	'    - text: Zgłoś uwagę',
	'      link: https://example.com/issues/',
	'      variant: minimal',
	'status: zastane',
	'---',
	'',
	'Treść.',
	'',
].join('\r\n');

test('ukryjOdeslania usuwa przycisk hero do ukrytego adresu, reszte zostawia', () => {
	const wynik = ukryjOdeslania(HERO, new Set(['/sciezki/']));
	assert.doesNotMatch(wynik, /Wybierz swoją ścieżkę/);
	assert.doesNotMatch(wynik, /link: \/sciezki\//);
	assert.match(wynik, /    - text: Zacznij naukę\r\n      link: \/podstawy\/wstep\/\r\n      icon: right-arrow\r\n    - text: Zgłoś uwagę\r\n/);
	assert.match(wynik, /      variant: minimal\r\nstatus: zastane\r\n---\r\n/);
});

test('ukryjOdeslania usuwa pozycje listy do ukrytego adresu', () => {
	const wejscie = [
		'- [Wstęp do kursu](/podstawy/wstep/) - jeśli zaczynasz od zera',
		'- [Wybierz ścieżkę pod siebie](/sciezki/) - jeśli wolisz materiał ułożony pod Twoją rolę',
		'- [Program kursu](/) - jeśli chcesz najpierw zobaczyć całość',
		'',
		'Zdanie z [odnośnikiem](/sciezki/) w środku zostaje.',
	].join('\r\n');
	const wynik = ukryjOdeslania(wejscie, new Set(['/sciezki/']));
	assert.equal(
		wynik,
		[
			'- [Wstęp do kursu](/podstawy/wstep/) - jeśli zaczynasz od zera',
			'- [Program kursu](/) - jeśli chcesz najpierw zobaczyć całość',
			'',
			'Zdanie z [odnośnikiem](/sciezki/) w środku zostaje.',
		].join('\r\n'),
	);
});

test('transformuj chowa sciezki tylko, gdy sekcja sciezek jest pusta', () => {
	const pusta = transformuj(HERO, czyWycietyD01, { url: '/', stan: STAN });
	assert.doesNotMatch(pusta, /Wybierz swoją ścieżkę/);

	const zSciezka = { ...STAN, pusteSekcje: new Set(['/jak-dziala-ai/']) };
	const pelna = transformuj(HERO, czyWycietyD01, { url: '/', stan: zSciezka });
	assert.match(pelna, /Wybierz swoją ścieżkę/);
});

test('transformuj bez stanu nie dotyka przycisku ani tabeli', () => {
	assert.equal(transformuj(HERO, czyWycietyD01), HERO);
});
