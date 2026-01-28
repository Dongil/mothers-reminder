import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 쿼리 결과 타입
interface FamilyMemberResult {
  id: string;
  role: string;
  is_active: boolean;
  joined_at: string;
  family: {
    id: string;
    name: string;
    code: string;
    created_by: string;
    created_at: string;
  } | null;
}

interface AdminQueryResult {
  family_id: string;
  user: {
    name: string;
    nickname: string | null;
  } | null;
}

// 랜덤 가족 코드 생성
function generateFamilyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET: 내 가족 목록 조회
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

    // family_members를 통해 가족 목록 조회
    const { data, error } = await supabase
      .from('family_members')
      .select(`
        id,
        role,
        is_active,
        joined_at,
        family:family_id (
          id,
          name,
          code,
          created_by,
          created_at
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Families fetch error:', error);
      return NextResponse.json(
        { error: '가족 목록을 불러오는데 실패했습니다' },
        { status: 500 }
      );
    }

    const memberships = (data || []) as unknown as FamilyMemberResult[];

    // 각 가족의 관리자 정보 가져오기
    const familyIds = memberships
      .map(d => d.family?.id)
      .filter(Boolean) as string[];

    let adminMap: Record<string, { name: string; nickname: string | null }> = {};

    if (familyIds.length > 0) {
      const { data: adminData } = await supabase
        .from('family_members')
        .select(`
          family_id,
          user:user_id (
            name,
            nickname
          )
        `)
        .in('family_id', familyIds)
        .eq('role', 'admin');

      if (adminData) {
        const admins = adminData as unknown as AdminQueryResult[];
        admins.forEach((item) => {
          if (item.user) {
            adminMap[item.family_id] = {
              name: item.user.name,
              nickname: item.user.nickname,
            };
          }
        });
      }
    }

    // 관리자 정보를 포함한 결과 반환
    const enrichedData = memberships.map(item => ({
      ...item,
      admin: item.family ? adminMap[item.family.id] || null : null,
    }));

    return NextResponse.json({ data: enrichedData });
  } catch (error) {
    console.error('Families GET error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// POST: 새 가족 생성
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // 필수 필드 검증
    if (!body.name) {
      return NextResponse.json(
        { error: '가족 이름은 필수입니다' },
        { status: 400 }
      );
    }

    // 가족 코드 생성 (중복 체크 포함)
    let familyCode = generateFamilyCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('family')
        .select('id')
        .eq('code', familyCode)
        .single();

      if (!existing) break;
      familyCode = generateFamilyCode();
      attempts++;
    }

    // 가족 생성
    const { data: newFamily, error: familyError } = await supabase
      .from('family')
      .insert({
        name: body.name,
        code: familyCode,
        created_by: user.id,
      } as never)
      .select()
      .single();

    if (familyError) {
      console.error('Family creation error:', familyError);
      return NextResponse.json(
        { error: '가족 생성에 실패했습니다' },
        { status: 500 }
      );
    }

    const family = newFamily as { id: string; name: string; code: string };

    // 생성자를 family_members에 admin으로 추가
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({
        user_id: user.id,
        family_id: family.id,
        role: 'admin',
        is_active: true,
      } as never);

    if (memberError) {
      console.error('Family member creation error:', memberError);
      // 가족은 생성됐지만 멤버 추가 실패 - 가족 삭제
      await supabase.from('family').delete().eq('id', family.id);
      return NextResponse.json(
        { error: '가족 멤버 추가에 실패했습니다' },
        { status: 500 }
      );
    }

    // 기존 활성 가족 비활성화
    await supabase
      .from('family_members')
      .update({ is_active: false } as never)
      .eq('user_id', user.id)
      .neq('family_id', family.id);

    return NextResponse.json({ data: newFamily }, { status: 201 });
  } catch (error) {
    console.error('Families POST error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
