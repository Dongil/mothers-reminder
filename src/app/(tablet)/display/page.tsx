'use client';

/**
 * @fileoverview 태블릿 디스플레이 화면 (DisplayPage)
 *
 * 이 페이지는 태블릿에서 가족 메시지를 표시하는 전용 화면입니다.
 * 거실이나 주방에 설치된 태블릿에서 항상 켜진 상태로 메시지를 보여주는 용도입니다.
 *
 * 주요 기능:
 * - 오늘의 메시지 목록 실시간 표시
 * - TTS(Text-to-Speech)로 메시지 읽기
 * - 메시지 시간에 맞춰 자동 스크롤
 * - 야간 모드 자동 전환 (설정된 시간대에 화면 어둡게)
 * - Wake Lock API로 화면 꺼짐 방지
 * - 브라우저 Autoplay 정책 대응 (터치로 오디오 활성화)
 *
 * 화면 구조:
 * - 오디오 활성화 오버레이 (초기 1회)
 * - 야간 모드 화면 (설정된 시간대)
 * - 헤더 (가족 이름)
 * - 메시지 카드 목록
 * - 하단 상태바 (메시지 수, 화면 유지 상태, 알림 상태)
 *
 * @see useMessages - 메시지 데이터 조회
 * @see useNightMode - 야간 모드 관리
 * @see useNotifications - TTS 스케줄링
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Header, MessageCard, NightMode } from '@/components/tablet';
import { useMessages, useNightMode, useDateRefresh, useUser, useSettings } from '@/hooks';
import { useNotifications } from '@/hooks/useNotifications';
import { getCurrentTimeString } from '@/lib/utils';

/** localStorage에 저장되는 마지막 방문 페이지 키 */
const LAST_PAGE_KEY = 'mothers-reminder-last-page';

/**
 * DisplayPage - 태블릿 디스플레이 메인 컴포넌트
 *
 * @description 가족 메시지를 큰 화면에 표시하는 페이지입니다.
 * 태블릿을 거실에 설치하고 항상 켜둔 상태로 사용하도록 설계되었습니다.
 *
 * 동작 흐름:
 *   1. 페이지 로드 시 오디오 활성화 오버레이 표시
 *   2. 사용자 터치 후 오디오 활성화 → TTS 스케줄링 시작
 *   3. Wake Lock으로 화면 꺼짐 방지
 *   4. 매 분마다 현재 시간 확인하여 해당 시간 메시지로 스크롤
 *   5. 자정이 지나면 날짜 갱신하여 새로운 메시지 로드
 *   6. 야간 시간대 진입 시 야간 모드 화면 표시
 *
 * @example
 * // 태블릿에서 /display 경로로 접근
 * // 브라우저 전체 화면 모드 + 키오스크 모드 권장
 *
 * @returns {JSX.Element} 디스플레이 화면 컴포넌트
 */
