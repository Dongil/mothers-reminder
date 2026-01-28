'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Settings } from '@/types/database';

type SettingsData = Omit<Settings, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

interface UseSettingsReturn {
  settings: SettingsData | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (data: Partial<SettingsData>) => Promise<boolean>;
}

const defaultSettings: SettingsData = {
  night_mode_enabled: true,
  night_mode_start: '20:00',
  night_mode_end: '06:00',
  tts_voice: 'ko-KR-Wavenet-A',
  tts_speed: 0.9,
  volume_day: 80,
  volume_night: 30,
  ui_mode: 'touch',
};

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings', {
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '설정을 불러오는데 실패했습니다');
      }

      setSettings(result.data || defaultSettings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (data: Partial<SettingsData>): Promise<boolean> => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '설정 저장에 실패했습니다');
      }

      setSettings(prev => prev ? { ...prev, ...data } : { ...defaultSettings, ...data });
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      return false;
    }
  }, []);

  return {
    settings,
    loading,
    error,
    refreshSettings: fetchSettings,
    updateSettings,
  };
}

// Google Cloud TTS에서 사용 가능한 한국어 음성 목록
export const AVAILABLE_TTS_VOICES = [
  { id: 'ko-KR-Wavenet-A', name: '여성 A (Wavenet)', gender: 'female' },
  { id: 'ko-KR-Wavenet-B', name: '여성 B (Wavenet)', gender: 'female' },
  { id: 'ko-KR-Wavenet-C', name: '남성 A (Wavenet)', gender: 'male' },
  { id: 'ko-KR-Wavenet-D', name: '남성 B (Wavenet)', gender: 'male' },
  { id: 'ko-KR-Standard-A', name: '여성 A (Standard)', gender: 'female' },
  { id: 'ko-KR-Standard-B', name: '여성 B (Standard)', gender: 'female' },
  { id: 'ko-KR-Standard-C', name: '남성 A (Standard)', gender: 'male' },
  { id: 'ko-KR-Standard-D', name: '남성 B (Standard)', gender: 'male' },
] as const;

// TTS 속도 옵션
export const TTS_SPEED_OPTIONS = [
  { value: 0.5, label: '매우 느림' },
  { value: 0.75, label: '느림' },
  { value: 0.9, label: '보통' },
  { value: 1.0, label: '빠름' },
  { value: 1.25, label: '매우 빠름' },
] as const;
