#!/usr/bin/env node
/**
 * Publikacja do publicznego repozytorium.
 *
 * Zrodlo prawdy (GitLab) zawiera cala tresc. Publiczne repo (GitHub) dostaje
 * wylacznie strony o statusie `zastane` albo `gotowe`. Strony `szkic` sa
 * wycinane, a skrypt naprawia wszystkie slady po nich, zeby publiczna wersja
 * nie miala martwych odnosnikow:
 *
 *   1. odnosnik do wycietej strony -> sam tekst (zdanie zostaje sensowne),
 *   2. blok "Nastepny krok" do wycietej strony -> odeslanie do strony sekcji,
 *   3. <LinkCard> do wycietej strony -> <Card> z dopiskiem "w przygotowaniu",
 *   4. adres wycietej strony -> regula 302 na strone zbiorcza sekcji.
 *
 * Do tego droga czytelnika, dopoki czesc sekcji jest pusta (D01, D03):
 *
 *   5. strona glowna dostaje ramke "Co jest gotowe dzis" nad programem kursu,
 *   6. "Nastepny krok" do pustej sekcji -> tekst zastepczy z lista sekcji
 *      gotowych dzis (generowana ze stanu, nie wpisana na sztywno),
 *   7. liczba lekcji pustej sekcji w tabeli -> "w przebudowie",
 *   8. przycisk i pozycja listy prowadzace na puste sciezki nauki znikaja.
 *
 * Regula 302, nie 301 i nie 410: adres wroci po przegladzie redakcyjnym.
 * 301 kazalby wyszukiwarce zapomniec URL na stale.
 *
 * Uzycie:
 *   node scripts/publish.mjs            - przygotuj i zweryfikuj, bez pushu
 *   node scripts/publish.mjs --push     - to samo plus commit i push na GitHub
 *   node scripts/publish.mjs --bez-buildu - pomin build (szybki podglad zmian)
 */

