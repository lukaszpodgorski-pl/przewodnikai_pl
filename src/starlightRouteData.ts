import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

/**
 * Dokłada przycisk powrotu do strony 404.
 *
 * Domyślna strona 404 Starlight kończy się na samym komunikacie "Nie znaleziono"
 * i zostawia czytelnika bez wyjścia. Starlight buduje ją z pola `hero`, którego
 * lista `actions` jest pusta (utils/routing/data.ts, `get404Route`) - dopisanie
 * tam jednej pozycji daje gotowy, ostylowany przycisk, bez własnego CSS-a.
 *
 * Dlaczego middleware, a nie plik strony:
 *
 * - `src/pages/404.astro` koliduje z trasą wstrzykiwaną przez Starlight.
 *   Astro dziś wybiera stronę użytkownika, ale ostrzega przy każdym buildzie:
 *   "A collision will result in a hard error in following versions of Astro".
 * - `src/content/docs/404.md` to wbudowany hak Starlight (`getEntry('docs', '404')`),
 *   ale wpis kolekcji `docs` trafia też do `getRoutes()`, więc powstałaby
 *   dodatkowa, zwykła strona pod `/404/` - indeksowalna, ze statusem 200.
 *   Czyli dokładnie ten soft-404, którego unikamy w wrangler.jsonc.
 *
 * Zostaje `routeMiddleware` - udokumentowane wejście Starlight, bez kolizji tras
 * i bez nadmiarowej strony. Mutacja jest bezpieczna: middleware.ts wpina do
 * `locals` głęboką kopię danych trasy (`klona`), więc zmiana nie wycieka na inne
 * strony.
 */
export const onRequest = defineRouteMiddleware((context) => {
	const route = context.locals.starlightRoute;

	// `404` to identyfikator wpisu zastępczego, który Starlight tworzy wyłącznie
	// dla tej trasy. Żaden artykuł w src/content/docs/ go nie używa.
	if (route.entry.id !== '404') return;

	const hero = route.entry.data.hero;
	if (!hero) return;

	// Bez ikony celowo. Starlight renderuje ikonę zawsze ZA etykietą
	// (Hero.astro -> LinkButton) i nie da się jej przenieść przed tekst bez
	// własnego CSS-a. Strzałka "wstecz" stojąca po prawej stronie napisu kłóci
	// się sama ze sobą, a strzałka w prawo kłóci się ze słowem "Wróć".
	hero.actions = [
		{
			text: 'Wróć na stronę główną',
			link: '/',
			variant: 'primary',
		},
	];
});
