-- Family Message Board - Database Schema
-- Supabase SQL Editor에서 실행하세요

-- 1. family 테이블
CREATE TABLE IF NOT EXISTS family (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. users 테이블 (Supabase Auth와 연동)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  relationship VARCHAR(50),
  photo_url TEXT,
  family_id UUID REFERENCES family(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. messages 테이블
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES family(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',

  -- 표시 설정
  display_date DATE NOT NULL,
  display_duration INT DEFAULT 1,
  display_forever BOOLEAN DEFAULT FALSE,

  -- 사진
  photo_url TEXT,

  -- TTS 설정
  tts_enabled BOOLEAN DEFAULT TRUE,
  tts_times TEXT[],
  tts_voice VARCHAR(20) DEFAULT 'female',
  tts_speed DECIMAL(3,1) DEFAULT 1.0,
  background_sound VARCHAR(20) DEFAULT 'chime',

  -- 반복 설정
  repeat_pattern VARCHAR(20),
  repeat_weekdays INT[],
  repeat_month_day INT,
  repeat_start DATE,
  repeat_end DATE,

  -- D-day 설정
  is_dday BOOLEAN DEFAULT FALSE,
  dday_date DATE,
  dday_label VARCHAR(100),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. notifications 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. settings 테이블
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- 야간 모드
  night_mode_start TIME DEFAULT '20:00',
  night_mode_end TIME DEFAULT '06:00',

  -- TTS 설정
  tts_voice VARCHAR(20) DEFAULT 'female',
  tts_speed DECIMAL(3,1) DEFAULT 1.0,

  -- 볼륨
  volume_day INT DEFAULT 80,
  volume_night INT DEFAULT 0,

  -- UI 모드
  ui_mode VARCHAR(20) DEFAULT 'touch',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_messages_family_id ON messages(family_id);
CREATE INDEX IF NOT EXISTS idx_messages_display_date ON messages(display_date);
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_message_id ON notifications(message_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE family ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성

-- family 테이블: 가족 구성원만 조회 가능
CREATE POLICY "Family members can view family"
  ON family FOR SELECT
  USING (id IN (
    SELECT family_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Anyone can create family"
  ON family FOR INSERT
  WITH CHECK (true);

-- users 테이블
CREATE POLICY "Users can view family members"
  ON users FOR SELECT
  USING (
    family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
    OR id = auth.uid()
  );

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- messages 테이블
CREATE POLICY "Family members can view messages"
  ON messages FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Family members can insert messages"
  ON messages FOR INSERT
  WITH CHECK (family_id IN (
    SELECT family_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Authors can update own messages"
  ON messages FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own messages"
  ON messages FOR DELETE
  USING (author_id = auth.uid());

-- notifications 테이블
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- settings 테이블
CREATE POLICY "Users can manage own settings"
  ON settings FOR ALL
  USING (user_id = auth.uid());

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Realtime 활성화 (Supabase Dashboard에서 수동으로 활성화해야 할 수도 있음)
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
