const CACHE_NAME = 'peptideos-shell-v4';
const APP_SHELL = [
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'claim') {
    self.clients.claim();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstPage(event.request));
    return;
  }

  if (isDynamicRequest(event.request, url)) {
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request));
  }
});

function isDynamicRequest(request, url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname === '/sw.js' ||
    isNextRouteDataRequest(request, url)
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/ocr/') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/icon-192.png' ||
    url.pathname === '/icon-512.png' ||
    url.pathname === '/offline.html'
  );
}

function isNextRouteDataRequest(request, url) {
  return (
    request.headers.get('rsc') === '1' ||
    url.searchParams.has('_rsc') ||
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('next-router-state-tree') !== null
  );
}

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;

    return fetch(request).then((response) => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    });
  });
}

function networkFirstPage(request) {
  return fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() => caches.match(request).then((cached) => cached ?? caches.match('/offline.html')));
}
