/**
 * @fileoverview 웹 푸시 알림 발송 모듈
 *
 * 이 모듈은 web-push 라이브러리를 사용하여 웹 푸시 알림을 발송합니다.
 * 서버 사이드에서만 실행되며, VAPID 키를 사용한 인증을 통해
 * 구독된 브라우저에 푸시 알림을 전송합니다.
 *
 * 주요 기능:
 * - 특정 사용자에게 푸시 알림 발송
 * - 가족 관리자들에게 푸시 알림 발송
 * - 가족 멤버 전체에게 푸시 알림 발송
 * - 만료된 구독 자동 정리 (410 Gone 응답 시)
 * - 사용자별 알림 설정 확인
 *
 * 사용 시나리오:
 * - 새 메시지 작성 시 가족 멤버에게 알림
 * - 가족 참여 요청 시 관리자에게 알림
 *
 * @see usePushNotification - 클라이언트 사이드 구독 관리
 */

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import type { Database, PushSubscription } from '@/types/database';

// VAPID 설정
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

/** VAPID 키 설정 완료 여부 */
let vapidConfigured = false;

/**
 * VAPID 키 초기화
 *
 * 모듈 로드 시 VAPID 키를 설정합니다.
 * 키가 없거나 설정 실패 시 푸시 알림을 발송할 수 없습니다.
 */
if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(
      'mailto:admin@mothers-reminder.com',
      vapidPublicKey,
      vapidPrivateKey
    );
    vapidConfigured = true;
  } catch (err) {
    console.error('[Push] VAPID configuration failed:', err);
  }
} else {
  console.warn('[Push] VAPID keys not set:', {
    publicKey: !!vapidPublicKey,
    privateKey: !!vapidPrivateKey,
  });
}

/**
 * getAdminClient - Supabase Admin 클라이언트 생성
 *
 * @description Service Role Key를 사용하여 RLS를 우회하는 관리자 클라이언트를 생성합니다.
 * 서버 사이드에서만 사용해야 합니다.
 *
 * @returns {SupabaseClient} Admin 권한의 Supabase 클라이언트
 */
function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * 푸시 알림 페이로드 타입
 *
 * @property {string} title - 알림 제목
 * @property {string} body - 알림 본문
 * @property {string} [icon] - 알림 아이콘 URL
 * @property {string} [tag] - 알림 태그 (같은 태그는 덮어쓰기)
 * @property {object} [data] - 추가 데이터
 */
export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: string;
    [key: string]: unknown;
  };
}

/**
 * 푸시 발송 결과
 *
 * @property {number} success - 성공 횟수
 * @property {number} failed - 실패 횟수
 */
export interface PushResult {
  success: number;
  failed: number;
}

/**
 * sendPushToUser - 특정 사용자에게 푸시 알림 발송
 *
 * @description 사용자의 모든 등록된 구독(기기)에 푸시 알림을 발송합니다.
 * 여러 기기를 사용하는 사용자는 모든 기기에서 알림을 받습니다.
 *
 * 동작 흐름:
 *   1. VAPID 설정 확인
 *   2. push_subscriptions 테이블에서 사용자의 구독 조회
 *   3. 각 구독에 대해 web-push로 알림 발송
 *   4. 410 Gone 응답 시 만료된 구독 삭제
 *
 * @param {string} userId - 대상 사용자 ID
 * @param {PushPayload} payload - 알림 내용
 * @returns {Promise<PushResult>} 발송 결과 (성공/실패 횟수)
 *
 * @example
 * await sendPushToUser('user-uuid', {
 *   title: '새 메시지',
 *   body: '엄마가 메시지를 보냈습니다',
 *   icon: '/icons/icon.svg',
 * });
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<PushResult> {
  if (!vapidConfigured) {
    console.error('[Push] Cannot send push: VAPID not configured');
    return { success: 0, failed: 0 };
  }

  const supabase = getAdminClient();

  // 사용자의 모든 구독 조회
  const { data: subscriptionsData, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  const subscriptions = subscriptionsData as PushSubscription[] | null;

  if (error || !subscriptions || subscriptions.length === 0) {
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  // 각 구독(기기)에 알림 발송
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload)
      );
      success++;
    } catch (err: unknown) {
      const webPushError = err as { statusCode?: number };
      // 410 Gone: 구독이 만료됨 - 삭제
      if (webPushError.statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', sub.id);
      }
      failed++;
      console.error('[Push] Push failed for subscription:', sub.id, err);
    }
  }

  return { success, failed };
}

/**
 * sendPushToFamilyAdmins - 가족 관리자들에게 푸시 알림 발송
 *
 * @description 가족의 관리자 역할을 가진 멤버들에게 알림을 발송합니다.
 * 각 관리자의 알림 설정을 확인하여 비활성화된 경우 건너뜁니다.
 *
 * 사용 시나리오:
 * - 가족 참여 요청 알림
 * - 관리자 권한이 필요한 이벤트 알림
 *
 * 동작 흐름:
 *   1. family_members 테이블에서 role='admin'인 멤버 조회
 *   2. 각 관리자의 settings 조회하여 알림 설정 확인
 *   3. 알림이 활성화된 관리자에게만 발송
 *
 * @param {string} familyId - 가족 ID
 * @param {PushPayload} payload - 알림 내용
 * @param {string} [excludeUserId] - 제외할 사용자 ID (발송자 자신 제외용)
 * @param {'new_message'|'join_request'} [notificationType='join_request'] - 알림 유형
 * @returns {Promise<PushResult>} 발송 결과
 *
 * @example
 * // 가족 참여 요청 알림 (요청자 제외)
 * await sendPushToFamilyAdmins(
 *   'family-uuid',
 *   { title: '참여 요청', body: '홍길동님이 참여를 요청했습니다' },
 *   'requester-uuid',
 *   'join_request'
 * );
 */
