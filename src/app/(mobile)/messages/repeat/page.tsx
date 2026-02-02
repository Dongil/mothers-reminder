'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Home, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RepeatMessageList } from '@/components/mobile/RepeatMessageList';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks';
import type { Message } from '@/types/database';

export default function RepeatMessagesPage() {
  const router = useRouter();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // 반복 메시지 조회
  const fetchRepeatMessages = useCallback(async () => {
    if (!supabase || !user?.activeFamily?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('family_id', user.activeFamily.id)
        .eq('repeat_pattern', 'weekly')
        .not('repeat_weekdays', 'is', null)
        .order('display_time', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages((data as Message[]) || []);
    } catch (err) {
      console.error('Failed to fetch repeat messages:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, user?.activeFamily?.id]);

  useEffect(() => {
    fetchRepeatMessages();
  }, [fetchRepeatMessages]);

  // 토글 처리
  const handleToggle = async (messageId: string, enabled: boolean, skipDate?: string) => {
    if (!supabase) return;

    try {
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      const updateData: { repeat_enabled: boolean; repeat_skip_dates?: string[] | null } = {
        repeat_enabled: enabled,
      };

      if (enabled && skipDate) {
        // "오늘만 건너뛰기" - 오늘 날짜를 skip_dates에 추가
        const currentSkipDates = message.repeat_skip_dates || [];
        if (!currentSkipDates.includes(skipDate)) {
          updateData.repeat_skip_dates = [...currentSkipDates, skipDate];
        }
      } else if (enabled && !skipDate) {
        // 다시 켜기 (완전히) - skip_dates 클리어
        updateData.repeat_skip_dates = null;
      }
      // enabled=false인 경우 (완전히 끄기)는 skip_dates 그대로 유지

      const { error } = await supabase
        .from('messages')
        .update(updateData as never)
        .eq('id', messageId);

      if (error) throw error;

      // 로컬 상태 업데이트
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                repeat_enabled: enabled,
                repeat_skip_dates: updateData.repeat_skip_dates !== undefined
                  ? updateData.repeat_skip_dates
                  : m.repeat_skip_dates,
              }
            : m
        )
      );
    } catch (err) {
      console.error('Failed to toggle repeat message:', err);
      alert('변경에 실패했습니다');
    }
  };

  // 삭제 처리
  const handleDelete = async (messageId: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error('Failed to delete repeat message:', err);
      alert('삭제에 실패했습니다');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-purple-600 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-purple-500"
              onClick={() => router.push('/home')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-white" />
              <h1 className="text-xl font-bold text-white">반복 메시지</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-purple-500"
            onClick={() => router.push('/home')}
            title="홈으로"
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* 설명 배너 */}
      <div className="bg-purple-50 border-b border-purple-200 px-4 py-3">
        <p className="text-sm text-purple-700">
          매주 지정한 요일에 자동으로 표시되는 메시지입니다
        </p>
      </div>

      {/* 메시지 목록 */}
      <main className="p-4 pb-24">
        <RepeatMessageList
          messages={messages}
          currentUserId={user?.id}
          isAdmin={user?.activeMembership?.role === 'admin'}
          activeFamilyId={user?.activeFamily?.id}
          onToggle={handleToggle}
          onDelete={handleDelete}
          loading={loading}
        />
      </main>

      {/* FAB - 새 메시지 버튼 */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="primary"
          size="lg"
          className="rounded-full shadow-lg px-5 py-3 h-auto bg-purple-600 hover:bg-purple-700"
          onClick={() => router.push('/messages/new')}
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">새 메시지</span>
        </Button>
      </div>
    </div>
  );
}
