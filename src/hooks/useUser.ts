'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Family, FamilyMember } from '@/types/database';

interface UserWithFamily extends User {
  activeFamily: Family | null;
  activeMembership: FamilyMember | null;
}

interface UseUserReturn {
  user: UserWithFamily | null;
  loading: boolean;
  error: string | null;
  hasFamily: boolean;
  refreshUser: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<UserWithFamily | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchUser = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // 현재 인증된 사용자 확인
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // 사용자 프로필 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) {
        throw new Error('사용자 정보를 불러오는데 실패했습니다');
      }

      // 활성 가족 조회
      const { data: membershipData } = await supabase
        .from('family_members')
        .select(`
          *,
          family:family_id (*)
        `)
        .eq('user_id', authUser.id)
        .eq('is_active', true)
        .single();

      const membership = membershipData as (FamilyMember & { family: Family }) | null;

      setUser({
        ...(userData as User),
        activeFamily: membership?.family || null,
        activeMembership: membership ? {
          id: membership.id,
          user_id: membership.user_id,
          family_id: membership.family_id,
          role: membership.role,
          is_active: membership.is_active,
          joined_at: membership.joined_at,
        } : null,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // 인증 상태 변경 감지
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          fetchUser();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchUser]);

  return {
    user,
    loading,
    error,
    hasFamily: !!user?.activeFamily,
    refreshUser: fetchUser,
  };
}
