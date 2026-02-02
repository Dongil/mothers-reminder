-- v1.5.5 반복 메시지 추가 필드
-- 반복 메시지 이름 (리스트 표시용)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS repeat_name TEXT;

-- 반복 활성화 여부 (기본값: true)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS repeat_enabled BOOLEAN DEFAULT TRUE;

-- 건너뛸 날짜들 (특정 날짜만 스킵)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS repeat_skip_dates DATE[];

-- 코멘트 추가
COMMENT ON COLUMN public.messages.repeat_name IS '반복 메시지 이름 (리스트 표시용)';
COMMENT ON COLUMN public.messages.repeat_enabled IS '반복 활성화 여부';
COMMENT ON COLUMN public.messages.repeat_skip_dates IS '건너뛸 날짜 목록';
