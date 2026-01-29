import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface DeletionResult {
  success: boolean;
  error?: string;
  deletion_requested_at?: string;
  scheduled_deletion_at?: string;
}

interface CancelResult {
  success: boolean;
  error?: string;
}

// DELETE: 회원 탈퇴 (소프트 삭제)
export async function DELETE(request: NextRequest) {
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

    // 비밀번호 확인 (선택적)
    const body = await request.json().catch(() => ({}));
    if (body.password) {
      // 비밀번호 재확인
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: body.password,
      });

      if (signInError) {
        return NextResponse.json(
          { error: '비밀번호가 일치하지 않습니다' },
          { status: 400 }
        );
      }
    }

    // 소프트 삭제 요청 처리
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('request_account_deletion', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Account deletion error:', error);
      return NextResponse.json(
        { error: '회원 탈퇴 처리에 실패했습니다' },
        { status: 500 }
      );
    }

    const result = data as DeletionResult;

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // 로그아웃
    await supabase.auth.signOut();

    return NextResponse.json({
      message: '회원 탈퇴가 요청되었습니다. 30일 후에 계정이 완전히 삭제됩니다.',
      deletionRequestedAt: result.deletion_requested_at,
      scheduledDeletionAt: result.scheduled_deletion_at,
    });
  } catch (error) {
    console.error('Account DELETE error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// POST: 회원 탈퇴 취소
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
    const { action } = body;

    if (action === 'cancel') {
      // 탈퇴 취소
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('cancel_account_deletion', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Cancel deletion error:', error);
        return NextResponse.json(
          { error: '탈퇴 취소에 실패했습니다' },
          { status: 500 }
        );
      }

      const result = data as CancelResult;

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: '회원 탈퇴가 취소되었습니다.',
      });
    }

    return NextResponse.json(
      { error: '잘못된 요청입니다' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Account POST error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// GET: 탈퇴 상태 조회
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

    // 사용자 정보 조회
    const { data: userData, error } = await supabase
      .from('users')
      .select('deletion_requested_at, deleted_at')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('User fetch error:', error);
      return NextResponse.json(
        { error: '사용자 정보를 불러오는데 실패했습니다' },
        { status: 500 }
      );
    }

    const typedUserData = userData as { deletion_requested_at: string | null; deleted_at: string | null } | null;
    const deletionRequestedAt = typedUserData?.deletion_requested_at;
    const deletedAt = typedUserData?.deleted_at;

    return NextResponse.json({
      isDeletionRequested: !!deletionRequestedAt && !deletedAt,
      isDeleted: !!deletedAt,
      deletionRequestedAt,
      scheduledDeletionAt: deletionRequestedAt
        ? new Date(new Date(deletionRequestedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null,
    });
  } catch (error) {
    console.error('Account GET error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
