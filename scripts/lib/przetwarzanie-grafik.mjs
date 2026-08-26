import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

export const SZEROKOSC = 1600;
export const WYSOKOSC = 900;
export const TEKST_ZNACZKA = 'Wygenerowano przez AI';
export const LIMIT_BAJTOW = 1024 * 1024;
export const JAKOSC_START = 82;
export const JAKOSC_MIN = 40;
export const KROK_JAKOSCI = 6;

const MARGINES = 40; // px od krawedzi (2,5% z 1600)
const FONT_PX = 35; // ~2,2% z 1600
const ROZSZERZENIA = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff']);

/**
 * Buduje nakladke SVG ze znaczkiem "Wygenerowano przez AI" w prawym dolnym rogu.
 * Bialy tekst z ciemnym cieniem (offsetowana kopia pod spodem) - czytelny na jasnych i ciemnych grafikach.
 */
export function zbudujNakladkeSvg(szerokosc = SZEROKOSC, wysokosc = WYSOKOSC, tekst = TEKST_ZNACZKA) {
	const x = szerokosc - MARGINES;
	const y = wysokosc - MARGINES;
	return `<svg width="${szerokosc}" height="${wysokosc}" viewBox="0 0 ${szerokosc} ${wysokosc}" xmlns="http://www.w3.org/2000/svg">
  <style>.znak{font-family:'Segoe UI',Arial,sans-serif;font-size:${FONT_PX}px;font-weight:600;}</style>
  <text x="${x}" y="${y}" text-anchor="end" class="znak" fill="rgba(0,0,0,0.55)" transform="translate(1.5,1.5)">${tekst}</text>
  <text x="${x}" y="${y}" text-anchor="end" class="znak" fill="#ffffff">${tekst}</text>
</svg>`;
}

/**
 * Sprowadza obraz do jednolitego formatu 1600x900 (fit: cover), opcjonalnie naklada
 * znaczek AI i koduje JPEG mieszczacy sie w limicie 1 MB (obniza jakosc krokiem, gdy trzeba).
 * @param {Buffer} wejscie surowy bufor obrazu
 * @param {{ znaczek?: boolean }} [opcje] znaczek: czy nalozyc "Wygenerowano przez AI" (domyslnie true)
 * @returns {Promise<{ bufor: Buffer, jakosc: number, bajty: number }>}
 */
export async function przetworzBufor(wejscie, opcje = {}) {
	const { znaczek = true } = opcje;
	let potok = sharp(wejscie).resize(SZEROKOSC, WYSOKOSC, { fit: 'cover', position: 'center' });
	if (znaczek) {
		potok = potok.composite([{ input: Buffer.from(zbudujNakladkeSvg()), top: 0, left: 0 }]);
	}
	const bazowy = await potok.png().toBuffer();

	let jakosc = JAKOSC_START;
	let bufor;
	do {
		bufor = await sharp(bazowy).jpeg({ quality: jakosc, mozjpeg: true }).toBuffer();
		if (bufor.length <= LIMIT_BAJTOW || jakosc <= JAKOSC_MIN) break;
		jakosc -= KROK_JAKOSCI;
	} while (true);

	return { bufor, jakosc, bajty: bufor.length };
}

/**
 * Rekurencyjnie zbiera pliki obrazow z katalogu wejsciowego i mapuje kazdy
 * na sciezke docelowa 1:1, normalizujac rozszerzenie wyjscia na .jpg.
 * @param {string} katalogWejscia
 * @param {string} katalogWyjscia
 * @returns {Promise<Array<{ wejscie: string, wyjscie: string }>>}
 */
export async function zmapujSurowce(katalogWejscia, katalogWyjscia) {
	const wyniki = [];
	async function chodz(wzgledny) {
		const pelny = path.join(katalogWejscia, wzgledny);
		const wpisy = await readdir(pelny, { withFileTypes: true });
		for (const wpis of wpisy) {
			const wzgl = path.join(wzgledny, wpis.name);
			if (wpis.isDirectory()) {
				await chodz(wzgl);
			} else if (ROZSZERZENIA.has(path.extname(wpis.name).toLowerCase())) {
				const bezRozsz = wzgl.slice(0, wzgl.length - path.extname(wzgl).length);
				wyniki.push({
					wejscie: path.join(katalogWejscia, wzgl),
					wyjscie: path.join(katalogWyjscia, bezRozsz + '.jpg'),
				});
			}
		}
	}
	await chodz('');
	return wyniki;
}
