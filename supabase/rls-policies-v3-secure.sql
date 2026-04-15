-- ============================================================
-- RLS 정책 v3 - 보안 강화 버전
-- Supabase SQL Editor에서 실행하세요
--
-- 변경사항 (v2 → v3):
--   v2: 모든 테이블 FOR ALL USING (true) - 보안 없음
--   v3: 각 테이블별 적절한 권한 분리
-- ============================================================

-- ============================================================
-- STEP 1: 기존 정책 모두 삭제
-- ============================================================

-- family 테이블
DROP POLICY IF EXISTS "family_all" ON public.family;
DROP POLICY IF EXISTS "family_select" ON public.family;
DROP POLICY IF EXISTS "family_insert" ON public.family;
DROP POLICY IF EXISTS "family_update" ON public.family;
DROP POLICY IF EXISTS "family_delete" ON public.family;

-- users 테이블
DROP POLICY IF EXISTS "users_all" ON public.users;
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;

-- messages 테이블
DROP POLICY IF EXISTS "messages_all" ON public.messages;
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;

-- notifications 테이블
DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

-- settings 테이블
DROP POLICY IF EXISTS "settings_all" ON public.settings;

-- family_members 테이블
DROP POLICY IF EXISTS "family_members_select_own" ON public.family_members;
DROP POLICY IF EXISTS "family_members_select_family" ON public.family_members;
DROP POLICY IF EXISTS "family_members_select" ON public.family_members;
DROP POLICY IF EXISTS "family_members_insert" ON public.family_members;
DROP POLICY IF EXISTS "family_members_update_own" ON public.family_members;
DROP POLICY IF EXISTS "family_members_update" ON public.family_members;
DROP POLICY IF EXISTS "family_members_delete_own" ON public.family_members;
DROP POLICY IF EXISTS "family_members_delete" ON public.family_members;

-- family_join_requests 테이블
DROP POLICY IF EXISTS "join_requests_own" ON public.family_join_requests;
DROP POLICY IF EXISTS "join_requests_admin_select" ON public.family_join_requests;
DROP POLICY IF EXISTS "join_requests_admin_update" ON public.family_join_requests;

-- push_subscriptions 테이블
DROP POLICY IF EXISTS "push_subscriptions_all" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_own" ON public.push_subscriptions;

-- system_admins 테이블
DROP POLICY IF EXISTS "system_admins_select_own" ON public.system_admins;
DROP POLICY IF EXISTS "system_admins_manage" ON public.system_admins;
DROP POLICY IF EXISTS "system_admins_insert_super" ON public.system_admins;
DROP POLICY IF EXISTS "system_admins_update_super" ON public.system_admins;
DROP POLICY IF EXISTS "system_admins_delete_super" ON public.system_admins;

-- login_attempts 테이블
DROP POLICY IF EXISTS "login_attempts_admin_select" ON public.login_attempts;
DROP POLICY IF EXISTS "login_attempts_select_admin" ON public.login_attempts;
DROP POLICY IF EXISTS "login_attempts_insert" ON public.login_attempts;

-- audit_logs 테이블
DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;

-- user_activity_logs 테이블
DROP POLICY IF EXISTS "user_activity_logs_select" ON public.user_activity_logs;
DROP POLICY IF EXISTS "user_activity_logs_select_own" ON public.user_activity_logs;
DROP POLICY IF EXISTS "user_activity_logs_select_admin" ON public.user_activity_logs;
DROP POLICY IF EXISTS "user_activity_logs_insert" ON public.user_activity_logs;

-- tts_usage_logs 테이블
DROP POLICY IF EXISTS "tts_usage_logs_select" ON public.tts_usage_logs;
DROP POLICY IF EXISTS "tts_usage_logs_select_own" ON public.tts_usage_logs;
DROP POLICY IF EXISTS "tts_usage_logs_select_admin" ON public.tts_usage_logs;
DROP POLICY IF EXISTS "tts_usage_logs_insert" ON public.tts_usage_logs;

