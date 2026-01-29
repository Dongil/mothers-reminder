'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function FindEmailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    found: boolean;
    maskedEmail?: string;
    message: string;
    registeredAt?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/auth/find-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이메일 찾기에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    // 전화번호 형식으로 변환
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">이메일 찾기</h1>
          <p className="text-gray-500 text-sm">
            회원가입 시 등록한 전화번호로<br />
            가입한 이메일을 찾을 수 있습니다.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className={`mb-4 p-4 rounded-lg ${result.found ? 'bg-green-50' : 'bg-yellow-50'}`}>
            {result.found ? (
              <div className="text-center">
                <Mail className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium mb-1">가입된 이메일을 찾았습니다</p>
                <p className="text-green-700 text-lg font-bold">{result.maskedEmail}</p>
                {result.registeredAt && (
                  <p className="text-green-600 text-sm mt-2">
                    가입일: {new Date(result.registeredAt).toLocaleDateString('ko-KR')}
                  </p>
                )}
                <Link href="/login" className="mt-4 inline-block">
                  <Button variant="primary" size="sm">
                    로그인하러 가기
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-yellow-800">{result.message}</p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">전화번호</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              회원가입 시 등록한 전화번호를 입력해주세요
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? '찾는 중...' : '이메일 찾기'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex justify-center gap-4 text-sm">
            <Link href="/login" className="text-blue-600 hover:underline inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              로그인
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/forgot-password" className="text-blue-600 hover:underline">
              비밀번호 찾기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
