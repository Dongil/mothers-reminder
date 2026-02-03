'use client';

/**
 * @fileoverview 메시지 관리 훅 (useMessages)
 *
 * 이 훅은 가족 메시지의 CRUD(생성, 조회, 수정, 삭제) 작업을 처리하고,
 * Supabase Realtime을 통해 실시간으로 메시지 변경사항을 동기화합니다.
 *
 * 주요 기능:
 * - 특정 가족의 메시지 조회 (날짜 필터 지원)
 * - 메시지 생성 (API 라우트 통해 푸시 알림 발송 포함)
 * - 메시지 수정/삭제
 * - Realtime 구독으로 실시간 동기화
 * - 반복 메시지 필터링 (skip_dates 포함)
 * - 시간 기반 메시지 정렬
 *
 * @see shouldDisplayOnDate - 반복 메시지 표시 여부 판단
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message, MessageInsert, MessageUpdate, User, Gender } from '@/types/database';
import { shouldDisplayOnDate } from '@/lib/repeat-utils';

/**
 * 작성자 정보가 포함된 메시지 타입
 *
 * @description 메시지 조회 시 JOIN을 통해 작성자 정보를 함께 가져옴
 */
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

/**
 * useMessages 훅의 옵션
 *
 * @property {string} [familyId] - 조회할 가족 ID (없으면 빈 배열 반환)
 * @property {Date} [date] - 필터링할 날짜 (해당 날짜에 표시할 메시지만 조회)
 * @property {boolean} [realtime=true] - Realtime 구독 활성화 여부
 */
interface UseMessagesOptions {
  familyId?: string;
  date?: Date;
  realtime?: boolean;
}

/**
 * useMessages 훅의 반환 타입
 *
 * @property {MessageWithAuthor[]} messages - 정렬된 메시지 목록
 * @property {boolean} loading - 로딩 상태
 * @property {string|null} error - 에러 메시지
 * @property {Function} createMessage - 메시지 생성 함수
 * @property {Function} updateMessage - 메시지 수정 함수
 * @property {Function} deleteMessage - 메시지 삭제 함수
 * @property {Function} refreshMessages - 메시지 새로고침 함수
 */
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
 * sortMessages - 메시지를 시간 기반으로 정렬
 *
 * @description 메시지를 현재 시간 기준으로 3개 그룹으로 분류하여 정렬합니다.
 * 디스플레이 화면에서 사용자가 가장 관련성 높은 메시지를 먼저 볼 수 있도록 합니다.
 *
 * 정렬 순서:
 *   1. 다가오는 메시지 (아직 표시 시간이 안 된 메시지) - 시간순 오름차순
 *   2. 종일 메시지 (display_time이 없는 메시지) - 우선순위 → 생성일 내림차순
 *   3. 지나간 메시지 (표시 시간이 지난 메시지) - 시간순 내림차순
 *
 * @param {MessageWithAuthor[]} messages - 정렬할 메시지 배열
 * @returns {MessageWithAuthor[]} 정렬된 메시지 배열
 *
 * @example
 * // 현재 시간이 14:00일 때:
 * // - 15:00 메시지 → 맨 위
 * // - 종일 메시지 → 중간
 * // - 13:00 메시지 → 맨 아래
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

/**
 * getPriorityWeight - 우선순위 문자열을 숫자 가중치로 변환
 *
 * @param {string} priority - 우선순위 ('urgent' | 'important' | 'normal')
 * @returns {number} 가중치 (높을수록 우선)
 */
function getPriorityWeight(priority: string): number {
  switch (priority) {
    case 'urgent': return 3;
    case 'important': return 2;
    case 'normal': return 1;
    default: return 0;
  }
}

