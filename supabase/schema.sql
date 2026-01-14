-- Family Message Board 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. 가족 테이블
CREATE TABLE IF NOT EXISTS public.family (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 사용자 테이블
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  relationship TEXT,
  photo_url TEXT,
  family_id UUID REFERENCES public.family(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 메시지 테이블
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.users(id),
  family_id UUID NOT NULL REFERENCES public.family(id),
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  display_date DATE NOT NULL,
  display_duration INTEGER DEFAULT 1,
  display_forever BOOLEAN DEFAULT FALSE,
  photo_url TEXT,
  tts_enabled BOOLEAN DEFAULT TRUE,
  tts_times TEXT[],
  tts_voice TEXT DEFAULT 'ko-KR-SunHiNeural',
  tts_speed NUMERIC DEFAULT 0.8,
  background_sound TEXT DEFAULT 'none',
  repeat_pattern TEXT DEFAULT 'none' CHECK (repeat_pattern IN ('none', 'daily', 'weekly', 'monthly')),
  repeat_weekdays INTEGER[],
  repeat_month_day INTEGER,
  repeat_start DATE,
  repeat_end DATE,
  is_dday BOOLEAN DEFAULT FALSE,
  dday_date DATE,
  dday_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 알림 테이블
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 설정 테이블
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) UNIQUE,
  night_mode_start TIME DEFAULT '20:00',
  night_mode_end TIME DEFAULT '06:00',
  tts_voice TEXT DEFAULT 'ko-KR-SunHiNeural',
  tts_speed NUMERIC DEFAULT 0.8,
  volume_day INTEGER DEFAULT 80,
  volume_night INTEGER DEFAULT 30,
  ui_mode TEXT DEFAULT 'touch' CHECK (ui_mode IN ('touch', 'voice')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_messages_family_id ON public.messages(family_id);
CREATE INDEX IF NOT EXISTS idx_messages_display_date ON public.messages(display_date);
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON public.messages(author_id);
CREATE INDEX IF NOT EXISTS idx_users_family_id ON public.users(family_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.family ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Family: 가족 구성원만 조회
CREATE POLICY "family_select" ON public.family
  FOR SELECT USING (
    id IN (SELECT family_id FROM public.users WHERE id = auth.uid())
  );

-- Users: 같은 가족만 조회, 본인만 수정
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Messages: 가족 조회/작성, 본인만 수정/삭제
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE USING (author_id = auth.uid());

-- Notifications: 본인만
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- Settings: 본인만
CREATE POLICY "settings_all" ON public.settings
  FOR ALL USING (user_id = auth.uid());

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