export default function DisplayPage() {
  const { user } = useUser();
  const { settings } = useSettings();

  /** 오디오 활성화 상태 (브라우저 autoplay 정책 대응) */
  const [audioEnabled, setAudioEnabled] = useState(false);
  /** TTS 재생 중 여부 */
  const [isSpeaking, setIsSpeaking] = useState(false);
  /** Wake Lock 활성화 상태 */
  const [wakeLockActive, setWakeLockActive] = useState(false);
  /** 현재 시간 (HH:MM 형식) - 자동 스크롤에 사용 */
  const [currentTime, setCurrentTime] = useState(getCurrentTimeString());
  /** 마지막으로 스크롤한 시간 (중복 스크롤 방지) */
  const lastScrolledTimeRef = useRef<string | null>(null);

  /**
   * 마지막 방문 페이지 저장
   * PWA에서 앱 재시작 시 이 페이지로 바로 이동하기 위함
   */
  useEffect(() => {
    localStorage.setItem(LAST_PAGE_KEY, '/display');
  }, []);

  /**
   * Wake Lock API로 화면 꺼짐 방지
   *
   * Wake Lock은 화면이 자동으로 꺼지는 것을 방지합니다.
   * 태블릿을 항상 켜둔 상태로 유지하기 위해 필요합니다.
   *
   * 처리 사항:
   * - 페이지 로드 시 Wake Lock 요청
   * - 페이지가 백그라운드로 갔다가 다시 포그라운드로 올 때 재요청
   * - 언마운트 시 해제
   */
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

  /**
   * 오늘 날짜 상태
   * 자정 후 날짜가 바뀌면 업데이트하여 새로운 메시지를 로드
   */
  const [today, setToday] = useState(() => new Date());

  /**
   * 메시지 데이터 조회
   * - 활성 가족의 메시지만 조회
   * - 오늘 날짜에 표시할 메시지 필터링
   * - Realtime으로 실시간 동기화
   */
  const { messages, loading, refreshMessages } = useMessages({
    familyId: user?.activeFamily?.id,
    date: today,
    realtime: true,
  });

  /**
   * 야간 모드 설정
   * 설정된 시간대에 자동으로 야간 모드 화면 표시
   */
  const { isNightMode, exitNightMode: originalExitNightMode } = useNightMode({
    startTime: settings?.night_mode_start || '20:00',
    endTime: settings?.night_mode_end || '06:00',
    enabled: settings?.night_mode_enabled ?? true,
  });

  /**
   * TTS 스케줄링
   * 각 메시지의 tts_times에 맞춰 소리와 TTS를 예약
   */
  const { scheduleNotifications, requestPermission } = useNotifications({
    soundEnabled: true,
    ttsEnabled: true,
    voice: settings?.tts_voice || undefined,
    speed: typeof settings?.tts_speed === 'number' ? settings.tts_speed : undefined,
  });

  /**
   * 자정 감지 및 날짜 갱신
   *
   * 자정이 지나면:
   * 1. today 상태를 새 날짜로 업데이트
   * 2. 스크롤 상태 초기화
   * 3. useMessages가 새 날짜의 메시지를 자동으로 조회
   */
  const { checkDateChange } = useDateRefresh({
    onDateChange: useCallback(() => {
      setToday(new Date());
      // 스크롤 상태 초기화
      lastScrolledTimeRef.current = null;
    }, []),
    enabled: true,
  });

  /**
   * 야간 모드 종료 핸들러
   * 야간 모드 종료 시 날짜 변경도 확인 (자정을 넘긴 경우)
   */
  const exitNightMode = useCallback(() => {
    checkDateChange();
    originalExitNightMode();
  }, [checkDateChange, originalExitNightMode]);

  /**
   * 매 분마다 현재 시간 확인 및 자동 스크롤
   *
   * 메시지의 display_time과 현재 시간이 일치하면
   * 해당 메시지로 스크롤하여 사용자의 주의를 끕니다.
   */
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

  /**
   * 브라우저 알림 권한 요청
   * 페이지 로드 시 1회 실행
   */
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  /**
   * 오디오 활성화 후 TTS 스케줄링
   *
   * 브라우저 autoplay 정책으로 인해 사용자 인터랙션 후에만
   * 오디오를 재생할 수 있습니다. 오디오 활성화 후 스케줄링 시작.
   */
  useEffect(() => {
    if (audioEnabled && messages.length > 0) {
      scheduleNotifications(messages);
    }
  }, [audioEnabled, messages, scheduleNotifications]);

  /**
   * 오디오 활성화 핸들러
   *
   * 브라우저의 autoplay 정책을 우회하기 위해
   * 무음 오디오를 재생하여 오디오 컨텍스트를 활성화합니다.
   */
  const handleEnableAudio = useCallback(() => {
    // 무음 오디오 재생으로 오디오 컨텍스트 활성화
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    audio.play().catch(() => {});
    setAudioEnabled(true);
  }, []);

  /**
   * 현재 볼륨 계산
   * 야간 모드면 야간 볼륨, 아니면 주간 볼륨 사용
   */
  const currentVolume = isNightMode
    ? (settings?.volume_night ?? 30) / 100
    : (settings?.volume_day ?? 80) / 100;

  /**
   * handleSpeak - 메시지 TTS 재생
   *
   * @description Google Cloud TTS API를 통해 메시지 내용을 음성으로 읽습니다.
   *
   * 동작 흐름:
   *   1. 이미 재생 중이면 무시
   *   2. 서버 /api/tts에 텍스트 전송
   *   3. 반환된 base64 오디오를 재생
   *   4. 재생 완료 또는 에러 시 isSpeaking 해제
   *
   * @param {string} text - 읽을 텍스트
   */
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
      {/* 오디오 활성화 오버레이 - 브라우저 autoplay 정책 대응 */}
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

      {/* 야간 모드 오버레이 */}
      <NightMode isActive={isNightMode} onExit={exitNightMode} />

      <div className="min-h-screen bg-gray-50">
        {/* 헤더 - 가족 이름 표시 */}
        <Header familyName={user?.activeFamily?.name || '가족'} />

        {/* 메시지 목록 */}
        <main className="p-4 md:p-8">
          {loading ? (
            // 로딩 상태
            <div className="flex items-center justify-center h-64">
              <div className="text-lg md:text-2xl text-gray-400">불러오는 중...</div>
            </div>
          ) : messages.length === 0 ? (
            // 메시지 없음 상태
            <div className="flex flex-col items-center justify-center h-64 px-4">
              <p className="text-xl md:text-3xl text-gray-400 mb-2 md:mb-4 text-center">오늘의 메시지가 없습니다</p>
              <p className="text-base md:text-xl text-gray-300 text-center">
                가족이 새 메시지를 보내면 여기에 표시됩니다
              </p>
            </div>
          ) : (
            // 메시지 카드 목록
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

        {/* 하단 상태 표시바 */}
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
