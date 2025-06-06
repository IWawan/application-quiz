const CACHE_NAME = "quiz-cache-v5";
const urlsToCache = [
  "/",
  "/index.html",
  "/static/style/style.css",
  "/static/script/script.js",
  "/static/icons/favicon.ico",
  "/static/icons/icon-192.png",
  "/static/icons/icon-512.png",
  "https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js"
];

// Installation du service worker et mise en cache des ressources
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

// Interception des requêtes réseau
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      return fetch(event.request).catch(() => {
        return new Response("Erreur réseau ou ressource indisponible", {
          status: 503,
          statusText: "Service Unavailable"
        });
      });
    })
  );
});