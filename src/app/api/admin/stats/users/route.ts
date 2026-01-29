import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

interface UserRow {
  id: string;
  name: string;
  email: string;
  nickname: string | null;
  created_at: string;
  deleted_at: string | null;
  deletion_requested_at: string | null;
}

// GET: 사용자별 통계
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
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const supabase = await createClient();

    // 사용자 목록 조회
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        nickname,
        created_at,
        deleted_at,
        deletion_requested_at
      `, { count: 'exact' })
      .is('deleted_at', null)
      .range(offset, offset + limit - 1);

    // 정렬 적용
    if (sortBy && ['name', 'email', 'created_at'].includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Users query error:', error);
      return NextResponse.json(
        { error: '사용자 목록 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    const typedUsers = (users || []) as UserRow[];
    const userIds = typedUsers.map(u => u.id);

    // 사용자별 메시지 수
    const { data: messageCounts } = await supabase
      .from('messages')
      .select('author_id')
      .in('author_id', userIds);

    // 사용자별 TTS 사용량
    const { data: ttsUsages } = await supabase
      .from('tts_usage_logs')
      .select('user_id, text_length')
      .in('user_id', userIds)
      .eq('status', 'success');

    // 통계 집계
    const messageCountMap = new Map<string, number>();
    (messageCounts as Array<{ author_id: string }> || []).forEach(m => {
      messageCountMap.set(m.author_id, (messageCountMap.get(m.author_id) || 0) + 1);
    });

    const ttsUsageMap = new Map<string, { count: number; chars: number }>();
    (ttsUsages as Array<{ user_id: string; text_length: number }> || []).forEach(t => {
      const current = ttsUsageMap.get(t.user_id) || { count: 0, chars: 0 };
      ttsUsageMap.set(t.user_id, {
        count: current.count + 1,
        chars: current.chars + (t.text_length || 0),
      });
    });

    // 결과 조합
    const usersWithStats = typedUsers.map(user => ({
      ...user,
      stats: {
        messageCount: messageCountMap.get(user.id) || 0,
        ttsCount: ttsUsageMap.get(user.id)?.count || 0,
        ttsChars: ttsUsageMap.get(user.id)?.chars || 0,
      },
    }));

    return NextResponse.json({
      data: usersWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin stats users error:', error);
    return NextResponse.json(
      { error: '사용자 통계 조회에 실패했습니다' },
      { status: 500 }
    );
  }
}
