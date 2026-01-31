'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Family, FamilyMember } from '@/types/database';

interface AdminInfo {
  name: string;
  nickname: string | null;
}

interface MemberInfo {
  id: string;
  name: string;
  nickname: string | null;
}

interface FamilyWithMembership {
  membership: FamilyMember;
  family: Family;
  admin: AdminInfo | null;
  members: MemberInfo[];
}

interface UseFamiliesReturn {
  families: FamilyWithMembership[];
  loading: boolean;
  error: string | null;
  refreshFamilies: () => Promise<void>;
  createFamily: (name: string) => Promise<Family | null>;
  updateFamily: (id: string, name: string) => Promise<boolean>;
  deleteFamily: (id: string) => Promise<boolean>;
  setActiveFamily: (familyId: string) => Promise<boolean>;
  leaveFamily: (familyId: string) => Promise<boolean>;
}

export function useFamilies(): UseFamiliesReturn {
  const [families, setFamilies] = useState<FamilyWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchFamilies = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/families', {
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '가족 목록을 불러오는데 실패했습니다');
      }

      // API 응답을 FamilyWithMembership 형태로 변환
      const formatted = (result.data || []).map((item: {
        id: string;
        role: 'admin' | 'member';
        is_active: boolean;
        joined_at: string;
        family: Family;
        admin: AdminInfo | null;
        members: MemberInfo[];
      }) => ({
        membership: {
          id: item.id,
          user_id: '', // API에서 제공하지 않음
          family_id: item.family.id,
          role: item.role,
          is_active: item.is_active,
          joined_at: item.joined_at,
        },
        family: item.family,
        admin: item.admin,
        members: item.members || [],
      }));

      setFamilies(formatted);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  const createFamily = useCallback(async (name: string): Promise<Family | null> => {
    try {
      const response = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '가족 생성에 실패했습니다');
      }

      await fetchFamilies();
      return result.data as Family;
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      return null;
    }
  }, [fetchFamilies]);

  const updateFamily = useCallback(async (id: string, name: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/families/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '가족 수정에 실패했습니다');
      }

      await fetchFamilies();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      return false;
    }
  }, [fetchFamilies]);

  const deleteFamily = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/families/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '가족 삭제에 실패했습니다');
      }

      await fetchFamilies();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      return false;
    }
  }, [fetchFamilies]);

  const setActiveFamily = useCallback(async (familyId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/families/${familyId}/active`, {
        method: 'POST',
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '활성 가족 변경에 실패했습니다');
      }

      await fetchFamilies();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      return false;
    }
  }, [fetchFamilies]);

  const leaveFamily = useCallback(async (familyId: string): Promise<boolean> => {
    if (!supabase) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증이 필요합니다');

      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('user_id', user.id)
        .eq('family_id', familyId);

      if (error) {
        throw new Error('가족 탈퇴에 실패했습니다');
      }

      await fetchFamilies();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      return false;
    }
  }, [supabase, fetchFamilies]);

  return {
    families,
    loading,
    error,
    refreshFamilies: fetchFamilies,
    createFamily,
    updateFamily,
    deleteFamily,
    setActiveFamily,
    leaveFamily,
  };
}
