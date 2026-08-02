// sw.js - Service Worker for LifeFlow AI
const CACHE_NAME = 'lifeflow-cache-v2';
// Use relative paths (resolved against sw.js scope) so caching works
// whether the app is deployed at the domain root or in a subfolder.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/icons/favicon.ico',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/css/variables.css',
  './assets/css/global.css',
  './assets/css/typography.css',
  './assets/css/layout.css',
  './assets/css/components.css',
  './assets/css/glassmorphism.css',
  './assets/css/animations.css',
  './assets/css/dashboard.css',
  './assets/css/planner.css',
  './assets/css/calendar.css',
  './assets/css/analytics.css',
  './assets/css/settings.css',
  './assets/css/responsive.css',
  './assets/js/storage.js',
  './assets/js/utils.js',
  './assets/js/theme.js',
  './assets/js/router.js',
  './assets/js/components.js',
  './assets/js/dashboard.js',
  './assets/js/planner.js',
  './assets/js/pomodoro.js',
  './assets/js/calendar.js',
  './assets/js/goals.js',
  './assets/js/habits.js',
  './assets/js/analytics.js',
  './assets/js/settings.js',
  './assets/js/ai-hub.js',
  './assets/js/app.js'
];

// External CDN assets are cached separately with { mode: 'no-cors' }.
// Cross-origin resources can fail opaque-response caching under strict
// cache.addAll(), so we don't let them block the entire install step.
const EXTERNAL_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
];

// 1. Install Event: Cache Static Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[Service Worker] Caching local static assets');
      await cache.addAll(ASSETS_TO_CACHE);

      console.log('[Service Worker] Caching external assets');
      await Promise.all(
        EXTERNAL_ASSETS.map((url) =>
          cache.add(new Request(url, { mode: 'no-cors' })).catch((err) => {
            console.warn('[Service Worker] Skipped external asset (offline or blocked):', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clear Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Cache-First Strategy with Network Fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset and update cache in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore network errors on background sync */});
        
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // Fallback for HTML pages if offline
        const acceptHeader = event.request.headers.get('accept') || '';
        if (acceptHeader.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// 4. Web Push Notification Event Listener
self.addEventListener('push', (event) => {
  let data = { title: 'LifeFlow AI Reminder', body: 'Time to boost your focus!', icon: 'assets/icons/icon-192.png' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/svgs/solid/stopwatch.svg',
    badge: 'https://cdnjs.cloudflare.com/ajax/libs/fonts/font-awesome/6.4.0/svgs/solid/feather-pointed.svg',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