import { execFileSync } from 'node:child_process';
import {
	cpSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KORZEN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KATALOG_PUBLIKACJI = join(KORZEN, '.publish');
// Publiczne repozytorium - cel publikacji. Zrodlo prawdy (GitLab) jest
// remote'em `origin` glownego repo i z tym adresem nie ma nic wspolnego.
const REPO_PUBLICZNE = 'https://github.com/lukaszpodgorski-pl/przewodnikai_pl.git';
const KATALOG_TRESCI = 'src/content/docs';
// Lista sekcji kursu w kolejnosci sciezki nauki - ta sama, z ktorej idzie menu.
const PLIK_SEKCJI = 'src/config/sections.ts';
// Zrodlo stalych regul 301 (stare plaskie adresy). Edytowane recznie.
// Skrypt dopisuje do kopii w .publish/ sekcje regul 302 dla stron wycietych -
// oryginal w repo pozostaje nietkniety.
const REDIRECTS = 'public/_redirects';

/** Statusy dopuszczone do publicznego repozytorium. */
const PUBLIKOWANE = new Set(['zastane', 'gotowe']);

/**
 * Strony publikowane zawsze, niezaleznie od `status`. To nie jest decyzja
 * redakcyjna, tylko koniecznosc techniczna - patrz komentarze przy kazdej.
 */
const ZAWSZE_PUBLIKUJ = new Set([
	// Strona glowna - punkt wejscia serwisu.
	'index.mdx',
	// Strony pomocnicze newslettera: cele przekierowan z Sendy. Ich brak psuje
	// potwierdzanie zapisu, a nie sa indeksowane, wiec nic nie ujawniaja.
	...[
		'blad',
		'brak-zgody',
		'juz-zapisany',
		'potwierdzone',
		'sprawdz-skrzynke',
		'wypisano',
		'zgoda-potwierdzona',
	].map((s) => `newsletter/${s}.md`),
]);

/**
 * Pliki ze zrodla prawdy, ktore NIE trafiaja do publicznego repozytorium.
 * Sciezki wzgledem korzenia repo, dokladnie tak, jak wypisuje je `git ls-files`.
 */
const WYKLUCZONE_Z_PUBLIKACJI = new Set([
	// Dependabot w lustrze otwieralby PR-y, ktore kolejna publikacja i tak
	// cofa (package.json i package-lock.json zawsze przychodza ze zrodla).
	// Zaleznosci aktualizujemy w zrodle. Decyzja wlasciciela 2026-11-09.
	'.github/dependabot.yml',
]);

/**
 * Sekcje, ktore nie sa czescia kursu - nie trafiaja na liste "gotowe dzis",
 * choc sa publikowane (Zasoby to slownik, biblioteka i kontakt, nie lekcje).
 */
const SEKCJE_POZA_KURSEM = new Set(['zasoby']);

/**
 * Dopisek przy sekcji na liscie "gotowe dzis". Decyzja D01 = A z dopiskiem B:
 * czytelnik, ktory konczy Podstawy, musi wiedziec, ze Claude Code to inny
 * poziom i praca w terminalu, zanim tam kliknie.
 */
const DOPISEK_SEKCJI = {
	podstawy: 'dla początkujących',
	'claude-code': 'poziom średni, wymaga terminala',
};

/**
 * Adresy, do ktorych odeslania (przycisk na stronie glownej, pozycja listy)
 * znikaja z publikacji, dopoki sekcja pod tym adresem jest pusta. Decyzja D03
 * = B: sciezki nauki chowamy do czasu ich przegladu (Z14.8). Zrodlo zostaje
 * nietkniete - gdy pierwsza sciezka dostanie status `gotowe`, przycisk wraca
 * sam.
 */
const UKRYJ_ODESLANIA_DO_PUSTYCH = new Set(['/sciezki/']);

const flagi = new Set(process.argv.slice(2));
const CZY_PUSH = flagi.has('--push');
const CZY_BUILD = !flagi.has('--bez-buildu');

function git(args, opcje = {}) {
	return execFileSync('git', args, {
		cwd: opcje.cwd ?? KORZEN,
		encoding: 'utf8',
		stdio: opcje.cisza ? ['ignore', 'pipe', 'ignore'] : ['ignore', 'pipe', 'pipe'],
	}).trim();
}

function przerwij(komunikat) {
	console.error(`\n  BLAD: ${komunikat}\n`);
	process.exit(1);
}

/** `src/content/docs/podstawy/wstep.mdx` -> `/podstawy/wstep/` */
function plikNaUrl(sciezkaWzgledemTresci) {
	const bezRozszerzenia = sciezkaWzgledemTresci.replace(/\.mdx?$/, '');
	if (bezRozszerzenia === 'index') return '/';
	const bezIndeksu = bezRozszerzenia.replace(/\/index$/, '');
	return `/${bezIndeksu}/`;
}

/** `/podstawy/wstep/` -> `/podstawy/` (strona zbiorcza sekcji) */
function urlSekcji(url) {
	const czesci = url.split('/').filter(Boolean);
	return czesci.length > 1 ? `/${czesci[0]}/` : url;
}

function czytajStatus(tresc) {
	const dopasowanie = tresc.match(/^status:\s*(\S+)\s*$/m);
	return dopasowanie ? dopasowanie[1] : 'szkic';
}

/** `{ slug: 'podstawy', label: 'Podstawy' }` z sections.ts -> [{ slug, label }] */
function czytajSekcje(zrodlo) {
	return [...zrodlo.matchAll(/\{\s*slug:\s*'([^']+)',\s*label:\s*'([^']+)'\s*\}/g)].map(
		([, slug, label]) => ({ slug, label }),
	);
}

function czytajTytul(tresc) {
	const dopasowanie = tresc.match(/^title:\s*(.+?)\s*$/m);
	if (!dopasowanie) return null;
	return dopasowanie[1].replace(/^["']|["']$/g, '');
}

// ---------------------------------------------------------------------------
// Transformacje tresci
// ---------------------------------------------------------------------------

/**
 * Zamienia caly blok <LinkCard ... href="<wyciety>" ... /> na <Card>.
 * LinkCard jest w zrodle wieloliniowy i wciety tabulatorami, wiec dopasowanie
 * idzie leniwie do zamykajacego `/>`.
 */
function podmienKarty(tresc, czyWyciety) {
	let uzytoCard = false;
	const wynik = tresc.replace(
		/<LinkCard\b[\s\S]*?\/>/g,
		(blok) => {
			const href = blok.match(/href=["']([^"']+)["']/);
			if (!href || !czyWyciety(href[1])) return blok;

			const tytul = blok.match(/title=["']([^"']*)["']/);
			const opis = blok.match(/description=["']([^"']*)["']/);
			uzytoCard = true;
			const t = tytul ? tytul[1] : 'Artykul';
			const o = opis ? `${opis[1]} ` : '';
			return `<Card title="${t}">\n\t\t${o}(w przygotowaniu)\n\t</Card>`;
		},
	);

	if (!uzytoCard) return wynik;
	// Import: Card musi byc dostepny obok CardGrid/LinkCard.
	return wynik.replace(
		/import\s*\{([^}]*)\}\s*from\s*(['"])@astrojs\/starlight\/components\2;/,
		(calosc, nazwy, cudzyslow) => {
			if (/\bCard\b(?!Grid)/.test(nazwy)) return calosc;
			const lista = `${nazwy.trim().replace(/,$/, '')}, Card`;
			return `import { ${lista} } from ${cudzyslow}@astrojs/starlight/components${cudzyslow};`;
		},
	);
}

/** 1 lekcja, 2-4 lekcje, 5-21 lekcji, 22-24 lekcje, 12-14 lekcji. */
function odmianaLekcji(n) {
	if (n === 1) return 'lekcja';
	const jednosci = n % 10;
	const dziesiatki = n % 100;
	if (jednosci >= 2 && jednosci <= 4 && (dziesiatki < 12 || dziesiatki > 14)) return 'lekcje';
	return 'lekcji';
}

/**
 * "[Podstawy](/podstawy/) (8 lekcji, dla poczatkujacych) i [Claude Code](...)
 * (21 lekcji, poziom sredni, wymaga terminala)". Sekcja czesciowo gotowa
 * dostaje "3 z 10 lekcji" - lista nie obiecuje wiecej, niz da sie przeczytac.
 */
function listaGotowych(gotowe) {
	const pozycje = gotowe.map(({ url, nazwa, dostepne, wszystkie, dopisek }) => {
		const liczba =
			dostepne === wszystkie
				? `${dostepne} ${odmianaLekcji(dostepne)}`
				: `${dostepne} z ${wszystkie} ${odmianaLekcji(wszystkie)}`;
		return `[${nazwa}](${url}) (${dopisek ? `${liczba}, ${dopisek}` : liczba})`;
	});
	if (pozycje.length <= 1) return pozycje.join('');
	return `${pozycje.slice(0, -1).join(', ')} i ${pozycje[pozycje.length - 1]}`;
}

/**
 * "Nastepny krok" prowadzacy do wycietej strony. Bez tego lancuch nauki
 * urywa sie w prozni albo - po transformacji odnosnikow - zostaje zdanie
 * zapowiadajace lekcje, ktorej nie ma.
 *
 * Lapie oba warianty: "**Nastepny krok:**" w artykulach i "**Zacznij tutaj:**"
 * na stronach zbiorczych; etykieta z dopasowania zostaje w wyniku.
 *
 * `urlStrony` to adres przetwarzanej strony. `stan` (opcjonalny) to wiedza
 * o calej publikacji: `pusteSekcje` (Set adresow stron zbiorczych bez
 * dostepnej lekcji), `gotowe` (sekcje kursu z dostepnymi lekcjami, w kolejnosci
 * sciezki), `nazwySekcji` (Map adres -> nazwa z menu).
 *
 * Cel w pustej sekcji (sama strona zbiorcza albo lekcja w niej) to slepa
 * uliczka, nawet jesli strona zbiorcza jest publikowana - tam czeka tylko
 * ramka "w przebudowie". Wtedy idzie tekst zastepczy wg D01 = A:
 *   - na stronie zbiorczej tej pustej sekcji: lista sekcji gotowych dzis,
 *   - gdzie indziej: slownik albo biblioteka, plus sekcje gotowe poza
 *     biezaca (czytelnik konczacy Podstawy nie dostaje Podstaw jeszcze raz).
 */
function podmienNastepnyKrok(tresc, czyWyciety, urlStrony = null, stan = null) {
	return tresc.replace(
		/\*\*(Następny krok|Zacznij tutaj):\*\*\s*\[([^\]]+)\]\(([^)]+)\)[^\r\n]*/g,
		(calosc, naglowek, etykieta, url) => {
			const sekcja = urlSekcji(url.split('#')[0].split('?')[0]);

			if (stan?.pusteSekcje?.has(sekcja)) {
				const gotowe = stan.gotowe ?? [];
				const slownik = czyWyciety('/zasoby/slownik-pojec/')
					? null
					: '[słownik pojęć](/zasoby/slownik-pojec/)';
				const biblioteka = czyWyciety('/zasoby/biblioteka/')
					? null
					: '[bibliotekę zasobów](/zasoby/biblioteka/)';

				if (urlStrony && sekcja === urlStrony) {
					const czytaj = gotowe.length ? ` Dziś możesz czytać: ${listaGotowych(gotowe)}.` : '';
					const trudne = slownik ? ` Trudne słowa wyjaśnia ${slownik}.` : '';
					return `**${naglowek}:** lekcje tej sekcji wracają po przeglądzie.${czytaj}${trudne}`;
				}

				const nazwa = stan.nazwySekcji?.get(sekcja);
				const opis = nazwa ? `sekcja "${nazwa}" jest w przebudowie` : 'ta sekcja jest w przebudowie';
				const zasoby = [slownik, biblioteka].filter(Boolean);
				const sprawdz = zasoby.length ? ` Do tego czasu sprawdź ${zasoby.join(' albo ')}.` : '';
				const biezaca = urlStrony ? urlSekcji(urlStrony) : null;
				const inne = gotowe.filter((g) => g.url !== biezaca);
				const dalej = inne.length ? ` Dziś możesz też przejść do: ${listaGotowych(inne)}.` : '';
				return `**${naglowek}:** ${opis}.${sprawdz}${dalej}`;
			}

			if (!czyWyciety(url)) return calosc;
			if (urlStrony && sekcja === urlStrony) {
				return `**${naglowek}:** pierwsza lekcja tej sekcji jest w przygotowaniu - na [stronie głównej](/) zobaczysz, co jest gotowe dziś.`;
			}
			return `**${naglowek}:** lekcja "${etykieta}" jest w przygotowaniu - wróć do [przeglądu sekcji](${sekcja}), żeby zobaczyć, co już jest gotowe.`;
		},
	);
}

/**
 * Wiersz "**Wiecej:**", w ktorym KAZDY odnosnik prowadzi do wycietej strony,
 * znika w calosci razem z pustym wierszem po nim.
 *
 * Powod: samo odlinkowanie zostawia "**Wiecej:** Agenci AI" - napis, ktory
 * wyglada jak odnosnik, ale nigdzie nie prowadzi. Przy dwoch takich wierszach
 * na stronie to nie przeszkadza; w slowniku pojec, gdzie odnosnik stoi przy
 * niemal kazdym hasle, czytelnik dostaje 35 martwych obietnic pod rzad.
 *
 * Wiersz z choc jednym zywym odnosnikiem zostaje - tam odlinkowanie wystarczy.
 * Musi isc PRZED odlinkujOdnosniki, bo potem nie ma juz z czego odczytac URL-i.
 */
function usunMartweWiecej(tresc, czyWyciety) {
	return tresc.replace(/^\*\*Więcej:\*\*[^\n]*(\r?\n)?(\r?\n)?/gm, (calosc) => {
		const odnosniki = [...calosc.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)];
		if (!odnosniki.length) return calosc;
		const wszystkieWyciete = odnosniki.every(([, url]) => czyWyciety(url));
		return wszystkieWyciete ? '' : calosc;
	});
}

/** Odnosnik markdown do wycietej strony -> sam tekst, bez nawiasow. */
function odlinkujOdnosniki(tresc, czyWyciety) {
	return tresc.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (calosc, etykieta, url) =>
		czyWyciety(url) ? etykieta : calosc,
	);
}

