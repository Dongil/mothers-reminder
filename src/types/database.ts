export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      family: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          role: 'admin' | 'member';
          relationship: string | null;
          photo_url: string | null;
          family_id: string | null;
          gender: 'male' | 'female' | null;
          nickname: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deletion_requested_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          phone?: string | null;
          role?: 'admin' | 'member';
          relationship?: string | null;
          photo_url?: string | null;
          family_id?: string | null;
          gender?: 'male' | 'female' | null;
          nickname?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deletion_requested_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          role?: 'admin' | 'member';
          relationship?: string | null;
          photo_url?: string | null;
          family_id?: string | null;
          gender?: 'male' | 'female' | null;
          nickname?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deletion_requested_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          author_id: string;
          family_id: string;
          content: string;
          priority: 'normal' | 'important' | 'urgent';
          display_date: string;
          display_time: string | null;
          display_duration: number;
          display_forever: boolean;
          photo_url: string | null;
          tts_enabled: boolean;
          tts_times: string[] | null;
          tts_voice: string;
          tts_speed: number;
          background_sound: string;
          repeat_pattern: 'none' | 'daily' | 'weekly' | 'monthly' | null;
          repeat_weekdays: number[] | null;
          repeat_month_day: number | null;
          repeat_start: string | null;
          repeat_end: string | null;
          is_dday: boolean;
          dday_date: string | null;
          dday_label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          family_id: string;
          content: string;
          priority?: 'normal' | 'important' | 'urgent';
          display_date: string;
          display_time?: string | null;
          display_duration?: number;
          display_forever?: boolean;
          photo_url?: string | null;
          tts_enabled?: boolean;
          tts_times?: string[] | null;
          tts_voice?: string;
          tts_speed?: number;
          background_sound?: string;
          repeat_pattern?: 'none' | 'daily' | 'weekly' | 'monthly' | null;
          repeat_weekdays?: number[] | null;
          repeat_month_day?: number | null;
          repeat_start?: string | null;
          repeat_end?: string | null;
          is_dday?: boolean;
          dday_date?: string | null;
          dday_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          family_id?: string;
          content?: string;
          priority?: 'normal' | 'important' | 'urgent';
          display_date?: string;
          display_time?: string | null;
          display_duration?: number;
          display_forever?: boolean;
          photo_url?: string | null;
          tts_enabled?: boolean;
          tts_times?: string[] | null;
          tts_voice?: string;
          tts_speed?: number;
          background_sound?: string;
          repeat_pattern?: 'none' | 'daily' | 'weekly' | 'monthly' | null;
          repeat_weekdays?: number[] | null;
          repeat_month_day?: number | null;
          repeat_start?: string | null;
          repeat_end?: string | null;
          is_dday?: boolean;
          dday_date?: string | null;
          dday_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          message_id: string;
          type: string;
          sent_at: string;
          status: 'sent' | 'failed' | 'pending';
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message_id: string;
          type: string;
          sent_at?: string;
          status?: 'sent' | 'failed' | 'pending';
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          message_id?: string;
          type?: string;
          sent_at?: string;
          status?: 'sent' | 'failed' | 'pending';
          error_message?: string | null;
          created_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          user_id: string;
          night_mode_enabled: boolean;
          night_mode_start: string;
          night_mode_end: string;
          tts_voice: string;
          tts_speed: number;
          volume_day: number;
          volume_night: number;
          ui_mode: 'touch' | 'voice';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          night_mode_enabled?: boolean;
          night_mode_start?: string;
          night_mode_end?: string;
          tts_voice?: string;
          tts_speed?: number;
          volume_day?: number;
          volume_night?: number;
          ui_mode?: 'touch' | 'voice';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          night_mode_enabled?: boolean;
          night_mode_start?: string;
          night_mode_end?: string;
          tts_voice?: string;
          tts_speed?: number;
          volume_day?: number;
          volume_night?: number;
          ui_mode?: 'touch' | 'voice';
          created_at?: string;
          updated_at?: string;
        };
      };
      family_members: {
        Row: {
          id: string;
          user_id: string;
          family_id: string;
          role: 'admin' | 'member';
          is_active: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          family_id: string;
          role?: 'admin' | 'member';
          is_active?: boolean;
          joined_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          family_id?: string;
          role?: 'admin' | 'member';
          is_active?: boolean;
          joined_at?: string;
        };
      };
      family_join_requests: {
        Row: {
          id: string;
          user_id: string;
          family_id: string;
          status: 'pending' | 'accepted' | 'rejected';
          message: string | null;
          created_at: string;
          responded_at: string | null;
          responded_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          family_id: string;
          status?: 'pending' | 'accepted' | 'rejected';
          message?: string | null;
          created_at?: string;
          responded_at?: string | null;
          responded_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          family_id?: string;
          status?: 'pending' | 'accepted' | 'rejected';
          message?: string | null;
          created_at?: string;
          responded_at?: string | null;
          responded_by?: string | null;
        };
      };
      // v1.5 새 테이블들
      system_admins: {
        Row: {
          id: string;
          user_id: string;
          permissions: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          permissions?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          permissions?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      login_attempts: {
        Row: {
          id: string;
          email: string;
          ip_address: string | null;
          success: boolean;
          failure_reason: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          ip_address?: string | null;
          success?: boolean;
          failure_reason?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          ip_address?: string | null;
          success?: boolean;
          failure_reason?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_type: string;
          action: string;
          target_type: string | null;
          target_id: string | null;
          description: string | null;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_type?: string;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          description?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          actor_type?: string;
          action?: string;
          target_type?: string | null;
          target_id?: string | null;
          description?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      user_activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          family_id: string | null;
          session_id: string | null;
          action_type: string;
          action_detail: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          family_id?: string | null;
          session_id?: string | null;
          action_type: string;
          action_detail?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          family_id?: string | null;
          session_id?: string | null;
          action_type?: string;
          action_detail?: Json | null;
          created_at?: string;
        };
      };
      tts_usage_logs: {
        Row: {
          id: string;
          user_id: string | null;
          family_id: string | null;
          message_id: string | null;
          text_length: number;
          text_preview: string | null;
          voice: string;
          speed: number;
          duration_seconds: number | null;
          audio_size_bytes: number | null;
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          family_id?: string | null;
          message_id?: string | null;
          text_length: number;
          text_preview?: string | null;
          voice: string;
          speed?: number;
          duration_seconds?: number | null;
          audio_size_bytes?: number | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          family_id?: string | null;
          message_id?: string | null;
          text_length?: number;
          text_preview?: string | null;
          voice?: string;
          speed?: number;
          duration_seconds?: number | null;
          audio_size_bytes?: number | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
      };
      daily_stats: {
        Row: {
          id: string;
          stat_date: string;
          stat_type: string;
          entity_id: string | null;
          active_users: number;
          new_users: number;
          total_logins: number;
          messages_created: number;
          messages_viewed: number;
          tts_requests: number;
          tts_total_chars: number;
          tts_duration_seconds: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          stat_date: string;
          stat_type: string;
          entity_id?: string | null;
          active_users?: number;
          new_users?: number;
          total_logins?: number;
          messages_created?: number;
          messages_viewed?: number;
          tts_requests?: number;
          tts_total_chars?: number;
          tts_duration_seconds?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          stat_date?: string;
          stat_type?: string;
          entity_id?: string | null;
          active_users?: number;
          new_users?: number;
          total_logins?: number;
          messages_created?: number;
          messages_viewed?: number;
          tts_requests?: number;
          tts_total_chars?: number;
          tts_duration_seconds?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      // v1.5.2 Push Subscriptions
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_login_rate_limit: {
        Args: { p_email: string };
        Returns: {
          is_locked: boolean;
          failed_attempts: number;
          lockout_until: string | null;
          remaining_attempts: number;
        };
      };
      record_login_attempt: {
        Args: {
          p_email: string;
          p_success: boolean;
          p_ip_address?: string | null;
          p_failure_reason?: string | null;
          p_user_agent?: string | null;
        };
        Returns: string;
      };
      request_account_deletion: {
        Args: { p_user_id: string };
        Returns: {
          success: boolean;
          error?: string;
          deletion_requested_at?: string;
          scheduled_deletion_at?: string;
        };
      };
      cancel_account_deletion: {
        Args: { p_user_id: string };
        Returns: {
          success: boolean;
          error?: string;
        };
      };
      log_audit_event: {
        Args: {
          p_actor_id: string | null;
          p_actor_type: string;
          p_action: string;
          p_target_type?: string | null;
          p_target_id?: string | null;
          p_description?: string | null;
          p_old_values?: Json | null;
          p_new_values?: Json | null;
          p_ip_address?: string | null;
          p_user_agent?: string | null;
        };
        Returns: string;
      };
      log_user_activity: {
        Args: {
          p_user_id: string;
          p_action_type: string;
          p_family_id?: string | null;
          p_session_id?: string | null;
          p_action_detail?: Json | null;
        };
        Returns: string;
      };
      log_tts_usage: {
        Args: {
          p_user_id: string;
          p_text_length: number;
          p_voice: string;
          p_speed?: number;
          p_family_id?: string | null;
          p_message_id?: string | null;
          p_text_preview?: string | null;
          p_duration_seconds?: number | null;
          p_audio_size_bytes?: number | null;
          p_status?: string;
          p_error_message?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// 편의를 위한 타입 별칭
export type Family = Database['public']['Tables']['family']['Row'];
export type FamilyInsert = Database['public']['Tables']['family']['Insert'];
export type FamilyUpdate = Database['public']['Tables']['family']['Update'];

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export type Settings = Database['public']['Tables']['settings']['Row'];
export type SettingsInsert = Database['public']['Tables']['settings']['Insert'];
export type SettingsUpdate = Database['public']['Tables']['settings']['Update'];

// 메시지 중요도 타입
export type Priority = 'normal' | 'important' | 'urgent';

// 반복 패턴 타입
export type RepeatPattern = 'none' | 'daily' | 'weekly' | 'monthly';

// 성별 타입
export type Gender = 'male' | 'female';

// 가족 멤버 타입 별칭
export type FamilyMember = Database['public']['Tables']['family_members']['Row'];
export type FamilyMemberInsert = Database['public']['Tables']['family_members']['Insert'];
export type FamilyMemberUpdate = Database['public']['Tables']['family_members']['Update'];

// 가족 참여 요청 타입 별칭
export type FamilyJoinRequest = Database['public']['Tables']['family_join_requests']['Row'];
export type FamilyJoinRequestInsert = Database['public']['Tables']['family_join_requests']['Insert'];
export type FamilyJoinRequestUpdate = Database['public']['Tables']['family_join_requests']['Update'];

// 참여 요청 상태 타입
export type JoinRequestStatus = 'pending' | 'accepted' | 'rejected';

// v1.5 새 타입 별칭
export type SystemAdmin = Database['public']['Tables']['system_admins']['Row'];
export type SystemAdminInsert = Database['public']['Tables']['system_admins']['Insert'];
export type SystemAdminUpdate = Database['public']['Tables']['system_admins']['Update'];

export type LoginAttempt = Database['public']['Tables']['login_attempts']['Row'];
export type LoginAttemptInsert = Database['public']['Tables']['login_attempts']['Insert'];
export type LoginAttemptUpdate = Database['public']['Tables']['login_attempts']['Update'];

export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];
export type AuditLogUpdate = Database['public']['Tables']['audit_logs']['Update'];

export type UserActivityLog = Database['public']['Tables']['user_activity_logs']['Row'];
export type UserActivityLogInsert = Database['public']['Tables']['user_activity_logs']['Insert'];
export type UserActivityLogUpdate = Database['public']['Tables']['user_activity_logs']['Update'];

export type TtsUsageLog = Database['public']['Tables']['tts_usage_logs']['Row'];
export type TtsUsageLogInsert = Database['public']['Tables']['tts_usage_logs']['Insert'];
export type TtsUsageLogUpdate = Database['public']['Tables']['tts_usage_logs']['Update'];

export type DailyStat = Database['public']['Tables']['daily_stats']['Row'];
export type DailyStatInsert = Database['public']['Tables']['daily_stats']['Insert'];
export type DailyStatUpdate = Database['public']['Tables']['daily_stats']['Update'];

// v1.5.2 Push Subscriptions 타입 별칭
export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row'];
export type PushSubscriptionInsert = Database['public']['Tables']['push_subscriptions']['Insert'];
export type PushSubscriptionUpdate = Database['public']['Tables']['push_subscriptions']['Update'];

// 시스템 관리자 권한 타입
export type AdminPermission = 'read' | 'write' | 'super';

// 감사 로그 액터 타입
export type AuditActorType = 'user' | 'admin' | 'system';

// 사용자 활동 타입
export type UserActivityType =
  | 'login'
  | 'logout'
  | 'page_view'
  | 'message_create'
  | 'message_view'
  | 'tts_play'
  | 'settings_change';
