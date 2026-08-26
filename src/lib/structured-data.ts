/**
 * Czyste funkcje budujące obiekty JSON-LD. Zero API Astro - dzięki temu
 * dają się wywołać i sprawdzić bez uruchamiania frameworka.
 */
import { SECTION_LABELS } from '../config/sections';
import autor from '../data/autor.json';

export const SITE_URL = 'https://przewodnikai.pl';
export const SITE_NAME = 'Przewodnik AI';
const LICENSE = 'https://creativecommons.org/licenses/by-sa/4.0/';

/**
 * Dane autora są ZVENDOROWANĄ KOPIĄ z repo-profilu
 * github.com/lukaszpodgorski-pl/author-profile (profile.json).
 * Edytuj tam, potem `npm run profile:sync` - nie edytuj autor.json ręcznie.
 */
export const AUTHOR = {
	'@type': 'Person',
	name: autor.name,
	url: autor.url,
	image: autor.photo,
	jobTitle: autor.jobTitle,
	description: autor.description,
	sameAs: autor.sameAs,
} as const;

export interface ThingRef {
	name: string;
	sameAs: string;
	type?: string;
}

export interface FaqItem {
	q: string;
	a: string;
}

export interface BasicInput {
	pathname: string;
	title: string;
	description?: string;
	image?: string;
}

export interface ArticleInput extends BasicInput {
	dateModified?: Date;
	educationalLevel?: string;
	teaches?: string[];
	about?: ThingRef[];
	mentions?: ThingRef[];
}

/** Składa absolutny URL z zachowaniem końcowego ukośnika (trailingSlash: 'always'). */
export function absoluteUrl(pathname: string): string {
	return new URL(pathname, SITE_URL).href;
}

function toThing(ref: ThingRef) {
	return { '@type': ref.type ?? 'Thing', name: ref.name, sameAs: ref.sameAs };
}

/** Dokłada klucz tylko gdy wartość jest niepusta - unika pustych pól w JSON-LD. */
function withOptional<T extends object>(base: T, extras: Record<string, unknown>): T {
	const out: Record<string, unknown> = { ...base };
	for (const [key, value] of Object.entries(extras)) {
		if (value === undefined || value === null) continue;
		if (Array.isArray(value) && value.length === 0) continue;
		out[key] = value;
	}
	return out as T;
}

interface Crumb {
	name: string;
	item: string;
}

/**
 * Etykieta poziomu pośredniego dla pierwszego segmentu ścieżki, albo
 * `undefined`, gdy segment nie odpowiada żadnej stronie zbiorczej.
 * `sciezki` nie jest sekcją kursu (nie ma go w SECTIONS), ale ma własną
 * stronę indeksową, więc traktujemy go tak samo.
 */
function midLevelLabel(segment: string): string | undefined {
	return segment === 'sciezki' ? 'Ścieżki nauki' : SECTION_LABELS[segment];
}

export function buildBreadcrumbs(pathname: string, title: string) {
	const segments = pathname.split('/').filter(Boolean);
	const items: Crumb[] = [{ name: 'Strona główna', item: absoluteUrl('/') }];

	// Poziom pośredni (sekcja) dodajemy wyłącznie wtedy, gdy prowadzi do
	// istniejącej strony. Google wymaga pola `item` we wszystkich elementach
	// `ListItem` poza ostatnim i odrzuca cały `BreadcrumbList`, gdy któregoś
	// brakuje - dlatego brak etykiety oznacza pominięcie poziomu, a nie wpis
	// bez adresu. Każda z siedmiu sekcji ma dziś stronę indeksową
	// (src/content/docs/<sekcja>/index.mdx), więc `item` ma na co wskazywać.
	// Sama strona sekcji ma jeden segment i trafia od razu do wpisu końcowego.
	if (segments.length > 1) {
		const label = midLevelLabel(segments[0]);
		if (label) items.push({ name: label, item: absoluteUrl(`/${segments[0]}/`) });
	}

	items.push({ name: title, item: absoluteUrl(pathname) });

	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((entry, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: entry.name,
			item: entry.item,
		})),
	};
}

export function buildArticle(input: ArticleInput) {
	return withOptional(
		{
			'@context': 'https://schema.org',
			'@type': 'TechArticle',
			headline: input.title,
			url: absoluteUrl(input.pathname),
			mainEntityOfPage: absoluteUrl(input.pathname),
			inLanguage: 'pl-PL',
			license: LICENSE,
			isAccessibleForFree: true,
			author: AUTHOR,
			publisher: AUTHOR,
		},
		{
			description: input.description,
			image: input.image,
			dateModified: input.dateModified?.toISOString(),
			educationalLevel: input.educationalLevel,
			teaches: input.teaches,
			about: input.about?.map(toThing),
			mentions: input.mentions?.map(toThing),
		},
	);
}

export function buildCollectionPage(input: BasicInput) {
	return withOptional(
		{
			'@context': 'https://schema.org',
			'@type': 'CollectionPage',
			name: input.title,
			url: absoluteUrl(input.pathname),
			inLanguage: 'pl-PL',
			isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: absoluteUrl('/') },
		},
		{ description: input.description, image: input.image },
	);
}

export function buildWebSite() {
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				name: SITE_NAME,
				url: absoluteUrl('/'),
				inLanguage: 'pl-PL',
				license: LICENSE,
				publisher: AUTHOR,
			},
			AUTHOR,
		],
	};
}

export function buildFaqPage(items: FaqItem[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: items.map((item) => ({
			'@type': 'Question',
			name: item.q,
			acceptedAnswer: { '@type': 'Answer', text: item.a },
		})),
	};
}
