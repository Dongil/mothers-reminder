// 푸시 알림 전용 Service Worker
// 이 파일은 메인 sw.js에 의해 importScripts로 로드됩니다.

// 푸시 메시지 수신 처리
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const { title, body, icon, tag, data: notificationData } = data;

    const options = {
      body,
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
    console.error('Push event error:', err);
  }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/settings';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열린 창이 있으면 포커스
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
