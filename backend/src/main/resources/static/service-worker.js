// ============================================================
// service-worker.js  — Smoke-Free Tracker PWA
// Strategy: Cache-First for static assets, Network-First for API
// ============================================================

const CACHE_NAME    = 'smokefree-v2';
const OFFLINE_URL   = '/offline.html';

// All static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/achievements.html',
  '/health.html',
  '/cravings.html',
  '/progress.html',
  '/support.html',
  '/community.html',
  '/offline.html',
  '/manifest.json',
  '/css/style.css',
  '/js/auth.js',
  '/js/dashboard.js',
  '/js/achievements.js',
  '/js/health.js',
  '/js/cravings.js',
  '/js/progress.js',
  '/js/community.js',
  '/js/support.js',
  '/js/pwa.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── Install: pre-cache all static assets ───────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Cache-First for assets, Network-First for API ───────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API calls → Network-First, fallback to offline notice
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => new Response(
          JSON.stringify({ error: 'You are offline. Please check your connection.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        ))
    );
    return;
  }

  // Google Fonts → Cache-First (stale while revalidate)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME + '-fonts').then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request).then((res) => {
            cache.put(request, res.clone());
            return res;
          });
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // Static assets → Cache-First with network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          // For navigation requests, show the offline page
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// ── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: '🚭 Smoke-Free Tracker', body: 'Keep going! Every moment matters.', icon: '/icons/icon-192.png' };

  if (event.data) {
    try { data = { ...data, ...event.data.json() }; }
    catch (e) { data.body = event.data.text(); }
  }

  const options = {
    body:              data.body,
    icon:              data.icon || '/icons/icon-192.png',
    badge:             '/icons/icon-192.png',
    vibrate:           [200, 100, 200],
    tag:               data.tag || 'smokefree-notification',
    renotify:          true,
    requireInteraction: false,
    data: {
      url: data.url || '/dashboard.html',
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open',    title: '📊 Open Dashboard' },
      { action: 'dismiss', title: '✕ Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── Notification Click ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/dashboard.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app window already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// ── Background Sync (for offline actions) ─────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-craving-logs') {
    event.waitUntil(syncCravingLogs());
  }
});

async function syncCravingLogs() {
  // Placeholder for background sync of craving logs logged while offline
  console.log('[SW] Background sync: craving logs');
}

// ── Periodic motivation notifications (via client message) ─────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SEND_MOTIVATION') {
    const messages = [
      { title: '💪 Stay Strong!',  body: 'Every craving resisted is a victory. You\'ve got this!' },
      { title: '🎉 Keep Going!',   body: 'Your lungs are healing every single day. Amazing job!' },
      { title: '💰 Money Saved!',  body: 'Think about all the money you\'re saving by staying smoke-free.' },
      { title: '❤️ Healthier You', body: 'Your heart and lungs thank you. Keep up the fantastic work!' },
      { title: '🚭 Smoke-Free!',   body: 'You chose health today. That\'s something to be proud of.' },
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    self.registration.showNotification(msg.title, {
      body:  msg.body,
      icon:  '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag:   'motivation',
      data:  { url: '/dashboard.html' },
    });
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
