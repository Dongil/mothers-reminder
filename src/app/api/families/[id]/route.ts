import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 특정 가족 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 가족 정보 조회
    const { data, error } = await supabase
      .from('family')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Family fetch error:', error);
      return NextResponse.json(
        { error: '가족 정보를 불러오는데 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Family GET error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// PATCH: 가족 정보 수정
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 가족 생성자인지 확인
    const { data: familyData } = await supabase
      .from('family')
      .select('created_by')
      .eq('id', id)
      .single();

    const family = familyData as { created_by: string | null } | null;
    if (!family || family.created_by !== user.id) {
      return NextResponse.json(
        { error: '가족 수정 권한이 없습니다' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // 수정 가능한 필드만 추출
    const updateData: { name?: string } = {};
    if (body.name) updateData.name = body.name;

    const { data, error } = await supabase
      .from('family')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Family update error:', error);
      return NextResponse.json(
        { error: '가족 수정에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Family PATCH error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// DELETE: 가족 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 가족 생성자인지 확인
    const { data: familyData2 } = await supabase
      .from('family')
      .select('created_by')
      .eq('id', id)
      .single();

    const family2 = familyData2 as { created_by: string | null } | null;
    if (!family2 || family2.created_by !== user.id) {
      return NextResponse.json(
        { error: '가족 삭제 권한이 없습니다' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('family')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Family delete error:', error);
      return NextResponse.json(
        { error: '가족 삭제에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Family DELETE error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