-- daily_stats 테이블
DROP POLICY IF EXISTS "daily_stats_admin_select" ON public.daily_stats;
DROP POLICY IF EXISTS "daily_stats_select_admin" ON public.daily_stats;
DROP POLICY IF EXISTS "daily_stats_insert" ON public.daily_stats;

-- ============================================================
-- STEP 2: 모든 테이블에 RLS 활성화 (이미 활성화된 경우 무시)
-- ============================================================

ALTER TABLE public.family ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tts_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: Family 테이블 정책
-- 조회: 인증된 사용자 (가족 코드 검색에 필요)
-- 생성: 인증된 사용자 (회원가입 시 가족 생성)
-- ============================================================

CREATE POLICY "family_select" ON public.family
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "family_insert" ON public.family
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "family_update" ON public.family
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "family_delete" ON public.family
  FOR DELETE USING (created_by = auth.uid());

-- ============================================================
-- STEP 4: Users 테이블 정책
-- 조회: 인증된 사용자 (같은 가족 + 본인)
-- 생성: 본인만 (회원가입 시)
-- 수정: 본인만
-- ============================================================

CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      id = auth.uid()
      OR family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- STEP 5: Messages 테이블 정책
-- 조회: 인증된 사용자 (같은 가족)
-- 생성: 인증된 사용자
-- 수정/삭제: 작성자만
-- ============================================================

CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE USING (author_id = auth.uid());

-- ============================================================
-- STEP 6: Notifications 테이블 정책
-- 본인 알림만 접근
-- ============================================================

CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- STEP 7: Settings 테이블 정책
-- 본인 설정만 접근
-- ============================================================

CREATE POLICY "settings_all" ON public.settings
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- STEP 8: Family Members 테이블 정책
-- ============================================================

CREATE POLICY "family_members_select" ON public.family_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR family_id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "family_members_insert" ON public.family_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "family_members_update" ON public.family_members
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "family_members_delete" ON public.family_members
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- STEP 9: Family Join Requests 테이블 정책
-- ============================================================

-- 본인 요청 전체 접근
CREATE POLICY "join_requests_own" ON public.family_join_requests
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 가족 관리자가 요청 조회
CREATE POLICY "join_requests_admin_select" ON public.family_join_requests
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 가족 관리자가 요청 수락/거절
CREATE POLICY "join_requests_admin_update" ON public.family_join_requests
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- STEP 10: Push Subscriptions 테이블 정책
-- 본인 구독만 접근 (서버에서 service_role로 전체 조회)
-- ============================================================

CREATE POLICY "push_subscriptions_own" ON public.push_subscriptions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- STEP 11: Admin/Logging 테이블 정책
-- system_admins에 등록된 사용자만 접근
-- ============================================================

-- System Admins: 본인 확인 + super admin 관리
CREATE POLICY "system_admins_select_own" ON public.system_admins
  FOR SELECT USING (user_id = auth.uid());

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

-- Login Attempts: 시스템 관리자만
CREATE POLICY "login_attempts_admin_select" ON public.login_attempts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = auth.uid())
  );

-- 서버에서 삽입 (service_role 사용하므로 클라이언트 삽입 정책 불필요)
CREATE POLICY "login_attempts_insert" ON public.login_attempts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Audit Logs: 시스템 관리자만 조회
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- User Activity Logs: 본인 또는 시스템 관리자
CREATE POLICY "user_activity_logs_select" ON public.user_activity_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "user_activity_logs_insert" ON public.user_activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- TTS Usage Logs: 본인 또는 시스템 관리자
CREATE POLICY "tts_usage_logs_select" ON public.tts_usage_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "tts_usage_logs_insert" ON public.tts_usage_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Daily Stats: 시스템 관리자만
CREATE POLICY "daily_stats_admin_select" ON public.daily_stats
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "daily_stats_insert" ON public.daily_stats
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = auth.uid())
  );

-- ============================================================
-- 완료
-- ============================================================
SELECT 'RLS 정책 v3 (보안 강화) 적용 완료!' as result;
