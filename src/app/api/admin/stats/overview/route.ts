import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

// GET: 대시보드 개요 통계
export async function GET() {
  try {
    // 관리자 권한 확인
    const authResult = await requireAdmin('read');
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const supabase = await createClient();

    // 병렬로 통계 조회
    const [
      usersResult,
      familiesResult,
      messagesResult,
      todayActiveResult,
      ttsUsageResult,
      recentLoginsResult,
    ] = await Promise.all([
      // 전체 사용자 수 (삭제 안된)
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null),

      // 전체 가족 수
      supabase
        .from('family')
        .select('id', { count: 'exact', head: true }),

      // 전체 메시지 수
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true }),

      // 오늘 활성 사용자 수 (활동 로그 기반)
      supabase
        .from('user_activity_logs')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]),

      // 오늘 TTS 사용량
      supabase
        .from('tts_usage_logs')
        .select('text_length')
        .gte('created_at', new Date().toISOString().split('T')[0])
        .eq('status', 'success'),

      // 최근 로그인 시도
      supabase
        .from('login_attempts')
        .select('success')
        .gte('created_at', new Date().toISOString().split('T')[0]),
    ]);

    // TTS 통계 계산
    const ttsLogs = (ttsUsageResult.data || []) as Array<{ text_length: number }>;
    const ttsTotalRequests = ttsLogs.length;
    const ttsTotalChars = ttsLogs.reduce((sum, log) => sum + (log.text_length || 0), 0);

    // 로그인 통계 계산
    const loginLogs = (recentLoginsResult.data || []) as Array<{ success: boolean }>;
    const totalLogins = loginLogs.length;
    const successLogins = loginLogs.filter(l => l.success).length;
    const failedLogins = totalLogins - successLogins;

    return NextResponse.json({
      data: {
        totalUsers: usersResult.count || 0,
        totalFamilies: familiesResult.count || 0,
        totalMessages: messagesResult.count || 0,
        todayActiveUsers: todayActiveResult.count || 0,
        todayStats: {
          ttsRequests: ttsTotalRequests,
          ttsChars: ttsTotalChars,
          logins: {
            total: totalLogins,
            success: successLogins,
            failed: failedLogins,
          },
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin stats overview error:', error);
    return NextResponse.json(
      { error: '통계 조회에 실패했습니다' },
      { status: 500 }
    );
  }
}
