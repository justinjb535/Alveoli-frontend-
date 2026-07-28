const CACHE_NAME = 'alveoli-cache-v1.2.3';
const urlsToCache = [
  "/",
  "/index.html",
  "/dash.html",
  "/teach.html",
  "/register.html",
  "/main.js",
  "/dashB.css",
  "/loading.css",
  "/manifest.json",
  "/A_20260714_180909_0000 (1).png",
  "/IMG_20260714_194104.png",
  "/alv_logo.png"
];

// 1. INSTALL: cache new files and take over immediately
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// 2. ACTIVATE: delete old caches
self.addEventListener('activate', event => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); 
          }
        })
      );
    })
  );
});

// 3. FETCH: cache static files, but NEVER cache API calls
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Rule 1: Never cache API calls to your backend or supabase
  if (url.pathname.includes('/me') || url.hostname.includes('supabase')) {
    return event.respondWith(fetch(event.request));
  }

  // Rule 2: For HTML/JS/CSS/PNG - Cache first, then update in background
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // only cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // if offline and not in cache, fallback to index
        return cachedResponse || caches.match('/index.html');
      });

      return cachedResponse || fetchPromise;
    })
  );
});
