// Mapa URL -> data ostatniej zmiany pliku wg git, dla pola <lastmod> w sitemapie.
// Cloudflare (i CI) mogą klonować repo płytko - nie tylko `--depth=1`, ale też
// z umiarkowaną głębokością (np. `--depth=50`), gdzie commit dotykający
// starszego pliku wypada poza pobrane okno. W takim wypadku `git log -1 --
// <plik>` kończy się kodem 0 i pustym wyjściem, więc licznik commitów (`git
// rev-list --count HEAD > 1`) niczego by nie wykrył - repo "ma historię", tylko
// niekompletną dla części plików. Dlatego testem jest `git rev-parse
// --is-shallow-repository`, które wykrywa płytki klon dowolnej głębokości.
// Bez pełnej historii zwracamy pustą mapę, a `serialize` pomija <lastmod>
// całkowicie. Sygnał nieobecny jest uczciwy; sygnał częściowy (część z 55
// stron ma <lastmod>, część nie) - nie jest, a spec sitemap.xml wprost tego
// zabrania.
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const DOCS_PATHSPEC = 'src/content/docs';
const DOCS_PREFIX = `${DOCS_PATHSPEC}/`;

/** src/content/docs/podstawy/wstep.md -> /podstawy/wstep/ ; index.mdx -> / */
function urlFor(relPosixPath) {
	const rel = relPosixPath.replace(/\.mdx?$/, '');
	const parts = rel.split('/');
	if (parts[parts.length - 1] === 'index') parts.pop();
	return parts.length === 0 ? '/' : `/${parts.join('/')}/`;
}

function isShallowClone() {
	try {
		const out = execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim();
		// Polecenie zwraca dosłowny łańcuch "true" albo "false" - wszystko inne
		// (np. pusty ciąg) traktujemy ostrożnie, jako brak pewności co do pełnej
		// historii, więc tak samo jak płytki klon.
		return out !== 'false';
	} catch {
		// Brak gita albo katalog spoza repozytorium - jak dotychczas, brak
		// pewności co do historii oznacza pominięcie <lastmod>.
		return true;
	}
}

