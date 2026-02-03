'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft, List, Home } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { cn, getTodayString } from '@/lib/utils';
import { shouldDisplayOnDate } from '@/lib/repeat-utils';
import { useUser } from '@/hooks';
import type { Message } from '@/types/database';

function CalendarPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // URL에서 month 파라미터 읽기 (형식: yyyy-MM)
  const monthParam = searchParams.get('month');
  const initialMonth = useMemo(() => {
    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number);
      if (year && month && month >= 1 && month <= 12) {
        return new Date(year, month - 1, 1);
      }
    }
    return new Date();
  }, [monthParam]);

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  // today를 useMemo로 감싸서 불필요한 재생성 방지
  const today = useMemo(() => parseISO(getTodayString()), []);

  // 반복 메시지 표시 범위: 현재 주 시작 ~ 다음 주 끝 (일~토 기준)
  const repeatRangeStart = useMemo(() => startOfWeek(today, { weekStartsOn: 0 }), [today]);
  const repeatRangeEnd = useMemo(() => endOfWeek(addWeeks(today, 1), { weekStartsOn: 0 }), [today]);

  // 월별 메시지 개수 조회 (반복 메시지 포함)
  const fetchMessageCounts = useCallback(async () => {
    if (!supabase || !user?.activeFamily?.id) return;

    setLoading(true);
    try {
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      // 일반 메시지 + 반복 메시지 모두 조회
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('family_id', user.activeFamily.id)
        .or(`display_date.gte.${monthStart},repeat_pattern.eq.weekly`);

      if (error) throw error;

      const messages = (data || []) as Message[];

      // 달력에 표시할 날짜 범위
      const calendarStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
      const calendarEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
      const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

      // 날짜별 개수 집계
      const counts: Record<string, number> = {};

      calendarDays.forEach((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        let count = 0;

        messages.forEach((msg) => {
          const isRepeat = msg.repeat_pattern === 'weekly' && msg.repeat_weekdays && msg.repeat_weekdays.length > 0;

          if (isRepeat) {
            // 반복 메시지: 현재 주 ~ 다음 주 범위 내에서만 표시
            if (date >= repeatRangeStart && date <= repeatRangeEnd) {
              if (shouldDisplayOnDate(msg, date)) {
                count++;
              }
            }
          } else {
            // 일반 메시지: 정확한 날짜에만 표시
            if (shouldDisplayOnDate(msg, date)) {
              count++;
            }
          }
        });

        if (count > 0) {
          counts[dateStr] = count;
        }
      });

      setMessageCounts(counts);
    } catch (err) {
      console.error('Failed to fetch message counts:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, currentMonth, user?.activeFamily?.id, repeatRangeStart, repeatRangeEnd]);

  useEffect(() => {
    fetchMessageCounts();
  }, [fetchMessageCounts]);

  // 월 이동 - URL 업데이트 포함
  const handlePrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    router.replace(`/messages/calendar?month=${format(newMonth, 'yyyy-MM')}`, { scroll: false });
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    router.replace(`/messages/calendar?month=${format(newMonth, 'yyyy-MM')}`, { scroll: false });
  };

  // 날짜 클릭 - 관리 페이지로 이동
  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    router.push(`/messages/manage?date=${dateStr}`);
  };

  // 달력 날짜 생성
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // 요일 헤더
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

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
            <h1 className="text-xl font-bold text-white">{user?.activeFamily?.name || '가족'} 달력</h1>
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

      {/* 월 선택 */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="border-gray-400 text-gray-700 hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {format(currentMonth, 'yyyy년 M월', { locale: ko })}
            </h2>
            {loading && (
              <span className="text-xs text-gray-400">불러오는 중...</span>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="border-gray-400 text-gray-700 hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 달력 */}
      <div className="p-4">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day, idx) => (
            <div
              key={day}
              className={cn(
                'text-center text-sm font-medium py-2',
                idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-600'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const count = messageCounts[dateStr] || 0;
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isToday = isSameDay(date, today);
            const dayOfWeek = date.getDay();

            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(date)}
                disabled={!isCurrentMonth}
                className={cn(
                  'aspect-square p-1 rounded-lg transition-all relative',
                  'flex flex-col items-center justify-center',
                  isCurrentMonth ? 'hover:bg-gray-100' : 'cursor-default',
                  isToday && 'ring-2 ring-blue-500'
                )}
              >
                <span
                  className={cn(
                    'text-sm font-medium',
                    !isCurrentMonth && 'text-gray-400',
                    isCurrentMonth && dayOfWeek === 0 && 'text-red-500',
                    isCurrentMonth && dayOfWeek === 6 && 'text-blue-500',
                    isCurrentMonth && dayOfWeek !== 0 && dayOfWeek !== 6 && 'text-gray-900'
                  )}
                >
                  {format(date, 'd')}
                </span>

                {/* 메시지 개수 표시 - 로딩 중이 아닐 때만 */}
                {isCurrentMonth && !loading && count > 0 && (
                  <span
                    className={cn(
                      'absolute bottom-1 text-xs font-bold rounded-full min-w-[18px] h-[18px]',
                      'flex items-center justify-center',
                      count >= 3
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-500 text-white'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-blue-500" />
            <span>1-2개</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-red-500" />
            <span>3개 이상</span>
          </div>
        </div>
      </div>

      {/* 네비게이션 */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="outline"
          className="shadow-lg bg-white border-gray-400 text-gray-700 hover:bg-gray-100"
          onClick={() => router.push('/messages/manage')}
        >
          <List className="w-4 h-4 mr-2" />
          목록 보기
        </Button>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400">불러오는 중...</div></div>}>
      <CalendarPageContent />
    </Suspense>
  );
}
