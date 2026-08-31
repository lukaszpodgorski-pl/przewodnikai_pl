/**
 * Pierwszy obraz artykulu ladowany zachlannie, nie leniwie.
 *
 * Astro nadaje kazdemu obrazowi z Markdowna `loading="lazy"`. Dla ilustracji
 * otwierajacej artykul jest to blad: obraz stoi w pierwszym ekranie, wiec
 * przegladarka i tak musi go pobrac, ale odklada to do momentu, w ktorym
 * uklad jest juz policzony. Efekt: pusty prostokat migajacy przy kazdym
 * wejsciu na strone.
 *
 * `fetchpriority="high"` dokłada sie do tego samego: mowi przegladarce, ze ten
 * obraz ma pierwszenstwo przed pozostalymi zasobami. To wymog z zasad projektu
 * (obraz w pierwszym ekranie nigdy `lazy`).
 *
 * Plugin dotyka WYLACZNIE pierwszego obrazu w dokumencie. Wszystkie kolejne -
 * diagramy i zrzuty w srodku artykulu - zostaja leniwe, bo czytelnik dociera
 * do nich dopiero po przewinieciu.
 */
export function rehypeIlustracjaNaglowkowa() {
	return (tree) => {
		let znaleziony = false;

		const przejdz = (wezel) => {
			if (znaleziony || !wezel) return;

			if (wezel.type === 'element' && wezel.tagName === 'img') {
				znaleziony = true;
				wezel.properties = {
					...wezel.properties,
					loading: 'eager',
					fetchpriority: 'high',
					decoding: 'async',
				};
				return;
			}

			if (Array.isArray(wezel.children)) {
				for (const dziecko of wezel.children) {
					if (znaleziony) return;
					przejdz(dziecko);
				}
			}
		};

		przejdz(tree);
	};
}
