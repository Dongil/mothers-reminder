'use client';

/**
 * @fileoverview 알림 및 TTS 관리 훅 (useNotifications, useNightMode)
 *
 * 이 파일은 브라우저 알림, TTS(Text-to-Speech), 소리 재생을 관리하는 훅들을 제공합니다.
 * 디스플레이 화면에서 예약된 시간에 메시지를 읽어주고 알림을 표시하는 데 사용됩니다.
 *
 * 주요 기능:
 * - 브라우저 Notification API를 통한 알림 권한 관리
 * - TTS 스케줄링 (특정 시간에 메시지 읽기)
 * - 차임벨/긴급 알림음 재생
 * - 야간 모드 관리 (특정 시간대 자동 진입)
 *
 * @see useMessages - 메시지 데이터 제공
 * @see useSettings - 볼륨, TTS 설정 제공
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message } from '@/types/database';

/**
 * useNotifications 훅 옵션
 *
 * @property {boolean} [soundEnabled=true] - 알림 소리 활성화 여부
 * @property {boolean} [ttsEnabled=true] - TTS 활성화 여부
 * @property {string} [soundUrl] - 차임벨 소리 파일 경로
 */
interface NotificationOptions {
  soundEnabled?: boolean;
  ttsEnabled?: boolean;
  soundUrl?: string;
  /** TTS 목소리 (Google Cloud TTS voice name) */
  voice?: string;
  /** TTS 속도 (0.25 ~ 4.0) */
  speed?: number;
}

/**
 * 스케줄된 알림 정보
 *
 * @description 특정 메시지의 특정 시간에 예약된 알림
 * setTimeout의 ID를 보관하여 취소할 수 있게 함
 */
interface ScheduledNotification {
  messageId: string;
  time: string;
  timeoutId: NodeJS.Timeout;
}

/**
 * useNotifications 훅의 반환 타입
 */
interface UseNotificationsReturn {
  /** 브라우저 알림 권한 상태 */
  permission: NotificationPermission;
  /** 알림 권한 요청 함수 */
  requestPermission: () => Promise<NotificationPermission>;
  /** 메시지 목록의 TTS 스케줄링 */
  scheduleNotifications: (messages: Message[]) => void;
  /** 특정 메시지의 알림 취소 */
  cancelNotification: (messageId: string) => void;
  /** 모든 알림 취소 */
  cancelAllNotifications: () => void;
  /** 현재 스케줄된 알림 개수 */
  scheduledCount: number;
  /** 차임벨 소리 재생 */
  playChime: () => Promise<void>;
  /** 긴급 알림 소리 재생 */
  playAlert: () => Promise<void>;
}

/**
 * useNotifications - 알림 및 TTS 스케줄링 훅
 *
 * @description 메시지의 TTS 시간에 맞춰 알림을 스케줄링하고,
 * 해당 시간이 되면 소리와 TTS를 재생합니다.
 *
 * 동작 흐름:
 *   1. 브라우저 알림 권한 확인/요청
 *   2. 오디오 요소 초기화 (차임벨, 긴급 알림)
 *   3. 메시지 목록을 받아 각 tts_times에 대해 setTimeout 설정
 *   4. 예약된 시간이 되면 소리 재생 → TTS 재생 → 브라우저 알림 표시
 *
 * @param {NotificationOptions} options - 알림 설정 옵션
 * @returns {UseNotificationsReturn} 알림 관련 함수와 상태
 *
 * @example
 * const { scheduleNotifications, permission } = useNotifications({
 *   soundEnabled: true,
 *   ttsEnabled: true,
 * });
 *
 * // 메시지 로드 후 스케줄링
 * useEffect(() => {
 *   if (messages.length > 0) {
 *     scheduleNotifications(messages);
 *   }
 * }, [messages]);
 */
