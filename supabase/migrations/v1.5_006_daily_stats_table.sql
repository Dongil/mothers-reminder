-- v1.5_006: 일별 통계 테이블 생성
-- 실행일: 2026-01-29
-- 설명: 대시보드용 일별 집계 통계

-- 일별 통계 테이블
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL,
  stat_type TEXT NOT NULL,
  -- stat_type: 'total' (전체), 'family' (가족별), 'user' (사용자별)
  entity_id UUID,
  -- entity_id: stat_type이 'family'면 family_id, 'user'면 user_id, 'total'이면 NULL

  -- 활동 통계
  active_users INTEGER NOT NULL DEFAULT 0,
  new_users INTEGER NOT NULL DEFAULT 0,
  total_logins INTEGER NOT NULL DEFAULT 0,

  -- 메시지 통계
  messages_created INTEGER NOT NULL DEFAULT 0,
  messages_viewed INTEGER NOT NULL DEFAULT 0,

  -- TTS 통계
  tts_requests INTEGER NOT NULL DEFAULT 0,
  tts_total_chars INTEGER NOT NULL DEFAULT 0,
  tts_duration_seconds NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 유니크 제약: 같은 날짜, 같은 타입, 같은 엔티티는 하나만
  CONSTRAINT daily_stats_unique UNIQUE (stat_date, stat_type, entity_id)
);

-- 인덱스: 날짜로 조회
CREATE INDEX IF NOT EXISTS idx_daily_stats_date
  ON daily_stats(stat_date DESC);

-- 인덱스: 타입으로 조회
CREATE INDEX IF NOT EXISTS idx_daily_stats_type
  ON daily_stats(stat_type);

-- 인덱스: 엔티티로 조회
CREATE INDEX IF NOT EXISTS idx_daily_stats_entity
  ON daily_stats(entity_id);

-- 복합 인덱스: 대시보드 조회용
CREATE INDEX IF NOT EXISTS idx_daily_stats_type_date
  ON daily_stats(stat_type, stat_date DESC);

-- RLS 활성화
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 시스템 관리자만 조회 가능
CREATE POLICY "daily_stats_select_admin" ON daily_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM system_admins sa
      WHERE sa.user_id = auth.uid()
    )
  );

-- 트리거: updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_daily_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_daily_stats_updated_at
  BEFORE UPDATE ON daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_stats_updated_at();

-- 함수: 일별 통계 집계 (수동 또는 cron으로 실행)
CREATE OR REPLACE FUNCTION aggregate_daily_stats(p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS VOID AS $$
DECLARE
  v_total_active_users INTEGER;
  v_total_new_users INTEGER;
  v_total_logins INTEGER;
  v_total_messages INTEGER;
  v_total_tts_requests INTEGER;
  v_total_tts_chars INTEGER;
  v_total_tts_duration NUMERIC;
BEGIN
  -- 전체 통계 계산
  SELECT COUNT(DISTINCT user_id) INTO v_total_active_users
  FROM user_activity_logs
  WHERE DATE(created_at) = p_date;

  SELECT COUNT(*) INTO v_total_new_users
  FROM users
  WHERE DATE(created_at) = p_date;

  SELECT COUNT(*) INTO v_total_logins
  FROM user_activity_logs
  WHERE DATE(created_at) = p_date AND action_type = 'login';

  SELECT COUNT(*) INTO v_total_messages
  FROM messages
  WHERE DATE(created_at) = p_date;

  SELECT COUNT(*), COALESCE(SUM(text_length), 0), COALESCE(SUM(duration_seconds), 0)
  INTO v_total_tts_requests, v_total_tts_chars, v_total_tts_duration
  FROM tts_usage_logs
  WHERE DATE(created_at) = p_date AND status = 'success';

  -- 전체 통계 삽입/갱신
  INSERT INTO daily_stats (
    stat_date, stat_type, entity_id,
    active_users, new_users, total_logins,
    messages_created, tts_requests, tts_total_chars, tts_duration_seconds
  )
  VALUES (
    p_date, 'total', NULL,
    v_total_active_users, v_total_new_users, v_total_logins,
    v_total_messages, v_total_tts_requests, v_total_tts_chars, v_total_tts_duration
  )
  ON CONFLICT (stat_date, stat_type, entity_id)
  DO UPDATE SET
    active_users = EXCLUDED.active_users,
    new_users = EXCLUDED.new_users,
    total_logins = EXCLUDED.total_logins,
    messages_created = EXCLUDED.messages_created,
    tts_requests = EXCLUDED.tts_requests,
    tts_total_chars = EXCLUDED.tts_total_chars,
    tts_duration_seconds = EXCLUDED.tts_duration_seconds;

  -- 가족별 통계
  INSERT INTO daily_stats (
    stat_date, stat_type, entity_id,
    active_users, messages_created, tts_requests, tts_total_chars, tts_duration_seconds
  )
  SELECT
    p_date,
    'family',
    f.id,
    (SELECT COUNT(DISTINCT ual.user_id)
     FROM user_activity_logs ual
     WHERE DATE(ual.created_at) = p_date AND ual.family_id = f.id),
    (SELECT COUNT(*)
     FROM messages m
     WHERE DATE(m.created_at) = p_date AND m.family_id = f.id),
    (SELECT COUNT(*)
     FROM tts_usage_logs tul
     WHERE DATE(tul.created_at) = p_date AND tul.family_id = f.id AND tul.status = 'success'),
    (SELECT COALESCE(SUM(tul.text_length), 0)
     FROM tts_usage_logs tul
     WHERE DATE(tul.created_at) = p_date AND tul.family_id = f.id AND tul.status = 'success'),
    (SELECT COALESCE(SUM(tul.duration_seconds), 0)
     FROM tts_usage_logs tul
     WHERE DATE(tul.created_at) = p_date AND tul.family_id = f.id AND tul.status = 'success')
  FROM family f
  ON CONFLICT (stat_date, stat_type, entity_id)
  DO UPDATE SET
    active_users = EXCLUDED.active_users,
    messages_created = EXCLUDED.messages_created,
    tts_requests = EXCLUDED.tts_requests,
    tts_total_chars = EXCLUDED.tts_total_chars,
    tts_duration_seconds = EXCLUDED.tts_duration_seconds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
