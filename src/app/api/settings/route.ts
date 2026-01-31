import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: 설정 조회
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

    // 설정 조회
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116: No rows found - 이 경우는 기본 설정 반환
      console.error('Settings fetch error:', error);
      return NextResponse.json(
        { error: '설정을 불러오는데 실패했습니다' },
        { status: 500 }
      );
    }

    // 설정이 없으면 기본값 반환
    if (!data) {
      return NextResponse.json({
        data: {
          night_mode_enabled: true,
          night_mode_start: '20:00',
          night_mode_end: '06:00',
          tts_voice: 'ko-KR-Wavenet-A',
          tts_speed: 0.9,
          volume_day: 80,
          volume_night: 30,
          ui_mode: 'touch',
          notify_join_request: true,
          notify_new_message: true,
        }
      });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// PATCH: 설정 수정
export async function PATCH(request: NextRequest) {
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

    // 수정 가능한 필드만 추출
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'night_mode_enabled',
      'night_mode_start',
      'night_mode_end',
      'tts_voice',
      'tts_speed',
      'volume_day',
      'volume_night',
      'ui_mode',
      'notify_join_request',
      'notify_new_message',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // 기존 설정 확인
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;

    if (existing) {
      // 기존 설정 업데이트
      const { data, error } = await supabase
        .from('settings')
        .update(updateData as never)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Settings update error:', error);
        return NextResponse.json(
          { error: '설정 수정에 실패했습니다' },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // 새 설정 생성
      const { data, error } = await supabase
        .from('settings')
        .insert({
          user_id: user.id,
          ...updateData,
        } as never)
        .select()
        .single();

      if (error) {
        console.error('Settings create error:', error);
        return NextResponse.json(
          { error: '설정 생성에 실패했습니다' },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Settings PATCH error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
