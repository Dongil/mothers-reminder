import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPushToFamilyAdmins } from '@/lib/push/send-notification';

// GET: 참여 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'sent' or 'received'

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    if (type === 'sent') {
      // 내가 보낸 요청
      const { data, error } = await supabase
        .from('family_join_requests')
        .select(`
          *,
          family:family_id (
            id,
            name,
            code
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Join requests fetch error:', error);
        return NextResponse.json(
          { error: '요청 목록을 불러오는데 실패했습니다' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data });
    } else {
      // 내가 관리자인 가족에 대한 요청
      // 먼저 관리자인 가족 ID 목록 조회
      const { data: adminFamilies } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (!adminFamilies || adminFamilies.length === 0) {
        return NextResponse.json({ data: [] });
      }

      const familyIds = (adminFamilies as { family_id: string }[]).map(f => f.family_id);

      const { data, error } = await supabase
        .from('family_join_requests')
        .select(`
          *,
          family:family_id (
            id,
            name,
            code
          ),
          user:user_id (
            id,
            name,
            nickname,
            gender,
            email
          )
        `)
        .in('family_id', familyIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Join requests fetch error:', error);
        return NextResponse.json(
          { error: '요청 목록을 불러오는데 실패했습니다' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data });
    }
  } catch (error) {
    console.error('Join requests GET error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// POST: 참여 요청 생성
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

    const body = await request.json();

    if (!body.family_id) {
      return NextResponse.json(
        { error: '가족 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 이미 멤버인지 확인
    const { data: existingMember } = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('family_id', body.family_id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: '이미 해당 가족의 멤버입니다' },
        { status: 400 }
      );
    }

    // 이미 대기 중인 요청이 있는지 확인
    const { data: existingRequest } = await supabase
      .from('family_join_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('family_id', body.family_id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: '이미 참여 요청이 대기 중입니다' },
        { status: 400 }
      );
    }

    // 요청 생성
    const { data, error } = await supabase
      .from('family_join_requests')
      .insert({
        user_id: user.id,
        family_id: body.family_id,
        message: body.message || null,
        status: 'pending',
      } as never)
      .select(`
        *,
        family:family_id (
          id,
          name,
          code
        )
      `)
      .single();

    if (error) {
      console.error('Join request creation error:', error);
      return NextResponse.json(
        { error: '참여 요청 생성에 실패했습니다' },
        { status: 500 }
      );
    }

    // 요청자 정보 조회
    const { data: requesterData } = await supabase
      .from('users')
      .select('name, nickname')
      .eq('id', user.id)
      .single();

    const requester = requesterData as { name: string; nickname: string | null } | null;

    // 가족 관리자들에게 푸시 알림 발송
    if (requester && data) {
      const requesterName = requester.nickname
        ? `${requester.name}(${requester.nickname})`
        : requester.name;

      const joinRequestData = data as { id: string; family?: { name: string } };
      const familyName = joinRequestData.family?.name || '가족';

      sendPushToFamilyAdmins(body.family_id, {
        title: '가족 참여 요청',
        body: `${requesterName}님이 ${familyName} 가족으로 참여 요청이 왔습니다. 설정에서 확인해주세요.`,
        tag: `join-request-${joinRequestData.id}`,
        data: {
          url: '/settings',
          type: 'join_request',
          requestId: joinRequestData.id,
        },
      }).catch(err => console.error('Push notification error:', err));
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Join requests POST error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
