// Asercje GEO/AEO/SEO na zbudowanym katalogu dist/.
// Repo nie ma frameworka testowego - ten skrypt pełni tę rolę dla danych
// strukturalnych, FAQ, obrazów OG i sitemapy.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
const SRC_DOCS = join('src', 'content', 'docs');
// Musi być zgodne z SITE_URL w src/lib/structured-data.ts.
const SITE_URL = 'https://przewodnikai.pl';
const results = [];

function check(name, fn) {
	try {
		const detail = fn();
		results.push({ name, ok: true, detail });
	} catch (err) {
		results.push({ name, ok: false, detail: err.message });
	}
}

function assert(cond, msg) {
	if (!cond) throw new Error(msg);
}

/** Wszystkie pliki index.html pochodzące z kolekcji docs (bez 404.html). */
function collectionPages() {
	const out = [];
	(function walk(dir) {
		for (const name of readdirSync(dir)) {
			const full = join(dir, name);
			if (statSync(full).isDirectory()) {
				if (name === '_astro' || name === 'pagefind' || name === 'og') continue;
				walk(full);
			} else if (name === 'index.html') {
				out.push(full);
			}
		}
	})(DIST);
	return out;
}

/**
 * Wszystkie pliki .md/.mdx w katalogu treści, które faktycznie staną się
 * stroną - źródło prawdy dla liczby stron w dist. Pliki i foldery z
 * przedrostkiem podkreślenia (`_`) pomijamy: to udokumentowana konwencja
 * Astro bezwarunkowo wykluczająca ścieżkę z routingu i z kolekcji treści
 * (ten sam mechanizm, co `src/pages/og/_fonts` w astro.config.mjs) - bez
 * tego wyjątku dodanie roboczego/szkicowego pliku z tym przedrostkiem
 * fałszywie zgłaszałoby rozjazd źródło/dist, mimo że build celowo go pomija.
 */
function sourceDocFiles() {
	const out = [];
	(function walk(dir) {
		for (const name of readdirSync(dir)) {
			if (name.startsWith('_')) continue;
			const full = join(dir, name);
			if (statSync(full).isDirectory()) {
				walk(full);
			} else if (/\.(md|mdx)$/.test(name)) {
				out.push(full);
			}
		}
	})(SRC_DOCS);
	return out;
}

/** Wyciąga blok frontmatteru (między parą `---`) z treści pliku źródłowego. */
function frontmatterOf(content) {
	const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	return m ? m[1] : '';
}

/**
 * Czy plik ma we frontmatterze pole `faq:` - proste dopasowanie tekstowe
 * (klucz na początku linii), bez parsera YAML jako dodatkowej zależności.
 */
function hasFaqField(content) {
	return /^faq:/m.test(frontmatterOf(content));
}

/** Wyciąga wszystkie bloki JSON-LD ze strony i parsuje je. */
function jsonLdBlocks(html) {
	const re = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
	const blocks = [];
	let m;
	while ((m = re.exec(html)) !== null) blocks.push(JSON.parse(m[1]));
	return blocks;
}

/** Zbiera wartości @type ze wszystkich bloków, także z @graph. */
function typesIn(html) {
	const types = new Set();
	for (const block of jsonLdBlocks(html)) {
		const nodes = Array.isArray(block['@graph']) ? block['@graph'] : [block];
		for (const node of nodes) if (node['@type']) types.add(node['@type']);
	}
	return types;
}

/**
 * Slugi sekcji, czyli katalogów treści mających własną stronę zbiorczą
 * (`<sekcja>/index.mdx`). Wykrywane ze struktury katalogów, a nie z zaszytej
 * listy - src/config/sections.ts jest modułem TypeScript, którego ten skrypt
 * (zwykły node) nie zaimportuje, a druga kopia listy rozjechałaby się z
 * pierwszą. `sciezki` i strony pomocnicze mają własne kategorie, więc są
 * wykluczone.
 */
