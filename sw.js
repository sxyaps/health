/**
 * HealthPulse - Service Worker
 * Provides offline-first caching using a cache-first strategy.
 * All app assets are cached on install for instant offline access.
 */

/** Cache version identifier — increment on each deployment */
var CACHE_NAME = 'healthpulse-v20';

/** List of all app assets to pre-cache */
var ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './storage.js',
  './insights.js',
  './ui.js',
  './manifest.json',
  './icon.svg'
];

/**
 * Install event handler.
 * Pre-caches all app assets for offline use.
 */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

/**
 * Activate event handler.
 * Cleans up old caches when a new service worker takes over.
 */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * Fetch event handler.
 * Uses cache-first strategy: serve from cache, fall back to network.
 * Network responses are cached for future offline use.
 * Navigation requests fall back to index.html for SPA support.
 */
self.addEventListener('fetch', function (event) {
  /* Never cache API calls - let them go straight to the server */
  if (event.request.url.indexOf('/api/') !== -1) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(function (networkResponse) {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(function () {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
