'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Volume2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TtsStats {
  period: {
    start: string;
    end: string;
    days: number;
  };
  total: {
    totalRequests: number;
    successRequests: number;
    errorRequests: number;
    totalChars: number;
    avgCharsPerRequest: number;
  };
  daily: Array<{
    date: string;
    requests: number;
    successRequests: number;
    totalChars: number;
  }>;
  byVoice: Record<string, number>;
}

export default function AdminStatisticsPage() {
  const [ttsStats, setTtsStats] = useState<TtsStats | null>(null);
  const [days, setDays] = useState(7);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/stats/tts?days=${days}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setTtsStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '통계를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [days]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getVoiceName = (voice: string) => {
    const voiceNames: Record<string, string> = {
      'ko-KR-Wavenet-A': '여성 A',
      'ko-KR-Wavenet-B': '여성 B',
      'ko-KR-Wavenet-C': '남성 A',
      'ko-KR-Wavenet-D': '남성 B',
    };
    return voiceNames[voice] || voice;
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadStats} className="ml-auto">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold">통계</h1>
            <p className="text-gray-500 text-sm">TTS 사용량 및 서비스 통계</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value={7}>최근 7일</option>
            <option value={14}>최근 14일</option>
            <option value={30}>최근 30일</option>
          </select>
          <Button variant="outline" size="sm" onClick={loadStats}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="animate-pulse space-y-4">
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* TTS 총계 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Volume2 className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold">TTS 사용 총계</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {ttsStats?.total.totalRequests.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">총 요청</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {ttsStats?.total.successRequests.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">성공</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {ttsStats?.total.errorRequests.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">실패</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">
                  {ttsStats?.total.totalChars.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">총 글자수</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">
                  {ttsStats?.total.avgCharsPerRequest}
                </p>
                <p className="text-sm text-gray-500">평균 글자수</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 일별 차트 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">일별 TTS 요청</h2>
              <div className="space-y-2">
                {ttsStats?.daily.map((day) => {
                  const maxRequests = Math.max(...(ttsStats?.daily.map(d => d.requests) || [1]));
                  const width = (day.requests / maxRequests) * 100;
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-16">{formatDate(day.date)}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(width, 10)}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {day.requests}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!ttsStats?.daily || ttsStats.daily.length === 0) && (
                  <p className="text-center text-gray-500 py-4">데이터가 없습니다</p>
                )}
              </div>
            </div>

            {/* 음성별 사용량 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">음성별 사용량</h2>
              <div className="space-y-3">
                {ttsStats?.byVoice && Object.entries(ttsStats.byVoice).length > 0 ? (
                  Object.entries(ttsStats.byVoice)
                    .sort((a, b) => b[1] - a[1])
                    .map(([voice, count]) => {
                      const total = Object.values(ttsStats.byVoice).reduce((a, b) => a + b, 0);
                      const percentage = Math.round((count / total) * 100);
                      return (
                        <div key={voice} className="flex items-center justify-between">
                          <span className="text-sm">{getVoiceName(voice)}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-full rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500 w-16 text-right">
                              {count}회 ({percentage}%)
                            </span>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-center text-gray-500 py-4">데이터가 없습니다</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
