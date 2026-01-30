import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: 푸시 구독 등록/갱신
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: '구독 정보가 올바르지 않습니다' },
        { status: 400 }
      );
    }

    // upsert로 기존 구독 갱신 또는 새로 생성
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: request.headers.get('user-agent'),
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: 'user_id,endpoint' }
      )
      .select()
      .single();

    if (error) {
      console.error('Push subscription error:', error);
      return NextResponse.json(
        { error: '구독 등록에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, message: '푸시 알림이 활성화되었습니다' });
  } catch (error) {
    console.error('Push subscription POST error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// DELETE: 푸시 구독 해제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'endpoint가 필요합니다' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Push unsubscribe error:', error);
      return NextResponse.json(
        { error: '구독 해제에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '푸시 알림이 비활성화되었습니다' });
  } catch (error) {
    console.error('Push subscription DELETE error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// GET: 현재 사용자의 구독 상태 확인
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, created_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Push subscription GET error:', error);
      return NextResponse.json(
        { error: '구독 정보 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscribed: data && data.length > 0,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Push subscription GET error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
