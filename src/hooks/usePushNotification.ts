'use client';

import { useState, useEffect, useCallback } from 'react';

interface UsePushNotificationReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  loading: boolean;
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);

  // 지원 여부 및 현재 상태 확인
  useEffect(() => {
    const checkSupport = async () => {
      console.log('[Push] Checking support...');

      const hasServiceWorker = typeof window !== 'undefined' && 'serviceWorker' in navigator;
      const hasPushManager = typeof window !== 'undefined' && 'PushManager' in window;
      const hasNotification = typeof window !== 'undefined' && 'Notification' in window;

      console.log('[Push] Support check:', { hasServiceWorker, hasPushManager, hasNotification });

      const supported = hasServiceWorker && hasPushManager && hasNotification;
      setIsSupported(supported);

      if (!supported) {
        if (!hasServiceWorker) setError('Service Worker 미지원');
        else if (!hasPushManager) setError('Push Manager 미지원');
        else if (!hasNotification) setError('Notification 미지원');
        setLoading(false);
        return;
      }

      setPermission(Notification.permission);
      console.log('[Push] Permission:', Notification.permission);

      try {
        // Service Worker 등록 확인
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('[Push] SW registrations:', registrations.length);

        if (registrations.length === 0) {
          setError('Service Worker가 등록되지 않음');
          setLoading(false);
          return;
        }

        // 현재 구독 상태 확인
        const registration = await navigator.serviceWorker.ready;
        console.log('[Push] SW ready:', registration.scope);

        const subscription = await registration.pushManager.getSubscription();
        console.log('[Push] Existing subscription:', !!subscription);
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('[Push] Failed to check subscription:', err);
        setError(`구독 확인 실패: ${err instanceof Error ? err.message : String(err)}`);
      }

      setLoading(false);
    };

    checkSupport();
  }, []);

  // 푸시 구독
  const subscribe = useCallback(async (): Promise<boolean> => {
    console.log('[Push] Subscribe called, isSupported:', isSupported);
    setError(null);

    if (!isSupported) {
      setError('푸시 알림이 지원되지 않습니다');
      return false;
    }

    try {
      setLoading(true);

      // 알림 권한 요청
      console.log('[Push] Requesting permission...');
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      console.log('[Push] Permission result:', permissionResult);

      if (permissionResult !== 'granted') {
        setError('알림 권한이 거부되었습니다');
        return false;
      }

      // Service Worker 구독
      console.log('[Push] Getting SW ready...');
      const registration = await navigator.serviceWorker.ready;
      console.log('[Push] SW scope:', registration.scope);

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      console.log('[Push] VAPID key exists:', !!vapidPublicKey);
      if (!vapidPublicKey) {
        setError('VAPID 공개키가 설정되지 않음');
        return false;
      }

      console.log('[Push] Subscribing to push manager...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
      console.log('[Push] Subscription endpoint:', subscription.endpoint.substring(0, 50) + '...');

      // 구독 정보 추출
      const p256dh = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');

      if (!p256dh || !auth) {
        setError('구독 키를 가져올 수 없습니다');
        return false;
      }

      // 서버에 구독 정보 저장
      console.log('[Push] Saving subscription to server...');
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
        console.log('[Push] Subscription saved successfully');
        setIsSubscribed(true);
        setError(null);
        return true;
      }

      const errorData = await response.json().catch(() => ({}));
      console.error('[Push] Server error:', response.status, errorData);
      setError(`서버 저장 실패: ${errorData.error || response.status}`);
      return false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[Push] Subscribe error:', err);
      setError(`구독 오류: ${errorMsg}`);
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
    error,
    subscribe,
    unsubscribe,
  };
}
