#!/usr/bin/env node
/**
 * Skaner treści na potrzeby audytu merytorycznego (docs-audyt/procedura.md).
 *
 * Liczy to, czego nie trzeba zgadywać: graf linków wewnętrznych, sieroty,
 * ślepe zaułki, łańcuch "Następny krok", duplikaty sidebar.order, braki pól
 * GEO, złamaną typografię i podejrzane kotwice. Agent audytujący dostaje
 * gotowe dane zamiast liczyć je od nowa przy każdym przebiegu - jest szybciej
 * i bez ryzyka arytmetycznej pomyłki.
 *
 * To NIE jest bramka CI. Skrypt niczego nie wywraca i nie zwraca kodu błędu
 * przy znaleziskach - raportuje stan, decyzje należą do człowieka.
 *
 * Użycie:
 *   node docs-audyt/skanuj.mjs               # raport do TODO_AUDYT_INT.md + podsumowanie na stdout
 *   node docs-audyt/skanuj.mjs --json plik   # dodatkowo pełne dane jako JSON
 *   node docs-audyt/skanuj.mjs --tylko-json  # sam JSON na stdout, bez zapisu pliku
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SRC_DOCS = join('src', 'content', 'docs');
const REDIRECTS = join('public', '_redirects');
const RAPORT = 'TODO_AUDYT_INT.md';

// Sekcje merytoryczne w kolejności ścieżki nauki. Musi być zgodne z
// src/config/sections.ts - tamten plik to TypeScript, którego zwykły node nie
// zaimportuje, a rozjazd wykrywa asercja `sekcjeZgodneZKonfiguracja()` niżej.
const SEKCJE = [
	'podstawy',
	'jak-dziala-ai',
	'prompt-engineering',
	'narzedzia',
	'suwerenne-ai',
	'praktyka',
	'etyka',
	'zasoby',
];

// Katalogi spoza ścieżki nauki: ścieżki tematyczne (splash, poza sidebarem)
// i strony obsługi newslettera (noindex, cele przekierowań z Sendy).
const POZA_SCIEZKA = ['sciezki', 'newsletter'];

// Kotwice, które nie mówią, dokąd prowadzą. Czytelnik i czytnik ekranu widzą
// sam tekst linku, bez otoczenia - "tutaj" nie niesie żadnej informacji.
const KOTWICE_PUSTE = [
	'tutaj',
	'tu',
	'kliknij',
	'kliknij tutaj',
	'link',
	'ten link',
	'zobacz',
	'więcej',
	'czytaj więcej',
	'strona',
	'ta strona',
	'artykuł',
	'ten artykuł',
];

/**
 * Kotwice odnoszące się do pozycji czytelnika w kursie, a nie do konkretnej
 * strony. Z każdego artykułu "poprzedni rozdział" to inny adres i tak ma być -
 * bez tego wyjątku kontrola K2 zgłaszałaby je jako wieloznaczne.
 */
const KOTWICE_WZGLEDNE =
	/^(poprzedni|nast[ęe]pn|wcze[śs]niej|dalej|powy[żz]ej|poni[żz]ej|kolejn|ten sam)/;

/**
 * Kwoty w treści. Właściciel zdecydował (commit #34), że konkretne ceny żyją
 * wyłącznie w artykule "Ile kosztuje AI" - przy narzędziach zostaje informacja
 * o planie darmowym i link do cennika u dostawcy. Kwota gdziekolwiek indziej
 * to dług, który zestarzeje się szybciej, niż zdążymy go odświeżyć.
 */
const WZORZEC_KWOTY = /(\$\s?\d|\d+[\d\s,.]*\s*(USD|EUR|PLN|zł|dolar|euro)\b|€\s?\d)/i;
const PLIK_Z_CENAMI = 'narzedzia/ile-kosztuje-ai.md';

// Znaki łamiące konwencję typograficzną z AGENTS.md (pauza to dywiz `-`,
// cudzysłowy proste). Nazwy opisowe trafiają wprost do raportu.
const ZLA_TYPOGRAFIA = [
	['—', 'pauza — (ma być dywiz -)'],
	['–', 'półpauza – (ma być dywiz -)'],
	['„', 'cudzysłów otwierający „ (ma być prosty ")'],
	['”', 'cudzysłów zamykający ” (ma być prosty ")'],
	['“', 'cudzysłów angielski “ (ma być prosty ")'],
	['‘', 'apostrof otwierający ‘ (ma być prosty \')'],
	['’', 'apostrof zamykający ’ (ma być prosty \')'],
];