/**
 * Zapowiedz na stronie zbiorczej sekcji, w ktorej nie ma ani jednego
 * dostepnego artykulu. Bez tego czytelnik dostaje strone opowiadajaca
 * "osiem lekcji ponizej idzie jedna po drugiej" i liste martwych kart -
 * tekst mowi o czyms, czego na stronie nie ma.
 *
 * Blok idzie po frontmatterze i po imports (MDX wymaga, zeby imports byly
 * przed trescia), na samej gorze widocznej czesci strony.
 */
function dodajZapowiedzSekcji(tresc) {
	const zapowiedz = [
		':::note[Ta sekcja jest w przebudowie]',
		'Przechodzę przez te teksty lekcja po lekcji i poprawiam to, co się nie broni.',
		'Lekcje wracają tutaj pojedynczo, w miarę jak kończę przegląd - pod tymi samymi',
		'adresami co wcześniej. Poniżej lista tego, co się w tej sekcji pojawi.',
		':::',
		'',
		'',
	].join('\n');

	const frontmatter = tresc.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
	if (!frontmatter) return tresc;

	const poFrontmatterze = frontmatter[0].length;
	const reszta = tresc.slice(poFrontmatterze);

	// Za ostatnim importem, jesli jakis jest - inaczej zaraz za frontmatterem.
	const importy = [...reszta.matchAll(/^import\s.+?;\s*$/gm)];
	const offset = importy.length
		? importy[importy.length - 1].index + importy[importy.length - 1][0].length
		: 0;

	const przedzielnik = importy.length ? '\n\n' : '\n';
	return (
		tresc.slice(0, poFrontmatterze + offset) +
		przedzielnik +
		zapowiedz +
		reszta.slice(offset).replace(/^\s*\n/, '')
	);
}

