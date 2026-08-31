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
