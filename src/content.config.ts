import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				// GEO/AEO — dane strukturalne (schema.org) przenoszone z meta.php
				// starego serwisu; generowanie JSON-LD z tych pól: Etap 2 migracji.
				educationalLevel: z
					.enum(['Beginner', 'Intermediate', 'Advanced'])
					.optional(),
				teaches: z.array(z.string()).optional(),
				about: z
					.array(z.object({ name: z.string(), sameAs: z.string().url() }))
					.optional(),
				mentions: z
					.array(
						z.object({
							name: z.string(),
							sameAs: z.string().url(),
							type: z.string().optional(),
						}),
					)
					.optional(),
				faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
				// Ukrywa wygenerowaną sekcję "Częste pytania" w treści strony, przy
				// zachowaniu bloku FAQPage w JSON-LD (Head.astro nie sprawdza tej
				// flagi). Ustaw, gdy artykuł sam w sobie jest FAQ - pytania stoją
				// w treści jako nagłówki `##` - i wygenerowana sekcja powielałaby
				// dokładnie te same pytania.
				//
				// Dziś nie używa jej żaden plik: jedyna taka strona (zasoby/faq.md)
				// została usunięta, bo powtarzała odpowiedzi z artykułów. Włączając
				// tę flagę sprawdź asercję "FAQPage zawsze towarzyszy widocznej
				// sekcji" w scripts/verify-geo.mjs - potrzebuje wtedy wyjątku.
				faqHidden: z.boolean().optional(),
				// Wyłącza indeksowanie strony: `<meta name="robots" content="noindex">`
				// w Head.astro plus pominięcie w sitemapie (astro.config.mjs).
				// Dla stron pomocniczych, które są celem przekierowania z zewnętrznej
				// usługi i nie mają wartości w wynikach wyszukiwania - np. potwierdzenia
				// zapisu na newsletter. Strona oznaczona `noindex` NIE MOŻE zostać
				// w sitemapie: mapa mówiłaby wyszukiwarce "zindeksuj", a znacznik
				// "nie indeksuj", co Google raportuje jako błąd.
				noindex: z.boolean().optional(),
				// Etap przeglądu redakcyjnego - steruje tym, czy strona trafia do
				// publicznego repo (scripts/publish.mjs). Trzy stany, bo dwa nie
				// oddają rzeczywistości przebudowy 2026-08:
				//   szkic   - nieprzejrzany, WYCIĘTY z produkcji. Linki do niego są
				//             zamieniane na zwykły tekst, adres dostaje 302 na stronę
				//             zbiorczą sekcji.
				//   zastane - nieprzejrzany, ale publikowany. Treść odziedziczona po
				//             starym serwisie: stoi publicznie od miesięcy, więc jej
				//             zdjęcie nic nie chroni, a psuje SEO. Do przejrzenia.
				//   gotowe  - przejrzany przez właściciela, publikowany.
				// Domyślnie `szkic`: nowy plik nie wycieknie na produkcję przez
				// zapomnienie. Publikowane są `zastane` i `gotowe`.
				// Licznik postępu przeglądu: npm run status
				status: z.enum(['szkic', 'zastane', 'gotowe']).default('szkic'),
			}),
		}),
	}),
};
