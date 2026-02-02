'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageForm } from '@/components/mobile';
import type { MessageFormData } from '@/components/mobile';
import { useMessages } from '@/hooks';

export default function NewMessagePage() {
  const router = useRouter();
  const { createMessage } = useMessages();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: MessageFormData) => {
    setIsLoading(true);
    try {
      // 반복 메시지인 경우 repeat_pattern과 관련 필드 설정
      const isRepeat = data.repeat_enabled && data.repeat_weekdays.length > 0;

      const result = await createMessage({
        content: data.content,
        priority: data.priority,
        display_date: data.display_date,
        display_time: data.display_time,
        tts_enabled: data.tts_enabled,
        tts_times: data.tts_times,
        // 반복 메시지 필드
        repeat_pattern: isRepeat ? 'weekly' : 'none',
        repeat_weekdays: isRepeat ? data.repeat_weekdays : null,
        repeat_name: isRepeat ? data.repeat_name : null,
        repeat_enabled: isRepeat,
      });

      if (result) {
        // 반복 설정이 있으면 /messages/repeat으로, 없으면 /home으로
        if (isRepeat) {
          router.push('/messages/repeat');
        } else {
          router.push('/home');
        }
      } else {
        alert('메시지 작성에 실패했습니다');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-blue-600 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-blue-500"
            onClick={() => router.push('/home')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">새 메시지</h1>
        </div>
      </header>

      {/* 폼 */}
      <main className="p-4">
        <MessageForm onSubmit={handleSubmit} isLoading={isLoading} />
      </main>
    </div>
  );
}
