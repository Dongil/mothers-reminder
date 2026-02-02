'use client';

import React from 'react';
import { Edit2, Trash2, Volume2, Calendar, Repeat, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, getPriorityColor, getPriorityLabel, formatDday } from '@/lib/utils';
import { isRepeatMessage } from '@/lib/repeat-utils';
import type { MessageWithAuthor } from '@/hooks/useMessages';
import type { Priority } from '@/types/database';

interface MessageListProps {
  messages: MessageWithAuthor[];
  currentUserId?: string;
  isAdmin?: boolean;
  activeFamilyId?: string;
  viewingDate?: string; // 현재 보고 있는 날짜 (YYYY-MM-DD)
  onEdit?: (message: MessageWithAuthor) => void;
  onDelete?: (message: MessageWithAuthor) => void;
  onSkipDate?: (message: MessageWithAuthor, date: string) => void; // 반복 메시지 해당일 숨기기
  loading?: boolean;
  emptyMessage?: string;
}

export function MessageList({
  messages,
  currentUserId,
  isAdmin,
  activeFamilyId,
  viewingDate,
  onEdit,
  onDelete,
  onSkipDate,
  loading,
  emptyMessage = '등록된 메시지가 없습니다',
}: MessageListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageListItem
          key={message.id}
          message={message}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          activeFamilyId={activeFamilyId}
          viewingDate={viewingDate}
          onEdit={onEdit}
          onDelete={onDelete}
          onSkipDate={onSkipDate}
        />
      ))}
    </div>
  );
}

interface MessageListItemProps {
  message: MessageWithAuthor;
  currentUserId?: string;
  isAdmin?: boolean;
  activeFamilyId?: string;
  viewingDate?: string;
  onEdit?: (message: MessageWithAuthor) => void;
  onDelete?: (message: MessageWithAuthor) => void;
  onSkipDate?: (message: MessageWithAuthor, date: string) => void;
}

function MessageListItem({ message, currentUserId, isAdmin, activeFamilyId, viewingDate, onEdit, onDelete, onSkipDate }: MessageListItemProps) {
  const priorityColor = getPriorityColor(message.priority as Priority);
  const priorityLabel = getPriorityLabel(message.priority as Priority);
  const isAuthor = currentUserId && message.author_id === currentUserId;
  const canModify = isAuthor || (isAdmin && message.family_id === activeFamilyId);
  const isRepeat = isRepeatMessage(message);

  const handleEdit = () => {
    // 반복 메시지는 수정 불가 (반복 메시지 리스트에서만 수정)
    if (isRepeat) return;
    if (onEdit && canModify) onEdit(message);
  };

  const handleDelete = () => {
    if (!canModify) return;

    if (isRepeat && onSkipDate && viewingDate) {
      // 반복 메시지: 해당일만 숨기기
      if (window.confirm('이 날짜에 메시지를 숨기시겠습니까?\n(반복 메시지 자체는 삭제되지 않습니다)')) {
        onSkipDate(message, viewingDate);
      }
    } else if (onDelete) {
      // 일반 메시지: 삭제
      if (window.confirm('이 메시지를 삭제하시겠습니까?')) {
        onDelete(message);
      }
    }
  };

  return (
    <Card className={cn('border-l-4', priorityColor)}>
      <CardContent className="p-4">
        {/* 상단: 배지들 */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge
            variant={message.priority as 'normal' | 'important' | 'urgent'}
            size="sm"
          >
            {priorityLabel}
          </Badge>

          {isRepeat && (
            <Badge variant="outline" size="sm" className="gap-1 bg-purple-50 text-purple-700 border-purple-200">
              <Repeat className="w-3 h-3" />
              반복
            </Badge>
          )}

          {message.tts_enabled && (
            <Badge variant="outline" size="sm" className="gap-1">
              <Volume2 className="w-3 h-3" />
              음성
              {message.tts_times && message.tts_times.length > 0 && (
                <span className="ml-1">{message.tts_times.length}회</span>
              )}
            </Badge>
          )}

          {message.is_dday && message.dday_date && (
            <Badge variant="dday" size="sm">
              {formatDday(message.dday_date)}
            </Badge>
          )}
        </div>

        {/* 메시지 내용 */}
        <p className="text-lg font-medium text-gray-900 mb-3 line-clamp-2">
          {message.content}
        </p>

        {/* 하단: 작성자 + 날짜 + 액션 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {/* 작성자 정보 */}
            <span className="flex items-center gap-1">
              {message.author?.gender === 'male' ? '👨' :
               message.author?.gender === 'female' ? '👩' : '👤'}
              {message.author?.nickname || message.author?.name || '가족'}
            </span>

            {/* 표시 날짜 */}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {message.display_date}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 수정 버튼: 반복 메시지는 숨김 */}
            {onEdit && !isRepeat && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                disabled={!canModify}
                className={cn(
                  canModify ? "text-gray-500 hover:text-blue-600" : "text-gray-300 cursor-not-allowed"
                )}
                title={canModify ? "수정" : "수정 권한이 없습니다"}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}

            {/* 삭제/숨기기 버튼 */}
            {(onDelete || (isRepeat && onSkipDate)) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={!canModify}
                className={cn(
                  canModify ? "text-gray-500 hover:text-red-600" : "text-gray-300 cursor-not-allowed"
                )}
                title={isRepeat ? "이 날짜에 숨기기" : (canModify ? "삭제" : "삭제 권한이 없습니다")}
              >
                {isRepeat ? <EyeOff className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MessageList;
