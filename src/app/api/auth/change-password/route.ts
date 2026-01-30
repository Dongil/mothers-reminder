import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validatePassword, PASSWORD_POLICY_MESSAGE } from '@/lib/auth/password-policy';

// POST: 비밀번호 변경 (로그인 상태에서)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // 필수 필드 검증
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요' },
        { status: 400 }
      );
    }

    // 새 비밀번호 정책 검증
    const validation = validatePassword(newPassword);
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

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 현재 비밀번호 검증 (signInWithPassword로 확인)
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json(
        { error: '현재 비밀번호가 일치하지 않습니다' },
        { status: 400 }
      );
    }

    // 비밀번호 변경
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { error: '비밀번호 변경에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '비밀번호가 성공적으로 변경되었습니다',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
