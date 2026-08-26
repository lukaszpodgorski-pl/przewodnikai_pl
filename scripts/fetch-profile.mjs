/**
 * Pobiera kanoniczne dane autora (wersja polska) z repo-profilu na GitHubie i zapisuje
 * zvendorowane kopie: src/data/autor.json, src/data/autor-krotki.html
 * oraz src/assets/zasoby/o-mnie/lukasz.jpg.
 *
 * Uruchamiany ręcznie (npm run profile:sync) albo z workflowu
 * profile-sync.yml - CELOWO nie przy buildzie, żeby build nigdy nie
 * zależał od sieci. Kopie są commitowane do repo.
 *
 * Walidacja jest bramką: uszkodzone lub niekompletne dane rzucają błąd
 * i nie nadpisują działającej kopii.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const REF = process.env.PROFILE_REF ?? 'main';
const RAW = `https://raw.githubusercontent.com/lukaszpodgorski-pl/author-profile/${REF}`;
const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));
const repo = (...p) => path.join(SCRIPTS, '..', ...p);

async function pobierz(url) {
	const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
	if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
	return res;
}

const profile = await (await pobierz(`${RAW}/profile.pl.json`)).json();

for (const pole of ['name', 'jobTitle', 'url', 'bioShort', 'description', 'photo']) {
	if (typeof profile[pole] !== 'string' || !profile[pole].trim()) {
		throw new Error(`profile.pl.json: brak lub puste pole "${pole}"`);
	}
}
if (!Array.isArray(profile.sameAs) || profile.sameAs.length === 0) {
	throw new Error('profile.pl.json: pusta lista sameAs');
}

const krotkiMd = await (await pobierz(`${RAW}/bio/krotki.pl.md`)).text();
if (!krotkiMd.trim()) throw new Error('bio/krotki.pl.md jest puste');

const foto = Buffer.from(await (await pobierz(`${RAW}/foto/lukasz-web.jpg`)).arrayBuffer());
if (foto.length < 10_000) throw new Error(`foto/lukasz-web.jpg podejrzanie małe (${foto.length} B)`);
if (foto.length >= 1_000_000) throw new Error(`foto/lukasz-web.jpg przekracza limit 1 MB CI (${foto.length} B)`);

const naglowek =
	'<!-- PLIK GENEROWANY przez scripts/fetch-profile.mjs (npm run profile:sync).\n' +
	'     Nie edytuj ręcznie - źródło: github.com/lukaszpodgorski-pl/author-profile -->\n';

await mkdir(repo('src', 'data'), { recursive: true });
await mkdir(repo('src', 'assets', 'zasoby', 'o-mnie'), { recursive: true });
await writeFile(repo('src', 'data', 'autor.json'), JSON.stringify(profile, null, '\t') + '\n');
await writeFile(repo('src', 'data', 'autor-krotki.html'), naglowek + marked.parse(krotkiMd));
await writeFile(repo('src', 'assets', 'zasoby', 'o-mnie', 'lukasz.jpg'), foto);

console.log('OK: autor.json, autor-krotki.html, lukasz.jpg zaktualizowane');
