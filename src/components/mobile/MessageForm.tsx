'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Volume2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn, getTodayString, calculateTimeOffset } from '@/lib/utils';

// 폼 스키마
const messageSchema = z.object({
  content: z
    .string()
    .min(1, '메시지를 입력해주세요')
    .max(500, '메시지는 500자 이내로 입력해주세요'),
  priority: z.enum(['normal', 'important', 'urgent']),
  display_date: z.string().min(1, '날짜를 선택해주세요'),
  display_time: z.string().nullable(),
  tts_enabled: z.boolean(),
  tts_times: z.array(z.string()),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface MessageFormProps {
  onSubmit: (data: MessageFormData) => Promise<void>;
  initialData?: Partial<MessageFormData>;
  isLoading?: boolean;
}

// 알림 바로가기 버튼 설정
const TIME_OFFSET_BUTTONS = [
  { label: '-60분', offset: -60 },
  { label: '-30분', offset: -30 },
  { label: '-15분', offset: -15 },
  { label: '-10분', offset: -10 },
  { label: '-5분', offset: -5 },
  { label: '정각', offset: 0 },
  { label: '+5분', offset: 5 },
  { label: '+10분', offset: 10 },
];

export function MessageForm({ onSubmit, initialData, isLoading }: MessageFormProps) {
  const [ttsTimes, setTtsTimes] = useState<string[]>(
    initialData?.tts_times || []
  );
  const [newTime, setNewTime] = useState('');
  // 수정 모드에서는 기존 값 사용, 새 메시지에서는 시간 지정이 기본값
  const [isAllDay, setIsAllDay] = useState(
    initialData ? initialData.display_time === null : false
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: initialData?.content || '',
      priority: initialData?.priority || 'normal',
      display_date: initialData?.display_date || getTodayString(),
      // 수정 모드에서는 기존 값 사용, 새 메시지에서는 09:00이 기본값
      display_time: initialData ? initialData.display_time : '09:00',
      tts_enabled: initialData?.tts_enabled ?? true,
      tts_times: initialData?.tts_times || [],
    },
  });

  const ttsEnabled = watch('tts_enabled');
  const priority = watch('priority');
  const displayTime = watch('display_time');

  // 바로가기 버튼으로 추가할 수 있는 시간 목록 계산
  const availableOffsetTimes = useMemo(() => {
    if (!displayTime) return {};
    return TIME_OFFSET_BUTTONS.reduce((acc, btn) => {
      const time = calculateTimeOffset(displayTime, btn.offset);
      acc[btn.offset] = time;
      return acc;
    }, {} as Record<number, string | null>);
  }, [displayTime]);

  const handleAddTime = () => {
    if (newTime && !ttsTimes.includes(newTime)) {
      const updated = [...ttsTimes, newTime].sort();
      setTtsTimes(updated);
      setValue('tts_times', updated);
      setNewTime('');
    }
  };

  const handleAddTimeFromOffset = (offset: number) => {
    const time = availableOffsetTimes[offset];
    if (time && !ttsTimes.includes(time)) {
      const updated = [...ttsTimes, time].sort();
      setTtsTimes(updated);
      setValue('tts_times', updated);
    }
  };

  const handleRemoveTime = (time: string) => {
    const updated = ttsTimes.filter((t) => t !== time);
    setTtsTimes(updated);
    setValue('tts_times', updated);
  };

  const handleToggleAllDay = () => {
    if (isAllDay) {
      // 종일 -> 시간 지정
      setIsAllDay(false);
      setValue('display_time', '09:00');
    } else {
      // 시간 지정 -> 종일
      setIsAllDay(true);
      setValue('display_time', null);
    }
  };

  const onFormSubmit = async (data: MessageFormData) => {
    await onSubmit({
      ...data,
      display_time: isAllDay ? null : data.display_time,
      tts_times: ttsTimes,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* 메시지 내용 */}
      <div className="space-y-2">
        <Label htmlFor="content" className="text-base font-semibold text-gray-900">
          메시지 내용 *
        </Label>
        <Textarea
          id="content"
          placeholder="어머니께 전할 메시지를 입력하세요"
          className="min-h-[120px] text-lg"
          {...register('content')}
        />
        {errors.content && (
          <p className="text-sm text-red-500">{errors.content.message}</p>
        )}
        <p className="text-sm text-gray-500 text-right">
          {watch('content')?.length || 0}/500
        </p>
      </div>

      {/* 중요도 */}
      <div className="space-y-2">
        <Label className="text-base font-semibold text-gray-900">중요도</Label>
        <div className="flex gap-2">
          {[
            { value: 'normal', label: '일반', color: 'bg-gray-100', textColor: 'text-gray-800' },
            { value: 'important', label: '⭐ 중요', color: 'bg-yellow-100', textColor: 'text-yellow-800' },
            { value: 'urgent', label: '🚨 긴급', color: 'bg-red-100', textColor: 'text-red-800' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue('priority', option.value as MessageFormData['priority'])}
              className={cn(
                'flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all',
                priority === option.value
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-300',
                option.color,
                option.textColor
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 표시 날짜 및 시간 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display_date" className="text-base font-semibold text-gray-900">
            표시 날짜 *
          </Label>
          <Input
            id="display_date"
            type="date"
            className="text-lg"
            {...register('display_date')}
          />
          {errors.display_date && (
            <p className="text-sm text-red-500">{errors.display_date.message}</p>
          )}
        </div>

        {/* 표시 시간 */}
        <div className="space-y-2">
          <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-700" />
            표시 시간
          </Label>
          <div className="flex gap-2 items-stretch">
            <Input
              type="time"
              disabled={isAllDay}
              className={cn(
                'flex-1 text-lg',
                isAllDay && 'opacity-50'
              )}
              value={displayTime || ''}
              onChange={(e) => {
                setValue('display_time', e.target.value);
                if (isAllDay) setIsAllDay(false);
              }}
            />
            <button
              type="button"
              onClick={handleToggleAllDay}
              className={cn(
                'px-6 rounded-lg border-2 font-medium transition-all text-base flex items-center justify-center',
                isAllDay
                  ? 'border-blue-500 bg-blue-100 text-blue-800 ring-2 ring-blue-200'
                  : 'border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100'
              )}
            >
              종일
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {isAllDay ? '하루 종일 표시됩니다' : '지정한 시간에 상단에 표시됩니다'}
          </p>
        </div>
      </div>

      {/* TTS 설정 */}
      <div className="space-y-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-gray-700" />
            음성 읽기
          </Label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              {...register('tts_enabled')}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {ttsEnabled && (
          <div className="space-y-3">
            {/* 바로가기 버튼 */}
            {!isAllDay && displayTime && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">표시 시간 기준 알림추가</Label>
                <div className="flex flex-wrap gap-2">
                  {TIME_OFFSET_BUTTONS.map((btn) => {
                    const time = availableOffsetTimes[btn.offset];
                    const isDisabled = !time || ttsTimes.includes(time);
                    return (
                      <button
                        key={btn.offset}
                        type="button"
                        onClick={() => handleAddTimeFromOffset(btn.offset)}
                        disabled={isDisabled}
                        className={cn(
                          'px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all',
                          isDisabled
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400'
                        )}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Label className="text-sm font-medium text-gray-700">알림 시간 설정</Label>

            {/* 시간 추가 */}
            <div className="flex gap-2">
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1 text-gray-900"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTime}
                disabled={!newTime}
                className="border-gray-400 text-gray-700 hover:bg-gray-200"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* 설정된 시간 목록 */}
            {ttsTimes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ttsTimes.map((time) => (
                  <div
                    key={time}
                    className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                  >
                    <span className="font-medium">{time}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTime(time)}
                      className="hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 제출 버튼 */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? '전송 중...' : '메시지 전송'}
      </Button>
    </form>
  );
}

export default MessageForm;
