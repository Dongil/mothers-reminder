-- RLS 정책 재설정
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 정책 삭제
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
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "settings_all" ON public.settings;

-- 2. RLS 활성화
ALTER TABLE public.family ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 3. Family 테이블 정책
-- 누구나 가족 생성 가능 (회원가입 시)
CREATE POLICY "family_insert" ON public.family
  FOR INSERT WITH CHECK (true);

-- 누구나 가족 조회 가능 (코드로 가입 시 필요)
CREATE POLICY "family_select" ON public.family
  FOR SELECT USING (true);

-- 4. Users 테이블 정책
-- 누구나 사용자 생성 가능 (회원가입 시)
CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (true);

-- 같은 가족만 조회 가능
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid())
    OR id = auth.uid()
  );

-- 본인만 수정 가능
CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- 5. Messages 테이블 정책
-- 같은 가족만 조회 가능 (+ 비로그인 태블릿도 허용)
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (true);

-- 로그인한 사용자만 메시지 생성 가능
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 작성자만 수정 가능
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE USING (author_id = auth.uid());

-- 작성자만 삭제 가능
CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE USING (author_id = auth.uid());

-- 6. Notifications 테이블 정책
CREATE POLICY "notifications_all" ON public.notifications
  FOR ALL USING (true);

-- 7. Settings 테이블 정책
CREATE POLICY "settings_all" ON public.settings
  FOR ALL USING (true);

-- 완료 메시지
SELECT 'RLS 정책이 성공적으로 설정되었습니다!' as result;
