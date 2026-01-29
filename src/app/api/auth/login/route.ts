import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkLoginRateLimit, recordLoginAttempt } from '@/lib/auth/rate-limit';

interface UserData {
  deleted_at: string | null;
  deletion_requested_at: string | null;
}

// POST: 로그인 (시도 제한 포함)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요' },
        { status: 400 }
      );
    }

    // 요청 정보 추출
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      null;
    const userAgent = request.headers.get('user-agent') || null;

    // 로그인 시도 제한 체크
    const rateLimit = await checkLoginRateLimit(email);

    if (rateLimit.isLocked) {
      const lockoutTime = rateLimit.lockoutUntil
        ? new Date(rateLimit.lockoutUntil).toLocaleString('ko-KR')
        : '잠시 후';

      return NextResponse.json(
        {
          error: `로그인 시도 횟수를 초과했습니다. ${lockoutTime}까지 잠금됩니다.`,
          isLocked: true,
          lockoutUntil: rateLimit.lockoutUntil,
        },
        { status: 429 }
      );
    }

    const supabase = await createClient();

    // 계정 삭제 여부 확인
    const { data: userData } = await supabase
      .from('users')
      .select('deleted_at, deletion_requested_at')
      .eq('email', email)
      .single();

    const typedUserData = userData as UserData | null;

    if (typedUserData?.deleted_at) {
      await recordLoginAttempt(email, false, ipAddress, 'account_deleted', userAgent);
      return NextResponse.json(
        { error: '삭제된 계정입니다' },
        { status: 401 }
      );
    }

    // 삭제 요청 중인 계정은 로그인 허용하고 안내
    const isDeletionPending = typedUserData?.deletion_requested_at && !typedUserData?.deleted_at;

    // 로그인 시도
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 실패 기록
      await recordLoginAttempt(email, false, ipAddress, error.message, userAgent);

      const newRemainingAttempts = rateLimit.remainingAttempts - 1;
      const warningMessage = newRemainingAttempts > 0
        ? ` (남은 시도: ${newRemainingAttempts}회)`
        : '';

      return NextResponse.json(
        {
          error: `이메일 또는 비밀번호가 올바르지 않습니다${warningMessage}`,
          remainingAttempts: newRemainingAttempts,
        },
        { status: 401 }
      );
    }

    // 성공 기록
    await recordLoginAttempt(email, true, ipAddress, null, userAgent);

    // 이메일 인증 여부 확인
    const emailConfirmed = !!data.user?.email_confirmed_at;

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed,
      },
      isDeletionPending,
      message: isDeletionPending
        ? '회원 탈퇴가 진행 중입니다. 탈퇴를 취소하시려면 계정 설정에서 취소해주세요.'
        : undefined,
    });
  } catch (error) {
    console.error('Login POST error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
