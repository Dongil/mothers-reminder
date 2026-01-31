const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../public/sw.js');

const pushCode = `

// Push notification handlers (added by postbuild)
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

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/settings';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
`;

try {
  let swContent = fs.readFileSync(swPath, 'utf8');

  // 이미 push 코드가 있는지 확인
  if (swContent.includes("self.addEventListener('push'")) {
    console.log('Push handlers already exist in sw.js');
    process.exit(0);
  }

  // push 코드 추가
  swContent += pushCode;
  fs.writeFileSync(swPath, swContent);
  console.log('Push handlers added to sw.js successfully');
} catch (error) {
  console.error('Error modifying sw.js:', error);
  process.exit(1);
}
