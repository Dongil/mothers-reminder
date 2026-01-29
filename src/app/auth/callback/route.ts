import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Supabase Auth 콜백 처리
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const tokenHash = searchParams.get('token_hash');
  const next = searchParams.get('next') ?? '/home';

  // Recovery 타입이면 비밀번호 재설정 페이지로
  if (type === 'recovery') {
    // token_hash가 있으면 전달
    if (tokenHash) {
      return NextResponse.redirect(`${origin}/reset-password?token_hash=${tokenHash}&type=recovery`);
    }
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  // PKCE 코드가 있으면 세션 교환
  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // 기본적으로 홈으로 리다이렉트
  return NextResponse.redirect(`${origin}/home`);
}
