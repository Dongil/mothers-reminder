'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message, MessageInsert, MessageUpdate, User, Gender } from '@/types/database';

// 작성자 정보가 포함된 메시지 타입
export interface MessageWithAuthor extends Message {
  author?: {
    id: string;
    name: string;
    nickname: string | null;
    gender: Gender | null;
  };
}
import { format } from 'date-fns';
import { getCurrentTimeString } from '@/lib/utils';

interface UseMessagesOptions {
  familyId?: string;
  date?: Date;
  realtime?: boolean;
}

interface UseMessagesReturn {
  messages: MessageWithAuthor[];
  loading: boolean;
  error: string | null;
  createMessage: (message: Omit<MessageInsert, 'author_id' | 'family_id'>) => Promise<Message | null>;
  updateMessage: (id: string, updates: MessageUpdate) => Promise<Message | null>;
  deleteMessage: (id: string) => Promise<boolean>;
  refreshMessages: () => Promise<void>;
}

/**
 * 메시지 정렬 함수
 * 1. 현재 시간 이후 메시지 (시간순 오름차순)
 * 2. 종일 메시지 (priority DESC, created_at DESC)
 * 3. 지나간 메시지 (시간순 내림차순)
 */
function sortMessages(messages: MessageWithAuthor[]): MessageWithAuthor[] {
  const currentTime = getCurrentTimeString();

  // 메시지를 3개 그룹으로 분류
  const upcomingMessages: Message[] = [];
  const allDayMessages: Message[] = [];
  const passedMessages: Message[] = [];

  for (const msg of messages) {
    if (!msg.display_time) {
      // 종일 메시지
      allDayMessages.push(msg);
    } else if (msg.display_time > currentTime) {
      // 아직 안 온 시간
      upcomingMessages.push(msg);
    } else {
      // 지나간 시간
      passedMessages.push(msg);
    }
  }

  // 각 그룹 정렬
  // 1. 다가오는 메시지: 시간순 오름차순
  upcomingMessages.sort((a, b) => {
    const timeCompare = (a.display_time || '').localeCompare(b.display_time || '');
    if (timeCompare !== 0) return timeCompare;
    // 시간이 같으면 priority로
    return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
  });

  // 2. 종일 메시지: priority DESC, created_at DESC
  allDayMessages.sort((a, b) => {
    const priorityCompare = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (priorityCompare !== 0) return priorityCompare;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // 3. 지나간 메시지: 시간순 내림차순
  passedMessages.sort((a, b) => {
    const timeCompare = (b.display_time || '').localeCompare(a.display_time || '');
    if (timeCompare !== 0) return timeCompare;
    return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
  });

  return [...upcomingMessages, ...allDayMessages, ...passedMessages];
}

function getPriorityWeight(priority: string): number {
  switch (priority) {
    case 'urgent': return 3;
    case 'important': return 2;
    case 'normal': return 1;
    default: return 0;
  }
}

export function useMessages(options: UseMessagesOptions = {}): UseMessagesReturn {
  const { familyId, date, realtime = true } = options;
  const [rawMessages, setRawMessages] = useState<MessageWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(getCurrentTimeString());

  // 싱글톤 클라이언트 (매 렌더링마다 같은 인스턴스)
  const supabase = createClient();

  // 클라이언트 사이드에서만 실행 (마운트 시 1회)
  useEffect(() => {
    if (typeof window !== 'undefined' && supabase) {
      setIsReady(true);
    }
  }, []);

  // 매 분마다 현재 시간 업데이트 (정렬 갱신용)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMinute(getCurrentTimeString());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // 정렬된 메시지 (현재 시간 기준)
  const messages = useMemo(() => {
    return sortMessages(rawMessages);
  }, [rawMessages, currentMinute]);

  // 메시지 조회
  const fetchMessages = useCallback(async () => {
    if (!isReady || !supabase) {
      setLoading(false);
      return;
    }

    // familyId가 없으면 빈 배열 반환 (가족 미참여 사용자 - 프라이버시 보호)
    if (!familyId) {
      setRawMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('messages')
        .select(`
          *,
          author:author_id (
            id,
            name,
            nickname,
            gender
          )
        `);

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

      setRawMessages((data as unknown as MessageWithAuthor[]) || []);
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

      // 활성 가족 ID 가져오기 (family_members에서)
      const { data: memberDataRaw } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      const memberData = memberDataRaw as { family_id: string } | null;

      // family_members에 없으면 users.family_id로 폴백 (하위 호환성)
      let activeFamilyId: string | undefined = memberData?.family_id;
      if (!activeFamilyId) {
        const { data: userData } = await supabase
          .from('users')
          .select('family_id')
          .eq('id', user.id)
          .single();
        activeFamilyId = (userData as { family_id: string | null } | null)?.family_id ?? undefined;
      }

      if (!activeFamilyId) {
        throw new Error('활성 가족이 없습니다. 설정에서 가족을 만들거나 참여해주세요.');
      }

      const insertData = {
        ...messageData,
        author_id: user.id,
        family_id: activeFamilyId,
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
      setRawMessages((prev) => prev.filter((msg) => msg.id !== id));

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
    if (!isReady || !supabase || !realtime) return;

    // familyId가 있으면 해당 가족만, 없으면 전체 메시지 구독
    const channelName = familyId ? `messages:family:${familyId}` : 'messages:all';
    const subscriptionConfig = familyId
      ? {
          event: '*' as const,
          schema: 'public',
          table: 'messages',
          filter: `family_id=eq.${familyId}`,
        }
      : {
          event: '*' as const,
          schema: 'public',
          table: 'messages',
        };

    // 날짜 필터에 맞는지 확인하는 함수
    const isMessageForDate = (message: Message): boolean => {
      if (!date) return true; // 날짜 필터 없으면 모두 허용
      const dateStr = format(date, 'yyyy-MM-dd');
      return message.display_date === dateStr || message.display_forever === true;
    };

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', subscriptionConfig, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as Message;
          // 날짜 필터 확인 후 추가
          if (isMessageForDate(newMessage)) {
            setRawMessages((prev) => [newMessage, ...prev]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedMessage = payload.new as Message;
          setRawMessages((prev) => {
            // 업데이트된 메시지가 날짜 필터에 맞는지 확인
            if (isMessageForDate(updatedMessage)) {
              // 기존에 있으면 업데이트, 없으면 추가 (날짜가 변경되어 필터에 맞게 된 경우)
              const exists = prev.some((msg) => msg.id === updatedMessage.id);
              if (exists) {
                return prev.map((msg) =>
                  msg.id === updatedMessage.id ? updatedMessage : msg
                );
              } else {
                return [updatedMessage, ...prev];
              }
            } else {
              // 날짜 필터에 안 맞으면 목록에서 제거
              return prev.filter((msg) => msg.id !== updatedMessage.id);
            }
          });
        } else if (payload.eventType === 'DELETE') {
          setRawMessages((prev) =>
            prev.filter((msg) => msg.id !== payload.old.id)
          );
        }
      })
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [isReady, familyId, realtime, date]);

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
