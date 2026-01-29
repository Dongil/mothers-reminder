'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const supabase = createClient();

  // 현재 사용자 이메일 및 인증 상태 확인
  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || null);

      // 이미 인증된 경우
      if (user.email_confirmed_at) {
        setIsVerified(true);
      }
    };

    checkUser();

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' && session?.user?.email_confirmed_at) {
        setIsVerified(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const handleResendEmail = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이메일 발송에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    router.push('/home');
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">이메일 인증 완료</h1>
          <p className="text-gray-500 mb-6">
            이메일 인증이 완료되었습니다.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleContinue}
          >
            시작하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">이메일 인증</h1>
        <p className="text-gray-500 mb-2">
          {email ? (
            <>
              <span className="font-medium text-gray-900">{email}</span>로<br />
              인증 이메일을 발송했습니다.
            </>
          ) : (
            '이메일로 인증 링크를 발송했습니다.'
          )}
        </p>
        <p className="text-sm text-gray-400 mb-6">
          이메일을 확인하고 인증 링크를 클릭해주세요.
        </p>

        {message && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleResendEmail}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                발송 중...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                인증 이메일 재발송
              </>
            )}
          </Button>

          <p className="text-xs text-gray-400">
            이메일이 도착하지 않으면 스팸 폴더를 확인해주세요
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
