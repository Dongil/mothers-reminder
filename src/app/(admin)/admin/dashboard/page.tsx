'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Home,
  MessageSquare,
  Activity,
  Volume2,
  LogIn,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OverviewStats {
  totalUsers: number;
  totalFamilies: number;
  totalMessages: number;
  todayActiveUsers: number;
  todayStats: {
    ttsRequests: number;
    ttsChars: number;
    logins: {
      total: number;
      success: number;
      failed: number;
    };
  };
  lastUpdated: string;
}

function StatCard({
  title,
  value,
  icon,
  description,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/stats/overview');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '통계를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-gray-500 text-sm">
            {stats?.lastUpdated && (
              <>마지막 업데이트: {new Date(stats.lastUpdated).toLocaleString('ko-KR')}</>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats}>
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="전체 사용자"
          value={stats?.totalUsers.toLocaleString() || 0}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="전체 가족"
          value={stats?.totalFamilies.toLocaleString() || 0}
          icon={<Home className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="전체 메시지"
          value={stats?.totalMessages.toLocaleString() || 0}
          icon={<MessageSquare className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="오늘 활성 사용자"
          value={stats?.todayActiveUsers.toLocaleString() || 0}
          icon={<Activity className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* 오늘의 통계 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">오늘의 활동</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TTS 사용량 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Volume2 className="w-5 h-5 text-purple-600" />
              <span className="font-medium">TTS 사용</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">요청 수</span>
                <span className="font-semibold">{stats?.todayStats.ttsRequests || 0}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">총 글자 수</span>
                <span className="font-semibold">{stats?.todayStats.ttsChars?.toLocaleString() || 0}자</span>
              </div>
            </div>
          </div>

          {/* 로그인 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <LogIn className="w-5 h-5 text-blue-600" />
              <span className="font-medium">로그인</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">총 시도</span>
                <span className="font-semibold">{stats?.todayStats.logins.total || 0}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">성공</span>
                <span className="font-semibold text-green-600">{stats?.todayStats.logins.success || 0}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">실패</span>
                <span className="font-semibold text-red-600">{stats?.todayStats.logins.failed || 0}회</span>
              </div>
            </div>
          </div>

          {/* 빠른 링크 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-5 h-5 text-green-600" />
              <span className="font-medium">빠른 링크</span>
            </div>
            <div className="space-y-2">
              <a href="/admin/users" className="block text-blue-600 hover:underline text-sm">
                사용자 관리 &rarr;
              </a>
              <a href="/admin/statistics" className="block text-blue-600 hover:underline text-sm">
                상세 통계 &rarr;
              </a>
              <a href="/admin/audit-logs" className="block text-blue-600 hover:underline text-sm">
                감사 로그 &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
