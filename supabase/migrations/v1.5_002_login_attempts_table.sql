-- v1.5_002: 로그인 시도 기록 테이블 생성
-- 실행일: 2026-01-29
-- 설명: 무차별 대입 공격 방지를 위한 로그인 시도 추적

-- 로그인 시도 테이블
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  failure_reason TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스: 이메일로 최근 시도 조회용
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created
  ON login_attempts(email, created_at DESC);

-- 인덱스: IP로 최근 시도 조회용
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_created
  ON login_attempts(ip_address, created_at DESC);

-- 인덱스: 오래된 기록 삭제용
CREATE INDEX IF NOT EXISTS idx_login_attempts_created
  ON login_attempts(created_at);

-- RLS 활성화
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 시스템 관리자만 조회 가능
CREATE POLICY "login_attempts_select_admin" ON login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM system_admins sa
      WHERE sa.user_id = auth.uid()
    )
  );

-- RLS 정책: 서비스 역할만 삽입 가능 (API에서 service role 사용)
-- 서비스 역할은 RLS를 우회하므로 별도 정책 불필요

-- 함수: 로그인 시도 제한 체크 (5회 실패 시 10분 잠금)
CREATE OR REPLACE FUNCTION check_login_rate_limit(
  p_email TEXT,
  p_ip_address INET DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_failed_attempts INTEGER;
  v_last_attempt TIMESTAMPTZ;
  v_lockout_until TIMESTAMPTZ;
  v_is_locked BOOLEAN := FALSE;
BEGIN
  -- 최근 10분 내 실패 시도 횟수 조회
  SELECT COUNT(*), MAX(created_at)
  INTO v_failed_attempts, v_last_attempt
  FROM login_attempts
  WHERE email = p_email
    AND success = FALSE
    AND created_at > NOW() - INTERVAL '10 minutes';

  -- 5회 이상 실패 시 잠금
  IF v_failed_attempts >= 5 THEN
    v_is_locked := TRUE;
    v_lockout_until := v_last_attempt + INTERVAL '10 minutes';
  END IF;

  RETURN jsonb_build_object(
    'is_locked', v_is_locked,
    'failed_attempts', v_failed_attempts,
    'lockout_until', v_lockout_until,
    'remaining_attempts', GREATEST(0, 5 - v_failed_attempts)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: 로그인 시도 기록
CREATE OR REPLACE FUNCTION record_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_ip_address INET DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO login_attempts (email, success, ip_address, failure_reason, user_agent)
  VALUES (p_email, p_success, p_ip_address, p_failure_reason, p_user_agent)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
