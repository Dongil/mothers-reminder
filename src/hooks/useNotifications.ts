'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message } from '@/types/database';
import { getTTSService } from '@/lib/tts/speech';

interface NotificationOptions {
  soundEnabled?: boolean;
  ttsEnabled?: boolean;
  soundUrl?: string;
}

interface ScheduledNotification {
  messageId: string;
  time: string;
  timeoutId: NodeJS.Timeout;
}

interface UseNotificationsReturn {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  scheduleNotifications: (messages: Message[]) => void;
  cancelNotification: (messageId: string) => void;
  cancelAllNotifications: () => void;
  scheduledCount: number;
  playChime: () => Promise<void>;
  playAlert: () => Promise<void>;
}

export function useNotifications(options: NotificationOptions = {}): UseNotificationsReturn {
  const {
    soundEnabled = true,
    ttsEnabled = true,
    soundUrl = '/sounds/chime.mp3',
  } = options;

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const scheduledRef = useRef<Map<string, ScheduledNotification[]>>(new Map());
  const [scheduledCount, setScheduledCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);

  // 권한 상태 초기화
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // 오디오 요소 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.preload = 'auto';

      alertAudioRef.current = new Audio('/sounds/alert.mp3');
      alertAudioRef.current.preload = 'auto';
    }

    return () => {
      audioRef.current = null;
      alertAudioRef.current = null;
    };
  }, [soundUrl]);

  // 알림 권한 요청
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Notification permission error:', error);
      return 'denied';
    }
  }, []);

  // 차임벨 재생
  const playChime = useCallback(async (): Promise<void> => {
    if (!soundEnabled || !audioRef.current) return;

    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.error('Chime play error:', error);
    }
  }, [soundEnabled]);

  // 긴급 알림음 재생
  const playAlert = useCallback(async (): Promise<void> => {
    if (!alertAudioRef.current) return;

    try {
      alertAudioRef.current.currentTime = 0;
      await alertAudioRef.current.play();
    } catch (error) {
      console.error('Alert play error:', error);
    }
  }, []);

  // 알림 표시
  const showNotification = useCallback(async (message: Message) => {
    // 소리 재생
    if (soundEnabled) {
      if (message.priority === 'urgent') {
        await playAlert();
      } else {
        await playChime();
      }
    }

    // TTS 재생
    if (ttsEnabled && message.tts_enabled) {
      const tts = getTTSService();
      try {
        await tts.speak(message.content, {
          rate: message.tts_speed || 0.8,
          voice: message.tts_voice,
        });
      } catch (error) {
        console.error('TTS error:', error);
      }
    }

    // 브라우저 알림 표시
    if (permission === 'granted') {
      try {
        new Notification('가족 메시지', {
          body: message.content,
          icon: '/icons/icon.svg',
          tag: message.id,
          requireInteraction: message.priority === 'urgent',
        });
      } catch (error) {
        console.error('Notification error:', error);
      }
    }
  }, [permission, soundEnabled, ttsEnabled, playChime, playAlert]);

  // 단일 알림 스케줄링
  const scheduleOne = useCallback((message: Message, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0
    );

    // 이미 지난 시간이면 스킵
    if (scheduledTime <= now) {
      return null;
    }

    const delay = scheduledTime.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      showNotification(message);

      // 스케줄에서 제거
      const scheduled = scheduledRef.current.get(message.id) || [];
      const updated = scheduled.filter((s) => s.time !== time);
      if (updated.length > 0) {
        scheduledRef.current.set(message.id, updated);
      } else {
        scheduledRef.current.delete(message.id);
      }
      setScheduledCount((prev) => prev - 1);
    }, delay);

    return { messageId: message.id, time, timeoutId };
  }, [showNotification]);

  // 메시지 알림 스케줄링
  const scheduleNotifications = useCallback((messages: Message[]) => {
    // 기존 스케줄 취소
    scheduledRef.current.forEach((notifications) => {
      notifications.forEach((n) => clearTimeout(n.timeoutId));
    });
    scheduledRef.current.clear();
    setScheduledCount(0);

    let count = 0;

    messages.forEach((message) => {
      if (!message.tts_enabled || !message.tts_times || message.tts_times.length === 0) {
        return;
      }

      const scheduled: ScheduledNotification[] = [];

      message.tts_times.forEach((time) => {
        const notification = scheduleOne(message, time);
        if (notification) {
          scheduled.push(notification);
          count++;
        }
      });

      if (scheduled.length > 0) {
        scheduledRef.current.set(message.id, scheduled);
      }
    });

    setScheduledCount(count);
  }, [scheduleOne]);

  // 단일 메시지 알림 취소
  const cancelNotification = useCallback((messageId: string) => {
    const scheduled = scheduledRef.current.get(messageId);
    if (scheduled) {
      scheduled.forEach((n) => clearTimeout(n.timeoutId));
      scheduledRef.current.delete(messageId);
      setScheduledCount((prev) => prev - scheduled.length);
    }
  }, []);

  // 모든 알림 취소
  const cancelAllNotifications = useCallback(() => {
    scheduledRef.current.forEach((notifications) => {
      notifications.forEach((n) => clearTimeout(n.timeoutId));
    });
    scheduledRef.current.clear();
    setScheduledCount(0);
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cancelAllNotifications();
    };
  }, [cancelAllNotifications]);

  return {
    permission,
    requestPermission,
    scheduleNotifications,
    cancelNotification,
    cancelAllNotifications,
    scheduledCount,
    playChime,
    playAlert,
  };
}

/**
 * 야간 모드 관리
 */
export function useNightMode(startTime = '20:00', endTime = '06:00') {
  const [isNightMode, setIsNightMode] = useState(false);

  useEffect(() => {
    const checkNightMode = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // 야간 시간대 확인
      if (startTime > endTime) {
        // 예: 20:00 ~ 06:00 (자정을 넘김)
        setIsNightMode(currentTime >= startTime || currentTime < endTime);
      } else {
        // 예: 22:00 ~ 23:00 (같은 날)
        setIsNightMode(currentTime >= startTime && currentTime < endTime);
      }
    };

    checkNightMode();
    const interval = setInterval(checkNightMode, 60000); // 1분마다 확인

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const exitNightMode = useCallback(() => {
    setIsNightMode(false);
  }, []);

  return { isNightMode, exitNightMode };
}
