import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_type: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  description: string | null;
  ip_address: string | null;
  created_at: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
}

// GET: 감사 로그 조회
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const actorType = searchParams.get('actorType');
    const action = searchParams.get('action');
    const targetType = searchParams.get('targetType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const supabase = await createClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        actor_id,
        actor_type,
        action,
        target_type,
        target_id,
        description,
        ip_address,
        created_at
      `, { count: 'exact' });

    // 필터 적용
    if (actorType) {
      query = query.eq('actor_type', actorType);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (targetType) {
      query = query.eq('target_type', targetType);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: logs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Audit logs query error:', error);
      return NextResponse.json(
        { error: '감사 로그 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    const typedLogs = (logs || []) as AuditLogRow[];

    // 관련 사용자 정보 조회
    const actorIds = typedLogs.map(l => l.actor_id).filter((id): id is string => id !== null);
    const { data: actors } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', actorIds);

    const typedActors = (actors || []) as UserRow[];
    const actorMap = new Map(typedActors.map(a => [a.id, a]));

    // 결과 조합
    const logsWithActors = typedLogs.map(log => ({
      ...log,
      actor: log.actor_id ? actorMap.get(log.actor_id) || null : null,
    }));

    return NextResponse.json({
      data: logsWithActors,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin audit-logs GET error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
