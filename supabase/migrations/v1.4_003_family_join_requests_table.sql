-- v1.4 Migration 003: Family Join Requests 테이블 생성
-- 실행일: 2026-01-27

-- family_join_requests 테이블 생성
CREATE TABLE IF NOT EXISTS public.family_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.family(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES public.users(id)
);

-- 동일 사용자의 동일 가족 pending 요청은 하나만 허용
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_request
  ON public.family_join_requests(user_id, family_id)
  WHERE status = 'pending';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON public.family_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_family_id ON public.family_join_requests(family_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON public.family_join_requests(status);

-- RLS 활성화
ALTER TABLE public.family_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 요청 조회/삽입/수정/삭제
CREATE POLICY "join_requests_own" ON public.family_join_requests
  FOR ALL USING (user_id = auth.uid());

-- RLS 정책: 가족 관리자가 해당 가족 요청 조회
CREATE POLICY "join_requests_admin_select" ON public.family_join_requests
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS 정책: 가족 관리자가 요청 수락/거절 (UPDATE)
CREATE POLICY "join_requests_admin_update" ON public.family_join_requests
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
