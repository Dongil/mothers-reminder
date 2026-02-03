'use client';

import React, { useState, useCallback, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft, Pencil, Trash2, Clock, Calendar as CalendarIcon, Home, EyeOff, Repeat } from 'lucide-react';
import { format, addDays, subDays, parseISO, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { shouldDisplayOnDate, isRepeatMessage } from '@/lib/repeat-utils';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { cn, formatTime, getPriorityColor, getPriorityLabel, getTodayString } from '@/lib/utils';
import { useUser } from '@/hooks';
import type { Priority } from '@/types/database';
import type { MessageWithAuthor } from '@/hooks/useMessages';

function ManagePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const initialDate = searchParams.get('date') || getTodayString();

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [messages, setMessages] = useState<MessageWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  // 반복 메시지 표시 범위: 현재 주 시작 ~ 다음 주 끝 (일~토 기준)
  const today = useMemo(() => parseISO(getTodayString()), []);
  const repeatRangeStart = useMemo(() => startOfWeek(today, { weekStartsOn: 0 }), [today]);
  const repeatRangeEnd = useMemo(() => endOfWeek(addWeeks(today, 1), { weekStartsOn: 0 }), [today]);

  // 메시지 조회
  const fetchMessages = useCallback(async () => {
    if (!supabase || !user?.activeFamily?.id) return;

    setLoading(true);
    try {
      // 해당 날짜 메시지 + 반복 메시지 조회
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          author:author_id (
            id,
            name,
            nickname,
            gender
          )
        `)
        .eq('family_id', user.activeFamily.id)
        .or(`display_date.eq.${selectedDate},display_forever.eq.true,repeat_pattern.eq.weekly`)
        .order('display_time', { ascending: true, nullsFirst: false })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 클라이언트에서 반복 메시지 필터링
      const targetDate = parseISO(selectedDate);
      const filteredMessages = ((data as unknown as MessageWithAuthor[]) || []).filter((msg) => {
        const isRepeat = msg.repeat_pattern === 'weekly' && msg.repeat_weekdays && msg.repeat_weekdays.length > 0;

        if (isRepeat) {
          // 반복 메시지: 현재 주 ~ 다음 주 범위 내에서만 표시
          if (targetDate < repeatRangeStart || targetDate > repeatRangeEnd) {
            return false;
          }
        }

        return shouldDisplayOnDate(msg, targetDate);
      });

      setMessages(filteredMessages);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedDate, user?.activeFamily?.id, repeatRangeStart, repeatRangeEnd]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // 날짜 이동
  const handlePrevDay = () => {
    const newDate = format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(newDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  // 수정/삭제 권한 확인 헬퍼
  const canModify = (message: MessageWithAuthor) => {
    if (!user) return false;
    const isAuthor = message.author_id === user.id;
    const isAdmin = user.activeMembership?.role === 'admin' &&
                    message.family_id === user.activeFamily?.id;
    return isAuthor || isAdmin;
  };

  // 메시지 수정
  const handleEdit = (message: MessageWithAuthor) => {
    if (!canModify(message)) return;
    router.push(`/messages/${message.id}/edit`);
  };

  // 메시지 삭제 (일반 메시지만)
  const handleDelete = async (message: MessageWithAuthor) => {
    if (!supabase) return;
    if (!canModify(message)) return;
    if (isRepeatMessage(message)) return; // 반복 메시지는 삭제 불가
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', message.id);

      if (error) throw error;
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('삭제에 실패했습니다');
    }
  };

  // 반복 메시지 해당일 숨기기
  const handleSkipDate = async (message: MessageWithAuthor) => {
    if (!supabase) return;
    if (!canModify(message)) return;
    if (!confirm('이 날짜에 메시지를 숨기시겠습니까?\n(반복 메시지 자체는 삭제되지 않습니다)')) return;

    try {
      const currentSkipDates = message.repeat_skip_dates || [];
      if (!currentSkipDates.includes(selectedDate)) {
        const { error } = await supabase
          .from('messages')
          .update({ repeat_skip_dates: [...currentSkipDates, selectedDate] } as never)
          .eq('id', message.id);

        if (error) throw error;
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
      }
    } catch (err) {
      console.error('Failed to skip date:', err);
      alert('숨기기에 실패했습니다');
    }
  };

  // 오늘 날짜인지 확인
  const isToday = selectedDate === getTodayString();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-blue-600 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-blue-500"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-white">{user?.activeFamily?.name || '가족'} 메시지</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-blue-500"
            onClick={() => router.push('/home')}
            title="홈으로"
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* 날짜 선택기 */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevDay}
            className="shrink-0 border-gray-400 text-gray-700 hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1 flex items-center justify-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="max-w-[200px] text-center"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            className="shrink-0 border-gray-400 text-gray-700 hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* 선택된 날짜 표시 */}
        <div className="text-center mt-2">
          <span className={cn(
            'text-sm font-medium',
            isToday ? 'text-blue-600' : 'text-gray-600'
          )}>
            {format(parseISO(selectedDate), 'yyyy년 M월 d일 EEEE', { locale: ko })}
            {isToday && ' (오늘)'}
          </span>
        </div>
      </div>

      {/* 메시지 목록 */}
      <main className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-400">불러오는 중...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32">
            <p className="text-gray-400 mb-2">이 날짜에 메시지가 없습니다</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/messages/new?date=${selectedDate}`)}
            >
              새 메시지 작성
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const canEdit = canModify(message);
              const isRepeat = isRepeatMessage(message);
              return (
                <Card
                  key={message.id}
                  className={cn('border-l-4', getPriorityColor(message.priority as Priority))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* 상단: 배지 + 시간 */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge
                            variant={message.priority as 'normal' | 'important' | 'urgent'}
                            className="text-xs"
                          >
                            {getPriorityLabel(message.priority as Priority)}
                          </Badge>

                          {isRepeat && (
                            <Badge variant="outline" className="text-xs gap-1 bg-purple-50 text-purple-700 border-purple-200">
                              <Repeat className="w-3 h-3" />
                              반복
                            </Badge>
                          )}

                          {message.display_time ? (
                            <span className="text-xs text-blue-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(message.display_time)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">종일</span>
                          )}
                        </div>

                        {/* 메시지 내용 */}
                        <p className="text-gray-900 line-clamp-2">{message.content}</p>

                        {/* 작성자 정보 + TTS 시간 (같은 줄) */}
                        <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-gray-500">
                          <span>
                            {message.author?.gender === 'male' ? '👨' :
                             message.author?.gender === 'female' ? '👩' : '👤'}
                            {' '}{message.author?.nickname || message.author?.name || '가족'}
                          </span>
                          {message.tts_times && message.tts_times.length > 0 && (
                            <>
                              {message.tts_times.map((time) => (
                                <span key={time} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                  ⏰ {time}
                                </span>
                              ))}
                            </>
                          )}
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex flex-col gap-1 shrink-0">
                        {/* 수정 버튼: 반복 메시지는 숨김 */}
                        {!isRepeat && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8",
                              canEdit ? "text-gray-500 hover:text-blue-600" : "text-gray-300 cursor-not-allowed"
                            )}
                            onClick={() => handleEdit(message)}
                            disabled={!canEdit}
                            title={canEdit ? "수정" : "수정 권한이 없습니다"}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {/* 삭제/숨기기 버튼 */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8",
                            canEdit ? "text-gray-500 hover:text-red-600" : "text-gray-300 cursor-not-allowed"
                          )}
                          onClick={() => isRepeat ? handleSkipDate(message) : handleDelete(message)}
                          disabled={!canEdit}
                          title={isRepeat ? "이 날짜에 숨기기" : (canEdit ? "삭제" : "삭제 권한이 없습니다")}
                        >
                          {isRepeat ? <EyeOff className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* 새 메시지 작성 버튼 - 항상 표시 */}
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/messages/new?date=${selectedDate}`)}
              >
                새 메시지 작성
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* 네비게이션 */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2">
        <Button
          variant="outline"
          className="shadow-lg bg-white border-gray-400 text-gray-700 hover:bg-gray-100"
          onClick={() => router.push('/messages/calendar')}
        >
          <CalendarIcon className="w-4 h-4 mr-2" />
          달력 보기
        </Button>
      </div>
    </div>
  );
}

export default function ManagePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">불러오는 중...</div>
      </div>
    }>
      <ManagePageContent />
    </Suspense>
  );
}
