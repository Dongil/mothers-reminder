'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AuthListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    // Supabase 인증 이벤트 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('[Auth Event]', event);

      // PASSWORD_RECOVERY 이벤트 감지 시 비밀번호 재설정 페이지로 이동
      if (event === 'PASSWORD_RECOVERY') {
        // 이미 reset-password 페이지에 있으면 무시
        if (pathname !== '/reset-password') {
          router.push('/reset-password');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  return null;
}
