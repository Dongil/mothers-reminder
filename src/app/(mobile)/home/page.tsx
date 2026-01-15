'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MessageSquare, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageList } from '@/components/mobile';
import { useMessages } from '@/hooks';
import type { Message } from '@/types/database';

export default function MobileHomePage() {
  const router = useRouter();

  // 오늘 날짜를 메모이제이션하여 불필요한 리렌더링 방지
  const today = useMemo(() => new Date(), []);

  const { messages, loading, deleteMessage } = useMessages({
    date: today,
  });

  const handleNewMessage = () => {
    router.push('/messages/new');
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
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold">가족 메시지</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

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
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
