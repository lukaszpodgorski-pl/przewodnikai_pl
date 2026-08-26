import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { zbudujNakladkeSvg, przetworzBufor, zmapujSurowce, TEKST_ZNACZKA } from './przetwarzanie-grafik.mjs';

test('nakladka SVG zawiera tekst znaczka i wymiary docelowe', () => {
	const svg = zbudujNakladkeSvg();
	assert.ok(svg.includes(TEKST_ZNACZKA), 'brak tekstu znaczka');
	assert.ok(svg.includes('width="1600"'), 'zla szerokosc');
	assert.ok(svg.includes('height="900"'), 'zla wysokosc');
	assert.ok(svg.includes('text-anchor="end"'), 'znaczek nie jest wyrownany do prawej');
});

test('przetworzBufor daje JPEG 1600x900 ponizej 1 MB', async () => {
	const surowiec = await sharp({
		create: { width: 2000, height: 1200, channels: 3, background: { r: 13, g: 148, b: 136 } },
	}).jpeg().toBuffer();

	const { bufor, jakosc, bajty } = await przetworzBufor(surowiec);
	const meta = await sharp(bufor).metadata();

	assert.equal(meta.format, 'jpeg');
	assert.equal(meta.width, 1600);
	assert.equal(meta.height, 900);
	assert.ok(bajty <= 1024 * 1024, 'plik przekracza 1 MB');
	assert.ok(jakosc >= 40 && jakosc <= 82, 'jakosc poza zakresem');
});

test('przetworzBufor bez znaczka daje JPEG 1600x900', async () => {
	const surowiec = await sharp({
		create: { width: 2000, height: 1200, channels: 3, background: { r: 13, g: 148, b: 136 } },
	}).jpeg().toBuffer();
	const { bufor } = await przetworzBufor(surowiec, { znaczek: false });
	const meta = await sharp(bufor).metadata();
	assert.equal(meta.width, 1600);
	assert.equal(meta.height, 900);
});

test('zmapujSurowce odwzorowuje strukture katalogow i normalizuje na .jpg', async () => {
	const baza = await mkdtemp(path.join(tmpdir(), 'graf-'));
	const wej = path.join(baza, 'wej');
	const wyj = path.join(baza, 'wyj');
	await mkdir(path.join(wej, 'podstawy', 'wstep'), { recursive: true });
	await writeFile(path.join(wej, 'podstawy', 'wstep', 'wstep.png'), 'x');
	await writeFile(path.join(wej, 'podstawy', 'wstep', 'notatka.txt'), 'x'); // ma zostac pominiety

	const pary = await zmapujSurowce(wej, wyj);

	assert.equal(pary.length, 1, 'nie-obrazy powinny byc pominiete');
	assert.equal(pary[0].wejscie, path.join(wej, 'podstawy', 'wstep', 'wstep.png'));
	assert.equal(pary[0].wyjscie, path.join(wyj, 'podstawy', 'wstep', 'wstep.jpg'));

	await rm(baza, { recursive: true, force: true });
});