/**
 * Ramka "Co jest gotowe dzis" na stronie glownej, tuz nad "## Program kursu"
 * (S003, D01 = A). Bez niej wszystkie dziewiec kart programu wyglada tak
 * samo i czytelnik nie wie, ktore sekcje da sie dzis czytac.
 *
 * Brak naglowka = tresc bez zmian; main() wykrywa to i przerywa publikacje,
 * zeby ramka nie zniknela po cichu po zmianie naglowka w zrodle.
 */
const NAGLOWEK_PROGRAMU = /^## Program kursu\s*$/m;

function dodajRamkeGotowe(tresc, gotowe) {
	if (!gotowe.length) return tresc;
	const dopasowanie = tresc.match(NAGLOWEK_PROGRAMU);
	if (!dopasowanie) return tresc;
	const nl = tresc.includes('\r\n') ? '\r\n' : '\n';
	const ramka = [
		':::note[Co jest gotowe dziś]',
		`Przechodzę przez przewodnik lekcja po lekcji. Dziś możesz czytać: ${listaGotowych(gotowe)}. Pozostałe sekcje wracają pojedynczo - zapisz się na powiadomienia niżej, a dam Ci znać.`,
		':::',
		'',
		'',
	].join(nl);
	return tresc.slice(0, dopasowanie.index) + ramka + tresc.slice(dopasowanie.index);
}

