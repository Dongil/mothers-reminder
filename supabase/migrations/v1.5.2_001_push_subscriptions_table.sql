-- v1.5.2 Migration 001: Push Subscriptions 테이블 생성
-- 실행일: 2026-01-30
-- Web Push 알림을 위한 사용자 구독 정보 저장

-- push_subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 동일 사용자의 동일 endpoint는 하나만 허용
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_push_subscription
  ON public.push_subscriptions(user_id, endpoint);

-- user_id 인덱스 (사용자별 구독 조회용)
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id
  ON public.push_subscriptions(user_id);

-- RLS 활성화
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 인증된 사용자 허용 (서버에서 검증)
CREATE POLICY "push_subscriptions_all" ON public.push_subscriptions
  FOR ALL USING (true) WITH CHECK (true);

-- 테이블 설명
COMMENT ON TABLE public.push_subscriptions IS 'Web Push 알림 구독 정보';
COMMENT ON COLUMN public.push_subscriptions.endpoint IS 'Push 서비스 엔드포인트 URL';
COMMENT ON COLUMN public.push_subscriptions.p256dh IS '클라이언트 공개 키 (Base64)';
COMMENT ON COLUMN public.push_subscriptions.auth IS '인증 시크릿 (Base64)';
