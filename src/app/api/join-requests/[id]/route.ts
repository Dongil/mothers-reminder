import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPushToUser } from '@/lib/push/send-notification';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH: 참여 요청 수락/거절
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();

    if (!body.status || !['accepted', 'rejected'].includes(body.status)) {
      return NextResponse.json(
        { error: '유효한 상태값이 필요합니다 (accepted/rejected)' },
        { status: 400 }
      );
    }

    // 요청 조회
    const { data: request_ } = await supabase
      .from('family_join_requests')
      .select('*, family:family_id (id, name)')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (!request_) {
      return NextResponse.json(
        { error: '요청을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const joinRequest = request_ as {
      id: string;
      user_id: string;
      family_id: string;
      family: { id: string; name: string };
    };

    // 해당 가족의 관리자인지 확인
    const { data: adminCheck } = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('family_id', joinRequest.family_id)
      .eq('role', 'admin')
      .single();

    if (!adminCheck) {
      return NextResponse.json(
        { error: '요청 처리 권한이 없습니다' },
        { status: 403 }
      );
    }

    // 요청 상태 업데이트
    const { data, error } = await supabase
      .from('family_join_requests')
      .update({
        status: body.status,
        responded_at: new Date().toISOString(),
        responded_by: user.id,
      } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Join request update error:', error);
      return NextResponse.json(
        { error: '요청 처리에 실패했습니다' },
        { status: 500 }
      );
    }

    // 수락된 경우 family_members에 추가
    if (body.status === 'accepted') {
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          user_id: joinRequest.user_id,
          family_id: joinRequest.family_id,
          role: 'member',
          is_active: false, // 기본적으로 비활성화
        } as never);

      if (memberError) {
        console.error('Member add error:', memberError);
        // 요청 상태는 이미 업데이트됐으므로 에러 반환하지 않음
      }

      // 요청자에게 수락 푸시 알림 발송
      sendPushToUser(joinRequest.user_id, {
        title: '참여 요청 수락됨',
        body: `${joinRequest.family.name} 가족 참여 요청이 수락되었습니다. 설정에서 활성 가족으로 설정하세요.`,
        tag: `join-accepted-${id}`,
        data: {
          url: '/settings',
          type: 'join_accepted',
          familyId: joinRequest.family_id,
        },
      }).catch(err => console.error('Push notification error:', err));
    } else if (body.status === 'rejected') {
      // 요청자에게 거절 푸시 알림 발송
      sendPushToUser(joinRequest.user_id, {
        title: '참여 요청 거절됨',
        body: `${joinRequest.family.name} 가족 참여 요청이 거절되어서 참여 요청이 삭제되었습니다.`,
        tag: `join-rejected-${id}`,
        data: {
          url: '/settings',
          type: 'join_rejected',
        },
      }).catch(err => console.error('Push notification error:', err));
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Join request PATCH error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// DELETE: 참여 요청 취소 (본인만)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // 본인 요청인지 확인
    const { data: requestData } = await supabase
      .from('family_join_requests')
      .select('user_id, status')
      .eq('id', id)
      .single();

    const request_ = requestData as { user_id: string; status: string } | null;
    if (!request_) {
      return NextResponse.json(
        { error: '요청을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (request_.user_id !== user.id) {
      return NextResponse.json(
        { error: '본인의 요청만 취소할 수 있습니다' },
        { status: 403 }
      );
    }

    if (request_.status !== 'pending') {
      return NextResponse.json(
        { error: '대기 중인 요청만 취소할 수 있습니다' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('family_join_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Join request delete error:', error);
      return NextResponse.json(
        { error: '요청 취소에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Join request DELETE error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
