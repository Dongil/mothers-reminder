-- v1.5_001: 시스템 관리자 테이블 생성
-- 실행일: 2026-01-29
-- 설명: 시스템 레벨 관리자 권한 관리를 위한 테이블

-- 시스템 관리자 테이블
CREATE TABLE IF NOT EXISTS system_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permissions TEXT[] NOT NULL DEFAULT ARRAY['read'],
  -- 권한: 'read' (조회만), 'write' (수정 가능), 'super' (모든 권한)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT system_admins_user_id_unique UNIQUE (user_id),
  CONSTRAINT system_admins_permissions_check CHECK (
    permissions <@ ARRAY['read', 'write', 'super']::TEXT[]
  )
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_system_admins_user_id ON system_admins(user_id);

-- RLS 활성화
ALTER TABLE system_admins ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 정보만 조회 가능
CREATE POLICY "system_admins_select_own" ON system_admins
  FOR SELECT USING (auth.uid() = user_id);

-- RLS 정책: super 권한자만 관리 가능
CREATE POLICY "system_admins_manage_super" ON system_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM system_admins sa
      WHERE sa.user_id = auth.uid()
      AND 'super' = ANY(sa.permissions)
    )
  );

-- 트리거: updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_system_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_system_admins_updated_at
  BEFORE UPDATE ON system_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_system_admins_updated_at();
