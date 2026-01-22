'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageForm } from '@/components/mobile';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/types/database';

interface EditMessagePageProps {
  params: Promise<{ id: string }>;
}

export default function EditMessagePage({ params }: EditMessagePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchMessage = async () => {
      if (!supabase) {
        setIsFetching(false);
        return;
      }
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to fetch message:', error);
        alert('메시지를 불러오는데 실패했습니다');
        router.back();
        return;
      }

      setMessage(data as unknown as Message);
      setIsFetching(false);
    };

    fetchMessage();
  }, [id, router]);

  const handleSubmit = async (data: {
    content: string;
    priority: 'normal' | 'important' | 'urgent';
    display_date: string;
    display_time: string | null;
    tts_enabled: boolean;
    tts_times: string[];
  }) => {
    if (!supabase) {
      alert('서비스 연결에 실패했습니다');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content: data.content,
          priority: data.priority,
          display_date: data.display_date,
          display_time: data.display_time,
          tts_enabled: data.tts_enabled,
          tts_times: data.tts_times,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id);

      if (error) {
        throw error;
      }

      router.push('/home');
    } catch (error) {
      console.error('Failed to update message:', error);
      alert('메시지 수정에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">불러오는 중...</p>
      </div>
    );
  }

  if (!message) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-blue-600 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-blue-500"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">메시지 수정</h1>
        </div>
      </header>

      {/* 폼 */}
      <main className="p-4">
        <MessageForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          initialData={{
            content: message.content,
            priority: message.priority,
            display_date: message.display_date,
            display_time: message.display_time,
            tts_enabled: message.tts_enabled,
            tts_times: message.tts_times || [],
          }}
        />
      </main>
    </div>
  );
}
