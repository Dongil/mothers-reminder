// Service Worker for Push Notifications
// Version: 1.0.0

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(clients.claim());
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  if (!event.data) {
    console.log('[SW] No push data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);

    const { title, body, icon, tag, data: notificationData } = data;

    const options = {
      body: body || '',
      icon: icon || '/icons/icon.svg',
      badge: '/icons/icon.svg',
      tag: tag || 'default',
      data: notificationData || {},
      vibrate: [200, 100, 200],
      requireInteraction: true,
    };

    event.waitUntil(
      self.registration.showNotification(title || '가족 메시지', options)
    );
  } catch (err) {
    console.error('[SW] Push event error:', err);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/settings';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if found
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Fetch handler (simple pass-through, no caching)
self.addEventListener('fetch', (event) => {
  // Let the browser handle the request normally
});
