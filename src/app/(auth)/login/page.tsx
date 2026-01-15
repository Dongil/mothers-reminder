'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

type AuthMode = 'login' | 'register';
type RegisterMode = 'join' | 'create';

// 랜덤 가족 코드 생성
function generateFamilyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [registerMode, setRegisterMode] = useState<RegisterMode>('join');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [familyName, setFamilyName] = useState('');

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setIsLoading(true);
    setError('');

    try {
      let familyId: string;

      if (registerMode === 'join') {
        // 기존 가족 참여
        const { data: familyData, error: familyError } = await supabase
          .from('family')
          .select('*')
          .eq('code', familyCode)
          .single();

        const family = familyData as unknown as { id: string } | null;
        if (familyError || !family) {
          throw new Error('유효하지 않은 가족 코드입니다');
        }
        familyId = family.id;
      } else {
        // 새 가족 만들기
        const newCode = generateFamilyCode();
        const { data: newFamily, error: createError } = await supabase
          .from('family')
          .insert({
            name: familyName,
            code: newCode,
          } as never)
          .select()
          .single();

        if (createError) {
          console.error('Family creation error:', createError);
          throw new Error(`가족 생성 실패: ${createError.message}`);
        }
        if (!newFamily) {
          throw new Error('가족 생성에 실패했습니다 (데이터 없음)');
        }
        familyId = (newFamily as unknown as { id: string }).id;
        // 생성된 코드를 상태에 저장 (나중에 표시용)
        setFamilyCode(newCode);
      }

      // 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      // 사용자 프로필 생성
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            name,
            family_id: familyId,
            role: registerMode === 'create' ? 'admin' : 'member',
          } as never);

        if (profileError) {
          console.error('Profile creation error:', profileError);
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
                : 'text-gray-500'
            }`}
            onClick={() => setMode('login')}
          >
            로그인
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500'
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
            {/* 가입 모드 선택 */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  registerMode === 'create'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500'
                }`}
                onClick={() => setRegisterMode('create')}
              >
                새 가족 만들기
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  registerMode === 'join'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500'
                }`}
                onClick={() => setRegisterMode('join')}
              >
                가족 참여하기
              </button>
            </div>

            {/* 새 가족 만들기 */}
            {registerMode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="familyName" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  가족 이름
                </Label>
                <Input
                  id="familyName"
                  type="text"
                  placeholder="예: 김씨 가족"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  가입 후 가족 코드가 생성됩니다
                </p>
              </div>
            )}

            {/* 기존 가족 참여 */}
            {registerMode === 'join' && (
              <div className="space-y-2">
                <Label htmlFor="familyCode" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  가족 코드
                </Label>
                <Input
                  id="familyCode"
                  type="text"
                  placeholder="가족 코드를 입력하세요"
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  가족에게 받은 초대 코드를 입력하세요
                </p>
              </div>
            )}

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
              {isLoading ? '가입 중...' : registerMode === 'create' ? '가족 만들고 가입' : '가입하기'}
            </Button>
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
