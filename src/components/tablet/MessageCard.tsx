'use client';

import React from 'react';
import { Volume2, Calendar, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatTime, formatDday, getPriorityColor, getPriorityLabel } from '@/lib/utils';
import type { Message, Priority } from '@/types/database';

interface MessageCardProps {
  message: Message;
  onSpeak?: (text: string) => void;
  className?: string;
}

export function MessageCard({ message, onSpeak, className }: MessageCardProps) {
  const priorityColor = getPriorityColor(message.priority as Priority);
  const priorityLabel = getPriorityLabel(message.priority as Priority);

  // 다음 알림 시간 계산
  const getNextAlarmTime = () => {
    if (!message.tts_times || message.tts_times.length === 0) return null;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 현재 시간 이후의 첫 번째 알림 시간 찾기
    const nextTime = message.tts_times.find((time) => time > currentTime);
    return nextTime || message.tts_times[0]; // 없으면 첫 번째 시간 (내일)
  };

  const nextAlarm = getNextAlarmTime();

  const handleSpeak = () => {
    if (onSpeak) {
      onSpeak(message.content);
    }
  };

  return (
    <Card
      className={cn(
        'border-4 transition-all',
        priorityColor,
        message.priority === 'urgent' && 'animate-pulse',
        className
      )}
    >
      <CardContent className="p-6">
        {/* 상단: 중요도 배지 + D-day */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Badge
              variant={message.priority as 'normal' | 'important' | 'urgent'}
              size="tablet"
            >
              {message.priority === 'urgent' && '🚨 '}
              {message.priority === 'important' && '⭐ '}
              {priorityLabel}
            </Badge>

            {nextAlarm && (
              <span className="text-lg text-gray-500">
                ⏰ {formatTime(nextAlarm)}
              </span>
            )}
          </div>

          {message.is_dday && message.dday_date && (
            <Badge variant="dday" size="tablet">
              {formatDday(message.dday_date)}
              {message.dday_label && ` ${message.dday_label}`}
            </Badge>
          )}
        </div>

        {/* 메시지 내용 - 큰 글씨 */}
        <div className="mb-6">
          <p className="text-3xl leading-relaxed font-medium text-gray-900 break-words">
            {message.content}
          </p>
        </div>

        {/* 사진 (있는 경우) */}
        {message.photo_url && (
          <div className="mb-6">
            <img
              src={message.photo_url}
              alt="첨부 사진"
              className="w-full max-h-64 object-cover rounded-lg"
            />
          </div>
        )}

        {/* 하단: 작성자 + 듣기 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg text-gray-500">
            <User className="w-5 h-5" />
            <span>가족</span>
            <span className="mx-2">•</span>
            <Calendar className="w-5 h-5" />
            <span>{message.display_date}</span>
          </div>

          {message.tts_enabled && (
            <Button
              variant="tablet"
              size="tablet"
              onClick={handleSpeak}
              className="gap-3"
            >
              <Volume2 className="w-7 h-7" />
              지금 듣기
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MessageCard;
