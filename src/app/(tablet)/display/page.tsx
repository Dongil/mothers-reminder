'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Header, MessageCard, NightMode } from '@/components/tablet';
import { useMessages, useNightMode, useDateRefresh, useUser, useSettings } from '@/hooks';
import { useNotifications } from '@/hooks/useNotifications';
import { getCurrentTimeString } from '@/lib/utils';

const LAST_PAGE_KEY = 'mothers-reminder-last-page';

export default function DisplayPage() {
  const { user } = useUser();
  const { settings } = useSettings();

  // 오디오 활성화 상태 (브라우저 autoplay 정책 대응)
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentTimeString());
  const lastScrolledTimeRef = useRef<string | null>(null);

  // 마지막 방문 페이지 저장
  useEffect(() => {
    localStorage.setItem(LAST_PAGE_KEY, '/display');
  }, []);

  // Wake Lock API로 화면 꺼짐 방지
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          setWakeLockActive(true);
          wakeLock.addEventListener('release', () => {
            setWakeLockActive(false);
          });
        }
      } catch (err) {
        console.error('Wake Lock error:', err);
        setWakeLockActive(false);
      }
    };

    // 페이지가 다시 보일 때 wake lock 재요청
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      wakeLock?.release();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 오늘 날짜를 상태로 관리 (자정 후 업데이트 위해)
  const [today, setToday] = useState(() => new Date());

  const { messages, loading, refreshMessages } = useMessages({
    familyId: user?.activeFamily?.id,
    date: today,
    realtime: true,
  });

  const { isNightMode, exitNightMode: originalExitNightMode } = useNightMode({
    startTime: settings?.night_mode_start || '20:00',
    endTime: settings?.night_mode_end || '06:00',
    enabled: settings?.night_mode_enabled ?? true,
  });
  const { scheduleNotifications, requestPermission } = useNotifications({
    soundEnabled: true,
    ttsEnabled: true,
  });

  // 자정 감지 - 날짜가 바뀌면 today 상태 업데이트 후 메시지 새로고침
  const { checkDateChange } = useDateRefresh({
    onDateChange: useCallback(() => {
      setToday(new Date());
      // 스크롤 상태 초기화
      lastScrolledTimeRef.current = null;
    }, []),
    enabled: true,
  });

  // 야간 모드 종료 시 날짜도 확인
  const exitNightMode = useCallback(() => {
    checkDateChange();
    originalExitNightMode();
  }, [checkDateChange, originalExitNightMode]);

  // 매 분마다 현재 시간 업데이트 및 자동 스크롤
  useEffect(() => {
    const checkTimeAndScroll = () => {
      const newTime = getCurrentTimeString();
      setCurrentTime(newTime);

      // 해당 시간의 메시지가 있으면 스크롤
      if (newTime !== lastScrolledTimeRef.current) {
        const messageWithTime = messages.find(
          (msg) => msg.display_time === newTime
        );

        if (messageWithTime) {
          const element = document.getElementById(`message-${messageWithTime.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            lastScrolledTimeRef.current = newTime;
          }
        }
      }
    };

    // 초기 실행
    checkTimeAndScroll();

    // 매 분마다 확인
    const interval = setInterval(checkTimeAndScroll, 60000);

    return () => clearInterval(interval);
  }, [messages]);

  // 알림 권한 요청
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // 오디오 활성화 후에만 스케줄링
  useEffect(() => {
    if (audioEnabled && messages.length > 0) {
      scheduleNotifications(messages);
    }
  }, [audioEnabled, messages, scheduleNotifications]);

  // 화면 터치로 오디오 활성화
  const handleEnableAudio = useCallback(() => {
    // 무음 오디오 재생으로 오디오 컨텍스트 활성화
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    audio.play().catch(() => {});
    setAudioEnabled(true);
  }, []);

  // 현재 볼륨 계산 (야간 모드면 야간 볼륨, 아니면 주간 볼륨)
  const currentVolume = isNightMode
    ? (settings?.volume_night ?? 30) / 100
    : (settings?.volume_day ?? 80) / 100;

  // 메시지 읽기 - Google Cloud TTS API 사용
  const handleSpeak = useCallback(async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: settings?.tts_voice || 'ko-KR-Wavenet-A',
          speed: settings?.tts_speed || 0.9,
        }),
      });

      if (!response.ok) {
        console.error('TTS error:', await response.json());
        setIsSpeaking(false);
        return;
      }

      const data = await response.json();

      // base64 오디오를 재생
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audio.volume = currentVolume;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  }, [isSpeaking, settings?.tts_voice, settings?.tts_speed, currentVolume]);

  return (
    <>
      {/* 오디오 활성화 오버레이 */}
      {!audioEnabled && (
        <div
          className="fixed inset-0 z-50 bg-blue-600 flex flex-col items-center justify-center cursor-pointer"
          onClick={handleEnableAudio}
        >
          <div className="text-white text-center px-4">
            <div className="text-5xl md:text-8xl mb-4 md:mb-8">👆</div>
            <h1 className="text-2xl md:text-5xl font-bold mb-2 md:mb-4">화면을 터치하세요</h1>
            <p className="text-base md:text-2xl opacity-80">알림 소리를 활성화합니다</p>
          </div>
        </div>
      )}

      {/* 야간 모드 */}
      <NightMode isActive={isNightMode} onExit={exitNightMode} />

      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <Header familyName={user?.activeFamily?.name || '가족'} />

        {/* 메시지 목록 */}
        <main className="p-4 md:p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg md:text-2xl text-gray-400">불러오는 중...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-4">
              <p className="text-xl md:text-3xl text-gray-400 mb-2 md:mb-4 text-center">오늘의 메시지가 없습니다</p>
              <p className="text-base md:text-xl text-gray-300 text-center">
                가족이 새 메시지를 보내면 여기에 표시됩니다
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <MessageCard
                  key={message.id}
                  id={`message-${message.id}`}
                  message={message}
                  author={message.author ? {
                    name: message.author.name,
                    nickname: message.author.nickname,
                    gender: message.author.gender,
                  } : undefined}
                  onSpeak={handleSpeak}
                />
              ))}
            </div>
          )}
        </main>

        {/* 하단 상태 표시 */}
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 md:px-8 py-2 md:py-4">
          <div className="flex items-center justify-between text-sm md:text-base text-gray-500">
            <span>메시지 {messages.length}개</span>
            <div className="flex items-center gap-4">
              {wakeLockActive && <span>🔆 화면 유지</span>}
              <span>{isSpeaking ? '🔊 읽는 중...' : audioEnabled ? '🔔 알림 활성화됨' : '터치하여 듣기'}</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
