-- v1.5_004: 사용자 활동 로그 테이블 생성
-- 실행일: 2026-01-29
-- 설명: 사용자 활동 추적 및 통계 수집

-- 사용자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  family_id UUID REFERENCES family(id) ON DELETE SET NULL,
  session_id TEXT,
  action_type TEXT NOT NULL,
  -- action_type: 'login', 'logout', 'page_view', 'message_create',
  --              'message_view', 'tts_play', 'settings_change' 등
  action_detail JSONB,
  -- action_detail: { page: '/home', duration: 30, ... }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스: 사용자별 활동 조회
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id
  ON user_activity_logs(user_id);

-- 인덱스: 가족별 활동 조회
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_family_id
  ON user_activity_logs(family_id);

-- 인덱스: 활동 유형별 조회
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_type
  ON user_activity_logs(action_type);

-- 인덱스: 시간별 조회 (통계용)
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created
  ON user_activity_logs(created_at DESC);

-- 복합 인덱스: 날짜별 사용자 활동 통계용
-- timezone을 UTC로 고정하여 immutable하게 만듦
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_date_user
  ON user_activity_logs(((created_at AT TIME ZONE 'UTC')::date), user_id);

-- RLS 활성화
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 활동만 조회 가능
CREATE POLICY "user_activity_logs_select_own" ON user_activity_logs
  FOR SELECT USING (auth.uid() = user_id);

-- RLS 정책: 시스템 관리자는 모든 활동 조회 가능
CREATE POLICY "user_activity_logs_select_admin" ON user_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM system_admins sa
      WHERE sa.user_id = auth.uid()
    )
  );

-- 함수: 사용자 활동 기록
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_action_type TEXT,
  p_family_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_action_detail JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO user_activity_logs (user_id, family_id, session_id, action_type, action_detail)
  VALUES (p_user_id, p_family_id, p_session_id, p_action_type, p_action_detail)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