/**
 * useMessages - 메시지 CRUD 및 실시간 동기화 훅
 *
 * @description 가족 메시지를 관리하는 React 훅입니다.
 * Supabase를 사용하여 메시지 데이터를 조회/생성/수정/삭제하고,
 * Realtime 기능으로 다른 가족 구성원의 변경사항을 실시간으로 반영합니다.
 *
 * 동작 흐름:
 *   1. 클라이언트 초기화 및 마운트 확인
 *   2. familyId가 있으면 해당 가족의 메시지 조회
 *   3. date가 있으면 해당 날짜에 표시할 메시지만 필터링
 *   4. Realtime 채널 구독하여 INSERT/UPDATE/DELETE 이벤트 처리
 *   5. 매 분마다 currentMinute 업데이트하여 정렬 갱신
 *
 * @param {UseMessagesOptions} options - 훅 옵션
 * @returns {UseMessagesReturn} 메시지 데이터 및 CRUD 함수
 *
 * @example
 * const { messages, loading, createMessage } = useMessages({
 *   familyId: 'family-uuid',
 *   date: new Date(),
 *   realtime: true,
 * });
 *
 * @see UseMessagesOptions - 옵션 상세
 * @see UseMessagesReturn - 반환값 상세
 */
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

  /**
   * fetchMessages - 서버에서 메시지 조회
   *
   * @description Supabase에서 가족 메시지를 조회합니다.
   * 날짜 필터가 있으면 해당 날짜에 표시할 메시지만 가져옵니다.
   *
   * 쿼리 조건:
   *   - family_id 일치
   *   - display_date가 오늘이거나
   *   - display_forever가 true이거나
   *   - repeat_pattern이 weekly인 경우
   *
   * 클라이언트 필터링:
   *   - shouldDisplayOnDate로 반복 메시지의 요일/skip_dates 확인
   */
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
        // display_date가 오늘이거나, display_forever가 true이거나, 반복 메시지인 경우
        query = query.or(
          `display_date.eq.${dateStr},display_forever.eq.true,repeat_pattern.eq.weekly`
        );
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // 클라이언트에서 반복 메시지 필터링
      let filteredMessages = (data as unknown as MessageWithAuthor[]) || [];
      if (date) {
        filteredMessages = filteredMessages.filter((msg) =>
          shouldDisplayOnDate(msg, date)
        );
      }

      setRawMessages(filteredMessages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '메시지를 불러오는데 실패했습니다';
      setError(errorMessage);
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, [isReady, familyId, date]);

  /**
   * createMessage - 새 메시지 생성
   *
   * @description API 라우트를 통해 메시지를 생성합니다.
   * API에서 자동으로 author_id, family_id를 설정하고,
   * 가족 구성원들에게 푸시 알림을 발송합니다.
   *
   * @param {Omit<MessageInsert, 'author_id' | 'family_id'>} messageData - 메시지 데이터
   * @returns {Promise<Message | null>} 생성된 메시지 또는 null
   */
  const createMessage = useCallback(async (
    messageData: Omit<MessageInsert, 'author_id' | 'family_id'>
  ): Promise<Message | null> => {
    if (!isReady) {
      return null;
    }
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '메시지 작성에 실패했습니다');
      }

      return result.data as Message;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '메시지 작성에 실패했습니다';
      setError(errorMessage);
      console.error('Failed to create message:', err);
      return null;
    }
  }, [isReady]);

  /**
   * updateMessage - 메시지 수정
   *
   * @description Supabase를 통해 직접 메시지를 수정합니다.
   * updated_at 타임스탬프가 자동으로 갱신됩니다.
   *
   * @param {string} id - 메시지 ID
   * @param {MessageUpdate} updates - 수정할 필드
   * @returns {Promise<Message | null>} 수정된 메시지 또는 null
   */
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

  /**
   * deleteMessage - 메시지 삭제
   *
   * @description 메시지를 서버와 로컬 상태 모두에서 삭제합니다.
   *
   * @param {string} id - 삭제할 메시지 ID
   * @returns {Promise<boolean>} 성공 여부
   */
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

  /**
   * Realtime 구독 설정
   *
   * @description Supabase Realtime을 통해 메시지 변경사항을 실시간으로 수신합니다.
   *
   * 처리 이벤트:
   *   - INSERT: 새 메시지를 목록에 추가 (날짜 필터 확인 후)
   *   - UPDATE: 기존 메시지 업데이트 또는 필터에 맞게 추가/제거
   *   - DELETE: 메시지 목록에서 제거
   *
   * 주의사항:
   *   - Realtime payload에는 author 정보가 없으므로 기존 author 유지
   *   - 날짜가 변경되어 필터에 맞지 않게 되면 목록에서 제거
   */
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

    // 날짜 필터에 맞는지 확인하는 함수 (반복 메시지 skip_dates 포함)
    const isMessageForDate = (message: Message): boolean => {
      if (!date) return true; // 날짜 필터 없으면 모두 허용
      return shouldDisplayOnDate(message, date);
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
              const existingMsg = prev.find((msg) => msg.id === updatedMessage.id);
              if (existingMsg) {
                // realtime payload에는 author 정보가 없으므로 기존 author 유지
                return prev.map((msg) =>
                  msg.id === updatedMessage.id
                    ? { ...updatedMessage, author: existingMsg.author }
                    : msg
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
