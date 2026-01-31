-- v1.5.3: 알림 설정 필드 추가
-- 사용자별 푸시 알림 수신 여부 설정

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS notify_join_request BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_new_message BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN settings.notify_join_request IS '가족 참여 요청 푸시 알림 수신 여부';
COMMENT ON COLUMN settings.notify_new_message IS '새 메시지 푸시 알림 수신 여부';
