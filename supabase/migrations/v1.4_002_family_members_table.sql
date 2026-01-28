-- v1.4 Migration 002: Family Members 테이블 생성 (다중 가족 지원)
-- 실행일: 2026-01-27

-- family_members 테이블 생성
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.family(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_active BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, family_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON public.family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_is_active ON public.family_members(is_active);

-- RLS 활성화
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 기록 조회
CREATE POLICY "family_members_select_own" ON public.family_members
  FOR SELECT USING (user_id = auth.uid());

-- RLS 정책: 같은 가족 구성원 조회
CREATE POLICY "family_members_select_family" ON public.family_members
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

-- RLS 정책: 본인 기록 삽입
CREATE POLICY "family_members_insert" ON public.family_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS 정책: 본인 기록 수정 (활성 가족 변경 등)
CREATE POLICY "family_members_update_own" ON public.family_members
  FOR UPDATE USING (user_id = auth.uid());

-- RLS 정책: 본인 기록 삭제 (가족 탈퇴)
CREATE POLICY "family_members_delete_own" ON public.family_members
  FOR DELETE USING (user_id = auth.uid());
