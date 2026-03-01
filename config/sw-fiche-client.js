/**
 * SERVICE WORKER - Fiche Client PWA
 * Cache les ressources pour permettre l'accès offline
 */

const CACHE_NAME = 'fiche-client-v4'; // Version avec logs debug
const urlsToCache = [
    '/fiche-client.html',
    '/js/fiche-client-app.js',
    '/config/manifest-fiche-client.json',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Installation - Mettre en cache les ressources
self.addEventListener('install', event => {
    // console.log('🔵 SW v4: Installing...');
    // Forcer le nouveau SW à prendre le contrôle immédiatement
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // console.log('🔵 SW v4: Cache opened');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activation - Nettoyer les anciens caches
self.addEventListener('activate', event => {
    // console.log('🟢 SW v4: Activating...');
    // Prendre le contrôle de tous les clients immédiatement
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        // console.log('🗑️ SW v4: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // console.log('🟢 SW v4: Claiming clients...');
            return self.clients.claim();
        })
    );
});

// Fetch - Stratégie Network First, puis Cache
self.addEventListener('fetch', event => {
    // Ignorer complètement les requêtes non-GET (HEAD, POST, etc.)
    if (event.request.method !== 'GET') {
        // console.log('SW: Ignoring non-GET request:', event.request.method, event.request.url);
        return;
    }
    
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // console.log('SW v3: Fetched', event.request.url);
                
                // Cloner la réponse pour la mettre en cache
                const responseToCache = response.clone();
                
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache)
                            .catch(err => console.error('SW: Cache error', err));
                    });
                
                return response;
            })
            .catch(() => {
                // console.log('SW v3: Using cache for', event.request.url);
                // Si le réseau échoue, utiliser le cache
                return caches.match(event.request);
            })
    );
});