/**
 * Wiersz tabeli "| 2 | [Jak dziala AI](/jak-dziala-ai/) - 13 lekcji | ..."
 * dla pustej sekcji -> "- w przebudowie" (S005, `wstep`). Liczba obiecuje
 * lekcje, ktorych w publicznej wersji nie ma; po powrocie sekcji wraca sama.
 */
function oznaczPusteWTabeli(tresc, pusteSekcje) {
	return tresc.replace(/^\|[^\r\n]*$/gm, (wiersz) =>
		wiersz.replace(
			/(\[[^\]]+\]\((\/[^/)\s]+\/)\)) - \d+ lekcj[a-z]*/g,
			(calosc, odnosnik, url) => (pusteSekcje.has(url) ? `${odnosnik} - w przebudowie` : calosc),
		),
	);
}

/**
 * Odeslania do ukrytych adresow (D03 = B, S012):
 *   - akcja hero we frontmatterze (`- text: ...` z `link: <adres>`) znika cala,
 *   - pozycja listy zaczynajaca sie od odnosnika pod ten adres znika cala.
 * Odnosnik w srodku zdania zostaje - adres dziala, tylko nie reklamujemy go.
 */
function ukryjOdeslania(tresc, ukryte) {
	if (!ukryte.size) return tresc;

	let wynik = tresc;
	const frontmatter = wynik.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
	if (frontmatter) {
		const linie = frontmatter[0].split(/(?<=\n)/);
		const nowe = [];
		for (let i = 0; i < linie.length; i++) {
			const akcja = linie[i].match(/^(\s*)- text:/);
			if (!akcja) {
				nowe.push(linie[i]);
				continue;
			}
			const wciecie = akcja[1].length;
			let koniec = i + 1;
			while (koniec < linie.length) {
				const wlasne = linie[koniec].match(/^( *)\S/);
				if (!wlasne || wlasne[1].length <= wciecie) break;
				koniec++;
			}
			const blok = linie.slice(i, koniec);
			const link = blok.join('').match(/^\s*link:\s*(\S+)\s*$/m);
			if (!(link && ukryte.has(link[1]))) nowe.push(...blok);
			i = koniec - 1;
		}
		wynik = nowe.join('') + wynik.slice(frontmatter[0].length);
	}

	return wynik.replace(/^[ \t]*- \[[^\]]+\]\(([^)\s]+)\)[^\r\n]*(\r?\n|$)/gm, (calosc, url) =>
		ukryte.has(url.split('#')[0]) ? '' : calosc,
	);
}

/**
 * Kolejnosc ma znaczenie: "Nastepny krok" i "Wiecej" musza pojsc PRZED
 * odlinkowaniem, bo inaczej odlinkowanie zjada odnosnik w tych blokach
 * i zostaje zdanie zapowiadajace lekcje, ktorej nie ma na stronie.
 */
function transformuj(
	tresc,
	czyWyciety,
	{ pustaSekcja = false, url = null, stan = null } = {},
) {
	let wynik = podmienKarty(tresc, czyWyciety);
	wynik = podmienNastepnyKrok(wynik, czyWyciety, url, stan);
	wynik = usunMartweWiecej(wynik, czyWyciety);
	wynik = odlinkujOdnosniki(wynik, czyWyciety);
	if (pustaSekcja) wynik = dodajZapowiedzSekcji(wynik);
	if (stan) {
		if (url === '/' && stan.pusteSekcje.size) wynik = dodajRamkeGotowe(wynik, stan.gotowe);
		wynik = oznaczPusteWTabeli(wynik, stan.pusteSekcje);
		wynik = ukryjOdeslania(
			wynik,
			new Set([...UKRYJ_ODESLANIA_DO_PUSTYCH].filter((u) => stan.pusteSekcje.has(u))),
		);
	}
	return wynik;
}

// Eksport na potrzeby testow (scripts/lib/publish.test.mjs).
export {
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
	WYKLUCZONE_Z_PUBLIKACJI,
	zbierzPliki,
};

// ---------------------------------------------------------------------------
// Glowny przebieg
// ---------------------------------------------------------------------------

function sprawdzCzystoscRepo() {
	const brudne = git(['status', '--porcelain']);
	if (brudne) {
		przerwij(
			'katalog roboczy nie jest czysty. Zacommituj zmiany do Gitei przed publikacja,\n' +
				'  inaczej publiczne repo dostanie tresc, ktorej nie ma w zrodle prawdy.',
		);
	}
}

/**
 * Dzieli pliki repo na tresc (do filtrowania po statusie) i pozostale
 * (kopiowane 1:1). Pliki z WYKLUCZONE_Z_PUBLIKACJI wypadaja z obu list.
 */
function zbierzPliki(wszystkie = git(['ls-files']).split('\n').filter(Boolean)) {
	const tresc = [];
	const pozostale = [];

	for (const sciezka of wszystkie) {
		if (WYKLUCZONE_Z_PUBLIKACJI.has(sciezka)) continue;
		if (sciezka.startsWith(`${KATALOG_TRESCI}/`) && /\.mdx?$/.test(sciezka)) {
			tresc.push(sciezka);
		} else {
			pozostale.push(sciezka);
		}
	}
	return { tresc, pozostale };
}