function sectionSlugs(excludedPrefix) {
	return readdirSync(SRC_DOCS).filter(
		(name) =>
			name !== 'sciezki' &&
			`${name}/` !== excludedPrefix &&
			!name.startsWith('_') &&
			statSync(join(SRC_DOCS, name)).isDirectory() &&
			existsSync(join(SRC_DOCS, name, 'index.mdx')),
	);
}

/** URL strony na podstawie ścieżki pliku, np. dist/podstawy/x/index.html -> /podstawy/x/ */
function urlOf(file) {
	const rel = relative(DIST, file).split(sep).slice(0, -1).join('/');
	return rel === '' ? '/' : `/${rel}/`;
}

/** Usuwa bloki JSON-LD ze strony - potrzebne, żeby sprawdzać widoczną treść
 * niezależnie od tego, co jest zakodowane w danych strukturalnych (inaczej
 * tekst z JSON-LD "potwierdzałby sam siebie" jako treść widoczna). */
function stripJsonLd(html) {
	return html.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, '');
}

/** Płaski tekst widoczny dla czytelnika - bez bloków JSON-LD i bez znaczników HTML. */
function visibleText(html) {
	return stripJsonLd(html).replace(/<[^>]+>/g, ' ');
}

/**
 * Ujednolica cudzysłowy/apostrofy i białe znaki. Markdown renderuje proste
 * cudzysłowy ze źródła jako typograficzne (`"myśli"` w źródle staje się
 * „myśli" w HTML), więc porównanie tekstu pytania z frontmattera do HTML
 * nie może zależeć od tego, który wariant znaku aktualnie renderuje Astro.
 */
