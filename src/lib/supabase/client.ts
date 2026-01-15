import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 싱글톤 인스턴스
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return null for build time
    return null;
  }

  // 이미 인스턴스가 있으면 재사용
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
}
