'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const isHandling = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // 중복 실행 방지
      if (isHandling.current) return;
      isHandling.current = true;

      const supabase = createClient();
      if (!supabase) {
        router.push('/login');
        return;
      }

      // 쿼리 파라미터 확인 (PKCE 플로우)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const type = urlParams.get('type'); // PKCE에서 type도 쿼리로 올 수 있음

      // PKCE 플로우 처리
      if (code) {
        // PASSWORD_RECOVERY 이벤트 리스너 설정
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY') {
            subscription.unsubscribe();
            router.push('/reset-password');
          }
        });

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('Auth exchange error:', error);
          subscription.unsubscribe();
          router.push('/login?error=auth_failed');
          return;
        }

        // 이벤트가 발생하지 않은 경우를 위해 약간의 대기 후 처리
        // (PASSWORD_RECOVERY 이벤트가 발생하면 위 리스너가 처리)
        setTimeout(() => {
          // 아직 페이지 이동이 안됐으면 기본 동작
          if (window.location.pathname === '/auth/callback') {
            subscription.unsubscribe();
            // recovery 타입이 쿼리에 있으면 비밀번호 재설정
            if (type === 'recovery') {
              router.push('/reset-password');
            } else {
              router.push('/home');
            }
          }
        }, 500);
        return;
      }

      // URL 해시에서 토큰 파싱 (Implicit 플로우)
      const hash = window.location.hash.substring(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const hashType = params.get('type');


        // recovery 타입이면 비밀번호 재설정
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

        // 다른 타입 (signup, magiclink 등)
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

      // 기본 리다이렉트
      router.push('/login');
    };

    handleCallback();
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
