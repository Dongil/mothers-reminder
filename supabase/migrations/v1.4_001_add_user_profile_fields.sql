-- v1.4 Migration 001: Users 테이블에 gender, nickname 필드 추가
-- 실행일: 2026-01-27

-- gender 필드 추가 (male/female)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- nickname 필드 추가
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 기존 사용자의 nickname을 name으로 초기화 (NULL인 경우)
UPDATE public.users
SET nickname = name
WHERE nickname IS NULL;
