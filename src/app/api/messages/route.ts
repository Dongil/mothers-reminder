import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { MessageInsert, User } from '@/types/database';
import { sendPushToFamilyMembers } from '@/lib/push/send-notification';

// GET: 메시지 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const familyId = searchParams.get('family_id');
    const date = searchParams.get('date');

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    let query = supabase
      .from('messages')
      .select('*, author:users(id, name, photo_url)')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    // 가족 ID 필터
    if (familyId) {
      query = query.eq('family_id', familyId);
    }

    // 날짜 필터
    if (date) {
      query = query.or(
        `display_date.eq.${date},and(display_forever.eq.true,display_date.lte.${date})`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Messages fetch error:', error);
      return NextResponse.json(
        { error: '메시지를 불러오는데 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// POST: 메시지 생성
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

    // 사용자의 family_id 가져오기 (users 테이블 또는 settings의 active_family_id)
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    const userRecord = userData as unknown as User | null;

    // users.family_id가 없으면 family_members에서 첫 번째 가족 사용
    let familyId = userRecord?.family_id;
    if (!familyId) {
      const { data: membershipData } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      const membership = membershipData as { family_id: string } | null;
      familyId = membership?.family_id || null;
    }

    if (!familyId) {
      return NextResponse.json(
        { error: '가족 정보가 없습니다' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // 필수 필드 검증
    if (!body.content || !body.display_date) {
      return NextResponse.json(
        { error: '내용과 표시 날짜는 필수입니다' },
        { status: 400 }
      );
    }

    const messageData: MessageInsert = {
      author_id: user.id,
      family_id: familyId,
      content: body.content,
      priority: body.priority || 'normal',
      display_date: body.display_date,
      display_duration: body.display_duration || 1,
      display_forever: body.display_forever || false,
      photo_url: body.photo_url || null,
      tts_enabled: body.tts_enabled ?? true,
      tts_times: body.tts_times || null,
      tts_voice: body.tts_voice || 'ko-KR-SunHiNeural',
      tts_speed: body.tts_speed || 0.8,
      background_sound: body.background_sound || 'none',
      repeat_pattern: body.repeat_pattern || 'none',
      repeat_weekdays: body.repeat_weekdays || null,
      repeat_month_day: body.repeat_month_day || null,
      repeat_start: body.repeat_start || null,
      repeat_end: body.repeat_end || null,
      is_dday: body.is_dday || false,
      dday_date: body.dday_date || null,
      dday_label: body.dday_label || null,
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData as never)
      .select('*, author:users(id, name, photo_url)')
      .single();

    if (error) {
      console.error('Message insert error:', error);
      return NextResponse.json(
        { error: '메시지 작성에 실패했습니다' },
        { status: 500 }
      );
    }

    // 가족 멤버들에게 새 메시지 푸시 알림 발송 (작성자 제외)
    let pushResult = null;
    if (data) {
      const createdMessage = data as { id: string };
      const contentPreview = body.content.length > 50
        ? body.content.substring(0, 50) + '...'
        : body.content;

      try {
        pushResult = await sendPushToFamilyMembers(
          familyId,
          {
            title: '새 메시지',
            body: contentPreview,
            tag: `new-message-${createdMessage.id}`,
            data: {
              url: '/display',
              type: 'new_message',
              messageId: createdMessage.id,
            },
          },
          user.id,
          'new_message'
        );
      } catch (err) {
        console.error('Push notification error:', err);
      }
    }

    return NextResponse.json({ data, pushResult }, { status: 201 });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
