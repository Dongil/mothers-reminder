'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft, List } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { cn, getTodayString } from '@/lib/utils';

interface MessageCount {
  display_date: string;
  count: number;
}

export default function CalendarPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const today = parseISO(getTodayString());

  // 월별 메시지 개수 조회
  const fetchMessageCounts = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);
    try {
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('messages')
        .select('display_date')
        .gte('display_date', monthStart)
        .lte('display_date', monthEnd);

      if (error) throw error;

      // 날짜별 개수 집계
      const counts: Record<string, number> = {};
      (data || []).forEach((item: { display_date: string }) => {
        counts[item.display_date] = (counts[item.display_date] || 0) + 1;
      });

      setMessageCounts(counts);
    } catch (err) {
      console.error('Failed to fetch message counts:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, currentMonth]);

  useEffect(() => {
    fetchMessageCounts();
  }, [fetchMessageCounts]);

  // 월 이동
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
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
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-blue-500"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">메시지 달력</h1>
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

          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </h2>

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

                {/* 메시지 개수 표시 */}
                {isCurrentMonth && count > 0 && (
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
