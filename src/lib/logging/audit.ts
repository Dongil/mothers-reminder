// 감사 로그 및 활동 로깅 유틸리티
// v1.5: 관리자 행동 및 사용자 활동 기록

import { createClient } from '@/lib/supabase/server';
import type { AuditActorType, UserActivityType, Json } from '@/types/database';

/**
 * 감사 로그 기록
 */
export async function logAuditEvent(params: {
  actorId: string | null;
  actorType: AuditActorType;
  action: string;
  targetType?: string;
  targetId?: string;
  description?: string;
  oldValues?: Json;
  newValues?: Json;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('log_audit_event', {
      p_actor_id: params.actorId,
      p_actor_type: params.actorType,
      p_action: params.action,
      p_target_type: params.targetType || null,
      p_target_id: params.targetId || null,
      p_description: params.description || null,
      p_old_values: params.oldValues || null,
      p_new_values: params.newValues || null,
      p_ip_address: params.ipAddress || null,
      p_user_agent: params.userAgent || null,
    });

    if (error) {
      console.error('Audit log error:', error);
    }
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * 사용자 활동 로그 기록
 */
export async function logUserActivity(params: {
  userId: string;
  actionType: UserActivityType | string;
  familyId?: string;
  sessionId?: string;
  actionDetail?: Json;
}): Promise<void> {
  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('log_user_activity', {
      p_user_id: params.userId,
      p_action_type: params.actionType,
      p_family_id: params.familyId || null,
      p_session_id: params.sessionId || null,
      p_action_detail: params.actionDetail || null,
    });

    if (error) {
      console.error('User activity log error:', error);
    }
  } catch (error) {
    console.error('Failed to log user activity:', error);
  }
}

/**
 * TTS 사용 로그 기록
 */
export async function logTtsUsage(params: {
  userId: string;
  textLength: number;
  voice: string;
  speed?: number;
  familyId?: string;
  messageId?: string;
  textPreview?: string;
  durationSeconds?: number;
  audioSizeBytes?: number;
  status?: 'success' | 'error';
  errorMessage?: string;
}): Promise<void> {
  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('log_tts_usage', {
      p_user_id: params.userId,
      p_text_length: params.textLength,
      p_voice: params.voice,
      p_speed: params.speed || 1.0,
      p_family_id: params.familyId || null,
      p_message_id: params.messageId || null,
      p_text_preview: params.textPreview || null,
      p_duration_seconds: params.durationSeconds || null,
      p_audio_size_bytes: params.audioSizeBytes || null,
      p_status: params.status || 'success',
      p_error_message: params.errorMessage || null,
    });

    if (error) {
      console.error('TTS usage log error:', error);
    }
  } catch (error) {
    console.error('Failed to log TTS usage:', error);
  }
}
