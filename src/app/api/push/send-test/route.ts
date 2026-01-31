import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPushToUser } from '@/lib/push/send-notification';

// GET: 현재 사용자에게 테스트 푸시 발송
export async function GET() {
  console.log('[Push Send Test] Starting...');

  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    console.log('[Push Send Test] User:', user.id);

    // 직접 푸시 발송
    const result = await sendPushToUser(user.id, {
      title: '테스트 푸시',
      body: `테스트 메시지 - ${new Date().toLocaleTimeString('ko-KR')}`,
      tag: 'test-push',
      data: {
        url: '/home',
        type: 'test',
      },
    });

    console.log('[Push Send Test] Result:', result);

    return NextResponse.json({
      message: '푸시 발송 완료',
      userId: user.id,
      result,
    });
  } catch (error) {
    console.error('[Push Send Test] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
