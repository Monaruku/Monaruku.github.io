---
---
// Budget app service worker. CACHE_VERSION is stamped by Jekyll at build time,
// so every deploy produces a byte-different sw.js and triggers a cache swap.
const CACHE_VERSION = 'budget-{{ site.time | date: "%s" }}';

const SHELL = [
  '{{ "/budget/" | relative_url }}',
  '{{ "/budget/index.html" | relative_url }}',
  '{{ "/budget/manifest.json" | relative_url }}',
  '{{ "/assets/budget/budget.css" | relative_url }}',
  '{{ "/assets/budget/kv.js" | relative_url }}',
  '{{ "/assets/budget/util.js" | relative_url }}',
  '{{ "/assets/budget/store.js" | relative_url }}',
  '{{ "/assets/budget/charts.js" | relative_url }}',
  '{{ "/assets/budget/screens.js" | relative_url }}',
  '{{ "/assets/budget/settings.js" | relative_url }}',
  '{{ "/assets/budget/budget.js" | relative_url }}',
  '{{ "/assets/budget/icons/icon-192.png" | relative_url }}',
  '{{ "/assets/budget/icons/icon-512.png" | relative_url }}',
  '{{ "/assets/budget/icons/apple-touch-icon-180.png" | relative_url }}'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(SHELL))
    // No skipWaiting here — the page decides (it defers while a draft exists).
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigations (including deep links) always get the app shell from cache;
  // the hash router evaluates the route client-side.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('{{ "/budget/index.html" | relative_url }}')
        .then(cached => cached || fetch(req))
    );
    return;
  }

  // Cache-first for everything else; the app is fully offline.
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(resp => {
        if (resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(req, copy));
        }
        return resp;
      });
    })
  );
});
