'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 페이지 로드 후 Service Worker 등록
      window.addEventListener('load', async () => {
        try {
          await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      });

      // 이미 로드된 상태라면 바로 등록
      if (document.readyState === 'complete') {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .catch(err => console.error('Service Worker registration failed:', err));
      }
    }
  }, []);

  return null;
}
