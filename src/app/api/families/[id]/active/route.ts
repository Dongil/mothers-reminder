import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: 활성 가족 변경
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: familyId } = await params;
    const supabase = await createClient();

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 해당 가족의 멤버인지 확인
    const { data: membership } = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('family_id', familyId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: '해당 가족의 멤버가 아닙니다' },
        { status: 403 }
      );
    }

    // 모든 가족을 비활성화
    await supabase
      .from('family_members')
      .update({ is_active: false } as never)
      .eq('user_id', user.id);

    // 선택한 가족을 활성화
    const { error } = await supabase
      .from('family_members')
      .update({ is_active: true } as never)
      .eq('user_id', user.id)
      .eq('family_id', familyId);

    if (error) {
      console.error('Active family update error:', error);
      return NextResponse.json(
        { error: '활성 가족 변경에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Active family POST error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
