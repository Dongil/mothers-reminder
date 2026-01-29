import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validatePassword, PASSWORD_POLICY_MESSAGE } from '@/lib/auth/password-policy';

// POST: 비밀번호 재설정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: '새 비밀번호를 입력해주세요' },
        { status: 400 }
      );
    }

    // 비밀번호 정책 검증
    const validation = validatePassword(password);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.errors[0],
          errors: validation.errors,
          policyMessage: PASSWORD_POLICY_MESSAGE,
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 인증 확인 (재설정 링크 클릭 후 세션이 설정됨)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 재설정 링크입니다. 다시 시도해주세요.' },
        { status: 401 }
      );
    }

    // 비밀번호 업데이트
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error('Update password error:', error);
      return NextResponse.json(
        { error: '비밀번호 변경에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.',
    });
  } catch (error) {
    console.error('Reset password POST error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
