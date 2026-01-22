-- 메시지에 표시 시간 필드 추가 (HH:MM 형식, NULL = 종일)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS display_time TEXT DEFAULT NULL;

-- 표시 시간으로 조회할 때 성능 향상을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_messages_display_time
ON public.messages(display_time);

-- 표시 날짜 + 시간 복합 인덱스 (날짜별 시간순 조회용)
CREATE INDEX IF NOT EXISTS idx_messages_display_date_time
ON public.messages(display_date, display_time);
