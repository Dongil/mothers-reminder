-- v1.5_007: users 테이블 소프트 삭제 필드 추가
-- 실행일: 2026-01-29
-- 설명: 회원 탈퇴 시 소프트 삭제를 위한 필드 추가

-- 소프트 삭제 필드 추가
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

-- 인덱스: 삭제된 사용자 조회용
CREATE INDEX IF NOT EXISTS idx_users_deleted_at
  ON users(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- 인덱스: 삭제 예정 사용자 조회용 (30일 후 영구 삭제)
CREATE INDEX IF NOT EXISTS idx_users_deletion_requested
  ON users(deletion_requested_at)
  WHERE deletion_requested_at IS NOT NULL;

-- 함수: 회원 탈퇴 요청 (소프트 삭제)
CREATE OR REPLACE FUNCTION request_account_deletion(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- 사용자 확인
  SELECT * INTO v_user FROM users WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_user.deletion_requested_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Deletion already requested',
      'deletion_requested_at', v_user.deletion_requested_at,
      'scheduled_deletion_at', v_user.deletion_requested_at + INTERVAL '30 days'
    );
  END IF;

  -- 탈퇴 요청 시간 기록
  UPDATE users
  SET deletion_requested_at = NOW()
  WHERE id = p_user_id;

  -- 감사 로그 기록
  PERFORM log_audit_event(
    p_user_id, 'user', 'account_deletion_requested',
    'user', p_user_id, 'User requested account deletion'
  );

  RETURN jsonb_build_object(
    'success', true,
    'deletion_requested_at', NOW(),
    'scheduled_deletion_at', NOW() + INTERVAL '30 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: 회원 탈퇴 취소
CREATE OR REPLACE FUNCTION cancel_account_deletion(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- 사용자 확인
  SELECT * INTO v_user FROM users WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_user.deletion_requested_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No deletion request found');
  END IF;

  IF v_user.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account already deleted');
  END IF;

  -- 탈퇴 요청 취소
  UPDATE users
  SET deletion_requested_at = NULL
  WHERE id = p_user_id;

  -- 감사 로그 기록
  PERFORM log_audit_event(
    p_user_id, 'user', 'account_deletion_cancelled',
    'user', p_user_id, 'User cancelled account deletion request'
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: 만료된 삭제 요청 처리 (30일 경과 후 영구 삭제)
-- 이 함수는 cron job 또는 Supabase Edge Function으로 주기적으로 실행
CREATE OR REPLACE FUNCTION process_expired_deletions()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_user RECORD;
BEGIN
  -- 30일 경과한 삭제 요청 처리
  FOR v_user IN
    SELECT id, email
    FROM users
    WHERE deletion_requested_at IS NOT NULL
      AND deleted_at IS NULL
      AND deletion_requested_at < NOW() - INTERVAL '30 days'
  LOOP
    -- 소프트 삭제 처리 (실제 데이터는 유지하되 deleted_at 설정)
    UPDATE users
    SET deleted_at = NOW()
    WHERE id = v_user.id;

    -- 감사 로그 기록
    PERFORM log_audit_event(
      NULL, 'system', 'account_deleted',
      'user', v_user.id, 'Account permanently deleted after 30 days grace period'
    );

    v_deleted_count := v_deleted_count + 1;
  END LOOP;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 뷰: 활성 사용자만 조회 (삭제되지 않은)
CREATE OR REPLACE VIEW active_users AS
SELECT * FROM users WHERE deleted_at IS NULL;