function main() {
	console.log('\n  Publikacja do publicznego repozytorium\n');

	sprawdzCzystoscRepo();
	const { tresc, pozostale } = zbierzPliki();

	const publikowane = [];
	const wyciete = [];

	for (const sciezka of tresc) {
		const wzgledna = sciezka.slice(KATALOG_TRESCI.length + 1);
		const zawartosc = readFileSync(join(KORZEN, sciezka), 'utf8');
		const status = czytajStatus(zawartosc);
		const wpis = {
			sciezka,
			wzgledna,
			url: plikNaUrl(wzgledna),
			status,
			tytul: czytajTytul(zawartosc),
			zawartosc,
		};

		if (ZAWSZE_PUBLIKUJ.has(wzgledna) || PUBLIKOWANE.has(status)) publikowane.push(wpis);
		else wyciete.push(wpis);
	}

	if (wyciete.length === 0) {
		console.log('  Nic nie jest wyciete - publiczne repo dostanie pelna tresc.\n');
	} else {
		console.log(`  Wycietych stron: ${wyciete.length}`);
		for (const w of wyciete) console.log(`    - ${w.url}  (${w.status})`);
		console.log();
	}

	const wycieteUrls = new Set(wyciete.map((w) => w.url));
	const czyWyciety = (url) => {
		const czysty = url.split('#')[0].split('?')[0];
		return wycieteUrls.has(czysty);
	};

	// Strona zbiorcza sekcji jest celem przekierowan i nosnikiem zapowiedzi.
	// Gdyby sama byla wycieta, wyciete artykuly nie mialyby dokad prowadzic.
	for (const w of wyciete) {
		const sekcja = urlSekcji(w.url);
		if (sekcja !== w.url && wycieteUrls.has(sekcja)) {
			przerwij(
				`strona zbiorcza ${sekcja} jest wycieta, a artykul ${w.url} mialby na nia\n` +
					'  przekierowywac. Ustaw stronie zbiorczej status `zastane` albo `gotowe`.',
			);
		}
	}

	// --- budowa katalogu publikacji ---
	// Czyscimy zawartosc, ale zostawiamy `.git` (historia publikacji, remote
	// do GitHuba) i `node_modules` (dowiazanie, zeby build mial czym budowac).
	// Skasowanie ich oznaczaloby klonowanie repo i instalacje zaleznosci przy
	// kazdej publikacji.
	if (existsSync(KATALOG_PUBLIKACJI)) {
		for (const wpis of readdirSync(KATALOG_PUBLIKACJI)) {
			if (wpis === '.git' || wpis === 'node_modules') continue;
			rmSync(join(KATALOG_PUBLIKACJI, wpis), { recursive: true, force: true });
		}
	} else {
		mkdirSync(KATALOG_PUBLIKACJI, { recursive: true });
	}

	for (const sciezka of pozostale) {
		const cel = join(KATALOG_PUBLIKACJI, sciezka);
		mkdirSync(dirname(cel), { recursive: true });
		cpSync(join(KORZEN, sciezka), cel);
	}

	// Sekcje, w ktorych nie zostal ani jeden dostepny artykul. Ich strona
	// zbiorcza dostaje zapowiedz przebudowy - inaczej opowiada o lekcjach,
	// ktorych na stronie nie ma.
	const artykulowWSekcji = new Map();
	for (const wpis of [...publikowane, ...wyciete]) {
		const sekcja = urlSekcji(wpis.url);
		if (sekcja === wpis.url || wpis.url === '/') continue; // strona zbiorcza
		const licznik = artykulowWSekcji.get(sekcja) ?? { dostepne: 0, wszystkie: 0 };
		licznik.wszystkie++;
		if (!wycieteUrls.has(wpis.url)) licznik.dostepne++;
		artykulowWSekcji.set(sekcja, licznik);
	}
	const pusteSekcje = new Set(
		[...artykulowWSekcji]
			.filter(([, licznik]) => licznik.dostepne === 0)
			.map(([sekcja]) => sekcja),
	);

	// Sekcje kursu, ktore da sie dzis czytac - w kolejnosci sciezki nauki.
	// Z nich powstaje ramka na stronie glownej i tekst zastepczy na slepych
	// uliczkach (D01 = A).
	const sekcje = czytajSekcje(readFileSync(join(KORZEN, PLIK_SEKCJI), 'utf8'));
	if (!sekcje.length) przerwij(`nie udalo sie odczytac listy sekcji z ${PLIK_SEKCJI}.`);
	const gotowe = sekcje
		.filter(({ slug }) => !SEKCJE_POZA_KURSEM.has(slug))
		.map(({ slug, label }) => {
			const url = `/${slug}/`;
			const licznik = artykulowWSekcji.get(url) ?? { dostepne: 0, wszystkie: 0 };
			return { url, nazwa: label, ...licznik, dopisek: DOPISEK_SEKCJI[slug] ?? null };
		})
		.filter((s) => s.dostepne > 0);
	const stan = {
		pusteSekcje,
		gotowe,
		nazwySekcji: new Map(sekcje.map(({ slug, label }) => [`/${slug}/`, label])),
	};

	let zmienionych = 0;
	for (const wpis of publikowane) {
		const cel = join(KATALOG_PUBLIKACJI, wpis.sciezka);
		mkdirSync(dirname(cel), { recursive: true });
		const nowa = transformuj(wpis.zawartosc, czyWyciety, {
			pustaSekcja: pusteSekcje.has(wpis.url),
			url: wpis.url,
			stan,
		});
		if (
			wpis.url === '/' &&
			pusteSekcje.size &&
			gotowe.length &&
			!nowa.includes('[Co jest gotowe dziś]')
		) {
			przerwij(
				'strona glowna nie dostala ramki "Co jest gotowe dzis" - w index.mdx\n' +
					'  brakuje naglowka "## Program kursu", nad ktorym ramka ma stanac.',
			);
		}
		if (nowa !== wpis.zawartosc) zmienionych++;
		writeFileSync(cel, nowa, 'utf8');
	}
	if (gotowe.length) {
		const opis = gotowe.map((g) => `${g.nazwa} ${g.dostepne}/${g.wszystkie}`).join(', ');
		console.log(`  Sekcje gotowe dzis: ${opis}`);
	}
	if (pusteSekcje.size) {
		console.log(`  Sekcji z zapowiedzia przebudowy: ${pusteSekcje.size}`);
	}

	// --- przekierowania ---
	// Stale reguly 301 ze starych plaskich adresow. Jesli cel takiej reguly
	// jest dzis wyciety, kierujemy ja od razu na strone zbiorcza sekcji i
	// zmieniamy kod na 302. Bez tego powstaje lancuch 301 -> 302: przegladarka
	// robi dwa skoki, a wyszukiwarka widzi trwale przekierowanie na adres,
	// ktory sam przekierowuje tymczasowo. Po publikacji artykulu regula wraca
	// do pierwotnej postaci sama.
	let przepisanychStalych = 0;
	const stale = readFileSync(join(KORZEN, REDIRECTS), 'utf8')
		.trimEnd()
		.split('\n')
		.map((linia) => {
			const regula = linia.match(/^(\S+)\s+(\S+)\s+(\d{3})\s*$/);
			if (!regula) return linia;
			const [, zrodlo, cel, kod] = regula;
			if (!czyWyciety(cel)) return linia;
			przepisanychStalych++;
			return `${zrodlo} ${urlSekcji(cel)} 302`;
		})
		.join('\n');

	const tymczasowe = wyciete
		.map((w) => `${w.url} ${urlSekcji(w.url)} 302`)
		.sort();

	const naglowek = [
		'',
		'',
		'# --- Strony w przebudowie redakcyjnej (generowane automatycznie) ---',
		'# 302, nie 301: te adresy wroca po przegladzie redakcyjnym. Regula',
		'# znika sama w dniu publikacji artykulu. Nie edytuj tej sekcji recznie -',
		'# steruje nia pole `status` we frontmatterze artykulu.',
		'',
	].join('\n');

	writeFileSync(
		join(KATALOG_PUBLIKACJI, REDIRECTS),
		tymczasowe.length ? `${stale}${naglowek}${tymczasowe.join('\n')}\n` : `${stale}\n`,
		'utf8',
	);

	console.log(`  Skopiowano: ${publikowane.length} stron tresci, ${pozostale.length} pozostalych plikow`);
	console.log(`  Przepisano odnosniki w: ${zmienionych} plikach`);
	console.log(`  Regul 302 dla wycietych stron: ${tymczasowe.length}`);
	if (przepisanychStalych) {
		console.log(`  Stalych regul przekierowanych na sekcje: ${przepisanychStalych}`);
	}
	console.log();

	// --- weryfikacja ---
	if (!CZY_BUILD) {
		console.log('  Pominieto build (--bez-buildu). Publiczna wersja NIE zostala zweryfikowana.\n');
		return;
	}

	const moduly = join(KATALOG_PUBLIKACJI, 'node_modules');
	// `existsSync` idzie po dowiazaniu, wiec dla junction wskazujacego w pustke
	// (np. po przeniesieniu projektu na inna sciezke) zwraca false - a samo
	// dowiazanie nadal lezy na dysku i `symlinkSync` konczy sie EEXIST.
	// Dlatego zwisajace dowiazanie kasujemy, zamiast probowac je nadpisac.
	let jestDowiazanie = false;
	try {
		jestDowiazanie = lstatSync(moduly).isSymbolicLink();
	} catch {
		// brak wpisu - nic do sprzatania
	}
	if (jestDowiazanie && !existsSync(moduly)) rmSync(moduly, { force: true });

	if (!existsSync(moduly)) {
		try {
			symlinkSync(join(KORZEN, 'node_modules'), moduly, 'junction');
		} catch (blad) {
			przerwij(`nie udalo sie podlaczyc node_modules do .publish: ${blad.message}`);
		}
	}

	console.log('  Build publicznej wersji...');
	try {
		execFileSync('npm', ['run', 'build'], {
			cwd: KATALOG_PUBLIKACJI,
			stdio: ['ignore', 'ignore', 'pipe'],
			shell: process.platform === 'win32',
		});
	} catch (blad) {
		const wyjscie = blad.stderr ? blad.stderr.toString() : blad.message;
		przerwij(`publiczna wersja sie nie buduje. Nic nie zostalo wypchniete.\n\n${wyjscie}`);
	}
	console.log('  Build: OK');

	console.log('  Weryfikacja GEO...');
	try {
		execFileSync('npm', ['run', 'verify:geo'], {
			cwd: KATALOG_PUBLIKACJI,
			stdio: ['ignore', 'ignore', 'pipe'],
			shell: process.platform === 'win32',
		});
	} catch (blad) {
		const wyjscie = blad.stdout ? blad.stdout.toString() : blad.message;
		przerwij(`publiczna wersja nie przechodzi verify:geo.\n\n${wyjscie}`);
	}
	console.log('  Weryfikacja GEO: OK\n');

	if (!CZY_PUSH) {
		console.log('  Gotowe. Podglad: .publish/dist');
		console.log('  Aby wyslac na GitHub: node scripts/publish.mjs --push\n');
		return;
	}

	wyslij({ publikowane, wyciete });
}

