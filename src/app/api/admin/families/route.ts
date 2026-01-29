import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

interface FamilyRow {
  id: string;
  name: string;
  code: string;
  created_by: string | null;
  created_at: string;
}

// GET: 가족 목록
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await requireAdmin('read');
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const supabase = await createClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('family')
      .select('id, name, code, created_by, created_at', { count: 'exact' });

    // 검색 필터
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const { data: families, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Families query error:', error);
      return NextResponse.json(
        { error: '가족 목록 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    const typedFamilies = (families || []) as FamilyRow[];
    const familyIds = typedFamilies.map(f => f.id);

    // 가족별 멤버 수 조회
    const { data: members } = await supabase
      .from('family_members')
      .select('family_id')
      .in('family_id', familyIds);

    const memberCountMap = new Map<string, number>();
    (members as Array<{ family_id: string }> || []).forEach(m => {
      memberCountMap.set(m.family_id, (memberCountMap.get(m.family_id) || 0) + 1);
    });

    // 결과 조합
    const familiesWithCount = typedFamilies.map(family => ({
      ...family,
      memberCount: memberCountMap.get(family.id) || 0,
    }));

    return NextResponse.json({
      data: familiesWithCount,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin families GET error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
