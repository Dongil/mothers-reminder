import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

interface AdminData {
  permissions: string[];
}

interface UserData {
  deleted_at: string | null;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 사용자 세션 갱신
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 관리자 경로 보호 (/admin/*)
  if (pathname.startsWith('/admin')) {
    // 로그인 안된 경우
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 시스템 관리자 권한 확인 (maybeSingle 사용 - 결과 없어도 에러 아님)
    const { data: adminData, error: adminError } = await supabase
      .from('system_admins')
      .select('permissions')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminError) {
      console.error('[Admin Check] Query error:', adminError.code, adminError.message);
    }

    if (!adminData) {
      // 관리자가 아닌 경우 홈으로 리디렉트
      return NextResponse.redirect(new URL('/home', request.url));
    }

    const typedAdminData = adminData as AdminData;
    // 권한 정보를 헤더에 추가 (API에서 사용 가능)
    supabaseResponse.headers.set('x-admin-permissions', JSON.stringify(typedAdminData.permissions));
  }

  // 삭제된 계정 체크 (API 요청 제외)
  if (user && !pathname.startsWith('/api/')) {
    const { data: userData } = await supabase
      .from('users')
      .select('deleted_at')
      .eq('id', user.id)
      .single();

    const typedUserData = userData as UserData | null;

    if (typedUserData?.deleted_at) {
      // 삭제된 계정은 로그아웃 처리
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return supabaseResponse;
}