// --- odczyt plików ---------------------------------------------------------

/** Wszystkie pliki .md/.mdx kolekcji docs. Prefiks `_` wyklucza z routingu. */
function plikiTresci() {
	const out = [];
	(function walk(dir) {
		for (const name of readdirSync(dir)) {
			if (name.startsWith('_')) continue;
			const full = join(dir, name);
			if (statSync(full).isDirectory()) walk(full);
			else if (/\.(md|mdx)$/.test(name)) out.push(full);
		}
	})(SRC_DOCS);
	return out.sort();
}

/** Ścieżka pliku -> adres strony. `x/index.mdx` -> `/x/`, `x/y.md` -> `/x/y/`. */
function adresPliku(file) {
	const rel = relative(SRC_DOCS, file).split(sep).join('/');
	const bez = rel.replace(/\.(md|mdx)$/, '');
	if (bez === 'index') return '/';
	if (bez.endsWith('/index')) return `/${bez.slice(0, -'/index'.length)}/`;
	return `/${bez}/`;
}

function frontmatterOf(content) {
	const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	return m ? m[1] : '';
}

/**
 * Treść pliku z wygaszonym frontmatterem oraz kodem, ale z ZACHOWANĄ numeracją
 * linii: wycięte fragmenty zostają jako puste linie. Numer linii w raporcie
 * musi wskazywać miejsce w pliku źródłowym - liczenie go na okrojonym tekście
 * dawało przesunięcie o długość frontmattera i każdego bloku kodu powyżej.
 *
 * Kod jest wygaszany, bo link ani pauza wewnątrz przykładu promptu to nie jest
 * link ani błąd typograficzny - to cytat, którego nie wolno poprawiać.
 */
function maskuj(content) {
	let wFrontmatterze = false;
	let wKodzie = false;
	return content
		.split(/\r?\n/)
		.map((linia, i) => {
			if (i === 0 && /^---\s*$/.test(linia)) {
				wFrontmatterze = true;
				return '';
			}
			if (wFrontmatterze) {
				if (/^---\s*$/.test(linia)) wFrontmatterze = false;
				return '';
			}
			if (/^\s*```/.test(linia)) {
				wKodzie = !wKodzie;
				return '';
			}
			if (wKodzie) return '';
			return linia.replace(/`[^`]*`/g, '');
		})
		.join('\n');
}

function skalar(fm, klucz) {
	const m = fm.match(new RegExp(`^${klucz}:[ \\t]*(.*)$`, 'm'));
	if (!m) return undefined;
	return m[1].trim().replace(/^['"]|['"]$/g, '');
}

/** Pole zagnieżdżone pod `sidebar:` (order, hidden, label). */
function sidebarPole(fm, klucz) {
	const blok = fm.match(/^sidebar:[ \t]*\r?\n((?:[ \t]+.*\r?\n?)*)/m);
	if (!blok) return undefined;
	const m = blok[1].match(new RegExp(`^[ \\t]+${klucz}:[ \\t]*(.*)$`, 'm'));
	return m ? m[1].trim() : undefined;
}

/** Liczba elementów listy YAML pod danym kluczem (pozycje `- ` pierwszego poziomu). */
function liczbaPozycji(fm, klucz) {
	const blok = fm.match(new RegExp(`^${klucz}:[ \\t]*\\r?\\n((?:[ \\t]+.*\\r?\\n?)*)`, 'm'));
	if (!blok) return 0;
	const wciecie = blok[1].match(/^([ \t]+)-[ \t]/);
	if (!wciecie) return 0;
	const re = new RegExp(`^${wciecie[1]}-[ \\t]`, 'gm');
	return (blok[1].match(re) || []).length;
}

/** Mapa przekierowań ze starych płaskich adresów: źródło -> cel. */
function przekierowania() {
	if (!existsSync(REDIRECTS)) return new Map();
	const map = new Map();
	for (const linia of readFileSync(REDIRECTS, 'utf8').split(/\r?\n/)) {
		const m = linia.match(/^\s*(\/\S*)\s+(\/\S*)\s+30\d\s*$/);
		if (m) map.set(m[1], m[2]);
	}
	return map;
}

// --- wyciąganie linków -----------------------------------------------------

/**
 * Wszystkie odwołania wewnętrzne w treści: markdownowe `[tekst](/cel/)` oraz
 * atrybuty `href="/cel/"` w komponentach MDX (CardGrid/LinkCard na stronach
 * zbiorczych używają tej drugiej formy - pominięcie jej zrobiłoby fałszywe
 * sieroty ze wszystkich artykułów linkowanych tylko z karty sekcji).
 */
function linkiWewnetrzne(body) {
	const out = [];
	const linie = body.split(/\r?\n/);
	for (let i = 0; i < linie.length; i++) {
		const linia = linie[i];
		let m;
		const md = /\[([^\]]*)\]\((\/[^)\s]*)\)/g;
		while ((m = md.exec(linia)) !== null) {
			out.push({ kotwica: m[1].trim(), cel: m[2], linia: i + 1, forma: 'markdown' });
		}
		const href = /href=["'](\/[^"']*)["']/g;
		while ((m = href.exec(linia)) !== null) {
			out.push({ kotwica: '', cel: m[1], linia: i + 1, forma: 'href' });
		}
	}
	return out;
}

function linkiZewnetrzne(body) {
	const out = [];
	let m;
	const re = /\[([^\]]*)\]\((https?:\/\/[^)\s]*)\)/g;
	while ((m = re.exec(body)) !== null) out.push({ kotwica: m[1].trim(), cel: m[2] });
	return out;
}

