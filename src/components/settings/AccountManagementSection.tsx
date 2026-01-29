'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, Loader2, Undo2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks';

export function AccountManagementSection() {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDeletionPending = !!user?.deletion_requested_at && !user?.deleted_at;

  const handleDeleteAccount = async () => {
    if (confirmText !== '회원탈퇴') {
      setError('확인 문구를 정확히 입력해주세요.');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '회원 탈퇴 처리 중 오류가 발생했습니다.');
      }

      // 로그아웃 처리
      const supabase = createClient();
      await supabase.auth.signOut();

      // 로그인 페이지로 이동
      router.push('/login?message=account_deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsCanceling(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '탈퇴 취소 처리 중 오류가 발생했습니다.');
      }

      // 사용자 정보 새로고침
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // 삭제 예정일 계산 (요청일 + 30일)
  const getDeletionDate = () => {
    if (!user?.deletion_requested_at) return null;
    const requestDate = new Date(user.deletion_requested_at);
    requestDate.setDate(requestDate.getDate() + 30);
    return requestDate.toLocaleDateString('ko-KR');
  };

  return (
    <section className="bg-white rounded-xl shadow-sm">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-gray-900">계정 관리</h2>
      </div>

      {/* 탈퇴 예정 안내 배너 */}
      {isDeletionPending && (
        <div className="mx-4 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">회원 탈퇴가 예정되어 있습니다</p>
              <p className="text-sm text-amber-700 mt-1">
                {getDeletionDate()}에 계정이 영구 삭제됩니다.
                <br />
                탈퇴를 취소하시려면 아래 버튼을 눌러주세요.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-amber-700 border-amber-300 hover:bg-amber-100"
                onClick={handleCancelDeletion}
                disabled={isCanceling}
              >
                {isCanceling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <Undo2 className="w-4 h-4 mr-2" />
                    탈퇴 취소
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* 로그아웃 */}
        <Button
          variant="outline"
          className="w-full justify-start text-gray-700"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          로그아웃
        </Button>

        {/* 회원 탈퇴 (탈퇴 예정 아닐 때만 표시) */}
        {!isDeletionPending && (
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            회원 탈퇴
          </Button>
        )}

        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}
      </div>

      {/* 회원 탈퇴 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md" onClose={() => setIsDeleteDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              회원 탈퇴
            </DialogTitle>
            <DialogDescription className="text-left space-y-2">
              <p>정말로 탈퇴하시겠습니까?</p>
              <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                <li>탈퇴 요청 후 <strong>30일간 유예 기간</strong>이 있습니다.</li>
                <li>유예 기간 내 다시 로그인하면 탈퇴를 취소할 수 있습니다.</li>
                <li>30일 후 모든 데이터가 영구 삭제됩니다.</li>
                <li>삭제된 데이터는 복구할 수 없습니다.</li>
              </ul>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm">
                탈퇴를 확인하려면 <strong className="text-red-600">회원탈퇴</strong>를 입력하세요
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="회원탈퇴"
                className="text-center"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setConfirmText('');
                setError(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || confirmText !== '회원탈퇴'}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                '탈퇴하기'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
