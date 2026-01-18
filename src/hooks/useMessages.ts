'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message, MessageInsert, MessageUpdate, User } from '@/types/database';
import { format } from 'date-fns';

interface UseMessagesOptions {
  familyId?: string;
  date?: Date;
  realtime?: boolean;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  createMessage: (message: Omit<MessageInsert, 'author_id' | 'family_id'>) => Promise<Message | null>;
  updateMessage: (id: string, updates: MessageUpdate) => Promise<Message | null>;
  deleteMessage: (id: string) => Promise<boolean>;
  refreshMessages: () => Promise<void>;
}

export function useMessages(options: UseMessagesOptions = {}): UseMessagesReturn {
  const { familyId, date, realtime = true } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 싱글톤 클라이언트 (매 렌더링마다 같은 인스턴스)
  const supabase = createClient();

  // 클라이언트 사이드에서만 실행 (마운트 시 1회)
  useEffect(() => {
    if (typeof window !== 'undefined' && supabase) {
      setIsReady(true);
    }
  }, []);

  // 메시지 조회
  const fetchMessages = useCallback(async () => {
    if (!isReady || !supabase) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('messages')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      // 가족 ID 필터
      if (familyId) {
        query = query.eq('family_id', familyId);
      }

      // 날짜 필터 (오늘 표시할 메시지)
      if (date) {
        const dateStr = format(date, 'yyyy-MM-dd');
        // display_date가 오늘이거나, display_forever가 true인 메시지
        query = query.or(
          `display_date.eq.${dateStr},display_forever.eq.true`
        );
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setMessages((data as unknown as Message[]) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '메시지를 불러오는데 실패했습니다';
      setError(errorMessage);
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, [isReady, familyId, date]);

  // 메시지 생성
  const createMessage = useCallback(async (
    messageData: Omit<MessageInsert, 'author_id' | 'family_id'>
  ): Promise<Message | null> => {
    if (!isReady || !supabase) {
      return null;
    }
    try {
      // 현재 사용자 정보 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('로그인이 필요합니다');
      }
      const user = session.user;

      // 사용자의 family_id 가져오기
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      const userRecord = userData as unknown as User | null;
      if (!userRecord?.family_id) {
        throw new Error('가족 정보가 없습니다');
      }

      const insertData = {
        ...messageData,
        author_id: user.id,
        family_id: userRecord.family_id,
      } as MessageInsert;

      const { data, error: insertError } = await supabase
        .from('messages')
        .insert(insertData as never)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return data as unknown as Message;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '메시지 작성에 실패했습니다';
      setError(errorMessage);
      console.error('Failed to create message:', err);
      return null;
    }
  }, [isReady]);

  // 메시지 수정
  const updateMessage = useCallback(async (
    id: string,
    updates: MessageUpdate
  ): Promise<Message | null> => {
    if (!isReady || !supabase) {
      return null;
    }
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      } as MessageUpdate;

      const { data, error: updateError } = await supabase
        .from('messages')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return data as unknown as Message;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '메시지 수정에 실패했습니다';
      setError(errorMessage);
      console.error('Failed to update message:', err);
      return null;
    }
  }, [isReady]);

  // 메시지 삭제
  const deleteMessage = useCallback(async (id: string): Promise<boolean> => {
    if (!isReady || !supabase) {
      return false;
    }
    try {
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // 로컬 상태에서도 삭제
      setMessages((prev) => prev.filter((msg) => msg.id !== id));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '메시지 삭제에 실패했습니다';
      setError(errorMessage);
      console.error('Failed to delete message:', err);
      return false;
    }
  }, [isReady]);

  // 초기 로드
  useEffect(() => {
    if (isReady) {
      fetchMessages();
    }
  }, [isReady, fetchMessages]);

  // Realtime 구독
  useEffect(() => {
    if (!isReady || !supabase || !realtime || !familyId) return;

    const channel = supabase
      .channel(`messages:family:${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [payload.new as Message, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? (payload.new as Message) : msg
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [isReady, familyId, realtime]);

  return {
    messages,
    loading,
    error,
    createMessage,
    updateMessage,
    deleteMessage,
    refreshMessages: fetchMessages,
  };
}
