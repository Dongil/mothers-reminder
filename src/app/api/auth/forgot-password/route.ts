import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: 비밀번호 재설정 이메일 발송
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: '이메일을 입력해주세요' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '유효한 이메일 주소를 입력해주세요' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 비밀번호 재설정 이메일 발송
    // auth/callback으로 리다이렉트하여 토큰 처리
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
    });

    if (error) {
      console.error('Reset password email error:', error);
      // 보안을 위해 에러 메시지를 일반화
      return NextResponse.json(
        { error: '비밀번호 재설정 이메일 발송에 실패했습니다' },
        { status: 500 }
      );
    }

    // 보안을 위해 항상 성공 메시지 반환 (이메일 존재 여부 노출 방지)
    return NextResponse.json({
      message: '비밀번호 재설정 링크가 이메일로 발송되었습니다. 이메일을 확인해주세요.',
    });
  } catch (error) {
    console.error('Forgot password POST error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
