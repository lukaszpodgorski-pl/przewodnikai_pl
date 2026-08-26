/**
 * Konfiguracja zapisu na newsletter (Sendy, hosting wlasny).
 *
 * Formularz wysyla zwykly POST prosto do Sendy - bez JS i bez kodu po stronie
 * serwera, co jest warunkiem koniecznym przy statycznym hostingu na Workers.
 * Wzorzec przeniesiony z dzialajacego formularza na kursn8n.pl.
 */

export const NEWSLETTER = {
	/** Endpoint instancji Sendy. Wspolny dla wszystkich serwisow. */
	endpoint: 'https://lukaszpodgorski.pl/sendy/subscribe',

	/**
	 * ID listy w Sendy zalozonej dla przewodnikai.pl.
	 *
	 * To MUSI byc lista tego serwisu. Lista kursu n8n ma ID
	 * Si8V763FyPwNlZ36k4Wbr6Ww i uzycie jej tutaj byloby nie tylko bledem
	 * produktowym, ale i naruszeniem zgody: czlowiek zapisuje sie na
	 * powiadomienia o przewodniku, nie o kursie n8n.
	 */
	listId: 'UNt6763763VoqjJOOBfI5Hz88w',

	/**
	 * Polityka prywatnosci wprost wymienia domene przewodnikai.pl obok
	 * aitomate.pl, lukaszpodgorski.pl, szanujczas.pl i myeye.pl, wiec ten sam
	 * dokument obsluguje ten serwis - nie trzeba osobnego.
	 *
	 * Od 2026-08-20 dokument ma sekcje §3a "Newsletter i powiadomienia e-mail":
	 * cel przetwarzania, podstawa prawna (art. 6 ust. 1 lit. a), opis double
	 * opt-in, zakres danych, Sendy + SES Frankfurt, okres przechowywania,
	 * wycofanie zgody. Zrodlo: `aitomate.pl/public_html/polityka-prywatnosci.html`.
	 */
	privacyUrl: 'https://aitomate.pl/polityka-prywatnosci',

	/**
	 * Adres, pod ktorym mozna wycofac zgode inaczej niz linkiem w stopce maila.
	 *
	 * Art. 7 ust. 3 RODO wymaga, by wycofanie zgody bylo rownie latwe jak jej
	 * udzielenie, wiec ten adres musi realnie dzialac - wskazanie martwej
	 * skrzynki zamykaloby te droge.
	 *
	 * Adres potwierdzony przez wlasciciela 2026-07-22 i zgodny z
	 * src/content/docs/zasoby/kontakt.md. Tekst zgody w panelu Sendy wskazywal
	 * wczesniej `kontakt@przewodnikai.pl` - poprawione 2026-08-21, oba miejsca
	 * mowia teraz to samo.
	 */
	contactEmail: 'kontakt@lukaszpodgorski.pl',
} as const;

/**
 * Strony, na ktore Sendy odsyla czlowieka po kazdej akcji.
 *
 * Do wklejenia w panelu Sendy (ustawienia listy) jako pelne adresy z domena.
 * Wczesniej Sendy odsylal na strone glowna z parametrem w adresie
 * (`/?verification=sent` itd.), a strona glowna w ogole na to nie reagowala -
 * czlowiek ladowal na zwyklej stronie bez informacji, czy zapis sie udal.
 *
 * Dedykowane strony zamiast parametrow, bo:
 *   - dzialaja bez JS (serwis jest statyczny, parametru nie da sie obsluzyc
 *     przy generowaniu),
 *   - przy wlaczonym double opt-in strona "sprawdz skrzynke" jest najwazniejszym
 *     ekranem calego procesu: bez kliknięcia w link zapis nie zostaje dokonczony,
 *   - mieszcza wyjasnienie "co dalej", ktore nie zmiescilo by sie w banerze.
 *
 * Kazda ma `noindex: true` we frontmatterze i jest pomijana w sitemapie.
 */
/** Wspolny prefiks stron powrotu - uzywany do wykluczen w Footer.astro. */
export const PREFIX_STRON_POWROTU = '/newsletter/';

export const STRONY_POWROTU = {
	/** Subscribe success page - po wyslaniu formularza (double opt-in: mail wyslany). */
	poZapisie: '/newsletter/sprawdz-skrzynke/',
	/** Subscription confirmed page - po kliknieciu linku potwierdzajacego. */
	poPotwierdzeniu: '/newsletter/potwierdzone/',
	/** Already subscribed page - adres juz jest na liscie. */
	juzZapisany: '/newsletter/juz-zapisany/',
	/** Unsubscribe page - po wypisaniu sie. */
	poWypisaniu: '/newsletter/wypisano/',
	/**
	 * Error page - kazdy nieudany zapis: bledny adres, wygasly lub juz uzyty
	 * link potwierdzajacy, chwilowy problem po stronie serwera. Jedna strona
	 * na wszystkie te przypadki, bo z perspektywy czytelnika roznica jest
	 * nieistotna - liczy sie informacja, ze adres NIE trafil na liste
	 * i ze wystarczy sprobowac ponownie.
	 */
	blad: '/newsletter/blad/',
	/**
	 * GDPR consent not given page - czlowiek wyslal formularz bez zaznaczonej zgody.
	 *
	 * Od 2026-08-20 checkbox zgody jest widoczny i niezaznaczony (wczesniej byl
	 * ukryty i zaznaczony z gory), wiec ten przypadek stal sie realny: mozna
	 * swiadomie odmowic. Bez tej strony Sendy odsyla na wlasna, generyczna
	 * stronke z komunikatem "Consent not given".
	 */
	brakZgody: '/newsletter/brak-zgody/',
	/**
	 * GDPR reconsent success page - czlowiek potwierdzil zgode po kampanii
	 * wyslanej ze znacznikiem `[reconsent]`.
	 *
	 * Potrzebna, bo obie listy przewodnikai maja adresy bez mozliwego do wykazania
	 * dowodu zgody (szczegoly: `_newsletters/DO-SPRAWDZENIA-lista-clear.md`).
	 * Kampania re-consent nie ma bez tej strony gdzie odeslac czlowieka.
	 */
	zgodaPotwierdzona: '/newsletter/zgoda-potwierdzona/',
} as const;

/** Czy konfiguracja jest wciaz zastepcza. */
export const listIdIsPlaceholder = NEWSLETTER.listId.startsWith('PODMIEN');

let juzOstrzezono = false;

/**
 * Ostrzega raz na build, ze ID listy jest wciaz zastepcze.
 *
 * Wolane z komponentu, a nie jako efekt uboczny na poziomie modulu: taki efekt
 * zostal wyciety przez optymalizator i ostrzezenie w ogole sie nie pojawialo -
 * co jest gorsze niz brak ostrzezenia, bo daje falszywe poczucie, ze
 * konfiguracja jest w porzadku. Flaga `juzOstrzezono` pilnuje, zeby komunikat
 * nie powtorzyl sie przy kazdej z kilkudziesieciu stron.
 */
export function ostrzezJesliZastepcze(): void {
	if (!listIdIsPlaceholder || juzOstrzezono) return;
	juzOstrzezono = true;
	console.warn(
		'\n[newsletter] UWAGA: zastępcze ID listy Sendy w src/config/newsletter.ts.\n' +
			'             Formularz się renderuje, ale zapisy NIE ZADZIAŁAJĄ.\n' +
			'             Podmień `listId` na ID listy założonej dla przewodnikai.pl.\n',
	);
}
