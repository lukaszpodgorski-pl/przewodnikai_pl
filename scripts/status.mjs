#!/usr/bin/env node
/**
 * Licznik postepu przegladu redakcyjnego.
 *
 * Czyta pole `status` z frontmattera wszystkich stron i pokazuje, ile z nich
 * jest przejrzanych (`gotowe`), ile czeka (`zastane`), a ile jest wycietych
 * z produkcji (`szkic`). Rozbicie na sekcje, zeby bylo widac, gdzie stoi praca.
 *
 * Uzycie: npm run status
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const KORZEN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KATALOG_TRESCI = join(KORZEN, 'src/content/docs');

const ZNAKI = { gotowe: '●', zastane: '◐', szkic: '○' };
const KOLEJNOSC = ['gotowe', 'zastane', 'szkic'];

function* plikiTresci(katalog) {
	for (const wpis of readdirSync(katalog)) {
		const pelna = join(katalog, wpis);
		if (statSync(pelna).isDirectory()) yield* plikiTresci(pelna);
		else if (/\.mdx?$/.test(wpis)) yield pelna;
	}
}

const sekcje = new Map();
const suma = { gotowe: 0, zastane: 0, szkic: 0 };

for (const plik of plikiTresci(KATALOG_TRESCI)) {
	const wzgledna = plik.slice(KATALOG_TRESCI.length + 1).split(sep).join('/');
	const czesci = wzgledna.split('/');
	const sekcja = czesci.length > 1 ? czesci[0] : '(strona glowna)';

	const dopasowanie = readFileSync(plik, 'utf8').match(/^status:\s*(\S+)\s*$/m);
	const status = dopasowanie ? dopasowanie[1] : 'szkic';
	if (!(status in suma)) continue;

	if (!sekcje.has(sekcja)) sekcje.set(sekcja, { gotowe: 0, zastane: 0, szkic: 0 });
	sekcje.get(sekcja)[status]++;
	suma[status]++;
}

const razem = suma.gotowe + suma.zastane + suma.szkic;
const szerokosc = Math.max(...[...sekcje.keys()].map((s) => s.length));

console.log('\n  Postep przegladu redakcyjnego\n');
console.log(`  ${ZNAKI.gotowe} przejrzane   ${ZNAKI.zastane} zastane (publikowane)   ${ZNAKI.szkic} wyciete\n`);

for (const [sekcja, liczby] of [...sekcje].sort()) {
	const wSekcji = liczby.gotowe + liczby.zastane + liczby.szkic;
	const pasek = KOLEJNOSC.flatMap((s) => Array(liczby[s]).fill(ZNAKI[s])).join('');
	console.log(`  ${sekcja.padEnd(szerokosc)}  ${pasek}  ${liczby.gotowe}/${wSekcji}`);
}

const procent = razem ? Math.round((suma.gotowe / razem) * 100) : 0;
console.log(`\n  Razem: ${suma.gotowe}/${razem} przejrzanych (${procent}%)`);
console.log(`  Publikowanych: ${suma.gotowe + suma.zastane}, wycietych: ${suma.szkic}\n`);
