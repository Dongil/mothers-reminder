import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 싱글톤 인스턴스
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return null for build time
    return null;
  }

  // 이미 인스턴스가 있으면 재사용
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'mothers-reminder-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  }

  return supabaseInstance;
}
