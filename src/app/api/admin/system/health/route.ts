import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

// GET: 시스템 상태 체크
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

    const healthChecks = {
      database: { status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown', latency: 0 },
      tts: { status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown' },
    };

    // 데이터베이스 연결 체크
    const dbStart = Date.now();
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      healthChecks.database = {
        status: error ? 'unhealthy' : 'healthy',
        latency: Date.now() - dbStart,
      };
    } catch {
      healthChecks.database = {
        status: 'unhealthy',
        latency: Date.now() - dbStart,
      };
    }

    // TTS API 체크 (API 키 존재 여부만)
    healthChecks.tts = {
      status: process.env.GOOGLE_CLOUD_TTS_API_KEY ? 'healthy' : 'unhealthy',
    };

    // 최근 에러 로그 수
    const { count: recentErrors } = await supabase
      .from('tts_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'error')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // 최근 로그인 실패 수
    const { count: recentLoginFailures } = await supabase
      .from('login_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('success', false)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // 전체 상태 결정
    const overallStatus = Object.values(healthChecks).every(c => c.status === 'healthy')
      ? 'healthy'
      : Object.values(healthChecks).some(c => c.status === 'unhealthy')
        ? 'degraded'
        : 'unknown';

    return NextResponse.json({
      data: {
        status: overallStatus,
        checks: healthChecks,
        metrics: {
          recentTtsErrors: recentErrors || 0,
          recentLoginFailures: recentLoginFailures || 0,
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('System health check error:', error);
    return NextResponse.json(
      {
        data: {
          status: 'unhealthy',
          error: '시스템 상태 확인에 실패했습니다',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
