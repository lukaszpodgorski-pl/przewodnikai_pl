#!/usr/bin/env node
/**
 * Publikacja do publicznego repozytorium.
 *
 * Zrodlo prawdy (Gitea) zawiera cala tresc. Publiczne repo (GitHub) dostaje
 * wylacznie strony o statusie `zastane` albo `gotowe`. Strony `szkic` sa
 * wycinane, a skrypt naprawia wszystkie slady po nich, zeby publiczna wersja
 * nie miala martwych odnosnikow:
 *
 *   1. odnosnik do wycietej strony -> sam tekst (zdanie zostaje sensowne),
 *   2. blok "Nastepny krok" do wycietej strony -> odeslanie do strony sekcji,
 *   3. <LinkCard> do wycietej strony -> <Card> z dopiskiem "w przygotowaniu",
 *   4. adres wycietej strony -> regula 302 na strone zbiorcza sekcji.
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
// Publiczne repozytorium - cel publikacji. Zrodlo prawdy (Gitea) jest
// remote'em `origin` glownego repo i z tym adresem nie ma nic wspolnego.
const REPO_PUBLICZNE = 'https://github.com/lukaszpodgorski-pl/przewodnikai_pl.git';
const KATALOG_TRESCI = 'src/content/docs';
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

/**
 * "Nastepny krok" prowadzacy do wycietej strony. Bez tego lancuch nauki
 * urywa sie w prozni albo - po transformacji odnosnikow - zostaje zdanie
 * zapowiadajace lekcje, ktorej nie ma.
 */
function podmienNastepnyKrok(tresc, czyWyciety) {
	return tresc.replace(
		/\*\*Następny krok:\*\*\s*\[([^\]]+)\]\(([^)]+)\)[^\n]*/g,
		(calosc, etykieta, url) => {
			if (!czyWyciety(url)) return calosc;
			const sekcja = urlSekcji(url);
			return `**Następny krok:** lekcja "${etykieta}" jest w przygotowaniu - wróć do [przeglądu sekcji](${sekcja}), żeby zobaczyć, co już jest gotowe.`;
		},
	);
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
		'Przechodzę przez te teksty artykuł po artykule i poprawiam to, co się nie broni.',
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
 * Kolejnosc ma znaczenie: "Nastepny krok" musi pojsc PRZED odlinkowaniem,
 * bo inaczej odlinkowanie zjada odnosnik w tym bloku i zostaje zdanie
 * zapowiadajace lekcje, ktorej nie ma na stronie.
 */
function transformuj(tresc, czyWyciety, { pustaSekcja = false } = {}) {
	let wynik = podmienKarty(tresc, czyWyciety);
	wynik = podmienNastepnyKrok(wynik, czyWyciety);
	wynik = odlinkujOdnosniki(wynik, czyWyciety);
	if (pustaSekcja) wynik = dodajZapowiedzSekcji(wynik);
	return wynik;
}

// Eksport na potrzeby testow (scripts/lib/publish.test.mjs).
export { odlinkujOdnosniki, plikNaUrl, podmienKarty, podmienNastepnyKrok, transformuj, urlSekcji };

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

function zbierzPliki() {
	const wszystkie = git(['ls-files']).split('\n').filter(Boolean);
	const tresc = [];
	const pozostale = [];

	for (const sciezka of wszystkie) {
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
		const licznik = artykulowWSekcji.get(sekcja) ?? { dostepne: 0 };
		if (!wycieteUrls.has(wpis.url)) licznik.dostepne++;
		artykulowWSekcji.set(sekcja, licznik);
	}
	const pusteSekcje = new Set(
		[...artykulowWSekcji]
			.filter(([, licznik]) => licznik.dostepne === 0)
			.map(([sekcja]) => sekcja),
	);

	let zmienionych = 0;
	for (const wpis of publikowane) {
		const cel = join(KATALOG_PUBLIKACJI, wpis.sciezka);
		mkdirSync(dirname(cel), { recursive: true });
		const nowa = transformuj(wpis.zawartosc, czyWyciety, {
			pustaSekcja: pusteSekcje.has(wpis.url),
		});
		if (nowa !== wpis.zawartosc) zmienionych++;
		writeFileSync(cel, nowa, 'utf8');
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
		'\nWygenerowane przez `npm run publish` ze zrodla prawdy (Gitea),\n' +
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
