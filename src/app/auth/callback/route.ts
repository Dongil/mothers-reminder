import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/home';

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth exchange error:', error.message);
      // 에러 시 로그인 페이지로
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }

    // recovery 타입이면 비밀번호 재설정 페이지로
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/reset-password', request.url));
    }

    // 성공 시 지정된 페이지로
    return NextResponse.redirect(new URL(next, request.url));
  }

  // code가 없으면 클라이언트 페이지로 fallback (해시 파라미터 처리)
  return NextResponse.redirect(new URL('/auth/callback/client', request.url));
}
