import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: 인증 이메일 재발송
export async function POST() {
  try {
    const supabase = await createClient();

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 이미 인증된 경우
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: '이미 이메일 인증이 완료되었습니다' },
        { status: 400 }
      );
    }

    // 인증 이메일 재발송
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
    });

    if (error) {
      console.error('Resend verification email error:', error);
      return NextResponse.json(
        { error: '인증 이메일 발송에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '인증 이메일이 발송되었습니다. 이메일을 확인해주세요.',
    });
  } catch (error) {
    console.error('Verify email POST error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// GET: 이메일 인증 상태 확인
export async function GET() {
  try {
    const supabase = await createClient();

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      email: user.email,
      emailConfirmed: !!user.email_confirmed_at,
      emailConfirmedAt: user.email_confirmed_at,
    });
  } catch (error) {
    console.error('Verify email GET error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
