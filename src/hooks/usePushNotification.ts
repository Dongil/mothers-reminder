'use client';

import { useState, useEffect, useCallback } from 'react';

interface UsePushNotificationReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  loading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

// Base64 URL을 Uint8Array로 변환
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ArrayBuffer를 Base64로 변환
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function usePushNotification(): UsePushNotificationReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  // 지원 여부 및 현재 상태 확인
  useEffect(() => {
    const checkSupport = async () => {
      const supported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);

        try {
          // 현재 구독 상태 확인
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (err) {
          console.error('Failed to check subscription:', err);
        }
      }

      setLoading(false);
    };

    checkSupport();
  }, []);

  // 푸시 구독
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      setLoading(true);

      // 알림 권한 요청
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Service Worker 구독
      const registration = await navigator.serviceWorker.ready;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key not found');
        return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      // 구독 정보 추출
      const p256dh = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');

      if (!p256dh || !auth) {
        console.error('Failed to get subscription keys');
        return false;
      }

      // 서버에 구독 정보 저장
      const response = await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(p256dh),
            auth: arrayBufferToBase64(auth),
          },
        }),
        credentials: 'include',
      });

      if (response.ok) {
        setIsSubscribed(true);
        return true;
      }

      console.error('Failed to save subscription to server');
      return false;
    } catch (error) {
      console.error('Push subscription error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  // 푸시 구독 해제
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 로컬 구독 해제
        await subscription.unsubscribe();

        // 서버에서 구독 정보 삭제
        await fetch(
          `/api/push-subscriptions?endpoint=${encodeURIComponent(subscription.endpoint)}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        );
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Push unsubscribe error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  };
}
