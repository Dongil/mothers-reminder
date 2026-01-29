import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface UserRow {
  email: string;
  created_at: string;
}

// POST: 전화번호로 이메일 찾기
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: '전화번호를 입력해주세요' },
        { status: 400 }
      );
    }

    // 전화번호 정규화 (숫자만 추출)
    const normalizedPhone = phone.replace(/[^0-9]/g, '');

    if (normalizedPhone.length < 10) {
      return NextResponse.json(
        { error: '유효한 전화번호를 입력해주세요' },
        { status: 400 }
      );
    }

    // 전화번호로 사용자 검색 (삭제되지 않은 사용자만)
    const { data: users, error } = await supabase
      .from('users')
      .select('email, created_at')
      .or(`phone.eq.${normalizedPhone},phone.eq.${phone}`)
      .is('deleted_at', null)
      .limit(1);

    if (error) {
      console.error('Find email error:', error);
      return NextResponse.json(
        { error: '이메일 찾기에 실패했습니다' },
        { status: 500 }
      );
    }

    const typedUsers = (users || []) as UserRow[];

    if (typedUsers.length === 0) {
      // 보안을 위해 존재 여부를 직접 알려주지 않음
      return NextResponse.json({
        found: false,
        message: '해당 전화번호로 가입된 계정을 찾을 수 없습니다',
      });
    }

    const user = typedUsers[0];
    // 이메일 일부 마스킹 (예: te****@example.com)
    const email = user.email;
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.length > 2
      ? localPart.substring(0, 2) + '*'.repeat(Math.min(localPart.length - 2, 4))
      : localPart;
    const maskedEmail = `${maskedLocal}@${domain}`;

    return NextResponse.json({
      found: true,
      maskedEmail,
      message: '가입된 이메일을 찾았습니다',
      registeredAt: user.created_at,
    });
  } catch (error) {
    console.error('Find email POST error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
