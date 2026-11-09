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
 * musi pokrywać się z id nagłówka `## ...` na stronie słownika (małe litery,
 * spacje na myślniki, nawiasy usunięte - tak generuje je Starlight, np.
 * "RAG (Retrieval-Augmented Generation)" -> `rag-retrieval-augmented-generation`).
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
		anchor: 'uczenie-maszynowe-ang-machine-learning',
		krotka:
			'Sposób tworzenia AI, w którym program uczy się z danych i przykładów, zamiast być krok po kroku zaprogramowany.',
	},
	halucynacje: {
		termin: 'Halucynacje AI',
		anchor: 'halucynacje-ai-ang-hallucinations',
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
		anchor: 'okno-kontekstowe-ang-context-window',
		krotka:
			'Maksymalna ilość tekstu, którą model AI "widzi" naraz - gdy rozmowa ją przekroczy, najstarsze fragmenty przestają być widoczne albo zostają streszczone.',
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
			'Kawałek tekstu, na jaki model dzieli to, co czyta i pisze - zwykle część słowa; w tokenach mierzy się okno kontekstowe i koszty API.',
	},
	temperatura: {
		termin: 'Temperatura',
		anchor: 'temperatura-ang-temperature',
		krotka:
			'Ustawienie losowania - niska wartość daje odpowiedzi powtarzalne i zachowawcze, wysoka bardziej kreatywne, ale mniej przewidywalne.',
	},
	'zero-shot': {
		termin: 'Zero-shot',
		anchor: 'zero-shot',
		krotka:
			'Zadanie polecenia bez pokazywania modelowi ani jednego przykładu - liczy się sama instrukcja i wiedza, którą model wyniósł z treningu.',
	},
	'chain-of-thought': {
		termin: 'Chain-of-thought',
		anchor: 'chain-of-thought',
		krotka:
			'Technika promptowania, w której prosisz model o rozpisanie rozumowania krok po kroku, zanim poda ostateczną odpowiedź.',
	},
	model: {
		termin: 'Model',
		anchor: 'model',
		krotka:
			'Wytrenowany na danych system AI - w tym przewodniku najczęściej duży model językowy, czyli to, co generuje odpowiedzi w ChatGPT czy Claude.',
	},
	trenowanie: {
		termin: 'Trenowanie',
		anchor: 'trenowanie-ang-training',
		krotka:
			'Jednorazowy proces, w którym model dopasowuje swoje wagi do ogromnych zbiorów danych - potem wagi są zamrożone i w rozmowie z tobą model już się nie uczy.',
	},
	'uczenie-glebokie': {
		termin: 'Głębokie uczenie',
		anchor: 'głębokie-uczenie-ang-deep-learning',
		krotka:
			'Uczenie maszynowe na sieciach neuronowych o wielu warstwach - radzi sobie z surowymi danymi, bo cechy ważne dla zadania wypracowuje samo, bez podpowiedzi człowieka.',
	},
	'waska-ai': {
		termin: 'Wąska AI',
		anchor: 'wąska-ai-ani',
		krotka:
			'System AI wyspecjalizowany w jednym zadaniu - bardzo dobry w tym, do czego go wytrenowano, i bezradny poza tym obszarem; cała AI dostępna dzisiaj jest właśnie taka.',
	},
	'ogolna-ai': {
		termin: 'Ogólna AI',
		anchor: 'ogólna-ai-agi',
		krotka:
			'Hipotetyczny system dorównujący człowiekowi w dowolnej dziedzinie - przenoszący umiejętności między zadaniami i uczący się w trakcie działania; dziś nie istnieje.',
	},
	mcp: {
		termin: 'MCP',
		anchor: 'mcp-model-context-protocol',
		krotka:
			'Otwarty standard podłączania narzędzi do asystenta AI - przez serwery MCP asystent sięga, za Twoją zgodą, do kalendarza, plików czy bazy danych.',
	},
	api: {
		termin: 'API',
		anchor: 'api-application-programming-interface',
		krotka:
			'Sposób, w jaki programy rozmawiają ze sobą - przy AI to dostęp do modelu dla programistów i aplikacji, bez okna czatu, zwykle płatny za zużyte tokeny.',
	},
	embedding: {
		termin: 'Embedding',
		anchor: 'embedding',
		krotka:
			'Zapis znaczenia tekstu jako ciągu liczb - teksty o podobnym znaczeniu dostają podobne liczby, więc maszyna może je porównywać.',
	},
	sift: {
		termin: 'SIFT',
		anchor: 'sift',
		krotka:
			'Metoda sprawdzania informacji w czterech krokach: zatrzymaj się, sprawdź źródło, znajdź lepsze źródła, dotrzyj do oryginału.',
	},
	'prompt-injection': {
		termin: 'Prompt injection',
		anchor: 'prompt-injection',
		krotka:
			'Polecenie ukryte w cudzym tekście (stronie, mailu, dokumencie), które model może wziąć za Twoje i wykonać.',
	},
	subagent: {
		termin: 'Subagent',
		anchor: 'subagent',
		krotka:
			'Pomocnik agenta AI, który dostaje jedno zadanie, wykonuje je w osobnym oknie kontekstowym i oddaje tylko podsumowanie.',
	},
};
