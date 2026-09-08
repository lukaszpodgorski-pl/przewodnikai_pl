/**
 * Konfiguracja analityki i warstwy zgody - jedyne zrodlo prawdy dla tej domeny.
 *
 * GTM_ID i GA4_ID sa identyfikatorami publicznymi: widac je w zrodle kazdej
 * strony, ktora je laduje. Dlatego siedza wprost tutaj, a nie w `.env` ani
 * w `E:\secrets`. Sekretem jest dostep do panelu, nie numer kontenera.
 *
 * CONSENT_VERSION podbijamy przy KAZDEJ zmianie zakresu przetwarzania (nowy
 * odbiorca danych, nowa kategoria, nowy cel). Zapisana decyzja ze starszym `v`
 * jest traktowana jak brak decyzji, wiec baner pyta ponownie - to realizacja
 * art. 7 ust. 1 RODO, ktory kaze umiec wykazac zgode na AKTUALNY zakres.
 *
 * Wzorzec przeniesiony z kursn8n.pl - ten sam stack (Astro na Workers), te same
 * pulapki. Procedura: `e:\projects_www\TODO_analit.md`.
 */

/**
 * Kontener Google Tag Manager - WLASNY dla tej domeny, konto
 * `aitomate Lukasz Podgorski`.
 *
 * Osobny kontener, a nie wspolny GTM-MRR257KR obslugujacy aitomate.pl,
 * lukaszpodgorski.pl i myeye.pl: zmiana w kontenerze pilnujacym trzech zywych
 * domen ma duzo wiekszy promien razenia niz zalozenie czwartego kontenera.
 * Ta sama decyzja co przy kursn8n.pl (GTM-WWZKTTGJ).
 *
 * Docelowa konsolidacja do jednego kontenera ma sens, ale wtedy mapowanie marki
 * przenosi sie na zmienna `js - brand` liczona z `Page Hostname` - patrz sekcja
 * 7 `TODO_analit.md`.
 *
 * UWAGA, ISTNIEJE DRUGI KONTENER TEJ DOMENY: `GTM-KLXND5GL` w OSOBNYM koncie
 * `PrzewodnikAI` (6292583463). Sprawdzony 2026-09-08: jest PUSTY - zero tagow,
 * zero wersji, "Brak aktualnych danych" - i nigdy nie zostal wdrozony. To ten
 * sam przypadek co pusty `GTM-KVZ3WLDG` przy myeye.pl. NIE uzywaj go: konto
 * `PrzewodnikAI` jest bledem strukturalnym z dlugu (8) - model Google to jedno
 * konto na firme. Do skasowania razem z reszta konsolidacji kont GTM.
 *
 * Kontener zalozony 2026-09-08, konto 6323880351, kontener 263509093.
 */
export const GTM_ID = 'GTM-5XJ2VL4B';

/**
 * Identyfikator pomiaru GA4 - WSPOLNA usluga calego ekosystemu (513311833),
 * nie osobna usluga per domena.
 *
 * Powod jest arytmetyczny, nie estetyczny, i pochodzi z decyzji D1 w
 * `e:\projects_www\analityka-wdrozenie-runbook.md`: lista remarketingowa w
 * Google Ads potrzebuje 100 uzytkownikow do sieci reklamowej i 1000 do YouTube
 * i RLSA. Przy kilkunastu aktywnych uzytkownikach na domene tylko wspolna pula
 * kiedykolwiek przekroczy prog - osobne uslugi per domena to gwarancja, ze
 * zadna lista nie ruszy.
 *
 * Cena tej decyzji: raporty trzeba filtrowac po wymiarze `brand`, a nie
 * otwierac na czysto. Dlatego BRAND ponizej jest obowiazkowy w kazdym zdarzeniu.
 *
 * UWAGA: sam serwis nie uzywa tej stalej w czasie dzialania - identyfikator
 * siedzi w zmiennej `const - GA4 ID` w kontenerze GTM. Tu jest po to, zeby dalo
 * sie odczytac z repo, dokad leca dane, bez logowania do panelu. Zmiana tutaj
 * NIE zmienia pomiaru; trzeba ja powtorzyc w GTM.
 */
export const GA4_ID = 'G-VZJFZDE6X0';

/**
 * Marka w ramach wspolnej uslugi GA4. Trafia do kazdego zdarzenia jako
 * parametr `brand` i to ona rozdziela przewodnikai.pl od pozostalych domen
 * w raportach.
 */
export const BRAND = 'przewodnikai';