/**
 * Commit i push do publicznego repozytorium. Historia publiczna jest wlasna -
 * jeden commit na publikacje, bez zwiazku z historia zrodla prawdy. To celowe:
 * lustro pokazuje stan wydany, nie droge, ktora do niego doprowadzila.
 */
function wyslij({ publikowane, wyciete }) {
	const wPublikacji = (args) => git(args, { cwd: KATALOG_PUBLIKACJI });

	if (!existsSync(join(KATALOG_PUBLIKACJI, '.git'))) {
		console.log('  Inicjalizacja repozytorium publikacji...');
		wPublikacji(['init', '-b', 'main']);
		wPublikacji(['remote', 'add', 'origin', REPO_PUBLICZNE]);
	} else {
		// Lustro dostaje commity, ktorych nie ma lokalny katalog `.publish`:
		// merge PR-a Dependabota, poprawka zrobiona w GitHubie, publikacja
		// z innej maszyny. Bez tego `git push` konczy sie non-fast-forward
		// i publikacja pada juz PO buildzie i weryfikacji.
		//
		// `reset --mixed` przestawia HEAD na stan lustra, nie ruszajac plikow
		// w katalogu roboczym - a te sa i tak odtwarzane od zera przy kazdym
		// uruchomieniu. Commit publikacyjny powstaje wiec na szczycie lustra
		// i wysylka jest fast-forward.
		//
		// Skutek dla tresci jest ten sam, co opisany w AGENTS.md: publikacja
		// nadpisuje zmiany wniesione w lustrze recznie. Jesli maja przetrwac,
		// musza trafic do zrodla prawdy - lustro ich nie obroni.
		try {
			wPublikacji(['fetch', 'origin', 'main']);
			wPublikacji(['reset', '--mixed', 'origin/main']);
		} catch (blad) {
			przerwij(
				'nie udalo sie pobrac stanu lustra przed publikacja.\n' +
					`  ${blad.message}`,
			);
		}
	}

	wPublikacji(['add', '-A']);
	if (!wPublikacji(['status', '--porcelain'])) {
		console.log('  Brak zmian wobec poprzedniej publikacji - nie wysylam nic.\n');
		return;
	}

	const zrodlowy = git(['rev-parse', '--short', 'HEAD']);
	const opisWycietych = wyciete.length
		? `\nStrony w przebudowie (${wyciete.length}), niedostepne publicznie:\n` +
			wyciete.map((w) => `  ${w.url}`).join('\n') + '\n'
		: '\nWszystkie strony opublikowane.\n';

	const komunikat =
		`publikacja: ${publikowane.length} stron\n` +
		'\nWygenerowane przez `npm run publish` ze zrodla prawdy (GitLab),\n' +
		`commit zrodlowy ${zrodlowy}. Nie edytuj tego repozytorium recznie -\n` +
		'nastepna publikacja nadpisze zmiany. Uwagi: zakladka Issues.\n' +
		opisWycietych;

	wPublikacji(['commit', '-m', komunikat]);
	console.log('  Wysylam na GitHub...');
	wPublikacji(['push', '-u', 'origin', 'main']);
	console.log(`  Opublikowano. Cloudflare zbuduje z ${REPO_PUBLICZNE}\n`);
}

// Uruchamiaj tylko przy wywolaniu z linii polecen - import w tescie ma
// dostac same funkcje, bez efektow ubocznych.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main();
}
