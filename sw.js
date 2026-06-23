// Modeste Training — Service Worker
// Doit être servi depuis l'origine (https) pour s'enregistrer : les Blob/Data URL sont
// refusées par les navigateurs pour register(). Chemins RELATIFS → compatible GitHub Pages
// (sous-chemin /mdst-training/).

const CACHE = 'modeste-training-v2';
const ASSETS = ['./', './index.html'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first pour la navigation (HTML frais si en ligne), cache-fallback sinon.
// On ne met jamais en cache les appels Google APIs.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.url.includes('googleapis.com') || req.url.includes('google.com')) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
          return r;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((r) => {
      const copy = r.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return r;
    }).catch(() => cached))
  );
});