function normalizeForMatch(text) {
	return text
		.replace(/["'‘’“”„«»]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Rekurencyjnie zbiera wartości wszystkich pól o podanych kluczach
 * z dowolnie zagnieżdżonego obiektu/tablicy JSON-LD (np. `item` występuje
 * zarówno bezpośrednio w bloku, jak i zagnieżdżone w `itemListElement`).
 * Pole `url` na encji `Person` jest celowym wyjątkiem - to zewnętrzna
 * strona domowa autora (AUTHOR.url), a nie adres wygenerowany przez
 * `absoluteUrl()`, więc nie podlega wymogowi domeny/ukośnika.
 */
function collectFieldValues(node, keys, out) {
	if (Array.isArray(node)) {
		for (const item of node) collectFieldValues(item, keys, out);
	} else if (node && typeof node === 'object') {
		const isPerson = node['@type'] === 'Person';
		for (const [key, value] of Object.entries(node)) {
			if (keys.includes(key) && typeof value === 'string' && !(isPerson && key === 'url')) {
				out.push(value);
			}
			collectFieldValues(value, keys, out);
		}
	}
}

/** Rekurencyjnie zbiera wszystkie węzły `'@type': 'Person'` z bloku JSON-LD. */
function collectPersons(node, out) {
	if (Array.isArray(node)) {
		for (const item of node) collectPersons(item, out);
	} else if (node && typeof node === 'object') {
		if (node['@type'] === 'Person') out.push(node);
		for (const value of Object.values(node)) collectPersons(value, out);
	}
}

/**
 * Wyciąga teksty pytań z pola `faq:` - dopasowanie wzorca YAML `- q: ...`,
 * z opcjonalnym zdjęciem otaczających cudzysłowów. Też proste dopasowanie
 * tekstowe, nie parser YAML.
 */
function extractFaqQuestions(content) {
	const questions = [];
	const re = /^\s*-\s*q:\s*(.+)$/gm;
	let m;
	while ((m = re.exec(content)) !== null) {
		let q = m[1].trim();
		if ((q.startsWith('"') && q.endsWith('"')) || (q.startsWith("'") && q.endsWith("'"))) {
			q = q.slice(1, -1);
		}
		questions.push(q);
	}
	return questions;
}

assert(existsSync(DIST), 'Brak katalogu dist - uruchom najpierw `npm run build`');

// Strony pomocnicze obsługi newslettera - cele przekierowań z Sendy po zapisie,
// potwierdzeniu i wypisaniu. Nie są artykułami kursu: `Head.astro` klasyfikuje
// stronę jako artykuł po allowliście sekcji (src/config/sections.ts), więc te
// strony świadomie NIE dostają bloku TechArticle ani BreadcrumbList. Mają za to
// `noindex: true` i są pomijane w sitemapie (astro.config.mjs).
//
// Bez tego wyjątku klasyfikacja przez negację poniżej wrzuciłaby je do worka
// "artykuły" i asercja o TechArticle zapaliłaby się na czerwono.
//
// UWAGA: ta sama stała występuje w astro.config.mjs (pominięcie w sitemapie).
const NOINDEX_PREFIX = '/newsletter/';
const NOINDEX_SRC_PREFIX = 'newsletter/';

// Strony zbiorcze sekcji (`/podstawy/`, `/etyka/` itd.). Bez tej kategorii
// klasyfikacja przez negację poniżej wrzuciłaby je do worka "artykuły"
// i asercja o TechArticle zapaliłaby się na czerwono - one mają CollectionPage.
const SECTION_SLUGS = sectionSlugs(NOINDEX_SRC_PREFIX);
const SECTION_URLS = new Set(SECTION_SLUGS.map((slug) => `/${slug}/`));
const SECTION_SRC = new Set(SECTION_SLUGS.map((slug) => `${slug}/index.mdx`));

const pages = collectionPages();
const pageData = pages.map((f) => ({ file: f, url: urlOf(f), html: readFileSync(f, 'utf8') }));
const pomocnicze = pageData.filter((p) => p.url.startsWith(NOINDEX_PREFIX));
const sekcje = pageData.filter((p) => SECTION_URLS.has(p.url));
const articles = pageData.filter(
	(p) =>
		p.url !== '/' &&
		!p.url.startsWith('/sciezki/') &&
		!p.url.startsWith(NOINDEX_PREFIX) &&
		!SECTION_URLS.has(p.url),
);
const sciezki = pageData.filter((p) => p.url.startsWith('/sciezki/'));
const home = pageData.filter((p) => p.url === '/');
// Strony, które mają prawo znaleźć się w sitemapie - czyli wszystkie poza
// oznaczonymi noindex.
const indeksowane = pageData.filter((p) => !p.url.startsWith(NOINDEX_PREFIX));

// Stan źródeł (src/content/docs/) - punkt odniesienia dla asercji relacyjnych
// poniżej. `index.mdx` w katalogu głównym to strona główna; pliki pod
// `sciezki/` (w tym jej własny `index.mdx`) to ścieżki nauki; pliki pod
// `newsletter/` to strony pomocnicze; reszta to artykuły.
const sourceFiles = sourceDocFiles();
const sourceRel = sourceFiles.map((f) => relative(SRC_DOCS, f).split(sep).join('/'));
const sourceHome = sourceRel.filter((r) => r === 'index.mdx');
const sourceSciezki = sourceRel.filter((r) => r.startsWith('sciezki/'));
const sourceSekcje = sourceRel.filter((r) => SECTION_SRC.has(r));
const sourceArticles = sourceRel.filter(
	(r) =>
		r !== 'index.mdx' &&
		!r.startsWith('sciezki/') &&
		!r.startsWith(NOINDEX_SRC_PREFIX) &&
		!SECTION_SRC.has(r),
);

// --- Task 1: harness widzi to, co powinien ---
check('liczba stron w dist odpowiada liczbie plików źródłowych w treści', () => {
	assert(
		pageData.length === sourceFiles.length,
		`źródło: ${sourceFiles.length} plików .md/.mdx, dist: ${pageData.length} stron`,
	);
	return `${pageData.length} stron (źródło: ${sourceFiles.length} plików)`;
});
check('podział na artykuły / sekcje / ścieżki / stronę główną zgodny ze źródłem', () => {
	assert(
		articles.length === sourceArticles.length,
		`artykuły: źródło ${sourceArticles.length}, dist ${articles.length}`,
	);
	assert(
		sekcje.length === sourceSekcje.length,
		`sekcje: źródło ${sourceSekcje.length}, dist ${sekcje.length}`,
	);
	assert(
		sciezki.length === sourceSciezki.length,
		`ścieżki: źródło ${sourceSciezki.length}, dist ${sciezki.length}`,
	);
	assert(
		home.length === sourceHome.length,
		`strona główna: źródło ${sourceHome.length}, dist ${home.length}`,
	);
	return `${articles.length}/${sekcje.length}/${sciezki.length}/${home.length}`;
});
check('każdy katalog sekcji ma stronę zbiorczą', () => {
	// Nowa sekcja dopisana do src/config/sections.ts bez `index.mdx` zostawiłaby
	// dziurę: breadcrumb artykułów wskazywałby na nieistniejący adres, a Google
	// odrzuca cały BreadcrumbList, gdy pole `item` prowadzi donikąd.
	const katalogi = readdirSync(SRC_DOCS).filter(
		(name) =>
			name !== 'sciezki' &&
			`${name}/` !== NOINDEX_SRC_PREFIX &&
			!name.startsWith('_') &&
			statSync(join(SRC_DOCS, name)).isDirectory(),
	);
	const bez = katalogi.filter((name) => !SECTION_SLUGS.includes(name));
	assert(bez.length === 0, `katalogi bez index.mdx: ${bez.join(', ')}`);
	return `${SECTION_SLUGS.length}/${katalogi.length}`;
});

// --- Task 3: JSON-LD + OG ---
check('każda strona indeksowana ma blok JSON-LD', () => {
	// Strony `noindex` celowo nie dostają danych strukturalnych: te służą
	// wzbogaceniu wyników wyszukiwania, a strona wyłączona z indeksowania w tych
	// wynikach nie występuje. Tak samo Head.astro traktuje stronę 404.
	const missing = indeksowane.filter((p) => jsonLdBlocks(p.html).length === 0);
	assert(missing.length === 0, `bez JSON-LD: ${missing.map((p) => p.url).join(', ')}`);
	return `${indeksowane.length}/${indeksowane.length}`;
});
check('strony noindex nie mają danych strukturalnych', () => {
	const zbedne = pomocnicze.filter((p) => jsonLdBlocks(p.html).length > 0);
	assert(zbedne.length === 0, `niepotrzebny JSON-LD: ${zbedne.map((p) => p.url).join(', ')}`);
	return `${pomocnicze.length} stron pomocniczych bez JSON-LD`;
});
check('każdy artykuł ma TechArticle', () => {
	const bad = articles.filter((p) => !typesIn(p.html).has('TechArticle'));
	assert(bad.length === 0, `bez TechArticle: ${bad.map((p) => p.url).join(', ')}`);
	return `${articles.length}/${articles.length}`;
});
check('żadna strona zbiorcza (sekcja/ścieżka) nie ma TechArticle', () => {
	const zbiorcze = [...sekcje, ...sciezki];
	const bad = zbiorcze.filter((p) => typesIn(p.html).has('TechArticle'));
	assert(bad.length === 0, `błędnie oznaczone: ${bad.map((p) => p.url).join(', ')}`);
	return `0/${zbiorcze.length}`;
});
check('każda strona zbiorcza (sekcja/ścieżka) ma CollectionPage', () => {
	const zbiorcze = [...sekcje, ...sciezki];
	const bad = zbiorcze.filter((p) => !typesIn(p.html).has('CollectionPage'));
	assert(bad.length === 0, `bez CollectionPage: ${bad.map((p) => p.url).join(', ')}`);
	return `${zbiorcze.length}/${zbiorcze.length}`;
});
check('strona główna ma WebSite i Person', () => {
	const t = typesIn(home[0].html);
	assert(t.has('WebSite'), 'brak WebSite');
	assert(t.has('Person'), 'brak Person');
	return 'WebSite + Person';
});
check('każda strona ma BreadcrumbList poza główną', () => {
	const zBreadcrumbem = [...articles, ...sekcje, ...sciezki];
	const bad = zBreadcrumbem.filter((p) => !typesIn(p.html).has('BreadcrumbList'));
	assert(bad.length === 0, `bez BreadcrumbList: ${bad.map((p) => p.url).join(', ')}`);
	return `${zBreadcrumbem.length} stron`;
});
check('breadcrumb odzwierciedla głębokość adresu', () => {
	// Sedno hierarchii w wynikach wyszukiwania: artykuł ma trzy poziomy
	// (strona główna -> sekcja -> artykuł), strona zbiorcza dwa. Sama obecność
	// BreadcrumbList tego nie gwarantuje - wcześniej blok istniał, ale pomijał
	// poziom sekcji i był płytszy niż ścieżka URL.
	const oczekiwane = (p) => (SECTION_URLS.has(p.url) || p.url === '/sciezki/' ? 2 : 3);
	const bad = [];
	for (const p of [...articles, ...sekcje, ...sciezki]) {
		const block = jsonLdBlocks(p.html).find((b) => b['@type'] === 'BreadcrumbList');
		const n = block?.itemListElement?.length ?? 0;
		if (n !== oczekiwane(p)) bad.push(`${p.url}: ${n} zamiast ${oczekiwane(p)}`);
	}
	assert(bad.length === 0, `zła głębokość: ${bad.join(', ')}`);
	return `${articles.length} artykułów po 3 poziomy, ${sekcje.length + 1} stron zbiorczych po 2`;
});
check('każda strona ma og:image i twitter:image', () => {
	const bad = pageData.filter(
		(p) => !p.html.includes('property="og:image"') || !p.html.includes('name="twitter:image"')
	);
	assert(bad.length === 0, `bez obrazu OG: ${bad.map((p) => p.url).join(', ')}`);
	return `${pageData.length}/${pageData.length}`;
});

// --- Task 4: FAQ ---
const sourceFaqCount = sourceFiles.filter((f) => hasFaqField(readFileSync(f, 'utf8'))).length;

check('liczba stron z blokiem FAQPage odpowiada liczbie plików z polem faq: w frontmatterze', () => {
	const withFaq = pageData.filter((p) => typesIn(p.html).has('FAQPage'));
	assert(
		withFaq.length === sourceFaqCount,
		`źródło: ${sourceFaqCount} plików z faq:, dist: ${withFaq.length} bloków FAQPage`,
	);
	return `${withFaq.length}/${sourceFaqCount}`;
});

// Jedyna strona z jawnym wyjątkiem: pole `faqHidden` w jej frontmatterze
// wyłącza wygenerowaną sekcję "Częste pytania", bo treść artykułu sama jest
// FAQ (pytania jako nagłówki `##` z rozwiniętymi odpowiedziami), a
// wygenerowana sekcja pod spodem powielałaby dokładnie te same pytania.
// Blok FAQPage zostaje - warunek widocznej treści (wymagany przez Google)
// spełnia tu sama treść artykułu. To jedyny URL, któremu wolno nie mieć
// "Częste pytania" mimo FAQPage; każda inna strona z tym wyjątkiem to
// prawdziwy defekt.
const FAQ_HIDDEN_URL = '/zasoby/faq/';

check('FAQPage zawsze towarzyszy widocznej sekcji (poza jawnym wyjątkiem faqHidden)', () => {
	const withFaq = pageData.filter((p) => typesIn(p.html).has('FAQPage'));
	const bad = withFaq.filter((p) => p.url !== FAQ_HIDDEN_URL && !p.html.includes('Częste pytania'));
	assert(bad.length === 0, `JSON-LD bez widocznej treści: ${bad.map((p) => p.url).join(', ')}`);
	return `${withFaq.length - 1}/${withFaq.length - 1} (jedyny wyjątek: ${FAQ_HIDDEN_URL})`;
});
check(`faqHidden działa na ${FAQ_HIDDEN_URL}: FAQPage jest, wygenerowana sekcja - nie`, () => {
	const page = pageData.find((p) => p.url === FAQ_HIDDEN_URL);
	// Strona może być wycięta z publikacji (status: szkic we frontmatterze).
	// Harness biegnie zarówno na źródle prawdy, jak i na zawartości .publish/,
	// więc jej brak jest tu stanem dopuszczalnym, a nie błędem - inaczej
	// wycięcie jednego artykułu blokowałoby całą publikację.
	if (!page) return 'pominięte - strona wycięta z tej publikacji';
	assert(typesIn(page.html).has('FAQPage'), `${FAQ_HIDDEN_URL} powinna mieć blok FAQPage`);
	assert(
		!page.html.includes('Częste pytania'),
		`${FAQ_HIDDEN_URL} nie powinna mieć wygenerowanej sekcji "Częste pytania" - flaga faqHidden nie działa`
	);
	return 'FAQPage + brak wygenerowanej sekcji';
});
check('brak sekcji FAQ na stronach bez FAQPage', () => {
	const bad = pageData.filter(
		(p) => !typesIn(p.html).has('FAQPage') && p.html.includes('Częste pytania')
	);
	assert(bad.length === 0, `pusta sekcja FAQ: ${bad.map((p) => p.url).join(', ')}`);
	return 'brak pustych sekcji';
});

// --- Task 5: obrazy OG ---
check('obraz OG istnieje dla każdej strony', () => {
	const bad = [];
	for (const p of pageData) {
		const m = p.html.match(/property="og:image" content="([^"]+)"/);
		if (!m) { bad.push(`${p.url} (brak znacznika)`); continue; }
		const file = join(DIST, new URL(m[1]).pathname);
		if (!existsSync(file)) bad.push(`${p.url} -> ${m[1]}`);
	}
	assert(bad.length === 0, `brakujące pliki: ${bad.join(', ')}`);
	return `${pageData.length} obrazów`;
});

// --- Task 6: sitemap ---
check('sitemap zawiera tyle URL-i, ile stron indeksowanych', () => {
	const xml = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
	const n = (xml.match(/<loc>/g) || []).length;
	assert(
		n === indeksowane.length,
		`oczekiwano ${indeksowane.length}, jest ${n} (stron pomocniczych noindex: ${pomocnicze.length})`,
	);
	return `${n} URL-i (+${pomocnicze.length} pominiętych jako noindex)`;
});
check('strony noindex nie występują w sitemapie', () => {
	// Sitemapa i znacznik robots muszą mówić to samo. Wpis w mapie przy
	// jednoczesnym `noindex` to sprzeczny sygnał, który Google raportuje
	// w Search Console jako błąd.
	const xml = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
	const wSitemapie = pomocnicze.filter((p) => xml.includes(`${SITE_URL}${p.url}`));
	assert(wSitemapie.length === 0, `w sitemapie mimo noindex: ${wSitemapie.map((p) => p.url).join(', ')}`);
	const bezZnacznika = pomocnicze.filter((p) => !/<meta name="robots" content="noindex/.test(p.html));
	assert(bezZnacznika.length === 0, `brak meta robots: ${bezZnacznika.map((p) => p.url).join(', ')}`);
	return `${pomocnicze.length} stron pomocniczych: poza mapą i z meta robots`;
});
check('sitemap ma lastmod dla każdej strony albo potwierdzony płytki klon', () => {
	const xml = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
	const n = (xml.match(/<lastmod>/g) || []).length;
	assert(
		n === indeksowane.length || n === 0,
		`częściowy lastmod (${n}/${indeksowane.length}) - mapa git jest niespójna`,
	);
	return n === 0 ? 'pominięte (brak historii git)' : `${n} wpisów`;
});
check('sitemap rozróżnia priorytety', () => {
	const xml = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
	// @astrojs/sitemap serializuje priorytet 1.0 jako "1.0", nie jako "1"
	// (zweryfikowane w dist/sitemap-0.xml) - asercja dopasowana do realnego
	// formatu serializera, nie odwrotnie.
	assert(xml.includes('<priority>1.0</priority>'), 'brak priorytetu 1.0 dla strony głównej');
	assert(xml.includes('<priority>0.9</priority>'), 'brak priorytetu 0.9 dla stron sekcji');
	assert(xml.includes('<priority>0.5</priority>'), 'brak priorytetu 0.5 dla ścieżek');
	assert(xml.includes('<priority>0.8</priority>'), 'brak priorytetu 0.8 dla artykułów');
	return '1.0 / 0.9 / 0.8 / 0.5';
});

// --- Task 7: zawartość bloków JSON-LD, nie tylko ich obecność ---
// Poprzednie asercje sprawdzały wyłącznie `@type` - blok mógłby mieć
// całkowicie połamane dane (zły host, zgubiony ukośnik, puste imię autora)
// i wszystko pozostałoby zielone. Te trzy asercje zaglądają do treści.
check('pola url/item/mainEntityOfPage w JSON-LD są absolutne i kończą się ukośnikiem', () => {
	const URL_FIELD_KEYS = ['url', 'item', 'mainEntityOfPage'];
	const bad = [];
	for (const p of pageData) {
		for (const block of jsonLdBlocks(p.html)) {
			const values = [];
			collectFieldValues(block, URL_FIELD_KEYS, values);
			for (const v of values) {
				if (!v.startsWith(`${SITE_URL}/`) || !v.endsWith('/')) bad.push(`${p.url}: ${v}`);
			}
		}
	}
	assert(bad.length === 0, `nieprawidłowe adresy: ${bad.join(', ')}`);
	return 'wszystkie adresy zaczynają się od SITE_URL i kończą ukośnikiem';
});
check('encja autora (Person) ma niepuste pole name wszędzie, gdzie występuje', () => {
	const bad = [];
	for (const p of pageData) {
		for (const block of jsonLdBlocks(p.html)) {
			const persons = [];
			collectPersons(block, persons);
			for (const person of persons) {
				if (typeof person.name !== 'string' || person.name.trim() === '') bad.push(p.url);
			}
		}
	}
	assert(bad.length === 0, `puste pole name w encji Person: ${bad.join(', ')}`);
	return 'wszystkie encje Person mają niepuste name';
});
check(`każde pytanie z faq: na ${FAQ_HIDDEN_URL} występuje w widocznej treści HTML`, () => {
	const srcFile = `${join(SRC_DOCS, ...FAQ_HIDDEN_URL.split('/').filter(Boolean))}.md`;
	// Jak wyżej: przy publikacji częściowej pliku może po prostu nie być.
	if (!existsSync(srcFile)) return 'pominięte - strona wycięta z tej publikacji';
	const content = readFileSync(srcFile, 'utf8');
	const questions = extractFaqQuestions(content);
	assert(questions.length > 0, `nie znaleziono żadnego pytania w ${srcFile}`);

	const page = pageData.find((p) => p.url === FAQ_HIDDEN_URL);
	assert(page, `nie znaleziono strony ${FAQ_HIDDEN_URL}`);

	const visible = normalizeForMatch(visibleText(page.html));
	const missing = questions.filter((q) => !visible.includes(normalizeForMatch(q)));
	assert(
		missing.length === 0,
		`pytania nieobecne w widocznej treści (poza JSON-LD): ${missing.join(' | ')}`,
	);
	return `${questions.length}/${questions.length} pytań widocznych w HTML`;
});

// --- raport ---
let failed = 0;
for (const r of results) {
	if (!r.ok) failed++;
	console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? ` - ${r.detail}` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} asercji przeszło`);
process.exit(failed > 0 ? 1 : 0);
