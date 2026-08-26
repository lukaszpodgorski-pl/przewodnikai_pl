import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { przetworzBufor, zmapujSurowce } from './lib/przetwarzanie-grafik.mjs';

const KORZEN = path.resolve(fileURLToPath(import.meta.url), '../..');
const WEJSCIE = path.join(KORZEN, 'grafiki-zrodlo');
const WYJSCIE = path.join(KORZEN, 'src', 'assets');
const BEZ_ZNACZKA = process.argv.includes('--bez-znaczka');

async function istnieje(p) {
	try {
		await access(p);
		return true;
	} catch {
		return false;
	}
}

async function main() {
	if (!(await istnieje(WEJSCIE))) {
		await mkdir(WEJSCIE, { recursive: true });
		console.log('Utworzono pusty katalog grafiki-zrodlo/. Wrzuc surowce (grafiki-zrodlo/<sekcja>/<artykul>/<nazwa>.<ext>) i uruchom ponownie.');
		return;
	}

	const pary = await zmapujSurowce(WEJSCIE, WYJSCIE);
	if (pary.length === 0) {
		console.log('Brak grafik do przetworzenia w grafiki-zrodlo/.');
		return;
	}

	console.log(BEZ_ZNACZKA ? 'Tryb: bez znaczka AI (ilustracje).' : 'Tryb: ze znaczkiem AI.');
	for (const { wejscie, wyjscie } of pary) {
		const wej = await readFile(wejscie);
		const { bufor, jakosc, bajty } = await przetworzBufor(wej, { znaczek: !BEZ_ZNACZKA });
		await mkdir(path.dirname(wyjscie), { recursive: true });
		await writeFile(wyjscie, bufor);
		const ostrzezenie = bajty > 1024 * 1024 ? '  UWAGA: > 1 MB (limit CI!)' : '';
		console.log(`${path.relative(KORZEN, wejscie)} -> ${path.relative(KORZEN, wyjscie)}  (q${jakosc}, ${Math.round(bajty / 1024)} KB)${ostrzezenie}`);
	}
	console.log(`Gotowe: ${pary.length} grafik.`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
