/* Service Worker der Wetter-App
 *
 * Strategie „Netz zuerst mit Zeitlimit“ – nur für die eigenen App-Dateien (App-Hülle):
 *   1. Datei bei GitHub Pages anfragen.
 *   2. Antwortet GitHub innerhalb von TIMEOUT_MS, wird diese frische Fassung gezeigt und im Cache abgelegt.
 *   3. Sonst (langsames Netz, offline, Serverfehler) kommt die Fassung aus dem Cache.
 *   4. Gibt es noch keinen Cache, wird weiter auf das Netz gewartet; scheitert es, erscheint offline.html.
 *
 * Anfragen an die Datendienste (Open-Meteo, Photon, PEGELONLINE) fasst der Service Worker nicht an:
 * Sie gehen direkt ins Netz und werden nie gespeichert. Gespeichert werden keine Wetterdaten,
 * keine Orte und keine Suchbegriffe.
 *
 * Pflege: Ändert sich die Liste SHELL (neue/umbenannte Dateien), VERSION erhöhen.
 * Änderungen an index.html brauchen keine neue Version, sie kommen über „Netz zuerst“ an.
 * Rückbau: Datei nicht einfach löschen, sondern durch eine Abschalt-Version ersetzen
 * (Caches löschen, self.registration.unregister(), Clients neu laden) – siehe README.
 */
'use strict';

const VERSION = 'wetter-shell-v1';
const TIMEOUT_MS = 3000;
const SHELL = [
  './',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
  'offline.html'
];

const abs = u => new URL(u, self.location.href).href;
const HOME = abs('./');
const OFFLINE = abs('offline.html');
const SHELL_URLS = new Set(SHELL.map(abs));

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(SHELL.map(u => new Request(abs(u), { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('wetter-') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Frische Fassung holen; nur einwandfreie, nicht umgeleitete eigene Antworten landen im Cache. */
function fromNetwork(url){
  return fetch(new Request(url, { cache: 'no-cache', credentials: 'same-origin' })).then(res => {
    if (!res.ok || res.type !== 'basic' || res.redirected) throw new Error('unbrauchbare Antwort');
    const copy = res.clone();
    caches.open(VERSION).then(cache => cache.put(url, copy)).catch(() => {});
    return res;
  });
}

function networkFirst(event, url){
  const net = fromNetwork(url);
  event.waitUntil(net.then(() => {}, () => {}));          // Cache auch nach Zeitablauf noch auffrischen
  const timeout = new Promise(resolve => setTimeout(resolve, TIMEOUT_MS, null));
  return Promise.race([net.catch(() => null), timeout])
    .then(res => res || caches.match(url).then(hit => hit || net))
    .catch(() => caches.match(OFFLINE).then(off => off || Response.error()));
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;         // Datendienste: nicht anfassen

  if (req.mode === 'navigate'){
    if (url.pathname === new URL(HOME).pathname || url.pathname.endsWith('/index.html')){
      event.respondWith(networkFirst(event, HOME));        // Startseite, Query wird ignoriert
    } else {
      event.respondWith(fetch(req).catch(() => caches.match(OFFLINE).then(off => off || Response.error())));
    }
    return;
  }

  url.search = '';
  if (SHELL_URLS.has(url.href)) event.respondWith(networkFirst(event, url.href));
  /* alles Übrige (z. B. .well-known/assetlinks.json) geht unverändert ins Netz */
});
