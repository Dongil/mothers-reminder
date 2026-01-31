'use client';

import React from 'react';
import { Edit2, Trash2, Volume2, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, getPriorityColor, getPriorityLabel, formatDday } from '@/lib/utils';
import type { MessageWithAuthor } from '@/hooks/useMessages';
import type { Priority } from '@/types/database';

interface MessageListProps {
  messages: MessageWithAuthor[];
  currentUserId?: string;
  onEdit?: (message: MessageWithAuthor) => void;
  onDelete?: (message: MessageWithAuthor) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function MessageList({
  messages,
  currentUserId,
  onEdit,
  onDelete,
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
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

interface MessageListItemProps {
  message: MessageWithAuthor;
  currentUserId?: string;
  onEdit?: (message: MessageWithAuthor) => void;
  onDelete?: (message: MessageWithAuthor) => void;
}

function MessageListItem({ message, currentUserId, onEdit, onDelete }: MessageListItemProps) {
  const priorityColor = getPriorityColor(message.priority as Priority);
  const priorityLabel = getPriorityLabel(message.priority as Priority);
  const isAuthor = currentUserId && message.author_id === currentUserId;

  const handleEdit = () => {
    if (onEdit && isAuthor) onEdit(message);
  };

  const handleDelete = () => {
    if (onDelete && isAuthor) {
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
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                disabled={!isAuthor}
                className={cn(
                  isAuthor ? "text-gray-500 hover:text-blue-600" : "text-gray-300 cursor-not-allowed"
                )}
                title={isAuthor ? "수정" : "본인 메시지만 수정 가능"}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={!isAuthor}
                className={cn(
                  isAuthor ? "text-gray-500 hover:text-red-600" : "text-gray-300 cursor-not-allowed"
                )}
                title={isAuthor ? "삭제" : "본인 메시지만 삭제 가능"}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MessageList;
