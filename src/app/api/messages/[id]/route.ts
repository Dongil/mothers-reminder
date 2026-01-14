import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Message, MessageUpdate } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 단일 메시지 조회
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const { data, error } = await (supabase as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)
      .from('messages')
      .select('*, author:users(id, name, photo_url)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '메시지를 찾을 수 없습니다' },
          { status: 404 }
        );
      }
      console.error('Message fetch error:', error);
      return NextResponse.json(
        { error: '메시지를 불러오는데 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Message GET error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// PATCH: 메시지 수정
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 기존 메시지 확인
    const { data: existingData, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingData) {
      return NextResponse.json(
        { error: '메시지를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 본인 메시지인지 확인
    const existingMessage = existingData as unknown as Message;
    if (existingMessage.author_id !== user.id) {
      return NextResponse.json(
        { error: '수정 권한이 없습니다' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const updateData = {
      ...(body.content !== undefined && { content: body.content }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.display_date !== undefined && { display_date: body.display_date }),
      ...(body.display_duration !== undefined && { display_duration: body.display_duration }),
      ...(body.display_forever !== undefined && { display_forever: body.display_forever }),
      ...(body.photo_url !== undefined && { photo_url: body.photo_url }),
      ...(body.tts_enabled !== undefined && { tts_enabled: body.tts_enabled }),
      ...(body.tts_times !== undefined && { tts_times: body.tts_times }),
      ...(body.tts_voice !== undefined && { tts_voice: body.tts_voice }),
      ...(body.tts_speed !== undefined && { tts_speed: body.tts_speed }),
      ...(body.background_sound !== undefined && { background_sound: body.background_sound }),
      ...(body.repeat_pattern !== undefined && { repeat_pattern: body.repeat_pattern }),
      ...(body.repeat_weekdays !== undefined && { repeat_weekdays: body.repeat_weekdays }),
      ...(body.repeat_month_day !== undefined && { repeat_month_day: body.repeat_month_day }),
      ...(body.repeat_start !== undefined && { repeat_start: body.repeat_start }),
      ...(body.repeat_end !== undefined && { repeat_end: body.repeat_end }),
      ...(body.is_dday !== undefined && { is_dday: body.is_dday }),
      ...(body.dday_date !== undefined && { dday_date: body.dday_date }),
      ...(body.dday_label !== undefined && { dday_label: body.dday_label }),
      updated_at: new Date().toISOString(),
    } as MessageUpdate;

    const { data, error } = await supabase
      .from('messages')
      .update(updateData as never)
      .eq('id', id)
      .select('*, author:users(id, name, photo_url)')
      .single();

    if (error) {
      console.error('Message update error:', error);
      return NextResponse.json(
        { error: '메시지 수정에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Message PATCH error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// DELETE: 메시지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 기존 메시지 확인
    const { data: existingData, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingData) {
      return NextResponse.json(
        { error: '메시지를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 본인 메시지인지 확인
    const existingMessage = existingData as unknown as Message;
    if (existingMessage.author_id !== user.id) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Message delete error:', error);
      return NextResponse.json(
        { error: '메시지 삭제에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: '메시지가 삭제되었습니다' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Message DELETE error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
