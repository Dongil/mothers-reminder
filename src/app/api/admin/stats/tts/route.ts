import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

interface TtsLog {
  created_at: string;
  text_length: number;
  voice: string;
  status: string;
}

// GET: TTS 사용 통계
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
    const days = parseInt(searchParams.get('days') || '7');

    const supabase = await createClient();

    // 기간 설정
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // TTS 사용 로그 조회
    const { data, error } = await supabase
      .from('tts_usage_logs')
      .select('created_at, text_length, voice, status')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('TTS logs query error:', error);
      return NextResponse.json(
        { error: 'TTS 통계 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    const ttsLogs = (data || []) as TtsLog[];

    // 일별 집계
    const dailyStats = new Map<string, {
      date: string;
      requests: number;
      successRequests: number;
      totalChars: number;
    }>();

    ttsLogs.forEach(log => {
      const date = log.created_at.split('T')[0];
      const current = dailyStats.get(date) || {
        date,
        requests: 0,
        successRequests: 0,
        totalChars: 0,
      };

      current.requests++;
      if (log.status === 'success') {
        current.successRequests++;
        current.totalChars += log.text_length || 0;
      }

      dailyStats.set(date, current);
    });

    // 음성별 사용량
    const voiceStats = new Map<string, number>();
    ttsLogs.filter(l => l.status === 'success').forEach(log => {
      voiceStats.set(log.voice, (voiceStats.get(log.voice) || 0) + 1);
    });

    // 전체 통계
    const successLogs = ttsLogs.filter(l => l.status === 'success');
    const totalStats = {
      totalRequests: ttsLogs.length,
      successRequests: successLogs.length,
      errorRequests: ttsLogs.length - successLogs.length,
      totalChars: successLogs.reduce((sum, l) => sum + (l.text_length || 0), 0),
      avgCharsPerRequest: successLogs.length > 0
        ? Math.round(successLogs.reduce((sum, l) => sum + (l.text_length || 0), 0) / successLogs.length)
        : 0,
    };

    return NextResponse.json({
      data: {
        period: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
          days,
        },
        total: totalStats,
        daily: Array.from(dailyStats.values()),
        byVoice: Object.fromEntries(voiceStats),
      },
    });
  } catch (error) {
    console.error('Admin stats TTS error:', error);
    return NextResponse.json(
      { error: 'TTS 통계 조회에 실패했습니다' },
      { status: 500 }
    );
  }
}
