const CACHE_NAME = 'pdi-digital-v1';
const STATIC_ASSETS = [
    '/',
    '/usta',
    '/mercedes-logo.svg',
    '/mercedes-logo.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Always fetch API calls from network; cache only on success
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok && request.method === 'GET') {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // For navigation requests: network first, fallback to cache
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => caches.match('/') )
        );
        return;
    }

    // Static assets: cache first
    event.respondWith(
        caches.match(request).then(cached => cached || fetch(request).then(response => {
            if (response.ok) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            }
            return response;
        }))
    );
});

// Background sync for offline-saved responses
self.addEventListener('sync', (event) => {
    if (event.tag === 'pdi-sync') {
        event.waitUntil(syncOfflineData());
    }
});

async function syncOfflineData() {
    // Offline sync logic would go here
    // Reads from IndexedDB and posts to server when online
    console.log('[SW] Syncing offline PDI data...');
}
