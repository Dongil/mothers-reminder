-- ============================================================
-- RLS v4.1 - 다중 가족 지원 수정
-- users.family_id가 NULL이고 family_members.is_active로 활성 가족 관리하는 케이스 지원
-- ============================================================

-- 활성 가족 ID (is_active=true 우선, 없으면 users.family_id)
CREATE OR REPLACE FUNCTION public.get_user_family_id(uid uuid)
RETURNS uuid
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    (SELECT family_id FROM public.family_members WHERE user_id = uid AND is_active = true LIMIT 1),
    (SELECT family_id FROM public.users WHERE id = uid)
  )
$$;

-- 사용자가 속한 모든 family_ids (참여한 모든 가족)
CREATE OR REPLACE FUNCTION public.get_user_family_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth
AS $$
  SELECT family_id FROM public.family_members WHERE user_id = uid
$$;

-- messages: 참여한 모든 가족의 메시지 조회 가능
DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    family_id IN (SELECT public.get_user_family_ids(auth.uid()))
  );

-- users: 참여한 모든 가족의 사용자 조회 가능
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      id = auth.uid()
      OR family_id IN (SELECT public.get_user_family_ids(auth.uid()))
    )
  );

SELECT 'RLS v4.1 (다중 가족 지원) 적용 완료!' as result;
