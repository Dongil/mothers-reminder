-- v1.4 Migration 004: Settings 테이블에 night_mode_enabled 필드 추가
-- 실행일: 2026-01-27

-- night_mode_enabled 필드 추가
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS night_mode_enabled BOOLEAN DEFAULT TRUE;
