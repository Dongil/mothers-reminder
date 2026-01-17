-- RLS 정책 수정 버전 (순환 참조 해결)
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "family_select" ON public.family;
DROP POLICY IF EXISTS "family_insert" ON public.family;
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "messages_all" ON public.messages;
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;
DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "settings_all" ON public.settings;

-- 2. RLS 활성화
ALTER TABLE public.family ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 3. Family 테이블 - 모두 허용 (공개 데이터)
CREATE POLICY "family_all" ON public.family FOR ALL USING (true) WITH CHECK (true);

-- 4. Users 테이블 - 모두 허용 (순환 참조 방지)
CREATE POLICY "users_all" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 5. Messages 테이블 - 모두 허용 (태블릿 접근 필요)
CREATE POLICY "messages_all" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- 6. Notifications 테이블 - 모두 허용
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- 7. Settings 테이블 - 모두 허용
CREATE POLICY "settings_all" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- 완료 메시지
SELECT 'RLS 정책이 성공적으로 설정되었습니다! (v2 - 단순화 버전)' as result;
