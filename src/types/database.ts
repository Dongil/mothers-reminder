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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
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
