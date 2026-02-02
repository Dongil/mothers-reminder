'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const WEEKDAYS = [
  { value: 0, label: '일' },
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
];

interface WeekdaySelectorProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
}

export function WeekdaySelector({
  selectedDays,
  onChange,
  disabled = false,
}: WeekdaySelectorProps) {
  const toggleDay = (day: number) => {
    if (disabled) return;

    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  // 빠른 선택 버튼
  const selectWeekdays = () => {
    onChange([1, 2, 3, 4, 5]); // 월-금
  };

  const selectWeekend = () => {
    onChange([0, 6]); // 일, 토
  };

  const selectAll = () => {
    onChange([0, 1, 2, 3, 4, 5, 6]);
  };

  return (
    <div className="space-y-3">
      {/* 요일 버튼들 */}
      <div className="flex justify-center gap-2">
        {WEEKDAYS.map((day) => {
          const isSelected = selectedDays.includes(day.value);
          const isSunday = day.value === 0;
          const isSaturday = day.value === 6;

          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              disabled={disabled}
              className={cn(
                'w-10 h-10 rounded-full font-medium text-sm transition-all',
                'flex items-center justify-center',
                isSelected
                  ? 'bg-blue-500 text-white shadow-md'
                  : cn(
                      'bg-gray-100 hover:bg-gray-200',
                      isSunday && 'text-red-500',
                      isSaturday && 'text-blue-500',
                      !isSunday && !isSaturday && 'text-gray-700'
                    ),
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {day.label}
            </button>
          );
        })}
      </div>

      {/* 빠른 선택 버튼 */}
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={selectWeekdays}
          disabled={disabled}
          className={cn(
            'px-3 py-1 text-xs rounded-full border transition-all',
            selectedDays.length === 5 &&
              selectedDays.includes(1) &&
              selectedDays.includes(5) &&
              !selectedDays.includes(0) &&
              !selectedDays.includes(6)
              ? 'bg-blue-100 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          평일
        </button>
        <button
          type="button"
          onClick={selectWeekend}
          disabled={disabled}
          className={cn(
            'px-3 py-1 text-xs rounded-full border transition-all',
            selectedDays.length === 2 &&
              selectedDays.includes(0) &&
              selectedDays.includes(6)
              ? 'bg-blue-100 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          주말
        </button>
        <button
          type="button"
          onClick={selectAll}
          disabled={disabled}
          className={cn(
            'px-3 py-1 text-xs rounded-full border transition-all',
            selectedDays.length === 7
              ? 'bg-blue-100 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          매일
        </button>
      </div>
    </div>
  );
}

export default WeekdaySelector;
