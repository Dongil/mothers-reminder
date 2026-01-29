-- v1.5_005: TTS 사용 로그 테이블 생성
-- 실행일: 2026-01-29
-- 설명: TTS 사용량 추적 및 통계

-- TTS 사용 로그 테이블
CREATE TABLE IF NOT EXISTS tts_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  family_id UUID REFERENCES family(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  text_length INTEGER NOT NULL,
  text_preview TEXT,
  -- 텍스트 미리보기 (처음 100자)
  voice TEXT NOT NULL,
  speed NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
  duration_seconds NUMERIC(10, 2),
  -- 재생 시간 (초)
  audio_size_bytes INTEGER,
  -- 오디오 파일 크기
  status TEXT NOT NULL DEFAULT 'success',
  -- status: 'success', 'error'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스: 사용자별 사용량 조회
CREATE INDEX IF NOT EXISTS idx_tts_usage_logs_user_id
  ON tts_usage_logs(user_id);

-- 인덱스: 가족별 사용량 조회
CREATE INDEX IF NOT EXISTS idx_tts_usage_logs_family_id
  ON tts_usage_logs(family_id);

-- 인덱스: 메시지별 사용량 조회
CREATE INDEX IF NOT EXISTS idx_tts_usage_logs_message_id
  ON tts_usage_logs(message_id);

-- 인덱스: 시간별 조회 (통계용)
CREATE INDEX IF NOT EXISTS idx_tts_usage_logs_created
  ON tts_usage_logs(created_at DESC);

-- 복합 인덱스: 날짜별 사용량 통계용
-- timezone을 UTC로 고정하여 immutable하게 만듦
CREATE INDEX IF NOT EXISTS idx_tts_usage_logs_date
  ON tts_usage_logs(((created_at AT TIME ZONE 'UTC')::date));

-- RLS 활성화
ALTER TABLE tts_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 사용량만 조회 가능
CREATE POLICY "tts_usage_logs_select_own" ON tts_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- RLS 정책: 시스템 관리자는 모든 사용량 조회 가능
CREATE POLICY "tts_usage_logs_select_admin" ON tts_usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM system_admins sa
      WHERE sa.user_id = auth.uid()
    )
  );

-- 함수: TTS 사용 기록
CREATE OR REPLACE FUNCTION log_tts_usage(
  p_user_id UUID,
  p_text_length INTEGER,
  p_voice TEXT,
  p_speed NUMERIC DEFAULT 1.0,
  p_family_id UUID DEFAULT NULL,
  p_message_id UUID DEFAULT NULL,
  p_text_preview TEXT DEFAULT NULL,
  p_duration_seconds NUMERIC DEFAULT NULL,
  p_audio_size_bytes INTEGER DEFAULT NULL,
  p_status TEXT DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO tts_usage_logs (
    user_id, family_id, message_id, text_length, text_preview,
    voice, speed, duration_seconds, audio_size_bytes, status, error_message
  )
  VALUES (
    p_user_id, p_family_id, p_message_id, p_text_length, p_text_preview,
    p_voice, p_speed, p_duration_seconds, p_audio_size_bytes, p_status, p_error_message
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
