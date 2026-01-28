'use client';

import React, { useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MessageSquare, Monitor, LogOut, Calendar, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageList } from '@/components/mobile';
import { useMessages, useDateRefresh, useUser } from '@/hooks';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/types/database';

const LAST_PAGE_KEY = 'mothers-reminder-last-page';

export default function MobileHomePage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, hasFamily, loading: userLoading } = useUser();

  // 마지막 방문 페이지 저장
  useEffect(() => {
    localStorage.setItem(LAST_PAGE_KEY, '/home');
  }, []);

  // 오늘 날짜를 메모이제이션하여 불필요한 리렌더링 방지
  const today = useMemo(() => new Date(), []);

  const { messages, loading, deleteMessage, refreshMessages } = useMessages({
    familyId: user?.activeFamily?.id,
    date: today,
  });

  // 자정 감지 - 날짜가 바뀌면 메시지 새로고침
  useDateRefresh({
    onDateChange: useCallback(() => {
      refreshMessages();
    }, [refreshMessages]),
    enabled: true,
  });

  const handleNewMessage = () => {
    if (!hasFamily) {
      router.push('/settings');
      return;
    }
    router.push('/messages/new');
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleEdit = (message: Message) => {
    router.push(`/messages/${message.id}/edit`);
  };

  const handleDelete = async (message: Message) => {
    const success = await deleteMessage(message.id);
    if (!success) {
      alert('메시지 삭제에 실패했습니다');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-blue-600 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-white" />
            <h1 className="text-xl font-bold text-white">
              {user?.activeFamily?.name || '가족'} 메시지
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-blue-500"
              onClick={() => router.push('/messages/calendar')}
              title="달력 보기"
            >
              <Calendar className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-blue-500"
              onClick={() => router.push('/display')}
              title="태블릿 화면으로 전환"
            >
              <Monitor className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-blue-500"
              onClick={() => router.push('/settings')}
              title="설정"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-blue-500" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* 가족 없음 안내 배너 */}
      {!userLoading && !hasFamily && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-yellow-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800 font-medium">
                가족을 만들거나 참여해주세요
              </p>
              <p className="text-xs text-yellow-600">
                메시지를 보내려면 가족 그룹이 필요합니다
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/settings')}
            >
              설정으로
            </Button>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <main className="p-4 pb-24">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-700">오늘의 메시지</h2>
          <p className="text-sm text-gray-500">
            어머니 태블릿에 표시될 메시지입니다
          </p>
        </div>

        <MessageList
          messages={messages}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="오늘 표시할 메시지가 없습니다"
        />
      </main>

      {/* FAB 버튼 */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="primary"
          size="lg"
          className="w-14 h-14 rounded-full shadow-lg"
          onClick={handleNewMessage}
          disabled={!hasFamily}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
