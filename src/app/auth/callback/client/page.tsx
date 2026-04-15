'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// 모듈 레벨 락 (React StrictMode의 이중 실행 방지)
let isExchanging = false;

export default function AuthCallbackPage() {
  const router = useRouter();
  const isHandling = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // 이중 실행 방지 (StrictMode + Ref)
      if (isHandling.current || isExchanging) return;
      isHandling.current = true;
      isExchanging = true;

      const supabase = createClient();
      if (!supabase) {
        router.push('/login');
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const type = urlParams.get('type');

      // PKCE 플로우
      if (code) {
        // 이미 세션이 있으면 exchange 건너뛰기 (재방문 시)
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          if (type === 'recovery') {
            router.push('/reset-password');
          } else {
            router.push('/home');
          }
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          // 이미 다른 곳에서 exchange가 성공했을 수 있으니 세션 재확인
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            router.push(type === 'recovery' ? '/reset-password' : '/home');
            return;
          }
          router.push('/login?error=auth_failed');
          return;
        }

        // exchange 성공 → recovery면 reset-password, 아니면 home
        if (type === 'recovery') {
          router.push('/reset-password');
        } else {
          router.push('/home');
        }
        return;
      }

      // URL 해시에서 토큰 파싱 (Implicit 플로우)
      const hash = window.location.hash.substring(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const hashType = params.get('type');

        if (hashType === 'recovery' && accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            console.error('Auth session error:', error);
            router.push('/forgot-password?error=invalid_token');
            return;
          }

          router.push('/reset-password');
          return;
        }

        if (accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (!error) {
            router.push('/home');
            return;
          }
        }
      }

      router.push('/login');
    };

    handleCallback().finally(() => {
      // 페이지 언마운트 시 락 해제
      setTimeout(() => { isExchanging = false; }, 1000);
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">인증 처리 중...</p>
      </div>
    </div>
  );
}
