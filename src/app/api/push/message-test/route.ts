import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPushToFamilyMembers } from '@/lib/push/send-notification';

// GET: 메시지 생성 플로우 시뮬레이션 (실제 메시지 생성 없이 푸시만 테스트)
export async function GET() {
  console.log('[Message Push Test] Starting...');

  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    console.log('[Message Push Test] User:', user.id);

    // users 테이블에서 family_id 확인
    const { data: userData } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    const userRecord = userData as { family_id: string | null } | null;
    console.log('[Message Push Test] users.family_id:', userRecord?.family_id);

    // family_members에서 가족 ID 가져오기
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
      console.log('[Message Push Test] family_members.family_id:', familyId);
    }

    if (!familyId) {
      return NextResponse.json({
        error: '가족 없음',
        usersFamilyId: userRecord?.family_id,
        membershipFamilyId: null,
      }, { status: 400 });
    }

    // 푸시 발송 (메시지 생성 시와 동일한 플로우)
    console.log('[Message Push Test] Sending push to family:', familyId);

    const pushResult = await sendPushToFamilyMembers(
      familyId,
      {
        title: '새 메시지 (테스트)',
        body: `메시지 생성 플로우 테스트 - ${new Date().toLocaleTimeString('ko-KR')}`,
        tag: 'message-test-push',
        data: {
          url: '/display',
          type: 'new_message',
          messageId: 'test-message-id',
        },
      },
      user.id, // 작성자 제외
      'new_message'
    );

    console.log('[Message Push Test] Push result:', pushResult);

    return NextResponse.json({
      message: '메시지 푸시 테스트 완료',
      userId: user.id,
      usersFamilyId: userRecord?.family_id,
      resolvedFamilyId: familyId,
      excludedUser: user.id,
      pushResult,
    });
  } catch (error) {
    console.error('[Message Push Test] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
