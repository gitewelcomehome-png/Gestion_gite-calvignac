/**
 * SERVICE WORKER - Fiche Client PWA
 * Cache les ressources pour permettre l'accès offline
 */

const CACHE_NAME = 'fiche-client-v2'; // Incrémenté pour forcer le rechargement
const urlsToCache = [
    '/fiche-client.html',
    '/js/fiche-client-app.js',
    '/manifest-fiche-client.json',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Installation - Mettre en cache les ressources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache ouvert');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activation - Nettoyer les anciens caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch - Stratégie Network First, puis Cache
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cloner la réponse pour la mettre en cache
                // Ne pas cacher les requêtes HEAD (non supportées)
                if (event.request.method === 'GET') {
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                }
                
                return response;
            })
            .catch(() => {
                // Si le réseau échoue, utiliser le cache
                return caches.match(event.request);
            })
    );
});
