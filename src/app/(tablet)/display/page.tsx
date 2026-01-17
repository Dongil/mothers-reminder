'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Header, MessageCard, NightMode } from '@/components/tablet';
import { useMessages, useTTS, useNightMode } from '@/hooks';
import { useNotifications } from '@/hooks/useNotifications';

export default function DisplayPage() {
  // 오디오 활성화 상태 (브라우저 autoplay 정책 대응)
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

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

    // speechSynthesis도 활성화
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);

    setAudioEnabled(true);
  }, []);

  // 메시지 읽기 - Web Speech API 직접 호출
  const handleSpeak = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    synth.cancel();

    const speakWithVoice = () => {
      const voices = synth.getVoices();

      // 디버그: 사용 가능한 음성 정보
      const voiceInfo = voices.map(v => `${v.name}(${v.lang})`).join(', ');
      const koreanVoices = voices.filter(v => v.lang.startsWith('ko') || v.name.includes('Korean'));

      setDebugInfo(`총 ${voices.length}개 음성, 한국어: ${koreanVoices.length}개\n${voiceInfo.slice(0, 200)}`);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      // 한국어 음성 찾기 (여러 패턴 시도)
      const koreanVoice = voices.find(v => v.name === 'Google 한국의') ||
                          voices.find(v => v.name.includes('Korean')) ||
                          voices.find(v => v.lang === 'ko-KR') ||
                          voices.find(v => v.lang.startsWith('ko'));

      if (koreanVoice) {
        utterance.voice = koreanVoice;
        setDebugInfo(prev => prev + `\n선택: ${koreanVoice.name}`);
      } else {
        setDebugInfo(prev => prev + '\n한국어 음성 없음!');
      }

      utterance.onstart = () => setDebugInfo(prev => prev + '\n재생 시작');
      utterance.onend = () => setDebugInfo(prev => prev + '\n재생 완료');
      utterance.onerror = (e) => setDebugInfo(prev => prev + `\n오류: ${e.error}`);

      synth.speak(utterance);
    };

    // Chrome 버그 대응: cancel 후 딜레이
    setTimeout(() => {
      const voices = synth.getVoices();
      setDebugInfo(`음성 로드 체크: ${voices.length}개`);

      // 음성이 아직 로드 안 됐으면 이벤트 대기
      if (voices.length === 0) {
        setDebugInfo('음성 로드 대기중...');
        const handleVoicesChanged = () => {
          synth.onvoiceschanged = null;
          speakWithVoice();
        };
        synth.onvoiceschanged = handleVoicesChanged;

        // 타임아웃: 1초 후에도 음성 없으면 그냥 실행
        setTimeout(() => {
          if (synth.onvoiceschanged) {
            synth.onvoiceschanged = null;
            setDebugInfo(prev => prev + '\n타임아웃 - 기본 실행');
            speakWithVoice();
          }
        }, 1000);
      } else {
        speakWithVoice();
      }
    }, 100);
  }, []);

  return (
    <>
      {/* 오디오 활성화 오버레이 */}
      {!audioEnabled && (
        <div
          className="fixed inset-0 z-50 bg-blue-600 flex flex-col items-center justify-center cursor-pointer"
          onClick={handleEnableAudio}
        >
          <div className="text-white text-center">
            <div className="text-8xl mb-8">👆</div>
            <h1 className="text-5xl font-bold mb-4">화면을 터치하세요</h1>
            <p className="text-2xl opacity-80">알림 소리를 활성화합니다</p>
          </div>
        </div>
      )}

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
            <span>{speaking ? '🔊 읽는 중...' : audioEnabled ? '🔔 알림 활성화됨' : '터치하여 듣기'}</span>
          </div>
          {/* 디버그 정보 */}
          {debugInfo && (
            <pre className="mt-2 text-xs text-gray-400 whitespace-pre-wrap bg-gray-100 p-2 rounded">
              {debugInfo}
            </pre>
          )}
        </footer>
      </div>
    </>
  );
}
