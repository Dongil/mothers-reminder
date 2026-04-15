-- ============================================================
-- RLS v4 - 무한 재귀 수정
-- v3에서 users/family_members 정책이 자기 자신을 참조해 무한 재귀 발생
-- SECURITY DEFINER 함수로 우회
-- ============================================================

-- 1. SECURITY DEFINER 헬퍼 함수: 사용자의 family_id 조회 (RLS 우회)
CREATE OR REPLACE FUNCTION public.get_user_family_id(uid uuid)
RETURNS uuid
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth
AS $$
  SELECT family_id FROM public.users WHERE id = uid
$$;

-- 2. SECURITY DEFINER 헬퍼 함수: 사용자가 속한 family_ids 조회 (family_members)
CREATE OR REPLACE FUNCTION public.get_user_family_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth
AS $$
  SELECT family_id FROM public.family_members WHERE user_id = uid
$$;

-- 3. SECURITY DEFINER 헬퍼 함수: 사용자가 admin인 family_ids 조회
CREATE OR REPLACE FUNCTION public.get_user_admin_family_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth
AS $$
  SELECT family_id FROM public.family_members WHERE user_id = uid AND role = 'admin'
$$;

-- 4. SECURITY DEFINER 헬퍼 함수: 시스템 관리자 여부
CREATE OR REPLACE FUNCTION public.is_system_admin(uid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth
AS $$
  SELECT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = uid)
$$;

-- ============================================================
-- 기존 정책 삭제 후 재생성
-- ============================================================

-- users 정책
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      id = auth.uid()
      OR family_id = public.get_user_family_id(auth.uid())
    )
  );

-- messages 정책 (users 자기참조 우회)
DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    family_id = public.get_user_family_id(auth.uid())
  );

-- family_members 정책 (자기참조 우회)
DROP POLICY IF EXISTS "family_members_select" ON public.family_members;
CREATE POLICY "family_members_select" ON public.family_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR family_id IN (SELECT public.get_user_family_ids(auth.uid()))
  );

-- family_join_requests 관리자 정책 (family_members 참조 우회)
DROP POLICY IF EXISTS "join_requests_admin_select" ON public.family_join_requests;
CREATE POLICY "join_requests_admin_select" ON public.family_join_requests
  FOR SELECT USING (
    family_id IN (SELECT public.get_user_admin_family_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "join_requests_admin_update" ON public.family_join_requests;
CREATE POLICY "join_requests_admin_update" ON public.family_join_requests
  FOR UPDATE USING (
    family_id IN (SELECT public.get_user_admin_family_ids(auth.uid()))
  );

-- system_admins 정책 (자기참조 우회)
DROP POLICY IF EXISTS "system_admins_manage" ON public.system_admins;
CREATE POLICY "system_admins_manage" ON public.system_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.system_admins
      WHERE user_id = auth.uid() AND 'super' = ANY(permissions)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.system_admins
      WHERE user_id = auth.uid() AND 'super' = ANY(permissions)
    )
  );

-- 로그/통계 정책 (system_admins 참조 우회)
DROP POLICY IF EXISTS "login_attempts_admin_select" ON public.login_attempts;
CREATE POLICY "login_attempts_admin_select" ON public.login_attempts
  FOR SELECT USING (public.is_system_admin(auth.uid()));

DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
  FOR SELECT USING (public.is_system_admin(auth.uid()));

DROP POLICY IF EXISTS "user_activity_logs_select" ON public.user_activity_logs;
CREATE POLICY "user_activity_logs_select" ON public.user_activity_logs
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_system_admin(auth.uid())
  );

DROP POLICY IF EXISTS "tts_usage_logs_select" ON public.tts_usage_logs;
CREATE POLICY "tts_usage_logs_select" ON public.tts_usage_logs
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_system_admin(auth.uid())
  );

DROP POLICY IF EXISTS "daily_stats_admin_select" ON public.daily_stats;
CREATE POLICY "daily_stats_admin_select" ON public.daily_stats
  FOR SELECT USING (public.is_system_admin(auth.uid()));

DROP POLICY IF EXISTS "daily_stats_insert" ON public.daily_stats;
CREATE POLICY "daily_stats_insert" ON public.daily_stats
  FOR INSERT WITH CHECK (public.is_system_admin(auth.uid()));

SELECT 'RLS v4 (재귀 수정) 적용 완료!' as result;
