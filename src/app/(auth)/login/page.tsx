'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import type { Gender } from '@/types/database';

type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('서비스 연결에 실패했습니다');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
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
            family_id: null, // 가족 없이 가입
            role: 'member',
          } as never);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error('프로필 생성에 실패했습니다');
        }
      }

      router.push('/home');
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
              <Label htmlFor="registerPassword">비밀번호</Label>
              <Input
                id="registerPassword"
                type="password"
                placeholder="6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
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
