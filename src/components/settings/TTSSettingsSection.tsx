'use client';

import React, { useState } from 'react';
import { Volume2, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useSettings, AVAILABLE_TTS_VOICES, TTS_SPEED_OPTIONS } from '@/hooks';

export function TTSSettingsSection() {
  const { settings, updateSettings, loading } = useSettings();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleVoiceChange = async (voice: string) => {
    await updateSettings({ tts_voice: voice });
  };

  const handleSpeedChange = async (speed: number) => {
    await updateSettings({ tts_speed: speed });
  };

  const testVoice = async () => {
    if (isTesting || !settings) return;
    setIsTesting(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '안녕하세요. 가족 메시지 보드입니다.',
          voice: settings.tts_voice,
          speed: settings.tts_speed,
        }),
      });

      if (!response.ok) {
        throw new Error('TTS 테스트 실패');
      }

      const data = await response.json();
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audio.onended = () => setIsTesting(false);
      audio.onerror = () => setIsTesting(false);
      await audio.play();
    } catch (error) {
      console.error('TTS test error:', error);
      setIsTesting(false);
    }
  };

  if (loading || !settings) {
    return (
      <section className="bg-white rounded-lg shadow p-4">
        <div className="text-gray-500">로딩 중...</div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow">
      {/* 헤더 */}
      <button
        className="w-full px-4 py-3 flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">TTS 설정</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* 음성 선택 */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">음성 선택</Label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_TTS_VOICES.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => handleVoiceChange(voice.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    settings.tts_voice === voice.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-800 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-semibold">
                    {voice.gender === 'female' ? '👩' : '👨'} {voice.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 속도 선택 */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">읽기 속도</Label>
            <div className="flex flex-wrap gap-2">
              {TTS_SPEED_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSpeedChange(option.value)}
                  className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                    settings.tts_speed === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-800 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 테스트 버튼 */}
          <Button
            variant="outline"
            className="w-full"
            onClick={testVoice}
            disabled={isTesting}
          >
            <Play className="w-4 h-4 mr-2" />
            {isTesting ? '재생 중...' : '음성 테스트'}
          </Button>
        </div>
      )}
    </section>
  );
}
