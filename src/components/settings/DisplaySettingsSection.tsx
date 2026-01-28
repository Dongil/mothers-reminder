'use client';

import React, { useState } from 'react';
import { Monitor, ChevronDown, ChevronUp, Moon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/hooks';

export function DisplaySettingsSection() {
  const { settings, updateSettings, loading } = useSettings();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleNightModeToggle = async () => {
    if (!settings) return;
    await updateSettings({ night_mode_enabled: !settings.night_mode_enabled });
  };

  const handleTimeChange = async (field: 'night_mode_start' | 'night_mode_end', value: string) => {
    await updateSettings({ [field]: value });
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
          <Monitor className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">디스플레이 설정</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* 야간 모드 토글 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-indigo-500" />
              <div>
                <div className="font-medium text-gray-900">야간 모드</div>
                <div className="text-sm text-gray-500">
                  설정 시간에 화면을 어둡게 합니다
                </div>
              </div>
            </div>
            <button
              onClick={handleNightModeToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.night_mode_enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.night_mode_enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 야간 모드 시간 설정 */}
          {settings.night_mode_enabled && (
            <div className="space-y-3 p-3 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">시작 시간</Label>
                  <Input
                    type="time"
                    value={settings.night_mode_start}
                    onChange={(e) => handleTimeChange('night_mode_start', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">종료 시간</Label>
                  <Input
                    type="time"
                    value={settings.night_mode_end}
                    onChange={(e) => handleTimeChange('night_mode_end', e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {settings.night_mode_start} ~ {settings.night_mode_end} 동안 화면이 어두워집니다
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
