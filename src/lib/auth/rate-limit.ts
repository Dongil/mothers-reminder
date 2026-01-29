// 로그인 시도 제한 유틸리티
// v1.5: 5회 실패 시 10분 잠금

import { createClient } from '@/lib/supabase/server';

export interface RateLimitResult {
  isLocked: boolean;
  failedAttempts: number;
  lockoutUntil: string | null;
  remainingAttempts: number;
}

interface RateLimitData {
  is_locked: boolean;
  failed_attempts: number;
  lockout_until: string | null;
  remaining_attempts: number;
}

/**
 * 로그인 시도 제한 체크
 * @param email 사용자 이메일
 * @returns 잠금 상태 정보
 */
export async function checkLoginRateLimit(email: string): Promise<RateLimitResult> {
  const supabase = await createClient();

  // Supabase RPC 함수 호출
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('check_login_rate_limit', {
    p_email: email,
  });

  if (error) {
    console.error('Rate limit check error:', error);
    // 에러 시 기본값 반환 (보안상 허용)
    return {
      isLocked: false,
      failedAttempts: 0,
      lockoutUntil: null,
      remainingAttempts: 5,
    };
  }

  const result = data as RateLimitData;

  return {
    isLocked: result.is_locked,
    failedAttempts: result.failed_attempts,
    lockoutUntil: result.lockout_until,
    remainingAttempts: result.remaining_attempts,
  };
}

/**
 * 로그인 시도 기록
 * @param email 사용자 이메일
 * @param success 성공 여부
 * @param ipAddress IP 주소 (옵션)
 * @param failureReason 실패 사유 (옵션)
 * @param userAgent User Agent (옵션)
 */
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress?: string | null,
  failureReason?: string | null,
  userAgent?: string | null
): Promise<void> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('record_login_attempt', {
    p_email: email,
    p_success: success,
    p_ip_address: ipAddress || null,
    p_failure_reason: failureReason || null,
    p_user_agent: userAgent || null,
  });

  if (error) {
    console.error('Record login attempt error:', error);
  }
}
