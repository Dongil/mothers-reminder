import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: 가족 이름으로 검색
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    if (!name || name.trim().length < 1) {
      return NextResponse.json(
        { error: '검색어를 입력해주세요' },
        { status: 400 }
      );
    }

    // 가족 이름으로 검색 (부분 일치)
    const { data: familiesData, error } = await supabase
      .from('family')
      .select('id, name, code, created_at')
      .ilike('name', `%${name.trim()}%`)
      .limit(10);

    if (error) {
      console.error('Family search error:', error);
      return NextResponse.json(
        { error: '검색 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    const families = familiesData as { id: string; name: string; code: string; created_at: string }[];

    if (!families || families.length === 0) {
      return NextResponse.json({
        data: []
      });
    }

    // 각 가족에 대해 멤버십/요청 상태 확인
    const familyIds = families.map(f => f.id);

    // 이미 멤버인 가족 확인
    const { data: memberData } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .in('family_id', familyIds);

    const members = (memberData || []) as { family_id: string }[];
    const memberFamilyIds = new Set(members.map(m => m.family_id));

    // 이미 요청 중인 가족 확인
    const { data: requestData } = await supabase
      .from('family_join_requests')
      .select('family_id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .in('family_id', familyIds);

    const requests = (requestData || []) as { family_id: string }[];
    const pendingFamilyIds = new Set(requests.map(r => r.family_id));

    // 관리자 정보 가져오기
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

    const adminMap: Record<string, { name: string; nickname: string | null }> = {};
    if (adminData) {
      (adminData as unknown as { family_id: string; user: { name: string; nickname: string | null } | null }[]).forEach((item) => {
        if (item.user) {
          adminMap[item.family_id] = {
            name: item.user.name,
            nickname: item.user.nickname,
          };
        }
      });
    }

    // 모든 멤버 정보 가져오기
    const { data: allMembersData } = await supabase
      .from('family_members')
      .select(`
        family_id,
        user:user_id (
          id,
          name,
          nickname
        )
      `)
      .in('family_id', familyIds);

    const membersMap: Record<string, Array<{ id: string; name: string; nickname: string | null }>> = {};
    if (allMembersData) {
      (allMembersData as unknown as { family_id: string; user: { id: string; name: string; nickname: string | null } | null }[]).forEach((item) => {
        if (item.user) {
          if (!membersMap[item.family_id]) {
            membersMap[item.family_id] = [];
          }
          membersMap[item.family_id].push({
            id: item.user.id,
            name: item.user.name,
            nickname: item.user.nickname,
          });
        }
      });
    }

    // 결과 조합
    const results = families.map(family => ({
      ...family,
      is_member: memberFamilyIds.has(family.id),
      has_pending_request: pendingFamilyIds.has(family.id),
      admin: adminMap[family.id] || null,
      members: membersMap[family.id] || [],
    }));

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('Family search error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
