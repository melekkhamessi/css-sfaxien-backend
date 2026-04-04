const CACHE_NAME = 'css-sfaxien-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/matchs.html',
  '/boutique.html',
  '/nouvelles.html',
  '/galerie.html',
  '/calendrier.html',
  '/classement.html',
  '/effectif.html',
  '/histoire.html',
  '/billets.html',
  '/abonnement.html',
  '/don.html',
  '/sections.html',
  '/match-info.html',
  '/dashboard.html',
  '/espace-joueur.html',
  '/css/style.css',
  '/css/dashboard.css',
  '/js/app.js',
  '/js/dashboard.js',
  '/js/player-dashboard.js',
  '/uploads/images/css-logo.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});

// Push notification handler
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'CS Sfaxien', {
      body: data.body || '',
      icon: data.icon || '/uploads/images/icon-192x192.png',
      badge: '/uploads/images/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
      actions: [{ action: 'open', title: 'Voir' }]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const c of list) {
        if (c.url.includes(url) && 'focus' in c) return c.focus();
      }
      return clients.openWindow(url);
    })
  );
});