/**
 * Cel sekcji "Następny krok" - łańcuch prowadzący czytelnika liniowo przez
 * kurs. Dwie formy w repo: akapit `**Następny krok:** [tytuł](/cel/)`
 * w artykułach i aside `:::note[Następny krok]` na stronach zbiorczych.
 */
function nastepnyKrok(body) {
	const akapit = body.match(/\*\*Następny krok:?\*\*:?\s*\[([^\]]*)\]\((\/[^)\s]*)\)/);
	if (akapit) return { kotwica: akapit[1].trim(), cel: akapit[2], forma: 'akapit' };
	const aside = body.match(/:::note\[Następny krok\]([\s\S]*?):::/);
	if (aside) {
		const link = aside[1].match(/\[([^\]]*)\]\((\/[^)\s]*)\)/);
		if (link) return { kotwica: link[1].trim(), cel: link[2], forma: 'aside' };
		return { kotwica: '', cel: null, forma: 'aside-bez-linku' };
	}
	return null;
}

// --- budowa modelu ---------------------------------------------------------

const pliki = plikiTresci();
const redirects = przekierowania();

const strony = pliki.map((file) => {
	const surowe = readFileSync(file, 'utf8');
	const fm = frontmatterOf(surowe);
	const czysty = maskuj(surowe);
	const rel = relative(SRC_DOCS, file).split(sep).join('/');
	const katalog = rel.includes('/') ? rel.split('/')[0] : '';
	const adres = adresPliku(file);

	let rodzaj;
	if (adres === '/') rodzaj = 'strona-glowna';
	else if (katalog === 'newsletter') rodzaj = 'pomocnicza';
	else if (katalog === 'sciezki') rodzaj = adres === '/sciezki/' ? 'zbiorcza' : 'sciezka';
	else if (rel.endsWith('/index.mdx')) rodzaj = 'zbiorcza';
	else rodzaj = 'artykul';

	const order = sidebarPole(fm, 'order');

	return {
		plik: rel,
		adres,
		katalog,
		rodzaj,
		title: skalar(fm, 'title') ?? '',
		description: skalar(fm, 'description') ?? '',
		template: skalar(fm, 'template'),
		noindex: skalar(fm, 'noindex') === 'true',
		sidebarOrder: order === undefined ? null : Number(order),
		sidebarHidden: sidebarPole(fm, 'hidden') === 'true',
		educationalLevel: skalar(fm, 'educationalLevel'),
		teaches: liczbaPozycji(fm, 'teaches'),
		about: liczbaPozycji(fm, 'about'),
		mentions: liczbaPozycji(fm, 'mentions'),
		faq: liczbaPozycji(fm, 'faq'),
		slowa: czysty.split(/\s+/).filter(Boolean).length,
		naglowki: (czysty.match(/^##+ /gm) || []).length,
		obrazy: (czysty.match(/!\[[^\]]*\]\(/g) || []).length,
		wychodzace: linkiWewnetrzne(czysty),
		zewnetrzne: linkiZewnetrzne(czysty),
		nastepny: nastepnyKrok(czysty),
		typografia: ZLA_TYPOGRAFIA.map(([znak, opis]) => ({
			opis,
			ile: (czysty.match(new RegExp(znak, 'g')) || []).length,
		})).filter((t) => t.ile > 0),
		kwoty:
			rel === PLIK_Z_CENAMI
				? []
				: czysty
						.split('\n')
						.map((linia, i) => ({ linia: i + 1, trafienie: linia.match(WZORZEC_KWOTY)?.[0]?.trim() }))
						.filter((k) => k.trafienie),
	};
});

const adresy = new Set(strony.map((s) => s.adres));
const wgAdresu = new Map(strony.map((s) => [s.adres, s]));

// Linki przychodzące. Kotwica `#` i parametry nie zmieniają strony docelowej.
const przychodzace = new Map(strony.map((s) => [s.adres, []]));
for (const s of strony) {
	for (const l of s.wychodzace) {
		const cel = l.cel.split('#')[0].split('?')[0];
		if (przychodzace.has(cel)) przychodzace.get(cel).push({ z: s.adres, ...l });
	}
}

// --- kontrole --------------------------------------------------------------

const ustalenia = { N: [], S: [], GEO: [], ceny: [], kotwice: [], typografia: [] };

function dodaj(grupa, kod, waga, plik, opis) {
	ustalenia[grupa].push({ kod, waga, plik, opis });
}

// N1. Linki prowadzące donikąd oraz trafiające w cel dopiero przez 301.
for (const s of strony) {
	for (const l of s.wychodzace) {
		const [sciezka] = l.cel.split('#');
		const cel = sciezka.split('?')[0];
		if (adresy.has(cel)) continue;
		if (redirects.has(cel)) {
			dodaj(
				'N',
				'N1-przekierowanie',
				'P2',
				`${s.plik}:${l.linia}`,
				`link "${l.kotwica || l.cel}" -> ${cel} trafia w cel dopiero przez 301 (docelowo ${redirects.get(cel)})`,
			);
			continue;
		}
		// Zasoby statyczne z public/ (wideo, pliki do pobrania) nie są stronami.
		if (/^\/(media|media-src|favicon|robots|llms|_redirects)/.test(cel)) continue;
		if (existsSync(join('public', cel.replace(/^\//, '')))) continue;
		dodaj(
			'N',
			'N1-martwy',
			'P1',
			`${s.plik}:${l.linia}`,
			`link "${l.kotwica || l.cel}" -> ${cel} nie odpowiada żadnej stronie ani przekierowaniu`,
		);
	}
}

// N2. Brak ukośnika końcowego przy trailingSlash: 'always'.
for (const s of strony) {
	for (const l of s.wychodzace) {
		const [sciezka] = l.cel.split('#');
		if (sciezka === '' || sciezka.endsWith('/')) continue;
		if (/\.[a-z0-9]{2,4}$/i.test(sciezka)) continue; // plik, nie strona
		dodaj(
			'N',
			'N2-ukosnik',
			'P2',
			`${s.plik}:${l.linia}`,
			`link ${l.cel} bez ukośnika końcowego (trailingSlash: 'always')`,
		);
	}
}

// N3. Sieroty - strona bez ani jednego linku z treści. Strona główna jest
// celem logo i nawigacji, więc nie liczy się jako sierota.
for (const s of strony) {
	if (s.adres === '/') continue;
	if (przychodzace.get(s.adres).length > 0) continue;
	const waga = s.rodzaj === 'pomocnicza' ? 'P3' : 'P1';
	const uwaga =
		s.rodzaj === 'pomocnicza'
			? 'strona pomocnicza newslettera - cel przekierowania z Sendy, brak linków jest oczekiwany'
			: 'żaden artykuł nie prowadzi do tej strony';
	dodaj('N', 'N3-sierota', waga, s.plik, `${s.adres}: ${uwaga}`);
}

// N4. Ślepe zaułki - strona, z której nie da się pójść dalej wewnątrz serwisu.
for (const s of strony) {
	if (s.rodzaj === 'pomocnicza') continue;
	if (s.wychodzace.length > 0) continue;
	dodaj('N', 'N4-slepy-zaulek', 'P2', s.plik, `${s.adres}: brak jakiegokolwiek linku wewnętrznego`);
}

// N5. Łańcuch "Następny krok" - kompletność i kierunek.
const artykulyWgSekcji = new Map();
for (const s of strony) {
	if (s.rodzaj !== 'artykul') continue;
	if (!artykulyWgSekcji.has(s.katalog)) artykulyWgSekcji.set(s.katalog, []);
	artykulyWgSekcji.get(s.katalog).push(s);
}
for (const [, lista] of artykulyWgSekcji) {
	lista.sort((a, b) => (a.sidebarOrder ?? 999) - (b.sidebarOrder ?? 999));
}

// Ostatnia sekcja ścieżki nauki jest jej metą - łańcuch "Następny krok"
// celowo się tam urywa (`etyka/przyszlosc-ai` prowadzi do `/zasoby/`, a dalej
// są już materiały referencyjne, nie kolejne lekcje). Bez tego wyjątku
// kontrola zgłaszałaby całą sekcję jako braki.
const SEKCJA_KONCOWA = SEKCJE[SEKCJE.length - 1];

for (const s of strony) {
	if (s.rodzaj !== 'artykul') continue;
	if (!s.nastepny) {
		if (s.katalog === SEKCJA_KONCOWA) continue;
		dodaj('N', 'N5-brak-nastepnego', 'P2', s.plik, `${s.adres}: artykuł bez sekcji "Następny krok"`);
		continue;
	}
	if (!s.nastepny.cel) {
		dodaj('N', 'N5-nastepny-bez-linku', 'P1', s.plik, `${s.adres}: "Następny krok" bez linku`);
		continue;
	}
	const cel = s.nastepny.cel.split('#')[0];
	if (!adresy.has(cel)) {
		dodaj('N', 'N5-nastepny-martwy', 'P1', s.plik, `${s.adres}: "Następny krok" -> ${cel} nie istnieje`);
		continue;
	}
	if (cel === s.adres) {
		dodaj('N', 'N5-nastepny-petla', 'P1', s.plik, `${s.adres}: "Następny krok" wskazuje na samego siebie`);
		continue;
	}
	// Kierunek: następny krok powinien iść w przód ścieżki nauki. Wyjście poza
	// sekcję jest poprawne (ostatni artykuł prowadzi do kolejnej sekcji).
	const docel = wgAdresu.get(cel);
	if (docel && docel.katalog === s.katalog && docel.rodzaj === 'artykul') {
		const a = s.sidebarOrder ?? 999;
		const b = docel.sidebarOrder ?? 999;
		if (b <= a) {
			dodaj(
				'N',
				'N5-nastepny-wstecz',
				'P2',
				s.plik,
				`${s.adres} (order ${a}) -> ${cel} (order ${b}): "Następny krok" cofa czytelnika`,
			);
		}
	}
}

// Cele "Następnego kroku" osiągane więcej niż raz i artykuły, do których
// łańcuch nigdy nie dociera - obie sytuacje łamią liniowość ścieżki.
const celeLancucha = new Map();
for (const s of strony) {
	if (s.rodzaj !== 'artykul' || !s.nastepny?.cel) continue;
	const cel = s.nastepny.cel.split('#')[0];
	if (!celeLancucha.has(cel)) celeLancucha.set(cel, []);
	celeLancucha.get(cel).push(s.adres);
}
for (const [cel, zrodla] of celeLancucha) {
	if (zrodla.length > 1) {
		dodaj(
			'N',
			'N5-nastepny-zbieg',
			'P2',
			cel,
			`${zrodla.length} artykułów prowadzi "Następnym krokiem" do ${cel}: ${zrodla.join(', ')}`,
		);
	}
}

// S1. Duplikaty sidebar.order w obrębie sekcji - kolejność w menu staje się
// wtedy zależna od alfabetu, a nie od zamierzonej ścieżki.
for (const [sekcja, lista] of artykulyWgSekcji) {
	const wgOrder = new Map();
	for (const s of lista) {
		const o = s.sidebarOrder;
		if (o === null || Number.isNaN(o)) {
			dodaj('S', 'S1-brak-order', 'P2', s.plik, `${s.adres}: brak sidebar.order`);
			continue;
		}
		if (!wgOrder.has(o)) wgOrder.set(o, []);
		wgOrder.get(o).push(s.adres);
	}
	for (const [o, adr] of wgOrder) {
		if (adr.length > 1) {
			dodaj('S', 'S1-duplikat-order', 'P2', sekcja, `sidebar.order ${o} użyty ${adr.length} razy: ${adr.join(', ')}`);
		}
	}
}

// GEO. Pola frontmattera zasilające dane strukturalne (src/content.config.ts).
for (const s of strony) {
	if (s.rodzaj !== 'artykul') continue;
	// Rozdzielone wagi: bez `description`/`educationalLevel` blok TechArticle
	// wychodzi kaleki, więc to usterka. `teaches`/`about`/`faq` wzbogacają
	// wynik wyszukiwania - ich brak to niewykorzystana szansa, nie defekt.
	const rdzen = [];
	if (!s.description) rdzen.push('description');
	if (!s.educationalLevel) rdzen.push('educationalLevel');
	if (rdzen.length) dodaj('GEO', 'GEO1-braki', 'P2', s.plik, `${s.adres}: brak pól ${rdzen.join(', ')}`);

	const wzbogacenie = [];
	if (s.teaches === 0) wzbogacenie.push('teaches');
	if (s.about === 0) wzbogacenie.push('about');
	if (s.faq === 0) wzbogacenie.push('faq');
	if (wzbogacenie.length) {
		dodaj('GEO', 'GEO3-wzbogacenie', 'P3', s.plik, `${s.adres}: brak pól ${wzbogacenie.join(', ')}`);
	}
	if (s.description && s.description.length > 160) {
		dodaj('GEO', 'GEO2-dlugi-opis', 'P3', s.plik, `${s.adres}: description ma ${s.description.length} znaków (>160)`);
	}
}

// Typografia.
for (const s of strony) {
	for (const t of s.typografia) {
		dodaj('typografia', 'T1', 'P3', s.plik, `${t.ile}x ${t.opis}`);
	}
}

// Kotwice: puste, wieloznaczne i rozjeżdżające się.
const kotwicaDoCeli = new Map();
const celDoKotwic = new Map();
for (const s of strony) {
	for (const l of s.wychodzace) {
		if (l.forma !== 'markdown' || !l.kotwica) continue;
		const cel = l.cel.split('#')[0];
		const k = l.kotwica.toLowerCase().replace(/\*\*/g, '').trim();
		if (KOTWICE_PUSTE.includes(k)) {
			dodaj('kotwice', 'K1-pusta', 'P2', `${s.plik}:${l.linia}`, `kotwica "${l.kotwica}" nie mówi, dokąd prowadzi (-> ${cel})`);
		}
		if (!kotwicaDoCeli.has(k)) kotwicaDoCeli.set(k, new Set());
		kotwicaDoCeli.get(k).add(cel);
		if (!celDoKotwic.has(cel)) celDoKotwic.set(cel, new Set());
		celDoKotwic.get(cel).add(l.kotwica);
	}
}
for (const [k, cele] of kotwicaDoCeli) {
	if (cele.size > 1 && !KOTWICE_WZGLEDNE.test(k)) {
		dodaj('kotwice', 'K2-wieloznaczna', 'P2', '-', `kotwica "${k}" prowadzi do ${cele.size} różnych stron: ${[...cele].join(', ')}`);
	}
}

/**
 * Cele opisywane wieloma nazwami. To NIE jest lista usterek - polska odmiana
 * ("o tokenach", "tokenów") jest poprawnym stylem, a nie niespójnością.
 * Materiał wejściowy dla wymiaru S: agent ocenia, czy któraś z nazw myli
 * czytelnika co do tego, dokąd trafi. Strona główna jest wyłączona - powroty
 * do niej z natury brzmią różnie w różnych kontekstach.
 */
const nazewnictwo = [];
for (const [cel, kotwice] of celDoKotwic) {
	if (cel !== '/' && kotwice.size >= 4) {
		nazewnictwo.push({ cel, kotwice: [...kotwice] });
	}
}
nazewnictwo.sort((a, b) => b.kotwice.length - a.kotwice.length);

// C1. Kwoty poza artykułem o kosztach. Świadomie P3 "do przeglądu", nie P2
// "usterka": skrypt widzi liczbę z walutą, ale nie odróżni cennika narzędzia
// (do usunięcia zgodnie z konwencją) od kwoty ilustracyjnej, historycznej
// inwestycji czy liczby z case study (te zostają). Rozstrzyga człowiek.
for (const s of strony) {
	for (const k of s.kwoty) {
		dodaj(
			'ceny',
			'C1-kwota',
			'P3',
			`${s.plik}:${k.linia}`,
			`kwota "${k.trafienie}" - sprawdź, czy to cennik narzędzia (wtedy do \`${PLIK_Z_CENAMI}\` lub link do dostawcy), czy liczba ilustracyjna/historyczna (wtedy zostaje)`,
		);
	}
}

// N6. Artykuł nieosiągalny ze strony zbiorczej własnej sekcji. Strona sekcji
// jest środkowym poziomem breadcrumba i punktem wejścia z menu - artykuł,
// którego nie ma w jej CardGrid, istnieje tylko dla tego, kto trafi nań
// linkiem z innego tekstu.
for (const s of strony) {
	if (s.rodzaj !== 'artykul' || !s.katalog) continue;
	const zbiorcza = wgAdresu.get(`/${s.katalog}/`);
	if (!zbiorcza) continue;
	const zeZbiorczej = zbiorcza.wychodzace.some((l) => l.cel.split('#')[0] === s.adres);
	if (!zeZbiorczej) {
		dodaj('N', 'N6-poza-zbiorcza', 'P2', s.plik, `${s.adres}: brak na stronie zbiorczej /${s.katalog}/`);
	}
}

// Kontrola spójności skryptu z konfiguracją Astro - lista SEKCJI powyżej jest
// kopią src/config/sections.ts i musi się z nią zgadzać.
const katalogiSekcji = readdirSync(SRC_DOCS)
	.filter((n) => !n.startsWith('_') && statSync(join(SRC_DOCS, n)).isDirectory())
	.filter((n) => !POZA_SCIEZKA.includes(n))
	.sort();
const rozjazdSekcji = katalogiSekcji.filter((n) => !SEKCJE.includes(n)).concat(
	SEKCJE.filter((n) => !katalogiSekcji.includes(n)),
);

// --- raport ----------------------------------------------------------------

const wszystkie = Object.values(ustalenia).flat();
const wg = (w) => wszystkie.filter((u) => u.waga === w).length;

const dane = {
	data: new Date().toISOString().slice(0, 10),
	strony,
	przychodzace: Object.fromEntries([...przychodzace].map(([k, v]) => [k, v.length])),
	ustalenia,
	nazewnictwo,
	rozjazdSekcji,
	statystyki: {
		stron: strony.length,
		artykulow: strony.filter((s) => s.rodzaj === 'artykul').length,
		wystapienLinkow: strony.reduce((n, s) => n + s.wychodzace.length, 0),
		unikalnychCeli: new Set(strony.flatMap((s) => s.wychodzace.map((l) => l.cel.split('#')[0]))).size,
		linkowZewnetrznych: strony.reduce((n, s) => n + s.zewnetrzne.length, 0),
		P1: wg('P1'),
		P2: wg('P2'),
		P3: wg('P3'),
	},
};

const args = process.argv.slice(2);
const idxJson = args.indexOf('--json');
if (idxJson !== -1 && args[idxJson + 1]) {
	writeFileSync(args[idxJson + 1], JSON.stringify(dane, null, '\t'), 'utf8');
}
if (args.includes('--tylko-json')) {
	process.stdout.write(JSON.stringify(dane, null, '\t'));
	process.exit(0);
}

// --- szkielet TODO_AUDYT_INT.md -------------------------------------------

const KOLEJNOSC = [...SEKCJE, ...POZA_SCIEZKA, ''];
const posortowane = [...strony].sort((a, b) => {
	const ka = KOLEJNOSC.indexOf(a.katalog);
	const kb = KOLEJNOSC.indexOf(b.katalog);
	if (ka !== kb) return ka - kb;
	if (a.rodzaj === 'zbiorcza' && b.rodzaj !== 'zbiorcza') return -1;
	if (b.rodzaj === 'zbiorcza' && a.rodzaj !== 'zbiorcza') return 1;
	return (a.sidebarOrder ?? 999) - (b.sidebarOrder ?? 999) || a.adres.localeCompare(b.adres);
});

const L = [];
L.push(`# TODO_AUDYT_INT - audyt merytoryczny treści przewodnikai.pl (${dane.data})`);
L.push('');
L.push('> Plik generowany przez `node docs-audyt/skanuj.mjs`. Metoda audytu: `docs-audyt/procedura.md`.');
L.push('> Sekcje A i B pochodzą ze skanu (dane mechaniczne). Sekcję C wypełniają subagenty.');
L.push('');
L.push('## Stan skanu');
L.push('');
L.push('| Miara | Wartość |');
L.push('| --- | --- |');
L.push(`| Stron treści | ${dane.statystyki.stron} |`);
L.push(`| w tym artykułów | ${dane.statystyki.artykulow} |`);
L.push(`| Wystąpień linków wewnętrznych | ${dane.statystyki.wystapienLinkow} |`);
L.push(`| Unikalnych celów wewnętrznych | ${dane.statystyki.unikalnychCeli} |`);
L.push(`| Linków zewnętrznych | ${dane.statystyki.linkowZewnetrznych} |`);
L.push(`| Ustalenia skanu: P1 / P2 / P3 | ${dane.statystyki.P1} / ${dane.statystyki.P2} / ${dane.statystyki.P3} |`);
L.push('');
if (rozjazdSekcji.length) {
	L.push(`:::caution`);
	L.push(`Lista sekcji w \`docs-audyt/skanuj.mjs\` rozjechała się z \`src/config/sections.ts\`: ${rozjazdSekcji.join(', ')}`);
	L.push(`:::`);
	L.push('');
}

L.push('## A. Strony do audytu');
L.push('');
L.push('Kolumna **Ocena** jest pusta - wypełnia ją subagent w fazie B (skala: OK / UWAGA / BŁĄD).');
L.push('Wymiary: **D** dane, **A** aktualność, **K** kompletność, **J** jasność, **S** spójność, **N** nawigacja.');
L.push('');
L.push('| # | Adres | Plik | Rodzaj | Słów | Linki we/wy | FAQ | Ocena D/A/K/J/S/N |');
L.push('| ---: | --- | --- | --- | ---: | :---: | ---: | --- |');
posortowane.forEach((s, i) => {
	const we = przychodzace.get(s.adres).length;
	L.push(
		`| ${i + 1} | \`${s.adres}\` | \`${s.plik}\` | ${s.rodzaj} | ${s.slowa} | ${we}/${s.wychodzace.length} | ${s.faq} | |`,
	);
});
L.push('');

L.push('## B. Ustalenia skanu (mechaniczne)');
L.push('');
const GRUPY = [
	['N', 'Nawigacja i graf linków'],
	['S', 'Spójność struktury'],
	['GEO', 'Pola danych strukturalnych'],
	['ceny', 'Kwoty poza artykułem o kosztach'],
	['kotwice', 'Teksty kotwic'],
	['typografia', 'Typografia'],
];
for (const [klucz, tytul] of GRUPY) {
	const lista = ustalenia[klucz];
	L.push(`### ${tytul} (${lista.length})`);
	L.push('');
	if (lista.length === 0) {
		L.push('Bez uwag.');
		L.push('');
		continue;
	}
	L.push('| Waga | Kod | Miejsce | Opis |');
	L.push('| --- | --- | --- | --- |');
	for (const u of lista.sort((a, b) => a.waga.localeCompare(b.waga))) {
		L.push(`| ${u.waga} | ${u.kod} | \`${u.plik}\` | ${u.opis.replace(/\|/g, '\\|')} |`);
	}
	L.push('');
}

if (nazewnictwo.length) {
	L.push('### Materiał pomocniczy: cele opisywane wieloma nazwami');
	L.push('');
	L.push('To nie jest lista usterek - polska odmiana to poprawny styl, nie niespójność.');
	L.push('Wejście dla wymiaru **S**: czy któraś z nazw myli czytelnika co do tego, dokąd trafi.');
	L.push('');
	L.push('| Cel | Nazw | Warianty |');
	L.push('| --- | ---: | --- |');
	for (const n of nazewnictwo) {
		L.push(`| \`${n.cel}\` | ${n.kotwice.length} | ${n.kotwice.join(' \\| ')} |`);
	}
	L.push('');
}

L.push('## C. Ustalenia merytoryczne (subagenty)');
L.push('');
L.push('_Do wypełnienia w fazie B-E audytu. Format pozycji opisuje `docs-audyt/procedura.md`._');
L.push('');

writeFileSync(RAPORT, L.join('\n'), 'utf8');

console.log(`Zeskanowano ${dane.statystyki.stron} stron (${dane.statystyki.artykulow} artykułów).`);
console.log(`Linki wewnętrzne: ${dane.statystyki.wystapienLinkow} wystąpień -> ${dane.statystyki.unikalnychCeli} celów.`);
console.log(`Linki zewnętrzne: ${dane.statystyki.linkowZewnetrznych}.`);
console.log('');
for (const [klucz, tytul] of GRUPY) {
	console.log(`${tytul}: ${ustalenia[klucz].length}`);
}
console.log('');
console.log(`Razem: P1 ${dane.statystyki.P1} / P2 ${dane.statystyki.P2} / P3 ${dane.statystyki.P3}`);
if (rozjazdSekcji.length) console.log(`UWAGA: rozjazd listy sekcji: ${rozjazdSekcji.join(', ')}`);
console.log(`Zapisano ${RAPORT}`);
