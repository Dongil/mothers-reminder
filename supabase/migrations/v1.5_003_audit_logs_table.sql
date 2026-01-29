-- v1.5_003: 감사 로그 테이블 생성
-- 실행일: 2026-01-29
-- 설명: 관리자 행동 및 중요 이벤트 기록

-- 감사 로그 테이블
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL DEFAULT 'user',
  -- actor_type: 'user', 'admin', 'system'
  action TEXT NOT NULL,
  -- action: 'login', 'logout', 'create', 'update', 'delete', 'view', 'export' 등
  target_type TEXT,
  -- target_type: 'user', 'family', 'message', 'settings' 등
  target_id UUID,
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스: 행위자로 조회
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id
  ON audit_logs(actor_id);

-- 인덱스: 대상으로 조회
CREATE INDEX IF NOT EXISTS idx_audit_logs_target
  ON audit_logs(target_type, target_id);

-- 인덱스: 행동 유형으로 조회
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs(action);

-- 인덱스: 시간으로 조회
CREATE INDEX IF NOT EXISTS idx_audit_logs_created
  ON audit_logs(created_at DESC);

-- RLS 활성화
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 시스템 관리자만 조회 가능
CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM system_admins sa
      WHERE sa.user_id = auth.uid()
    )
  );

-- 함수: 감사 로그 기록
CREATE OR REPLACE FUNCTION log_audit_event(
  p_actor_id UUID,
  p_actor_type TEXT,
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO audit_logs (
    actor_id, actor_type, action, target_type, target_id,
    description, old_values, new_values, ip_address, user_agent
  )
  VALUES (
    p_actor_id, p_actor_type, p_action, p_target_type, p_target_id,
    p_description, p_old_values, p_new_values, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