export async function sendPushToFamilyAdmins(
  familyId: string,
  payload: PushPayload,
  excludeUserId?: string,
  notificationType: 'new_message' | 'join_request' = 'join_request'
): Promise<PushResult> {
  const supabase = getAdminClient();

  // 가족 관리자 목록 조회
  const { data: adminsData, error } = await supabase
    .from('family_members')
    .select('user_id')
    .eq('family_id', familyId)
    .eq('role', 'admin');

  const admins = adminsData as { user_id: string }[] | null;

  if (error || !admins || admins.length === 0) {
    return { success: 0, failed: 0 };
  }

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const admin of admins) {
    // 제외할 사용자 건너뛰기
    if (excludeUserId && admin.user_id === excludeUserId) continue;

    // 해당 사용자의 알림 설정 확인
    const { data: settingsData } = await supabase
      .from('settings')
      .select('notify_new_message, notify_join_request')
      .eq('user_id', admin.user_id)
      .single();

    // 설정이 없으면 기본값(true)으로 간주
    const settings = settingsData || { notify_new_message: true, notify_join_request: true };

    // 알림 타입에 따라 설정 확인
    const shouldNotify = notificationType === 'new_message'
      ? settings.notify_new_message !== false
      : settings.notify_join_request !== false;

    if (!shouldNotify) {
      continue;
    }

    const result = await sendPushToUser(admin.user_id, payload);
    totalSuccess += result.success;
    totalFailed += result.failed;
  }

  return { success: totalSuccess, failed: totalFailed };
}

/**
 * sendPushToFamilyMembers - 가족 멤버 전체에게 푸시 알림 발송
 *
 * @description 가족에 속한 모든 멤버에게 알림을 발송합니다.
 * 각 멤버의 알림 설정을 확인하여 비활성화된 경우 건너뜁니다.
 *
 * 사용 시나리오:
 * - 새 메시지 작성 시 가족 전체 알림
 *
 * 동작 흐름:
 *   1. family_members 테이블에서 가족 멤버 전체 조회
 *   2. 각 멤버의 settings 조회하여 알림 설정 확인
 *   3. 알림이 활성화된 멤버에게만 발송
 *   4. excludeUserId로 지정된 사용자는 제외 (메시지 작성자)
 *
 * @param {string} familyId - 가족 ID
 * @param {PushPayload} payload - 알림 내용
 * @param {string} [excludeUserId] - 제외할 사용자 ID (작성자 제외용)
 * @param {'new_message'|'join_request'} [notificationType='new_message'] - 알림 유형
 * @returns {Promise<PushResult>} 발송 결과
 *
 * @example
 * // 새 메시지 알림 (작성자 제외)
 * await sendPushToFamilyMembers(
 *   'family-uuid',
 *   { title: '새 메시지', body: '약 먹을 시간이에요', icon: '/icons/icon.svg' },
 *   'author-uuid',
 *   'new_message'
 * );
 */
export async function sendPushToFamilyMembers(
  familyId: string,
  payload: PushPayload,
  excludeUserId?: string,
  notificationType: 'new_message' | 'join_request' = 'new_message'
): Promise<PushResult> {
  const supabase = getAdminClient();

  // 가족 멤버 목록 조회
  const { data: membersData, error } = await supabase
    .from('family_members')
    .select('user_id')
    .eq('family_id', familyId);

  const members = membersData as { user_id: string }[] | null;

  if (error || !members || members.length === 0) {
    return { success: 0, failed: 0 };
  }

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const member of members) {
    // 제외할 사용자 건너뛰기 (보통 메시지 작성자)
    if (excludeUserId && member.user_id === excludeUserId) {
      continue;
    }

    // 해당 사용자의 알림 설정 확인
    const { data: settingsData } = await supabase
      .from('settings')
      .select('notify_new_message, notify_join_request')
      .eq('user_id', member.user_id)
      .single();

    // 설정이 없으면 기본값(true)으로 간주
    const settings = settingsData || { notify_new_message: true, notify_join_request: true };

    // 알림 타입에 따라 설정 확인
    const shouldNotify = notificationType === 'new_message'
      ? settings.notify_new_message !== false
      : settings.notify_join_request !== false;

    if (!shouldNotify) {
      continue;
    }

    const result = await sendPushToUser(member.user_id, payload);
    totalSuccess += result.success;
    totalFailed += result.failed;
  }

  return { success: totalSuccess, failed: totalFailed };
}
