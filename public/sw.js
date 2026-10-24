// Offline support. The build fills in BUILD_ID and ASSETS (see the sw-precache plugin in
// vite.config.ts), so every built file is cached on install and the first offline launch works.
// Page navigations are network-first (falling back to the cached app shell); other same-origin
// files are stale-while-revalidate.
const BUILD_ID = 'dev';
const ASSETS = [];

const CACHE = `pomodoro-flow-${BUILD_ID}`;
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png', ...ASSETS];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

// Each build gets its own cache, so dropping the others also clears old hashed assets.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Only cache a real page: not an error or a redirect to a login screen.
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('/', copy));
          }
          return res;
        })
        .catch(() => caches.match('/', { ignoreVary: true }).then((cached) => cached || Response.error())),
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      // ignoreVary: precached copies were fetched without the Origin header that the page's CORS
      // requests (Vite adds crossorigin) carry, so a `Vary: Origin` response would never match.
      const cached = await cache.match(req, { ignoreVary: true });
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      if (list.length) return list[0].focus();
      return self.clients.openWindow('/');
    }),
  );
});