export function lastModMap() {
	const map = new Map();
	if (isShallowClone()) {
		console.warn('[sitemap] Płytki klon (albo brak historii git) - pomijam <lastmod> w sitemapie.');
		return map;
	}
	// Jedno wywołanie `git log` na cały katalog zamiast osobnego spawnu na
	// każdy plik (było ich ~60) - na Windows spawn procesu to zauważalny
	// narzut (i widoczne okno konsoli), więc przy takiej liczbie artykułów
	// start dev servera potrafił przekroczyć 30 s.
	let output;
	try {
		output = execFileSync(
			'git',
			['log', '--format=%x00%cI', '--name-only', '--', DOCS_PATHSPEC],
			{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
		);
	} catch {
		return map;
	}
	// Commity od najnowszego, więc pierwsze trafienie danego pliku to jego
	// ostatnia zmiana - kolejne (starsze) są ignorowane przez `!map.has`.
	for (const commit of output.split('\x00').slice(1)) {
		const lines = commit.split('\n');
		const iso = lines[0].trim();
		for (const file of lines.slice(1)) {
			if (!file.startsWith(DOCS_PREFIX) || !/\.mdx?$/.test(file)) continue;
			const url = urlFor(file.slice(DOCS_PREFIX.length));
			if (!map.has(url)) map.set(url, iso);
		}
	}

	// Pełna historia to za mało: plik jeszcze niezacommitowany w TYM repozytorium
	// nie ma ani jednego commitu, więc wypada z mapy. Zdarza się to przy każdej
	// publikacji dokładającej nowe strony - katalog `.publish/` dostaje je jako
	// świeże pliki, a lustro pozna je dopiero po commicie publikacyjnym, który
	// powstaje PO weryfikacji. Wynik byłby wtedy sygnałem częściowym, a ten
	// - jak w komentarzu na górze pliku - jest gorszy niż żaden.
	const bezDaty = docUrls().filter((url) => !map.has(url));
	if (bezDaty.length) {
		console.warn(
			`[sitemap] ${bezDaty.length} stron bez historii git (np. ${bezDaty[0]}) - ` +
				'pomijam <lastmod> w calej sitemapie zamiast dawac sygnal czesciowy.',
		);
		return new Map();
	}
	return map;
}

let pierwszeCommity;

/**
 * Mapa URL -> data pierwszego commita pliku (ISO 8601), dla `datePublished`
 * w TechArticle (Head.astro). Ten sam mechanizm co `lastModMap` wyżej i co
 * `dateModified` liczone przez Starlight (`lastUpdated: true`): jedno
 * wywołanie `git log` na cały katalog treści, data commitera (`%cI`).
 *
 * - Zmiany nazw śledzimy sami (`-M` + `--name-status`, przetwarzanie od
 *   najstarszego commita): plik po `R` dziedziczy datę starej ścieżki. To
 *   odpowiednik `git log --follow` dla wszystkich plików naraz.
 * - Bierzemy MINIMUM dat commitów pliku, nie datę commita topologicznie
 *   najstarszego. Rebase potrafi przestawić daty commitera, a Starlight bierze
 *   maksimum - tylko min/max gwarantuje datePublished <= dateModified.
 * - Usunięcie pliku (`D`) zeruje jego datę: plik dodany ponownie pod tą samą
 *   ścieżką to nowa publikacja.
 * - Granica historii: gałąź main zaczyna się od `e9253dc` (init 2026-08-26,
 *   commit bez rodzica). Wcześniejsza historia treści (tagi `backup/*`) to
 *   osobny korzeń, do którego `git log` z HEAD nie dochodzi, także z
 *   `--follow`. Dla plików z tamtego okresu wynik to 2026-08-26 - prawdziwą
 *   datę wpisuje się w polu `datePublished` frontmattera.
 *
 * `pelnaHistoria: false` (płytki klon, brak gita) oznacza pustą mapę - jak
 * w sitemapie wolimy brak daty niż datę pierwszego commita w płytkim oknie,
 * czyli zwykle datę ostatniej publikacji. Wynik jest zapamiętywany: Head.astro
 * woła tę funkcję przy każdej renderowanej stronie.
 */
export function firstCommitDates() {
	if (pierwszeCommity) return pierwszeCommity;
	const daty = new Map();
	pierwszeCommity = { pelnaHistoria: false, daty };
	if (isShallowClone()) {
		console.warn('[datePublished] Płytki klon (albo brak historii git) - pomijam datePublished.');
		return pierwszeCommity;
	}
	let output;
	try {
		output = execFileSync(
			'git',
			['log', '-M', '--format=%x00%cI', '--name-status', '--', DOCS_PATHSPEC],
			{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024 },
		);
	} catch {
		return pierwszeCommity;
	}
	// Ścieżka w repo -> najwcześniejsza data (ms). Commity od najstarszego.
	const najwczesniej = new Map();
	const wczesniejsza = (a, b) => (a === undefined ? b : Math.min(a, b));
	for (const commit of output.split('\x00').slice(1).reverse()) {
		const lines = commit.split('\n');
		const czas = Date.parse(lines[0].trim());
		if (Number.isNaN(czas)) continue;
		for (const line of lines.slice(1)) {
			const pola = line.split('\t');
			if (pola.length < 2) continue;
			const status = pola[0];
			if (status.startsWith('R') && pola.length >= 3) {
				const [, stara, nowa] = pola;
				najwczesniej.set(nowa, wczesniejsza(najwczesniej.get(stara), czas));
				najwczesniej.delete(stara);
			} else if (status === 'D') {
				najwczesniej.delete(pola[1]);
			} else {
				najwczesniej.set(pola[1], wczesniejsza(najwczesniej.get(pola[1]), czas));
			}
		}
	}
	for (const [plik, czas] of najwczesniej) {
		if (!plik.startsWith(DOCS_PREFIX) || !/\.mdx?$/.test(plik)) continue;
		daty.set(urlFor(plik.slice(DOCS_PREFIX.length)), new Date(czas).toISOString());
	}
	pierwszeCommity.pelnaHistoria = true;
	return pierwszeCommity;
}

/** Adresy wszystkich stron kolekcji `docs`, prosto z układu katalogów. */
function docUrls() {
	const out = [];
	(function walk(dir, prefix) {
		let wpisy;
		try {
			wpisy = readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const wpis of wpisy) {
			// Podkreślenie na początku - udokumentowana konwencja Astro
			// wykluczająca ścieżkę z routingu. Tak samo traktuje ją verify-geo.
			if (wpis.name.startsWith('_')) continue;
			const rel = prefix ? `${prefix}/${wpis.name}` : wpis.name;
			if (wpis.isDirectory()) walk(join(dir, wpis.name), rel);
			else if (/\.mdx?$/.test(wpis.name)) out.push(urlFor(rel));
		}
	})(DOCS_PATHSPEC, '');
	return out;
}
