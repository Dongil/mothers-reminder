'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  formatWeekdaysSummary,
  formatTimeWithAmPm,
  getNextActiveDate,
} from '@/lib/repeat-utils';
import type { Message } from '@/types/database';

interface RepeatMessageListProps {
  messages: Message[];
  currentUserId?: string;
  isAdmin?: boolean;
  activeFamilyId?: string;
  onToggle: (messageId: string, enabled: boolean, skipDate?: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
  loading?: boolean;
}

export function RepeatMessageList({
  messages,
  currentUserId,
  isAdmin,
  activeFamilyId,
  onToggle,
  onDelete,
  loading,
}: RepeatMessageListProps) {
  const router = useRouter();
  const [toggleDialog, setToggleDialog] = useState<{
    open: boolean;
    message: Message | null;
  }>({ open: false, message: null });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
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
        <p className="text-gray-500 text-lg mb-2">등록된 반복 메시지가 없습니다</p>
        <p className="text-gray-400 text-sm">새 메시지를 작성할 때 반복을 설정해보세요</p>
      </div>
    );
  }

  const canModify = (message: Message) => {
    if (!currentUserId) return false;
    const isAuthor = message.author_id === currentUserId;
    const isAdminOfFamily = isAdmin && message.family_id === activeFamilyId;
    return isAuthor || isAdminOfFamily;
  };

  const handleToggleClick = (message: Message) => {
    if (message.repeat_enabled) {
      // 끄려고 할 때 다이얼로그 표시
      setToggleDialog({ open: true, message });
    } else {
      // 켜기
      handleToggle(message.id, true);
    }
  };

  const handleToggle = async (messageId: string, enabled: boolean, skipDate?: string) => {
    setActionLoading(messageId);
    try {
      await onToggle(messageId, enabled, skipDate);
    } finally {
      setActionLoading(null);
      setToggleDialog({ open: false, message: null });
    }
  };

  const handleDelete = async (message: Message) => {
    if (!window.confirm('이 반복 메시지를 삭제하시겠습니까?')) return;

    setActionLoading(message.id);
    try {
      await onDelete(message.id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (message: Message) => {
    router.push(`/messages/${message.id}/edit`);
  };

  // 다음 활성화 요일 계산을 위한 헬퍼
  const getNextActiveDateText = (message: Message) => {
    if (!message.repeat_weekdays || message.repeat_weekdays.length === 0) return null;
    const nextDate = getNextActiveDate(message.repeat_weekdays);
    if (!nextDate) return null;
    return format(nextDate, 'M월 d일 (EEEE)', { locale: ko });
  };

  return (
    <>
      <div className="space-y-3">
        {messages.map((message) => {
          const isEnabled = message.repeat_enabled;
          const weekdaysSummary = message.repeat_weekdays
            ? formatWeekdaysSummary(message.repeat_weekdays)
            : '';
          const timeDisplay = formatTimeWithAmPm(message.display_time);
          const canEdit = canModify(message);

          return (
            <Card
              key={message.id}
              className={cn(
                'border-l-4 transition-opacity',
                isEnabled ? 'border-l-purple-500' : 'border-l-gray-300 opacity-60'
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  {/* 메인 콘텐츠 - 한 줄로 표시 */}
                  <div className="flex-1 min-w-0">
                    {/* 반복 이름 - 시간 (요일) 한 줄 */}
                    <div className="flex items-center gap-2 text-base font-semibold text-gray-900 truncate">
                      <span className="truncate">
                        {message.repeat_name || message.content.substring(0, 20)}
                      </span>
                      <span className="text-gray-400 shrink-0">-</span>
                      <span className="text-blue-600 shrink-0">{timeDisplay}</span>
                      <span className="text-purple-600 shrink-0">({weekdaysSummary})</span>
                    </div>

                    {/* 메시지 내용 미리보기 */}
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {message.content}
                    </p>
                  </div>

                  {/* 오른쪽: 토글 + 액션 버튼 */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* 토글 스위치 */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isEnabled}
                        onChange={() => handleToggleClick(message)}
                        disabled={actionLoading === message.id}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>

                    {/* 수정/삭제 버튼 */}
                    {canEdit && (
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-blue-600"
                          onClick={() => handleEdit(message)}
                          disabled={actionLoading === message.id}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-red-600"
                          onClick={() => handleDelete(message)}
                          disabled={actionLoading === message.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 끄기 확인 다이얼로그 */}
      <Dialog
        open={toggleDialog.open}
        onOpenChange={(open) => !open && setToggleDialog({ open: false, message: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반복 메시지 끄기</DialogTitle>
            <DialogDescription>
              {toggleDialog.message && (
                <>
                  <span className="font-medium">
                    {toggleDialog.message.repeat_name || '이 반복 메시지'}
                  </span>
                  를 어떻게 처리할까요?
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {/* 완전히 끄기 */}
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4"
              onClick={() =>
                toggleDialog.message && handleToggle(toggleDialog.message.id, false)
              }
              disabled={actionLoading !== null}
            >
              <div className="text-left">
                <div className="font-medium">완전히 끄기</div>
                <div className="text-sm text-gray-500">
                  다시 켤 때까지 표시되지 않습니다
                </div>
              </div>
            </Button>

            {/* 오늘만 건너뛰고 다음 요일에 다시 표시 */}
            {toggleDialog.message?.repeat_weekdays &&
              toggleDialog.message.repeat_weekdays.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-4"
                  onClick={() => {
                    if (!toggleDialog.message) return;
                    // 오늘 날짜를 skip_dates에 추가 (오늘만 건너뛰기)
                    const todayStr = format(new Date(), 'yyyy-MM-dd');
                    handleToggle(toggleDialog.message.id, true, todayStr);
                  }}
                  disabled={actionLoading !== null}
                >
                  <div className="text-left">
                    <div className="font-medium">
                      {getNextActiveDateText(toggleDialog.message)}에 다시 표시
                    </div>
                    <div className="text-sm text-gray-500">
                      오늘만 건너뛰고 다음 해당 요일부터 표시됩니다
                    </div>
                  </div>
                </Button>
              )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setToggleDialog({ open: false, message: null })}
              disabled={actionLoading !== null}
            >
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default RepeatMessageList;
