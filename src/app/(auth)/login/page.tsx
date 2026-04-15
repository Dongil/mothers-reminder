'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { validatePassword, PASSWORD_POLICY_MESSAGE } from '@/lib/auth/password-policy';
import type { Gender } from '@/types/database';

type AuthMode = 'login' | 'register';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [phone, setPhone] = useState('');

  const supabase = createClient();

  // Supabase 비밀번호 재설정 링크 감지 및 리다이렉트
  useEffect(() => {
    if (!supabase) return;

    // 1. PKCE code 파라미터 처리 (Supabase redirect fallback)
    const code = searchParams.get('code');
    if (code) {
      const handleCode = async () => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY') {
            subscription.unsubscribe();
            router.replace('/reset-password');
          }
        });

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          setTimeout(() => {
            if (window.location.pathname === '/login') {
              subscription.unsubscribe();
              router.replace('/home');
            }
          }, 500);
        } else {
          subscription.unsubscribe();
        }
      };
      handleCode();
      return;
    }

    // 2. URL 해시에서 토큰 확인 (Implicit 플로우)
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken) {
        router.push(`/reset-password?access_token=${accessToken}&refresh_token=${refreshToken || ''}`);
        return;
      }
    }

    // 3. 쿼리 파라미터에서 확인 (일부 Supabase 설정에서 사용)
    const type = searchParams.get('type');
    const tokenHash = searchParams.get('token_hash');
    if (type === 'recovery' && tokenHash) {
      router.push(`/reset-password?token_hash=${tokenHash}&type=recovery`);
    }
  }, [router, searchParams, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('서비스 연결에 실패했습니다');
      return;
    }
    setIsLoading(true);
    setError('');
    setRemainingAttempts(null);

    try {
      // 로그인 시도 제한이 포함된 API 호출
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        throw new Error(data.error || '로그인에 실패했습니다');
      }

      // Supabase 클라이언트 세션 설정 (API에서 이미 인증됨)
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      // 이메일 미인증 시 인증 페이지로 이동
      if (!data.user.emailConfirmed) {
        router.push('/verify-email');
        return;
      }

      router.push('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('서비스 연결에 실패했습니다');
      return;
    }

    // 성별 필수 체크
    if (!gender) {
      setError('성별을 선택해주세요');
      return;
    }

    // 비밀번호 정책 검증
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors.join('\n'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      // 사용자 프로필 생성 (가족 없이)
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            name,
            nickname: nickname || name, // 닉네임 미입력시 이름 사용
            gender,
            phone: phone || null, // 전화번호 (이메일 찾기용)
            family_id: null, // 가족 없이 가입
            role: 'member',
          } as never);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error('프로필 생성에 실패했습니다');
        }
      }

      // 이메일 인증 페이지로 이동
      router.push('/verify-email');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-6">
      {/* 로고 */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">가족 메시지 보드</h1>
        <p className="text-gray-500 mt-2">어머니께 메시지를 전달하세요</p>
      </div>

      {/* 폼 카드 */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        {/* 탭 */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-700'
            }`}
            onClick={() => setMode('login')}
          >
            로그인
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-700'
            }`}
            onClick={() => setMode('register')}
          >
            회원가입
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 로그인 폼 */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>

            {/* 비밀번호 찾기 / 이메일 찾기 링크 */}
            <div className="flex justify-center gap-4 text-sm">
              <Link href="/forgot-password" className="text-blue-600 hover:underline">
                비밀번호 찾기
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/find-email" className="text-blue-600 hover:underline">
                이메일 찾기
              </Link>
            </div>
          </form>
        )}

        {/* 회원가입 폼 */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="메시지에 표시될 이름 (선택)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                비워두면 이름이 사용됩니다
              </p>
            </div>

            <div className="space-y-2">
              <Label>성별</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  className={`flex-1 py-3 rounded-lg border-2 text-center font-medium transition-colors ${
                    gender === 'male'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setGender('male')}
                >
                  <span className="text-xl mr-2">👨</span>
                  남
                </button>
                <button
                  type="button"
                  className={`flex-1 py-3 rounded-lg border-2 text-center font-medium transition-colors ${
                    gender === 'female'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setGender('female')}
                >
                  <span className="text-xl mr-2">👩</span>
                  여
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registerEmail">이메일</Label>
              <Input
                id="registerEmail"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registerPhone">전화번호 (선택)</Label>
              <Input
                id="registerPhone"
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                이메일 분실 시 찾기에 사용됩니다
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registerPassword">비밀번호</Label>
              <Input
                id="registerPassword"
                type="password"
                placeholder="8자 이상, 영문+숫자"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500">
                {PASSWORD_POLICY_MESSAGE}
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '가입 중...' : '회원가입'}
            </Button>

            <p className="text-xs text-center text-gray-500">
              가입 후 설정에서 가족을 만들거나 참여할 수 있습니다
            </p>
          </form>
        )}
      </div>

      {/* 하단 안내 */}
      <p className="mt-6 text-sm text-gray-400">
        어머니 태블릿은 /display 페이지로 접속하세요
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
