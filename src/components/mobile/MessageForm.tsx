'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn, getTodayString } from '@/lib/utils';

// 폼 스키마
const messageSchema = z.object({
  content: z
    .string()
    .min(1, '메시지를 입력해주세요')
    .max(500, '메시지는 500자 이내로 입력해주세요'),
  priority: z.enum(['normal', 'important', 'urgent']),
  display_date: z.string().min(1, '날짜를 선택해주세요'),
  tts_enabled: z.boolean(),
  tts_times: z.array(z.string()),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface MessageFormProps {
  onSubmit: (data: MessageFormData) => Promise<void>;
  initialData?: Partial<MessageFormData>;
  isLoading?: boolean;
}

export function MessageForm({ onSubmit, initialData, isLoading }: MessageFormProps) {
  const [ttsTimes, setTtsTimes] = useState<string[]>(
    initialData?.tts_times || []
  );
  const [newTime, setNewTime] = useState('');

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
      tts_enabled: initialData?.tts_enabled ?? true,
      tts_times: initialData?.tts_times || [],
    },
  });

  const ttsEnabled = watch('tts_enabled');
  const priority = watch('priority');

  const handleAddTime = () => {
    if (newTime && !ttsTimes.includes(newTime)) {
      const updated = [...ttsTimes, newTime].sort();
      setTtsTimes(updated);
      setValue('tts_times', updated);
      setNewTime('');
    }
  };

  const handleRemoveTime = (time: string) => {
    const updated = ttsTimes.filter((t) => t !== time);
    setTtsTimes(updated);
    setValue('tts_times', updated);
  };

  const onFormSubmit = async (data: MessageFormData) => {
    await onSubmit({
      ...data,
      tts_times: ttsTimes,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* 메시지 내용 */}
      <div className="space-y-2">
        <Label htmlFor="content" className="text-base font-semibold">
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
        <Label className="text-base font-semibold">중요도</Label>
        <div className="flex gap-2">
          {[
            { value: 'normal', label: '일반', color: 'bg-gray-100' },
            { value: 'important', label: '⭐ 중요', color: 'bg-yellow-100' },
            { value: 'urgent', label: '🚨 긴급', color: 'bg-red-100' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue('priority', option.value as MessageFormData['priority'])}
              className={cn(
                'flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all',
                priority === option.value
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200',
                option.color
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 표시 날짜 */}
      <div className="space-y-2">
        <Label htmlFor="display_date" className="text-base font-semibold">
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

      {/* TTS 설정 */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
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
            <Label className="text-sm text-gray-600">알림 시간 설정</Label>

            {/* 시간 추가 */}
            <div className="flex gap-2">
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTime}
                disabled={!newTime}
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
