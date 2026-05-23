// Service Worker - Virtual JG v2.0
const SW_VERSION = '2.0.0';
const CACHE_NAME = `vjg-v${SW_VERSION}`;

self.addEventListener('install', (event) => {
    console.log('[SW] Install v' + SW_VERSION);
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activate v' + SW_VERSION);
    event.waitUntil(
        Promise.all([
            caches.keys().then(keys =>
                Promise.all(keys.map(k => caches.delete(k)))
            ),
            self.clients.claim()
        ])
    );
});

self.addEventListener('fetch', (event) => {
    // CRÍTICO: Solo procesar GET
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);

    // No tocar APIs externas
    if (url.hostname !== self.location.hostname) {
        return;
    }

    // Network only, sin cache
    event.respondWith(
        fetch(event.request).catch(() => {
            return new Response('Offline', { status: 503 });
        })
    );
});

self.addEventListener('push', (event) => {
    let data = { title: 'Virtual JG', body: 'Nueva notificación', icon: '/assets/logo.png', data: { url: '/' } };
    if (event.data) {
        try { data = { ...data, ...event.data.json() }; }
        catch (e) { data.body = event.data.text(); }
    }
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/assets/logo.png',
            badge: '/assets/logo.png',
            tag: 'vjg-' + Date.now(),
            data: data.data || { url: '/' },
            vibrate: [200, 100, 200],
            actions: [
                { action: 'view', title: '👀 Ver' },
                { action: 'close', title: '✖' }
            ]
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'close') return;

    const urlToOpen = event.notification.data?.url || '/index.html';
    const fullUrl = new URL(urlToOpen, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                for (const client of windowClients) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        return client.navigate(fullUrl);
                    }
                }
                if (clients.openWindow) return clients.openWindow(fullUrl);
            })
    );
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

console.log('[SW] Virtual JG v' + SW_VERSION + ' listo');