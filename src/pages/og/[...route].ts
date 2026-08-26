import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';

const entries = await getCollection('docs');

// Klucz mapy staje się segmentem trasy: /og/<id>.png
// Strona główna ma w kolekcji surowy identyfikator 'index' (plik
// src/content/docs/index.mdx) - inny niż `route.id` z Astro.locals.starlightRoute
// używany w Head.astro, który Starlight normalizuje dla strony głównej do
// pustego łańcucha. Odfiltrowujemy oba warianty, żeby nie generować
// nieużywanego obrazu dla strony głównej - Head.astro i tak używa dla niej
// statycznego og-default.png.
const pages = Object.fromEntries(
	entries.filter((entry) => entry.id !== '' && entry.id !== 'index').map((entry) => [entry.id, entry.data]),
);

// OGImageRoute jest funkcją async - bez `await` destrukturyzacja łapie
// właściwości z obietnicy (undefined), a nie z jej rozwiązanej wartości.
// Nazwa parametru trasy (`route`) wynika z nazwy pliku `[...route].ts` -
// biblioteka wykrywa ją sama z `routePattern`, więc nie przyjmuje jej jako opcji.
export const { getStaticPaths, GET } = await OGImageRoute({
	pages,
	getImageOptions: (_path, page: (typeof pages)[string]) => ({
		title: page.title,
		description: page.description ?? 'Otwarta baza wiedzy o AI po polsku',
		// CanvasKit dekoduje tylko formaty rastrowe (PNG/JPEG/WebP), nie SVG -
		// og-logo.png (144x144) to zrasteryzowany znak marki. Znak jest dwukolorowy
		// (teal + biel) i czyta się wprost na ciemnym tle karty, więc nie wymaga już
		// wymuszania koloru, jak poprzedni monochromatyczny favicon. og-logo.png jest
		// ŚWIADOMIE odpięty od favicon.svg: favicon to portret (awatar), karta OG
		// zostaje przy znaku marki. Zmiana favicon.svg nie wymaga już regeneracji
		// tego pliku.
		logo: { path: './public/og-logo.png', size: [72, 72] },
		bgGradient: [
			[24, 24, 27],
			[39, 39, 42],
		],
		border: { color: [13, 148, 136], width: 16, side: 'inline-start' },
		padding: 70,
		// Domyślny font Noto Sans w astro-og-canvas ładuje wyłącznie podzbiór
		// "latin" (bez ą, ę, ł, ż) - polskie znaki renderowały się jako puste
		// kwadraty (tofu). Podzbiory Fontsource "latin" + "latin-ext" łączone
		// razem w jednym FontMgr wyglądałyby na rozwiązanie, ale w praktyce
		// psują dokładnie te same cztery litery (błąd CanvasKit przy scalaniu
		// dwóch plików pod tą samą nazwą rodziny czcionek - sprawdzone
		// empirycznie). Zamiast tego używamy jednego pełnego pliku Noto Sans
		// (source Google Fonts, bez podziału na podzbiory), który pokrywa
		// łacinę podstawową i rozszerzoną w jednym foncie - patrz
		// src/pages/og/_fonts/OFL.txt co do licencji. Plik jest
		// zsubsetowany do faktycznie używanego zakresu znaków (podstawowa
		// łacina + polskie diakrytyki + cyfry + interpunkcja) - font
		// wciąż wariabilny (wght/wdth), więc dobór wagi Bold/Normal
		// poniżej działa tak samo jak przed subsetowaniem. Katalog nosi
		// prefiks podkreślenia (`_fonts`) - to udokumentowany mechanizm
		// Astro, który bezwarunkowo wyklucza ścieżkę z routingu, więc
		// plik nie może przypadkiem stać się trasą.
		fonts: ['./src/pages/og/_fonts/noto-sans-full.ttf'],
		font: {
			title: { size: 64, weight: 'Bold', color: [255, 255, 255], lineHeight: 1.2 },
			description: { size: 30, weight: 'Normal', color: [161, 161, 170], lineHeight: 1.4 },
		},
	}),
});