/**
 * Token Cloudflare Web Analytics - drugi, niezalezny tor pomiaru.
 *
 * DLACZEGO RECZNY SNIPPET, A NIE AUTOMAT: panel Cloudflare oferuje wariant
 * "Enable - the JS Snippet will be automatically injected", ale dla tej strony
 * on NIE DZIALA i robi to po cichu. Automatyczne wstrzykiwanie dzieje sie
 * w warstwie przepisywania HTML na brzegu, a odpowiedz generuje Worker (static
 * assets), wiec te warstwe omija. Zmierzone na kursn8n.pl 2026-09-08: po
 * przelaczeniu na "Enable" beacon nie pojawil sie w HTML przez ponad dwie
 * minuty, takze przy pominietym cache i z naglowkiem przegladarki.
 *
 * DRUGA PULAPKA, na kursn8n.pl: konto mialo wariant "Enable, excluding visitor
 * data in the EU", wiec beacon nie byl wstrzykiwany NIKOMU z Unii. TA DOMENA
 * TEGO PROBLEMU NIE MIALA - sprawdzone w panelu 2026-09-08, stala na zwyklym
 * "Enable". Zapis w TODO_analit.md, ktory przypisywal jej wariant wykluczajacy
 * UE, byl bledny.
 *
 * STAN PRZED ZMIANA, zmierzony 2026-09-08: wariant "Enable" (automat), a zywy
 * HTML przewodnikai.pl NIE ZAWIERAL beacona (curl z naglowkiem przegladarki
 * i pominietym cache). Panel pokazywal jednak 23 odslony na dobe, wiec dla
 * czesci ruchu automat prawdopodobnie dzialal - najpewniej dla zadan
 * z pelnym zestawem naglowkow nawigacyjnych, ktorych curl nie wysyla.
 * Przelaczenie na snippet reczny zamyka te niepewnosc w obie strony: beacon
 * jest dokladnie tam, gdzie go widac w repo, i nie ma szansy na podwojne
 * liczenie odslon przez dwa rownolegle wstrzykniecia.
 *
 * Zgoda nie jest potrzebna: narzedzie nie zapisuje cookies ani pamieci
 * przegladarki i nie rozpoznaje ludzi po IP, wiec art. 399 PKE sie nie stosuje.
 * Podstawa to art. 6 ust. 1 lit. f RODO.
 *
 * Token jest identyfikatorem publicznym - widac go w zrodle kazdej strony,
 * ktora laduje beacon. Sekretem jest dostep do panelu, nie ten ciag.
 * Odczytany z panelu 2026-09-08.
 */
export const CF_BEACON_TOKEN = '2217bcec7cf44f61a16b136ec3c5c513';

/** Wersja zakresu przetwarzania. Podbicie = ponowne pytanie wszystkich. */
export const CONSENT_VERSION = 1;

/**
 * Klucz w localStorage.
 *
 * Prefiks `lp-` zamiast domenowego: format decyzji jest WSPOLNY dla calego
 * ekosystemu (aitomate.pl, lukaszpodgorski.pl, szanujczas.pl, przewodnikai.pl).
 * localStorage i tak nie przechodzi miedzy domenami, wiec wspolna nazwa niczego
 * nie wspoldzieli - pilnuje tylko, zeby przy nastepnej zmianie nie trzeba bylo
 * pamietac czterech roznych schematow zapisu. Historia tego dlugu: pulapka
 * (9) w `TODO_analit.md`.
 */
export const CONSENT_STORAGE_KEY = 'lp-consent';

/** Decyzja uzytkownika w formie, w jakiej podaje ja baner. */
export type ConsentChoice = {
	analytics: boolean;
	marketing: boolean;
};

/** Decyzja zapisana w localStorage, z wersja i znacznikiem czasu. */
export type StoredConsent = ConsentChoice & {
	v: number;
	ts: string;
};

/** Czy konfiguracja jest wciaz zastepcza. */
export const gtmIdIsPlaceholder = GTM_ID.includes('PODMIEN');
export const cfTokenIsPlaceholder = CF_BEACON_TOKEN.includes('PODMIEN');

let juzOstrzezono = false;

/**
 * Ostrzega raz na build, ze identyfikatory sa wciaz zastepcze.
 *
 * Wolane z komponentu, a nie jako efekt uboczny na poziomie modulu: taki efekt
 * zostaje wyciety przez optymalizator i ostrzezenie w ogole sie nie pojawia -
 * co jest gorsze niz brak ostrzezenia, bo daje falszywe poczucie, ze
 * konfiguracja jest w porzadku. Ten sam wzorzec co w `src/config/newsletter.ts`.
 */
export function ostrzezJesliZastepcze(): void {
	if (juzOstrzezono) return;
	if (!gtmIdIsPlaceholder && !cfTokenIsPlaceholder) return;
	juzOstrzezono = true;
	const braki: string[] = [];
	if (gtmIdIsPlaceholder) braki.push('GTM_ID (zaloz kontener w koncie `aitomate Lukasz Podgorski`)');
	if (cfTokenIsPlaceholder)
		braki.push('CF_BEACON_TOKEN (Cloudflare -> Web Analytics -> Manage site -> "Enable with JS Snippet installation")');
	console.warn(
		'\n[analityka] UWAGA: zastępcze identyfikatory w src/config/analytics.ts:\n' +
			braki.map((b) => `             - ${b}\n`).join('') +
			'             Baner i warstwa zgody działają, ale POMIAR NIE ZBIERA DANYCH.\n' +
			'             Nie publikuj tej wersji jako wdrożenia analityki.\n',
	);
}
