'use client';

import React, { useEffect, useMemo } from 'react';
import { Header, MessageCard, NightMode } from '@/components/tablet';
import { useMessages, useTTS, useNightMode } from '@/hooks';
import { useNotifications } from '@/hooks/useNotifications';

export default function DisplayPage() {
  // 오늘 날짜를 메모이제이션
  const today = useMemo(() => new Date(), []);

  const { messages, loading } = useMessages({
    date: today,
    realtime: true,
  });

  const { speak, speaking } = useTTS({ rate: 0.8 });
  const { isNightMode, exitNightMode } = useNightMode('20:00', '06:00');
  const { scheduleNotifications, requestPermission } = useNotifications({
    soundEnabled: true,
    ttsEnabled: true,
  });

  // 알림 권한 요청 및 스케줄링
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (messages.length > 0) {
      scheduleNotifications(messages);
    }
  }, [messages, scheduleNotifications]);

  // 메시지 읽기 - Web Speech API 직접 호출
  const handleSpeak = (text: string) => {
    console.log('TTS 요청:', text);

    const synth = window.speechSynthesis;

    // 기존 재생 중지
    synth.cancel();

    // Chrome 버그 대응: cancel 후 딜레이
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Google 한국어 음성 우선 찾기
      const voices = synth.getVoices();
      console.log('사용 가능한 음성 수:', voices.length);

      // Google 음성 우선, 없으면 다른 한국어 음성
      const googleKorean = voices.find(v => v.name.includes('Google') && v.lang.includes('ko'));
      const anyKorean = voices.find(v => v.lang.includes('ko'));

      if (googleKorean) {
        utterance.voice = googleKorean;
        console.log('선택된 음성 (Google):', googleKorean.name);
      } else if (anyKorean) {
        utterance.voice = anyKorean;
        console.log('선택된 음성:', anyKorean.name);
      } else {
        console.log('한국어 음성 없음, 기본 음성 사용');
      }

      utterance.onstart = () => console.log('재생 시작');
      utterance.onend = () => console.log('재생 종료');
      utterance.onerror = (e) => console.error('에러:', e.error);

      // 재생
      synth.speak(utterance);
      console.log('speak() 호출됨, pending:', synth.pending, 'speaking:', synth.speaking);
    }, 100);
  };

  return (
    <>
      {/* 야간 모드 */}
      <NightMode isActive={isNightMode} onExit={exitNightMode} />

      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <Header familyName="우리 가족" />

        {/* 메시지 목록 */}
        <main className="p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-2xl text-gray-400">불러오는 중...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-3xl text-gray-400 mb-4">오늘의 메시지가 없습니다</p>
              <p className="text-xl text-gray-300">
                가족이 새 메시지를 보내면 여기에 표시됩니다
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  onSpeak={handleSpeak}
                />
              ))}
            </div>
          )}
        </main>

        {/* 하단 상태 표시 */}
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t px-8 py-4">
          <div className="flex items-center justify-between text-gray-500">
            <span>메시지 {messages.length}개</span>
            <span>{speaking ? '🔊 읽는 중...' : '터치하여 듣기'}</span>
          </div>
        </footer>
      </div>
    </>
  );
}
