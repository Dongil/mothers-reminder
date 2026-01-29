import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

interface FamilyRow {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

// GET: 가족별 통계
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

    const supabase = await createClient();

    // 가족 목록 조회
    const offset = (page - 1) * limit;

    const { data: families, error, count } = await supabase
      .from('family')
      .select('id, name, code, created_at', { count: 'exact' })
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

    // 가족별 멤버 수
    const { data: memberCounts } = await supabase
      .from('family_members')
      .select('family_id')
      .in('family_id', familyIds);

    // 가족별 메시지 수
    const { data: messageCounts } = await supabase
      .from('messages')
      .select('family_id')
      .in('family_id', familyIds);

    // 가족별 TTS 사용량
    const { data: ttsUsages } = await supabase
      .from('tts_usage_logs')
      .select('family_id, text_length')
      .in('family_id', familyIds)
      .eq('status', 'success');

    // 통계 집계
    const memberCountMap = new Map<string, number>();
    (memberCounts as Array<{ family_id: string }> || []).forEach(m => {
      memberCountMap.set(m.family_id, (memberCountMap.get(m.family_id) || 0) + 1);
    });

    const messageCountMap = new Map<string, number>();
    (messageCounts as Array<{ family_id: string }> || []).forEach(m => {
      messageCountMap.set(m.family_id, (messageCountMap.get(m.family_id) || 0) + 1);
    });

    const ttsUsageMap = new Map<string, { count: number; chars: number }>();
    (ttsUsages as Array<{ family_id: string | null; text_length: number }> || []).forEach(t => {
      if (!t.family_id) return;
      const current = ttsUsageMap.get(t.family_id) || { count: 0, chars: 0 };
      ttsUsageMap.set(t.family_id, {
        count: current.count + 1,
        chars: current.chars + (t.text_length || 0),
      });
    });

    // 결과 조합
    const familiesWithStats = typedFamilies.map(family => ({
      ...family,
      stats: {
        memberCount: memberCountMap.get(family.id) || 0,
        messageCount: messageCountMap.get(family.id) || 0,
        ttsCount: ttsUsageMap.get(family.id)?.count || 0,
        ttsChars: ttsUsageMap.get(family.id)?.chars || 0,
      },
    }));

    return NextResponse.json({
      data: familiesWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin stats families error:', error);
    return NextResponse.json(
      { error: '가족 통계 조회에 실패했습니다' },
      { status: 500 }
    );
  }
}
