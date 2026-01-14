'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getTTSService, type TTSOptions, type TTSState } from '@/lib/tts/speech';

interface UseTTSReturn {
  speak: (text: string, options?: Partial<TTSOptions>) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  speaking: boolean;
  paused: boolean;
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  koreanVoices: SpeechSynthesisVoice[];
}

export function useTTS(defaultOptions?: Partial<TTSOptions>): UseTTSReturn {
  const [state, setState] = useState<TTSState>({
    speaking: false,
    paused: false,
    supported: false,
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [koreanVoices, setKoreanVoices] = useState<SpeechSynthesisVoice[]>([]);

  const ttsRef = useRef(getTTSService());

  useEffect(() => {
    const tts = ttsRef.current;

    // 기본 옵션 설정
    if (defaultOptions) {
      tts.setOptions(defaultOptions);
    }

    // 초기 상태 설정
    setState(tts.getState());

    // 상태 변경 리스너
    const handleStateChange = (newState: TTSState) => {
      setState(newState);
    };

    tts.on('stateChange', handleStateChange);

    // 음성 목록 로드
    const loadVoices = () => {
      setVoices(tts.getAllVoices());
      setKoreanVoices(tts.getKoreanVoices());
    };

    // 음성이 로드될 때까지 대기
    const checkVoices = setInterval(() => {
      if (tts.isInitialized()) {
        loadVoices();
        clearInterval(checkVoices);
      }
    }, 100);

    // 즉시 로드 시도
    loadVoices();

    return () => {
      clearInterval(checkVoices);
      tts.off('stateChange', handleStateChange);
      tts.stop();
    };
  }, [defaultOptions]);

  const speak = useCallback(async (text: string, options?: Partial<TTSOptions>) => {
    return ttsRef.current.speak(text, options);
  }, []);

  const stop = useCallback(() => {
    ttsRef.current.stop();
  }, []);

  const pause = useCallback(() => {
    ttsRef.current.pause();
  }, []);

  const resume = useCallback(() => {
    ttsRef.current.resume();
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    speaking: state.speaking,
    paused: state.paused,
    supported: state.supported,
    voices,
    koreanVoices,
  };
}

/**
 * 여러 메시지를 순차적으로 읽기
 */
export function useTTSQueue(defaultOptions?: Partial<TTSOptions>) {
  const { speak, stop, speaking, paused, supported, voices, koreanVoices } = useTTS(defaultOptions);
  const [queue, setQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const playNext = useCallback(async () => {
    if (currentIndex >= queue.length) {
      setIsPlaying(false);
      setCurrentIndex(0);
      return;
    }

    try {
      await speak(queue[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    } catch (error) {
      console.error('TTS queue error:', error);
      setIsPlaying(false);
    }
  }, [queue, currentIndex, speak]);

  useEffect(() => {
    if (isPlaying && !speaking && queue.length > 0) {
      playNext();
    }
  }, [isPlaying, speaking, queue.length, playNext]);

  const addToQueue = useCallback((texts: string | string[]) => {
    const newTexts = Array.isArray(texts) ? texts : [texts];
    setQueue((prev) => [...prev, ...newTexts]);
  }, []);

  const startQueue = useCallback((texts?: string[]) => {
    if (texts) {
      setQueue(texts);
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  }, []);

  const stopQueue = useCallback(() => {
    stop();
    setIsPlaying(false);
    setQueue([]);
    setCurrentIndex(0);
  }, [stop]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
  }, []);

  return {
    addToQueue,
    startQueue,
    stopQueue,
    clearQueue,
    isPlaying,
    currentIndex,
    queueLength: queue.length,
    speaking,
    paused,
    supported,
    voices,
    koreanVoices,
  };
}
