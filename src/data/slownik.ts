/**
 * Krótkie wyjaśnienia pojęć (jedno zdanie) - JEDYNE źródło prawdy dla
 * komponentów <Termin> (link + dymek w treści) oraz <SlowniczekStrony>
 * (blok "Pojęcia z tej strony" na dole artykułu).
 *
 * Pełne definicje żyją na stronie /zasoby/slownik-pojec/ i tam się je edytuje.
 * Tutaj trzymamy tylko wersję skróconą + kotwicę do właściwego hasła, więc
 * krótkie i pełne wyjaśnienie mają po jednym domu i nie mogą się rozjechać.
 *
 * Dodając nowe pojęcie: `id` to klucz używany w <Termin id="...">, `anchor`
 * musi pokrywać się z id nagłówka `### ...` na stronie słownika (małe litery,
 * spacje na myślniki - tak generuje je Starlight).
 */
export interface Pojecie {
	/** Nazwa hasła tak, jak brzmi na stronie słownika. */
	termin: string;
	/** Kotwica hasła na /zasoby/slownik-pojec/ (id nagłówka). */
	anchor: string;
	/** Jedno zdanie - pokazuje się w dymku i w bloku na dole strony. */
	krotka: string;
}

export const SLOWNIK_URL = '/zasoby/slownik-pojec/';

export const SLOWNIK: Record<string, Pojecie> = {
	prompt: {
		termin: 'Prompt',
		anchor: 'prompt',
		krotka:
			'Polecenie lub pytanie, które wpisujesz do AI - na jego podstawie model układa odpowiedź.',
	},
	chatbot: {
		termin: 'Chatbot',
		anchor: 'chatbot',
		krotka:
			'Program, z którym piszesz jak z człowiekiem, w naturalnym języku - a on odpowiada tekstem.',
	},
	genai: {
		termin: 'Generatywna AI',
		anchor: 'generatywna-ai',
		krotka:
			'AI, która tworzy nowe treści - teksty, obrazy, dźwięk czy kod - a nie tylko rozpoznaje lub wybiera.',
	},
	'uczenie-maszynowe': {
		termin: 'Uczenie maszynowe',
		anchor: 'uczenie-maszynowe-machine-learning',
		krotka:
			'Sposób tworzenia AI, w którym program uczy się z danych i przykładów, zamiast być krok po kroku zaprogramowany.',
	},
	halucynacje: {
		termin: 'Halucynacje AI',
		anchor: 'halucynacje-ai',
		krotka:
			'Sytuacja, gdy AI z pełnym przekonaniem podaje informację, która brzmi wiarygodnie, ale jest zmyślona.',
	},
	'prompt-engineering': {
		termin: 'Prompt engineering',
		anchor: 'prompt-engineering',
		krotka:
			'Umiejętność takiego formułowania poleceń dla AI, żeby dostać dokładnie taką odpowiedź, jakiej potrzebujesz.',
	},
	'agent-ai': {
		termin: 'Agent AI',
		anchor: 'agent-ai',
		krotka:
			'System AI, który dostaje cel zamiast pojedynczego polecenia - sam planuje kroki, korzysta z narzędzi i wykonuje wieloetapowe zadanie.',
	},
	'okno-kontekstowe': {
		termin: 'Okno kontekstowe',
		anchor: 'okno-kontekstowe',
		krotka:
			'Maksymalna ilość tekstu, którą model AI "widzi" jednocześnie - gdy rozmowa ją przekroczy, najstarsze fragmenty wypadają z pola widzenia.',
	},
	rag: {
		termin: 'RAG',
		anchor: 'rag-retrieval-augmented-generation',
		krotka:
			'Technika, w której AI najpierw wyszukuje odpowiednie fragmenty dokumentów, a dopiero potem odpowiada na ich podstawie, zamiast zgadywać z pamięci.',
	},
	'suwerennosc-cyfrowa': {
		termin: 'Suwerenność cyfrowa',
		anchor: 'suwerenność-cyfrowa',
		krotka:
			'Zdolność państwa, firmy lub osoby do korzystania z technologii cyfrowych bez krytycznej zależności od dostawców spoza swojego regionu.',
	},
	'open-weight': {
		termin: 'Model open-weight',
		anchor: 'model-open-weight',
		krotka:
			'Model AI, którego wagi (parametry) można pobrać i uruchomić na własnym sprzęcie - w przeciwieństwie do modeli dostępnych wyłącznie przez API dostawcy.',
	},
	token: {
		termin: 'Token',
		anchor: 'token',
		krotka:
			'Podstawowa jednostka tekstu, na jaką model dzieli to, co czyta i pisze - zwykle fragment słowa; w tokenach mierzy się okno kontekstowe i koszty API.',
	},
	temperatura: {
		termin: 'Temperatura',
		anchor: 'temperatura-temperature',
		krotka:
			'Parametr sterujący losowością odpowiedzi modelu - niska wartość daje wyniki powtarzalne i zachowawcze, wysoka bardziej kreatywne, ale mniej przewidywalne.',
	},
	'zero-shot': {
		termin: 'Zero-shot',
		anchor: 'zero-shot-bez-przykładów',
		krotka:
			'Zadanie polecenia bez pokazywania modelowi ani jednego przykładu - liczy się sama instrukcja i wiedza, którą model wyniósł z treningu.',
	},
	'chain-of-thought': {
		termin: 'Chain-of-thought',
		anchor: 'chain-of-thought-łańcuch-myśli',
		krotka:
			'Technika promptowania, w której prosisz model o rozpisanie rozumowania krok po kroku, zanim poda ostateczną odpowiedź.',
	},
};
