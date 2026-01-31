import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPushToFamilyMembers } from '@/lib/push/send-notification';

// GET: 가족 멤버들에게 테스트 푸시 발송 (메시지 생성 시뮬레이션)
export async function GET() {
  console.log('[Family Push Test] Starting...');

  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    // family_members에서 가족 ID 가져오기
    const { data: membershipData } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const membership = membershipData as { family_id: string } | null;
    const familyId = membership?.family_id;

    if (!familyId) {
      return NextResponse.json({ error: '가족 없음' }, { status: 400 });
    }

    // 가족의 모든 멤버 조회
    const { data: allMembers } = await supabase
      .from('family_members')
      .select('user_id, role')
      .eq('family_id', familyId);

    const members = allMembers as { user_id: string; role: string }[] | null;

    console.log('[Family Push Test] Family members:', members);

    // 푸시 발송 (작성자 제외)
    const result = await sendPushToFamilyMembers(
      familyId,
      {
        title: '가족 테스트 푸시',
        body: `가족 멤버 테스트 - ${new Date().toLocaleTimeString('ko-KR')}`,
        tag: 'family-test-push',
        data: {
          url: '/home',
          type: 'test',
        },
      },
      user.id, // 작성자 제외
      'new_message'
    );

    console.log('[Family Push Test] Result:', result);

    return NextResponse.json({
      message: '가족 푸시 테스트 완료',
      currentUserId: user.id,
      familyId,
      familyMembers: members,
      memberCount: members?.length || 0,
      excludedUser: user.id,
      otherMembers: members?.filter(m => m.user_id !== user.id) || [],
      pushResult: result,
    });
  } catch (error) {
    console.error('[Family Push Test] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
