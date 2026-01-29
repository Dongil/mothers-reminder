'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  Database,
  Volume2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  checks: {
    database: { status: string; latency: number };
    tts: { status: string };
  };
  metrics: {
    recentTtsErrors: number;
    recentLoginFailures: number;
  };
  environment: {
    nodeVersion: string;
    platform: string;
  };
  timestamp: string;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    healthy: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" />, label: '정상' },
    degraded: { color: 'bg-yellow-100 text-yellow-700', icon: <AlertTriangle className="w-4 h-4" />, label: '저하' },
    unhealthy: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" />, label: '비정상' },
    unknown: { color: 'bg-gray-100 text-gray-700', icon: <Activity className="w-4 h-4" />, label: '알 수 없음' },
  };

  const { color, icon, label } = config[status] || config.unknown;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${color}`}>
      {icon}
      {label}
    </span>
  );
}

export default function AdminSystemPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/system/health');
      const data = await response.json();

      if (!response.ok && response.status !== 500) {
        throw new Error(data.error);
      }

      setHealth(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '시스템 상태를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    // 30초마다 자동 갱신
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold">시스템 상태</h1>
            <p className="text-gray-500 text-sm">
              {health?.timestamp && (
                <>마지막 확인: {new Date(health.timestamp).toLocaleString('ko-KR')}</>
              )}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadHealth} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* 전체 상태 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">전체 시스템 상태</h2>
          {health && <StatusBadge status={health.status} />}
        </div>
      </div>

      {/* 서비스 상태 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 데이터베이스 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold">데이터베이스</h3>
            </div>
            {health && <StatusBadge status={health.checks.database.status} />}
          </div>
          {health && (
            <div className="text-sm text-gray-600">
              <p>응답 시간: {health.checks.database.latency}ms</p>
            </div>
          )}
        </div>

        {/* TTS API */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Volume2 className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold">TTS API</h3>
            </div>
            {health && <StatusBadge status={health.checks.tts.status} />}
          </div>
          {health && (
            <div className="text-sm text-gray-600">
              <p>API 키: {health.checks.tts.status === 'healthy' ? '설정됨' : '미설정'}</p>
            </div>
          )}
        </div>
      </div>

      {/* 최근 24시간 지표 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">최근 24시간 지표</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">TTS 오류</span>
              <span className={`text-xl font-bold ${(health?.metrics.recentTtsErrors || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {health?.metrics.recentTtsErrors || 0}건
              </span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">로그인 실패</span>
              <span className={`text-xl font-bold ${(health?.metrics.recentLoginFailures || 0) > 10 ? 'text-red-600' : 'text-green-600'}`}>
                {health?.metrics.recentLoginFailures || 0}건
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 환경 정보 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">환경 정보</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Node.js</p>
            <p className="font-mono">{health?.environment.nodeVersion || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500">플랫폼</p>
            <p className="font-mono">{health?.environment.platform || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
