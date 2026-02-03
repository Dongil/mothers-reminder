'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks';
import { FamilyManagementSection } from '@/components/settings/FamilyManagementSection';
import { NotificationSettingsSection } from '@/components/settings/NotificationSettingsSection';
import { TTSSettingsSection } from '@/components/settings/TTSSettingsSection';
import { DisplaySettingsSection } from '@/components/settings/DisplaySettingsSection';
import { QuickGuideSection } from '@/components/settings/QuickGuideSection';
import { AccountManagementSection } from '@/components/settings/AccountManagementSection';

const LAST_PAGE_KEY = 'mothers-reminder-last-page';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useUser();

  // 마지막 방문 페이지 저장
  useEffect(() => {
    localStorage.setItem(LAST_PAGE_KEY, '/settings');
  }, []);

  // 비로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로그인 페이지로 이동 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-blue-600 text-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-blue-500"
            onClick={() => router.push('/home')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">설정</h1>
        </div>
      </header>

      {/* 사용자 정보 */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
            {user.gender === 'male' ? '👨' : user.gender === 'female' ? '👩' : '👤'}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{user.nickname || user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </div>

      {/* 설정 섹션들 */}
      <main className="p-4 space-y-4 pb-20">
        {/* 가족 관리 */}
        <FamilyManagementSection />

        {/* 알림 설정 */}
        <NotificationSettingsSection />

        {/* TTS 설정 */}
        <TTSSettingsSection />

        {/* 디스플레이 설정 */}
        <DisplaySettingsSection />

        {/* 사용 가이드 */}
        <QuickGuideSection />

        {/* 계정 관리 */}
        <AccountManagementSection />
      </main>
    </div>
  );
}
