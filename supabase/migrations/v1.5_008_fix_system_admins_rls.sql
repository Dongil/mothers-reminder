-- v1.5_008: system_admins RLS 정책 수정
-- 실행일: 2026-01-29
-- 설명: 무한 재귀 오류 수정 - SECURITY DEFINER 함수 사용

-- 기존 정책 삭제
DROP POLICY IF EXISTS "system_admins_manage_super" ON system_admins;

-- Super 관리자 체크 함수 (SECURITY DEFINER로 RLS 우회)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM system_admins
    WHERE user_id = auth.uid()
    AND 'super' = ANY(permissions)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 새 정책: super 권한자만 INSERT 가능
CREATE POLICY "system_admins_insert_super" ON system_admins
  FOR INSERT WITH CHECK (is_super_admin());

-- 새 정책: super 권한자만 UPDATE 가능
CREATE POLICY "system_admins_update_super" ON system_admins
  FOR UPDATE USING (is_super_admin());

-- 새 정책: super 권한자만 DELETE 가능
CREATE POLICY "system_admins_delete_super" ON system_admins
  FOR DELETE USING (is_super_admin());
