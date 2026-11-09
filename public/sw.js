const VERSION = 'v2';
const CACHE = `offline-${VERSION}`;
// Bez rozszerzenia .html: Cloudflare (static assets) przekierowuje /offline.html
// na /offline kodem 307. Odpowiedz po przekierowaniu zapisana w cache przegladarka
// odrzuca jako odpowiedz na nawigacje (blad sieci zamiast strony offline).
// v1 -> v2: wymiana zawartosci cache po tej poprawce (2026-11-09).
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.add(new Request(OFFLINE_URL, { cache: 'reload' }))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Service Worker nie dotyka POST, API, paneli admina ani wysylki formularzy.
  if (request.method !== 'GET') return;
  // Fallback dotyczy wczytywania stron, nie obrazkow i nie zapytan XHR - bez tego
  // brakujacy obrazek dostaje w odpowiedzi HTML strony offline.
  if (request.mode !== 'navigate') return;

  event.respondWith(
    fetch(request).catch(() =>
      caches.open(CACHE).then((cache) => cache.match(OFFLINE_URL))
    )
  );
});
