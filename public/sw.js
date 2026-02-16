const CACHE_NAME = 'te-uekera-v1';
const DOCUMENT_CACHE = 'newspaper-library';
const ASSET_CACHE = 'app-assets';

const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/logo.png',
    '/favicon.ico'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            clients.claim(),
            // Clean up old caches if needed
            caches.keys().then(keys => Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME && key !== DOCUMENT_CACHE && key !== ASSET_CACHE) {
                        return caches.delete(key);
                    }
                })
            ))
        ])
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Intercept requests for individual page images (Document Cache)
    if (url.pathname.includes('/documents/') && url.pathname.includes('/page/')) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).then(networkResponse => {
                    if (networkResponse.ok) {
                        const responseToCache = networkResponse.clone();
                        caches.open(DOCUMENT_CACHE).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }

    // 2. Intercept static assets (Vite build output, fonts)
    if (url.pathname.includes('/build/assets/') || url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).then(networkResponse => {
                    if (networkResponse.ok) {
                        const responseToCache = networkResponse.clone();
                        caches.open(ASSET_CACHE).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }

    // 3. Handle Inertia and Page requests (Network First, but Cache Fallback)
    const isInertia = event.request.headers.get('X-Inertia');

    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                // If successful, cache it (handling Inertia separately if needed, but for now just URL)
                if (networkResponse.ok && event.request.method === 'GET') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        // We use the URL as key. Note: Inertia and HTML for same URL will clash if not handled.
                        // For simplicity, we'll prefix Inertia cache keys if needed, 
                        // but usually the app is either HTML (initial) or Inertia (navigation).
                        // Let's just cache the response.
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request).then(cachedResponse => {
                    if (cachedResponse) return cachedResponse;

                    // Fallback to root for HTML requests if not found
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }
                });
            })
    );
});

// Message listener to add document page images to the library cache
self.addEventListener('message', async (event) => {
    console.log('SW: Received message:', event.data);

    if (event.data && event.data.type === 'CACHE_IMAGES') {
        const { docId, pageCount } = event.data;
        console.log(`SW: Starting image cache for doc ${docId}, ${pageCount} pages`);

        try {
            const cache = await caches.open(DOCUMENT_CACHE);
            const mainCache = await caches.open(CACHE_NAME);
            const promises = [];

            // Add images
            for (let i = 1; i <= pageCount; i++) {
                const url = `/documents/${docId}/page/${i}`;
                promises.push(
                    fetch(url, { credentials: 'include' })
                        .then(response => {
                            if (!response.ok) throw new Error(`Failed to fetch page ${i}`);
                            return cache.put(url, response);
                        })
                );
            }

            // Also cache the reader page itself (Inertia data)
            const readerUrl = `/documents/${docId}/read`;
            promises.push(
                fetch(readerUrl, { headers: { 'X-Inertia': 'true' }, credentials: 'include' })
                    .then(response => {
                        if (response.ok) return mainCache.put(readerUrl, response);
                    })
            );

            await Promise.all(promises);
            console.log(`SW: All ${pageCount} pages and reader data for doc ${docId} cached successfully`);

            if (event.source) {
                event.source.postMessage({ type: 'CACHE_SUCCESS', docId: docId });
            }
        } catch (err) {
            console.error('SW: Image caching failed:', err);
            if (event.source) {
                event.source.postMessage({ type: 'CACHE_ERROR', docId: docId, error: err.message });
            }
        }
    }
});
