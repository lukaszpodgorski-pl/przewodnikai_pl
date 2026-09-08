import { SECTION_LABELS } from '../config/sections';
import { PREFIX_STRON_POWROTU, STRONY_POWROTU } from '../config/newsletter';

/**
 * Kontekst strony dla warstwy danych - `page_type` w rozumieniu etapu D3
 * runbooka analityki.
 *
 * Liczony z rejestru sekcji w `src/config/sections.ts`, nie z osobnej listy.
 * Dzieki temu nowa sekcja dopisana do rejestru klasyfikuje sie tu sama, tak samo
 * jak robi to juz klasyfikacja artykulow w `Head.astro`.
 *
 * UWAGA NA UKOSNIK: ten serwis ma `trailingSlash: 'always'`, odwrotnie niz
 * kursn8n.pl. `split('/').filter(Boolean)` radzi sobie z obiema postaciami, ale
 * porownania do stalych ze `STRONY_POWROTU` juz nie - tam adresy sa zapisane
 * z koncowym ukosnikiem i tak musza byc porownywane.
 */

/**
 * Strony prawne wewnatrz sekcji `zasoby`. Bez tego wyjatku regulamin liczylby
 * sie jako zwykly artykul merytoryczny i zawyzal statystyki czytelnictwa.
 */
const SLUGI_PRAWNE: ReadonlySet<string> = new Set(['regulamin', 'polityka-prywatnosci']);

export function pageType(pathname: string): string {
	const segments = pathname.split('/').filter(Boolean);
	const section = segments[0];

	if (section === undefined) return 'home';
	if (pathname.startsWith(PREFIX_STRON_POWROTU)) return 'newsletter';
	if (section === 'sciezki') return segments.length === 1 ? 'hub-sciezek' : 'sciezka';
	if (section === 'zasoby' && segments[1] !== undefined && SLUGI_PRAWNE.has(segments[1])) {
		return 'prawne';
	}
	if (SECTION_LABELS[section] !== undefined) {
		return segments.length === 1 ? 'sekcja' : 'artykul';
	}
	return 'inna';
}

/**
 * Zdarzenie lejka newslettera dla stron powrotnych Sendy, albo `null`.
 *
 * Formularz jest zwyklym POST-em do Sendy z pelnym przeladowaniem strony, wiec
 * zdarzenia NIE da sie sensownie wyslac przy kliknieciu "Zapisz sie" - wyscig
 * z nawigacja gubilby czesc trafien, a policzone bylyby proby, nie zapisy.
 * Dlatego liczymy je tam, gdzie Sendy odsyla po wykonaniu operacji.
 *
 * Double opt-in ma dwa etapy i celowo nie sklejamy ich w jedno zdarzenie:
 * - `newsletter_signup` - formularz przyjety, mail potwierdzajacy wyslany,
 * - `newsletter_confirmed` - czlowiek kliknal link w mailu; to jest realna
 *   konwersja i to ona ma byc zdarzeniem kluczowym w GA4.
 *
 * Pozostale strony powrotu (juz zapisany, blad, brak zgody, zgoda potwierdzona
 * po kampanii re-consent) zdarzenia NIE wysylaja - nie sa ani zapisem, ani
 * wypisem, a wrzucenie ich do lejka rozmylaloby konwersje.
 *
 * Mapa jest budowana ze stalych `STRONY_POWROTU`, wiec zmiana adresu strony
 * powrotu w jednym miejscu przenosi sie tutaj sama.
 */
const ZDARZENIA_LEJKA: Readonly<Record<string, string>> = {
	[STRONY_POWROTU.poZapisie]: 'newsletter_signup',
	[STRONY_POWROTU.poPotwierdzeniu]: 'newsletter_confirmed',
	[STRONY_POWROTU.poWypisaniu]: 'newsletter_unsubscribe',
};

export function newsletterEvent(pathname: string): string | null {
	return ZDARZENIA_LEJKA[pathname] ?? null;
}
