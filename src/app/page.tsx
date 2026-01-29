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

      // 1. URL 해시에서 recovery 타입 확인 (비밀번호 재설정 플로우)
      const hash = window.location.hash.substring(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const type = params.get('type');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        // recovery 타입이면 세션 설정 후 비밀번호 재설정 페이지로 이동
        if (type === 'recovery' && accessToken) {
          console.log('[Recovery Flow] Detected recovery type in hash');
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          router.replace('/reset-password');
          return;
        }
      }

      // 2. 인증 이벤트 리스너 설정 (PASSWORD_RECOVERY 감지)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        console.log('[Auth Event on Root]', event);
        if (event === 'PASSWORD_RECOVERY') {
          router.replace('/reset-password');
        }
      });

      // 3. 인증 상태 확인
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
