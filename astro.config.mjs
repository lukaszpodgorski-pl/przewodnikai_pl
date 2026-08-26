// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt';
import sitemap from '@astrojs/sitemap';
import { lastModMap } from './scripts/sitemap-lastmod.mjs';
import { SECTIONS } from './src/config/sections';

import { GITHUB_REPO } from './src/config/repo';

// Prefiks stron pomocniczych obsługi newslettera (cele przekierowań z Sendy).
// Mają `noindex: true` we frontmatterze i są pomijane w sitemapie.
// UWAGA: ta sama stała występuje w scripts/verify-geo.mjs, gdzie służy do
// wyłączenia tych stron z klasyfikacji "artykuł" i z liczby URL-i w sitemapie.
// Zmiana tutaj wymaga zmiany tam - inaczej CI zapali się na czerwono.
const NOINDEX_PREFIX = '/newsletter/';

// Mapa liczona raz, na starcie builda - nie per URL.
const LAST_MOD = lastModMap();

// Adresy stron zbiorczych sekcji - własny próg priorytetu w sitemapie.
const SECTION_PATHS = new Set(SECTIONS.map(({ slug }) => `/${slug}/`));

// https://astro.build/config
export default defineConfig({
	// `site` jest wymagane m.in. dla sitemapy i kanonicznych URL-i
	site: 'https://przewodnikai.pl',
	trailingSlash: 'always',
	integrations: [
		starlight({
			title: 'Przewodnik AI',
			description:
				'Otwarta, społecznościowa baza wiedzy o sztucznej inteligencji po polsku. Kurs AI od podstaw - bez żargonu, z ćwiczeniem na każdej lekcji.',
			customCss: ['./src/styles/custom.css'],
			components: {
				Footer: './src/components/Footer.astro',
				Head: './src/components/Head.astro',
				MarkdownContent: './src/components/MarkdownContent.astro',
				// Zamiast "Edytuj tę stronę" - zgłoszenie uwagi. Repozytorium
				// publiczne jest lustrem: skrypt publikacji przepisuje w nim treść
				// przy każdym wydaniu, więc edycja pliku po tamtej stronie zostałaby
				// nadpisana bez śladu. Powód i szczegóły: src/components/ZglosUwage.astro.
				EditLink: './src/components/ZglosUwage.astro',
			},
			// Polski jako root locale: polskie UI Starlight, <html lang="pl">,
			// polski stemming Pagefind - bez prefiksu /pl/ w adresach.
			locales: {
				root: { label: 'Polski', lang: 'pl' },
			},
			social: [{ icon: 'github', label: 'GitHub', href: GITHUB_REPO }],
			// `editLink` celowo nieustawione - własny komponent EditLink
			// (ZglosUwage.astro) nie korzysta z `editUrl` i renderuje się zawsze.
			lastUpdated: true,
			// Dokłada przycisk powrotu do strony 404 - patrz komentarz w tym pliku.
			routeMiddleware: './src/starlightRouteData.ts',
			plugins: [starlightLlmsTxt()],
			sidebar: SECTIONS.map(({ slug, label }) => ({
				label,
				items: [
					// Strona zbiorcza sekcji, wpisana jawnie. `autogenerate` jej nie
					// obejmuje, bo `<sekcja>/index.mdx` ma `sidebar.hidden: true` -
					// inaczej wpis pojawiłby się w grupie dwa razy.
					{ label: 'Przegląd', link: `/${slug}/` },
					{ autogenerate: { directory: slug } },
				],
			})),
		}),
		sitemap({
			changefreq: 'weekly',
			serialize(item) {
				const { pathname } = new URL(item.url);
				// Strony pomocnicze newslettera mają `noindex: true` we frontmatterze
				// (Head.astro emituje wtedy meta robots). Strona oznaczona noindex nie
				// może zostać w sitemapie - mapa mówiłaby wyszukiwarce "zindeksuj",
				// a znacznik "nie indeksuj". Zwrócenie undefined usuwa wpis z mapy.
				// Uwaga: scripts/verify-geo.mjs zna ten wyjątek i odejmuje te strony
				// od oczekiwanej liczby URL-i - zmiana tu wymaga zmiany tam.
				if (pathname.startsWith(NOINDEX_PREFIX)) return undefined;
				const lastmod = LAST_MOD.get(pathname);
				if (lastmod) item.lastmod = lastmod;
				// Progi odzwierciedlają hierarchię: strona główna, strony zbiorcze
				// sekcji, artykuły, ścieżki nauki. Google ignoruje `priority`, więc
				// jest to porządek dla nas i dla pozostałych wyszukiwarek.
				// Uwaga: scripts/verify-geo.mjs sprawdza obecność każdego progu.
				if (pathname === '/') item.priority = 1.0;
				else if (SECTION_PATHS.has(pathname)) item.priority = 0.9;
				else if (pathname.startsWith('/sciezki/')) item.priority = 0.5;
				else item.priority = 0.8;
				return item;
			},
		}),
	],
	vite: {
		build: {
			rolldownOptions: {
				// `satteri` (Astro's markdown parser) tries to load its wasm32-wasi
				// fallback binary when Vite resolves the "prerender" environment with
				// browser-like conditions (as Cloudflare's build does). That optional
				// dependency is gated on `cpu: ["wasm32"]` in its package.json, which
				// npm never matches on any real host, so it's never installed and the
				// bundler can't resolve it. It's unused in this code path, so mark it
				// external instead of bundling it.
				external: ['@bruits/satteri-wasm32-wasi'],
			},
		},
	},
});
