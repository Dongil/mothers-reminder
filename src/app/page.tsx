'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const LAST_PAGE_KEY = 'mothers-reminder-last-page';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const supabase = createClient();
      if (!supabase) {
        router.replace('/login');
        return;
      }

      // 1. PKCE code 파라미터 처리 (Supabase redirect fallback)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        // PASSWORD_RECOVERY 이벤트 감지 리스너
        const { data: { subscription: recoverySub } } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY') {
            recoverySub.unsubscribe();
            router.replace('/reset-password');
          }
        });

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          // 이벤트 발생 대기 후 처리
          setTimeout(() => {
            if (window.location.pathname === '/') {
              recoverySub.unsubscribe();
              router.replace('/home');
            }
          }, 500);
          return;
        }
        recoverySub.unsubscribe();
      }

      // 2. URL 해시에서 recovery 타입 확인 (Implicit 플로우)
      const hash = window.location.hash.substring(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const type = params.get('type');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        // recovery 타입이면 세션 설정 후 비밀번호 재설정 페이지로 이동
        if (type === 'recovery' && accessToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          router.replace('/reset-password');
          return;
        }
      }

      // 3. 인증 이벤트 리스너 설정 (PASSWORD_RECOVERY 감지)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          router.replace('/reset-password');
        }
      });

      // 4. 인증 상태 확인
      const { data: { session } } = await supabase.auth.getSession();

      // 로그인 안 되어 있으면 /login으로
      if (!session) {
        subscription.unsubscribe();
        router.replace('/login');
        return;
      }

      // 4. localStorage에서 마지막 방문 페이지 확인
      const lastPage = localStorage.getItem(LAST_PAGE_KEY);

      if (lastPage && (lastPage === '/home' || lastPage === '/display')) {
        subscription.unsubscribe();
        router.replace(lastPage);
        return;
      }

      // 5. 화면 크기로 기기 타입 감지 (768px 이상이면 태블릿)
      const isTablet = window.innerWidth >= 768;

      subscription.unsubscribe();
      if (isTablet) {
        router.replace('/display');
      } else {
        router.replace('/home');
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // 로딩 중 표시
  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-6xl mb-4">💬</div>
        <p className="text-2xl font-medium">잠시만 기다려주세요...</p>
      </div>
    </div>
  );
}
