'use client';

import React from 'react';
import { Volume2, Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatTime, formatDday, getPriorityColor, getPriorityLabel } from '@/lib/utils';
import type { Message, Priority, Gender } from '@/types/database';

interface AuthorInfo {
  name: string;
  nickname: string | null;
  gender: Gender | null;
}

interface MessageCardProps {
  message: Message;
  author?: AuthorInfo;
  onSpeak?: (text: string) => void;
  className?: string;
  id?: string;
}

export function MessageCard({ message, author, onSpeak, className, id }: MessageCardProps) {
  const priorityColor = getPriorityColor(message.priority as Priority);
  const priorityLabel = getPriorityLabel(message.priority as Priority);

  // 작성자 표시 문자열
  const authorDisplay = author
    ? `${author.gender === 'male' ? '👨' : author.gender === 'female' ? '👩' : '👤'} ${author.nickname || author.name}`
    : '가족';

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
      id={id}
      className={cn(
        'border-4 transition-all',
        priorityColor,
        message.priority === 'urgent' && 'animate-pulse',
        className
      )}
    >
      <CardContent className="p-4 md:p-6">
        {/* 상단: 중요도 배지 + D-day + 표시 시간 */}
        <div className="flex items-center justify-between mb-3 md:mb-4 gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <Badge
              variant={message.priority as 'normal' | 'important' | 'urgent'}
              size="tablet"
              className="text-xs md:text-base px-2 py-0.5 md:px-4 md:py-2"
            >
              {message.priority === 'urgent' && '🚨 '}
              {message.priority === 'important' && '⭐ '}
              {priorityLabel}
            </Badge>

            {/* 표시 시간 */}
            {message.display_time && (
              <span className="text-sm md:text-lg text-blue-600 font-medium flex items-center gap-1">
                <Clock className="w-4 h-4 md:w-5 md:h-5" />
                {formatTime(message.display_time)}
              </span>
            )}

            {nextAlarm && (
              <span className="text-sm md:text-lg text-gray-500">
                ⏰ {formatTime(nextAlarm)}
              </span>
            )}
          </div>

          {message.is_dday && message.dday_date && (
            <Badge variant="dday" size="tablet" className="text-xs md:text-base px-2 py-0.5 md:px-4 md:py-2">
              {formatDday(message.dday_date)}
              {message.dday_label && ` ${message.dday_label}`}
            </Badge>
          )}
        </div>

        {/* 메시지 내용 - 큰 글씨 (태블릿에서 100px) */}
        <div className="mb-4 md:mb-6">
          <p className="text-3xl md:text-[100px] md:leading-none leading-tight font-medium text-gray-900 break-words">
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 md:gap-2 text-sm md:text-lg text-gray-500 min-w-0">
            <span className="truncate">{authorDisplay}</span>
            <span className="mx-1 md:mx-2">•</span>
            <Calendar className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
            <span className="truncate">{message.display_date}</span>
          </div>

          {message.tts_enabled && (
            <Button
              variant="tablet"
              onClick={handleSpeak}
              className="gap-1 md:gap-3 px-3 py-2 md:px-8 md:py-4 text-sm md:text-2xl h-auto min-w-0 md:min-w-[200px]"
            >
              <Volume2 className="w-4 h-4 md:w-7 md:h-7" />
              듣기
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MessageCard;
