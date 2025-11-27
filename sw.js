// sw.js — v6.0 — app-shell sicura + hard bypass PDF + HTML statici ok
const CACHE = 'cascos-config-v6';

const CORE = [
  './',
  './index.html',
  './README.html',
  './LICENSE.html',
  './viewer.html',
  './app.js',
  './models.json',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE);
        // addAll può fallire se un file non esiste: lo proteggiamo con try/catch
        await cache.addAll(CORE);
      } catch (err) {
        // Non bloccare l’installazione del SW se una risorsa va in errore
        console.warn('[SW] install: errore in addAll, continuo comunque:', err);
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE && /^cascos-config-/.test(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const pathname = (url.pathname || '').toLowerCase();

  // ---- BYPASS DURO PDF: mai in cache, sempre rete ----
  if (pathname.endsWith('.pdf')) {
    event.respondWith(fetch(req));
    return;
  }

  // ---- Asset statici (html/js/css/img/json/manifest, docs, arms) rete→cache ----
  const isStaticAsset =
    /\.(?:html|js|css|png|jpg|jpeg|webp|svg|ico|json|webmanifest)$/.test(pathname) ||
    pathname.includes('/docs/') ||
    pathname.includes('/arms_files/');

  if (isStaticAsset) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // ---- App-shell SOLO per navigazioni “pulite” (senza estensione) ----
  const hasExtension = /\.[a-z0-9]+$/i.test(pathname);
  const isNavigate =
    req.mode === 'navigate' &&
    !hasExtension &&
    url.origin === location.origin;

  if (isNavigate) {
    event.respondWith(
      fetch('./index.html', { cache: 'no-cache' })
        .then((r) => (r.ok ? r : caches.match('./index.html')))
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // ---- Cache-first per il resto (API, ecc.) ----
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return resp;
      });
    })
  );
});
