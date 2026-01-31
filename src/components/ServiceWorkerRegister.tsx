'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 페이지 로드 후 Service Worker 등록
      window.addEventListener('load', async () => {
        try {
          console.log('[SW] Registering service worker...');
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
          console.log('[SW] Service Worker registered:', registration.scope);

          // 업데이트 확인
          registration.addEventListener('updatefound', () => {
            console.log('[SW] New service worker found');
          });
        } catch (error) {
          console.error('[SW] Service Worker registration failed:', error);
        }
      });

      // 이미 로드된 상태라면 바로 등록
      if (document.readyState === 'complete') {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then(reg => console.log('[SW] SW registered (immediate):', reg.scope))
          .catch(err => console.error('[SW] SW registration failed (immediate):', err));
      }
    }
  }, []);

  return null;
}
