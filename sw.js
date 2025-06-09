const CACHE_NAME = "quiz-cache-v6";
const urlsToCache = [
  '/',
  '/index.html',
  '/static/script/script.js',
  '/static/style/style.css',
  '/static/audios/correct_answer_sound.mp3',
  '/static/audios/fifty_sound.mp3',
  '/static/audios/wrong_answer_sound.mp3',
  '/questions_excel/questions-anglais-1.xlsx',
  '/questions_excel/questions-cinema-1.xlsx',
  '/questions_excel/questions-culture_generale-1.xlsx',
  '/questions_excel/questions-culture_generale-2.xlsx',
  '/questions_excel/questions-culture_generale-3.xlsx',
  '/questions_excel/questions-culture_generale-4.xlsx',
  '/questions_excel/questions-expressions_francaises-1.xlsx',
  '/questions_excel/questions-musique-1.xlsx',
  "https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js"
];

// Installation du service worker et mise en cache des ressources
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
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
  self.clients.claim();
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
