'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('유효한 이메일 주소를 입력해주세요');
      }

      const supabase = createClient();
      if (!supabase) {
        throw new Error('인증 시스템 초기화 실패');
      }

      // 클라이언트에서 직접 호출 (PKCE code_verifier가 cookie에 저장됨)
      // 보안: 결과와 무관하게 항상 성공으로 처리 (이메일 존재 여부 노출 방지)
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback/client?type=recovery`,
      });

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">이메일 발송 완료</h1>
          <p className="text-gray-500 mb-2">
            <span className="font-medium text-gray-900">{email}</span>로<br />
            비밀번호 재설정 링크를 발송했습니다.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            이메일을 확인하고 링크를 클릭해주세요.<br />
            이메일이 도착하지 않으면 스팸 폴더를 확인해주세요.
          </p>

          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              로그인 페이지로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">비밀번호 찾기</h1>
          <p className="text-gray-500 text-sm">
            가입한 이메일 주소를 입력하시면<br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? '발송 중...' : '재설정 링크 받기'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <Link href="/login" className="text-sm text-blue-600 hover:underline inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
