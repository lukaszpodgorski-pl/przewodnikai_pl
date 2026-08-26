/**
 * Odmiana rzeczownika przez liczbe w jezyku polskim.
 *
 * Polski ma trzy formy zalezne od liczby: pojedyncza ("1 token"), mnoga
 * "few" dla koncowek 2-4 ("2 tokeny") i mnoga "many" dla reszty
 * ("5 tokenow"). Pulapka siedzi w nastolatkach: 12, 13 i 14 maja koncowke
 * 2-4, ale odmieniaja sie jak "many" ("12 tokenow", nie "12 tokeny").
 * Stad dodatkowy warunek na reszcie z dzielenia przez 100.
 */
export function plural(n: number, one: string, few: string, many: string): string {
	const mod10 = n % 10;
	const mod100 = n % 100;
	if (n === 1) return one;
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
	return many;
}

/** Skrot na najczestszy przypadek: liczba razem z odmieniona nazwa. */
export function count(n: number, one: string, few: string, many: string): string {
	return `${n} ${plural(n, one, few, many)}`;
}
