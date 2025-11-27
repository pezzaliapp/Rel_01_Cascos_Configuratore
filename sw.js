// sw.js — v5.1 — app-shell sicura + hard bypass PDF + HTML statici ok
const CACHE = 'cascos-config-v5';
const CORE = [
  './',
  './index.html',
  './README.html',
  './LICENSE.html',
  './app.js',
  './models.json',
  './manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k))))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const pathname = (url.pathname || '').toLowerCase();

  // ---- HARD BYPASS: qualsiasi PDF SEMPRE in rete (no cache, no app-shell) ----
  if (pathname.endsWith('.pdf')) {
    e.respondWith(fetch(req));
    return;
  }

  // ---- Asset statici (inclusi .html): rete -> fallback cache ----
  const isStaticAsset =
    /\.(?:html|js|css|png|jpg|jpeg|webp|svg|ico|json|webmanifest)$/.test(pathname) ||
    pathname.startsWith('/docs/') || pathname.startsWith('/arms_files/');

  if (isStaticAsset) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // ---- App-shell SOLO per navigazioni senza estensione ----
  const hasExtension = /\.[a-z0-9]+$/i.test(pathname);
  const isNavigate = req.mode === 'navigate' && !hasExtension && url.origin === location.origin;

  if (isNavigate) {
    e.respondWith(
      fetch('./index.html', { cache: 'no-cache' })
        .then(r => (r.ok ? r : caches.match('./index.html')))
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // ---- Cache-first per il resto ----
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return resp;
    }))
  );
});