export function useNotifications(options: NotificationOptions = {}): UseNotificationsReturn {
  const {
    soundEnabled = true,
    ttsEnabled = true,
    soundUrl = '/sounds/chime.mp3',
    voice,
    speed,
  } = options;

  // 항상 최신 voice/speed 참조 (closure 캡처 방지)
  const voiceRef = useRef<string | undefined>(voice);
  const speedRef = useRef<number | undefined>(speed);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const [permission, setPermission] = useState<NotificationPermission>('default');
  /** 메시지ID → 스케줄된 알림 배열 매핑 */
  const scheduledRef = useRef<Map<string, ScheduledNotification[]>>(new Map());
  const [scheduledCount, setScheduledCount] = useState(0);
  /** 시간(HH:MM) → 해당 시간 알림 큐 매핑 (같은 시간 메시지 순차 재생용) */
  const timeQueueRef = useRef<Map<string, Message[]>>(new Map());
  /** 시간별 큐 실행 setTimeout ID */
  const timeQueueTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  /** 차임벨 오디오 요소 */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** 긴급 알림 오디오 요소 */
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * 권한 상태 초기화
   * 브라우저가 Notification API를 지원하면 현재 권한 상태를 설정
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  /**
   * 오디오 요소 초기화
   * 차임벨과 긴급 알림음을 미리 로드하여 즉시 재생 가능하게 함
   */
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

  /**
   * requestPermission - 브라우저 알림 권한 요청
   *
   * @description 사용자에게 알림 권한을 요청합니다.
   * 브라우저에서 알림 권한 팝업이 표시됩니다.
   *
   * @returns {Promise<NotificationPermission>} 권한 상태 ('granted' | 'denied' | 'default')
   */
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

  /**
   * playChime - 차임벨 소리 재생
   *
   * @description 일반 메시지 알림 시 재생되는 부드러운 알림음
   */
  const playChime = useCallback(async (): Promise<void> => {
    if (!soundEnabled || !audioRef.current) return;

    try {
      const audio = audioRef.current;
      audio.currentTime = 0;
      await new Promise<void>((resolve) => {
        const onEnd = () => { audio.removeEventListener('ended', onEnd); resolve(); };
        audio.addEventListener('ended', onEnd);
        audio.play().catch(() => { audio.removeEventListener('ended', onEnd); resolve(); });
      });
    } catch (error) {
      console.error('Chime play error:', error);
    }
  }, [soundEnabled]);

  /**
   * playAlert - 긴급 알림 소리 재생
   *
   * @description 긴급(urgent) 우선순위 메시지에 사용되는 강한 알림음
   */
  const playAlert = useCallback(async (): Promise<void> => {
    if (!alertAudioRef.current) return;

    try {
      const audio = alertAudioRef.current;
      audio.currentTime = 0;
      await new Promise<void>((resolve) => {
        const onEnd = () => { audio.removeEventListener('ended', onEnd); resolve(); };
        audio.addEventListener('ended', onEnd);
        audio.play().catch(() => { audio.removeEventListener('ended', onEnd); resolve(); });
      });
    } catch (error) {
      console.error('Alert play error:', error);
    }
  }, []);

  /**
   * speakWithCloudTTS - Google Cloud TTS로 텍스트 읽기
   *
   * @description 서버의 /api/tts 엔드포인트를 통해 Google Cloud TTS를 호출하고,
   * 반환된 오디오를 재생합니다.
   *
   * @param {string} text - 읽을 텍스트
   */
  const speakWithCloudTTS = useCallback(async (text: string) => {
    try {
      const body: { text: string; voice?: string; speed?: number } = { text };
      if (voiceRef.current) body.voice = voiceRef.current;
      if (typeof speedRef.current === 'number') body.speed = speedRef.current;

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error('Cloud TTS error:', await response.json());
        return;
      }

      const data = await response.json();
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      // 재생 완료까지 대기 (순차 재생을 위함)
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });
    } catch (error) {
      console.error('Cloud TTS error:', error);
    }
  }, []);

  /**
   * showNotification - 알림 표시 (소리 + TTS + 브라우저 알림)
   *
   * @description 메시지 알림을 표시합니다.
   *
   * 실행 순서:
   *   1. 소리 재생 (urgent면 긴급 알림, 아니면 차임벨)
   *   2. TTS 재생 (메시지의 tts_enabled가 true인 경우)
   *   3. 브라우저 알림 표시 (권한이 granted인 경우)
   *
   * @param {Message} message - 표시할 메시지
   */
  const showNotification = useCallback(async (message: Message) => {
    // 소리 재생 (완료까지 대기)
    if (soundEnabled) {
      if (message.priority === 'urgent') {
        await playAlert();
      } else {
        await playChime();
      }
    }

    // TTS 재생 (완료까지 대기)
    if (ttsEnabled && message.tts_enabled) {
      await speakWithCloudTTS(message.content);
    }

    // 브라우저 알림 표시
    if (permission === 'granted') {
      try {
        new Notification('가족 메시지', {
          body: message.content,
          icon: '/icons/icon.svg',
          tag: message.id,
          // 긴급 메시지는 사용자가 직접 닫을 때까지 유지
          requireInteraction: message.priority === 'urgent',
        });
      } catch (error) {
        console.error('Notification error:', error);
      }
    }
  }, [permission, soundEnabled, ttsEnabled, playChime, playAlert, speakWithCloudTTS]);

  /**
   * runQueueForTime - 특정 시간의 메시지 큐 순차 실행
   *
   * 같은 시간에 여러 메시지가 있으면 차례대로:
   *   알림음 → 메시지1 TTS → 5초 쉼 → 알림음 → 메시지2 TTS → ...
   */
  const runQueueForTime = useCallback(async (time: string) => {
    const queue = timeQueueRef.current.get(time);
    if (!queue || queue.length === 0) return;
    timeQueueRef.current.delete(time);
    timeQueueTimerRef.current.delete(time);

    for (let i = 0; i < queue.length; i++) {
      const msg = queue[i];
      try {
        await showNotification(msg);
      } catch (e) {
        console.error('Queue notification error:', e);
      }
      // 마지막 메시지가 아니면 5초 대기
      if (i < queue.length - 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, 5000));
      }
    }
  }, [showNotification]);

  /**
   * scheduleOne - 단일 알림 스케줄링
   *
   * @description 특정 메시지의 특정 시간에 알림을 예약합니다.
   * 이미 지난 시간이면 스케줄하지 않습니다.
   *
   * @param {Message} message - 스케줄할 메시지
   * @param {string} time - 스케줄 시간 ('HH:MM' 형식)
   * @returns {ScheduledNotification | null} 스케줄된 알림 정보 또는 null
   */
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

    // 같은 시간 큐에 메시지 추가
    const queue = timeQueueRef.current.get(time) || [];
    queue.push(message);
    timeQueueRef.current.set(time, queue);

    // 해당 시간 타이머가 이미 있으면 재사용 (큐만 추가)
    let timeoutId = timeQueueTimerRef.current.get(time);
    if (!timeoutId) {
      const delay = scheduledTime.getTime() - now.getTime();
      timeoutId = setTimeout(() => {
        runQueueForTime(time);
        // 스케줄 카운트 정리
        const queued = timeQueueRef.current.get(time)?.length || 0;
        setScheduledCount((prev) => Math.max(0, prev - queued));
      }, delay);
      timeQueueTimerRef.current.set(time, timeoutId);
    }

    return { messageId: message.id, time, timeoutId };
  }, [runQueueForTime]);

  /**
   * scheduleNotifications - 메시지 목록 알림 스케줄링
   *
   * @description 모든 메시지의 tts_times를 확인하여 알림을 스케줄링합니다.
   * 기존 스케줄은 모두 취소하고 새로 설정합니다.
   *
   * @param {Message[]} messages - 스케줄링할 메시지 목록
   */
  const scheduleNotifications = useCallback((messages: Message[]) => {
    // 기존 스케줄 취소
    timeQueueTimerRef.current.forEach((id) => clearTimeout(id));
    timeQueueTimerRef.current.clear();
    timeQueueRef.current.clear();
    scheduledRef.current.clear();
    setScheduledCount(0);

    let count = 0;

    messages.forEach((message) => {
      // TTS가 활성화되지 않았거나 시간이 설정되지 않은 메시지는 스킵
      if (!message.tts_enabled || !message.tts_times || message.tts_times.length === 0) {
        return;
      }

      const scheduled: ScheduledNotification[] = [];

      // 각 TTS 시간에 대해 스케줄 설정
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

  /**
   * cancelNotification - 특정 메시지의 알림 취소
   *
   * @param {string} messageId - 취소할 메시지 ID
   */
  const cancelNotification = useCallback((messageId: string) => {
    const scheduled = scheduledRef.current.get(messageId);
    if (scheduled) {
      scheduled.forEach((n) => clearTimeout(n.timeoutId));
      scheduledRef.current.delete(messageId);
      setScheduledCount((prev) => prev - scheduled.length);
    }
  }, []);

  /**
   * cancelAllNotifications - 모든 알림 취소
   *
   * @description 스케줄된 모든 알림을 취소합니다.
   * 컴포넌트 언마운트 시 자동으로 호출됩니다.
   */
  const cancelAllNotifications = useCallback(() => {
    timeQueueTimerRef.current.forEach((id) => clearTimeout(id));
    timeQueueTimerRef.current.clear();
    timeQueueRef.current.clear();
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
 * useNightMode 훅 옵션
 *
 * @property {string} [startTime='20:00'] - 야간 모드 시작 시간 (HH:MM)
 * @property {string} [endTime='06:00'] - 야간 모드 종료 시간 (HH:MM)
 * @property {boolean} [enabled=true] - 야간 모드 활성화 여부
 */
interface NightModeOptions {
  startTime?: string;
  endTime?: string;
  enabled?: boolean;
}

/**
 * useNightMode - 야간 모드 관리 훅
 *
 * @description 특정 시간대에 자동으로 야간 모드를 활성화합니다.
 * 야간 모드에서는 디스플레이 화면이 어두워지고 TTS가 비활성화됩니다.
 *
 * 동작 흐름:
 *   1. 현재 시간이 야간 시간대인지 확인
 *   2. 야간 시간대면 isNightMode를 true로 설정
 *   3. 1분마다 재확인하여 상태 갱신
 *
 * 시간대 계산:
 *   - startTime > endTime인 경우 (예: 20:00 ~ 06:00): 자정을 넘기는 시간대
 *   - startTime < endTime인 경우 (예: 22:00 ~ 23:00): 같은 날 시간대
 *
 * @param {NightModeOptions} options - 야간 모드 설정
 * @returns {{ isNightMode: boolean, exitNightMode: () => void }}
 *
 * @example
 * const { isNightMode, exitNightMode } = useNightMode({
 *   startTime: '22:00',
 *   endTime: '07:00',
 *   enabled: true,
 * });
 *
 * if (isNightMode) {
 *   return <NightModeScreen onExit={exitNightMode} />;
 * }
 */
export function useNightMode(options: NightModeOptions = {}) {
  const { startTime = '20:00', endTime = '06:00', enabled = true } = options;
  const [isNightMode, setIsNightMode] = useState(false);

  useEffect(() => {
    // 야간 모드가 비활성화되면 항상 false
    if (!enabled) {
      setIsNightMode(false);
      return;
    }

    /**
     * 현재 시간이 야간 시간대인지 확인
     */
    const checkNightMode = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // 야간 시간대 확인
      if (startTime > endTime) {
        // 자정을 넘기는 경우 (예: 20:00 ~ 06:00)
        // currentTime >= 20:00 또는 currentTime < 06:00 이면 야간
        setIsNightMode(currentTime >= startTime || currentTime < endTime);
      } else {
        // 같은 날인 경우 (예: 22:00 ~ 23:00)
        setIsNightMode(currentTime >= startTime && currentTime < endTime);
      }
    };

    checkNightMode();
    // 1분마다 확인
    const interval = setInterval(checkNightMode, 60000);

    return () => clearInterval(interval);
  }, [startTime, endTime, enabled]);

  /**
   * exitNightMode - 야간 모드 수동 종료
   *
   * @description 사용자가 야간 모드 화면을 터치하면 호출됩니다.
   * 다음 야간 시간대까지 야간 모드가 해제됩니다.
   */
  const exitNightMode = useCallback(() => {
    setIsNightMode(false);
  }, []);

  return { isNightMode, exitNightMode };
}
