'use client';

import { useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';

interface UseDateRefreshOptions {
  onDateChange?: () => void;
  enabled?: boolean;
}

/**
 * 자정 감지 훅
 * - 자정이 되면 onDateChange 콜백 호출
 * - 탭이 포커스될 때도 날짜 확인
 */
export function useDateRefresh(options: UseDateRefreshOptions = {}) {
  const { onDateChange, enabled = true } = options;
  const currentDateRef = useRef<string>(format(new Date(), 'yyyy-MM-dd'));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 날짜 변경 확인 및 콜백 호출
  const checkDateChange = useCallback(() => {
    const newDate = format(new Date(), 'yyyy-MM-dd');
    if (newDate !== currentDateRef.current) {
      currentDateRef.current = newDate;
      onDateChange?.();
      return true;
    }
    return false;
  }, [onDateChange]);

  // 자정까지 남은 시간 계산 (밀리초)
  const getMsUntilMidnight = useCallback(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  }, []);

  // 자정 타이머 설정
  const scheduleMidnightCheck = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const msUntilMidnight = getMsUntilMidnight();

    // 자정에 날짜 변경 확인 후 다음 자정 타이머 설정
    timerRef.current = setTimeout(() => {
      checkDateChange();
      scheduleMidnightCheck();
    }, msUntilMidnight + 100); // 100ms 여유를 둬서 확실히 자정 넘김
  }, [getMsUntilMidnight, checkDateChange]);

  // 탭 포커스 시 날짜 확인
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (checkDateChange()) {
          // 날짜가 변경됐으면 타이머 재설정
          scheduleMidnightCheck();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, checkDateChange, scheduleMidnightCheck]);

  // 자정 타이머 설정
  useEffect(() => {
    if (!enabled) return;

    scheduleMidnightCheck();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, scheduleMidnightCheck]);

  return {
    currentDate: currentDateRef.current,
    checkDateChange,
  };
}
