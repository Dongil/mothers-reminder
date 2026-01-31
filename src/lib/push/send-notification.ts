import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import type { Database, PushSubscription } from '@/types/database';

// VAPID 설정
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:admin@mothers-reminder.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

// Supabase Admin 클라이언트 (서버 전용)
function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

export interface PushResult {
  success: number;
  failed: number;
}

/**
 * 특정 사용자에게 푸시 알림 발송
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<PushResult> {
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
        console.log(`Deleted expired subscription: ${sub.id}`);
      }
      failed++;
      console.error(`Push failed for subscription ${sub.id}:`, err);
    }
  }

  return { success, failed };
}

/**
 * 가족 관리자들에게 푸시 알림 발송
 */
export async function sendPushToFamilyAdmins(
  familyId: string,
  payload: PushPayload,
  excludeUserId?: string
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

    const result = await sendPushToUser(admin.user_id, payload);
    totalSuccess += result.success;
    totalFailed += result.failed;
  }

  return { success: totalSuccess, failed: totalFailed };
}

/**
 * 가족 멤버들에게 푸시 알림 발송 (알림 설정 확인)
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
    // 제외할 사용자 건너뛰기
    if (excludeUserId && member.user_id === excludeUserId) continue;

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

    if (!shouldNotify) continue;

    const result = await sendPushToUser(member.user_id, payload);
    totalSuccess += result.success;
    totalFailed += result.failed;
  }

  return { success: totalSuccess, failed: totalFailed };
}
