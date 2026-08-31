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
	odlinkujOdnosniki,
	plikNaUrl,
	podmienKarty,
	podmienNastepnyKrok,
	transformuj,
	urlSekcji,
	usunMartweWiecej,
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
