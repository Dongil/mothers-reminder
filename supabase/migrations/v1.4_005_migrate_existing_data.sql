-- v1.4 Migration 005: 기존 데이터 마이그레이션
-- 실행일: 2026-01-27

-- 기존 users.family_id 데이터를 family_members 테이블로 복사
-- 기존 사용자들의 가족 관계를 유지하면서 다중 가족 지원으로 전환

INSERT INTO public.family_members (user_id, family_id, role, is_active, joined_at)
SELECT
  id as user_id,
  family_id,
  role,
  TRUE as is_active,  -- 기존 가족을 활성 가족으로 설정
  created_at as joined_at
FROM public.users
WHERE family_id IS NOT NULL
ON CONFLICT (user_id, family_id) DO NOTHING;

-- 참고: users.family_id 컬럼은 하위 호환성을 위해 유지
-- 향후 버전에서 제거 예정

-- Family 테이블 조회 정책 업데이트 (family_members 기반으로 변경)
-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "family_select" ON public.family;

CREATE POLICY "family_select" ON public.family
  FOR SELECT USING (
    id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
    OR created_by = auth.uid()
  );

-- Family 테이블 삽입 정책 추가 (인증된 사용자 누구나 가족 생성 가능)
DROP POLICY IF EXISTS "family_insert" ON public.family;

CREATE POLICY "family_insert" ON public.family
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Family 테이블 수정 정책 (생성자만)
DROP POLICY IF EXISTS "family_update" ON public.family;

CREATE POLICY "family_update" ON public.family
  FOR UPDATE USING (created_by = auth.uid());

-- Family 테이블 삭제 정책 (생성자만)
DROP POLICY IF EXISTS "family_delete" ON public.family;

CREATE POLICY "family_delete" ON public.family
  FOR DELETE USING (created_by = auth.uid());

-- Messages 정책 업데이트 (family_members 기반으로 변경)
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;

CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Users 정책 업데이트 (family_members 기반으로 변경)
DROP POLICY IF EXISTS "users_select" ON public.users;

CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (
    id = auth.uid()
    OR id IN (
      SELECT fm2.user_id FROM public.family_members fm1
      JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid()
    )
  );

-- Realtime 활성화 (family_members)
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_join_requests;
