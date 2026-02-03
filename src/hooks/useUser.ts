'use client';

/**
 * @fileoverview 사용자 인증 및 활성 가족 관리 훅 (useUser)
 *
 * 이 훅은 현재 로그인한 사용자의 정보와 활성 가족 정보를 관리합니다.
 * Supabase Auth와 연동하여 인증 상태를 추적하고,
 * 사용자가 현재 활동 중인 가족 정보를 함께 조회합니다.
 *
 * 주요 기능:
 * - 현재 인증된 사용자 정보 조회
 * - 활성 가족 정보 조회 (is_active가 true인 가족)
 * - 인증 상태 변경 감지 (로그인/로그아웃/토큰 갱신)
 *
 * @see useSettings - 사용자 설정 관리
 * @see useMessages - 메시지 조회 시 familyId 사용
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Family, FamilyMember } from '@/types/database';

/**
 * 활성 가족 정보가 포함된 사용자 타입
 *
 * @description 기본 User 타입에 현재 활성화된 가족 정보를 추가
 * 한 사용자가 여러 가족에 속할 수 있으며, 그 중 is_active=true인 가족이 활성 가족
 */
interface UserWithFamily extends User {
  /** 현재 활성화된 가족 정보 (없으면 null) */
  activeFamily: Family | null;
  /** 현재 활성 가족에서의 멤버십 정보 (역할, 가입일 등) */
  activeMembership: FamilyMember | null;
}

/**
 * useUser 훅의 반환 타입
 *
 * @property {UserWithFamily|null} user - 현재 사용자 정보 (미로그인시 null)
 * @property {boolean} loading - 로딩 상태
 * @property {string|null} error - 에러 메시지
 * @property {boolean} hasFamily - 활성 가족 존재 여부 (빠른 체크용)
 * @property {Function} refreshUser - 사용자 정보 새로고침
 */
interface UseUserReturn {
  user: UserWithFamily | null;
  loading: boolean;
  error: string | null;
  hasFamily: boolean;
  refreshUser: () => Promise<void>;
}

/**
 * useUser - 사용자 인증 및 활성 가족 관리 훅
 *
 * @description 현재 로그인한 사용자의 프로필과 활성 가족 정보를 관리합니다.
 * Supabase Auth의 인증 상태를 구독하여 로그인/로그아웃 시 자동으로 갱신됩니다.
 *
 * 동작 흐름:
 *   1. Supabase Auth에서 현재 인증된 사용자 확인
 *   2. 사용자가 있으면 users 테이블에서 프로필 조회
 *   3. family_members 테이블에서 is_active=true인 멤버십 조회 (JOIN으로 가족 정보 포함)
 *   4. Auth 상태 변경 구독 (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
 *
 * @returns {UseUserReturn} 사용자 데이터 및 관련 상태
 *
 * @example
 * const { user, loading, hasFamily } = useUser();
 *
 * if (loading) return <Loading />;
 * if (!user) return <LoginPage />;
 * if (!hasFamily) return <FamilyJoinPage />;
 *
 * return <HomePage familyName={user.activeFamily.name} />;
 *
 * @see UserWithFamily - 반환되는 user 객체의 타입
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<UserWithFamily | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  /**
   * fetchUser - 사용자 정보 조회
   *
   * @description Supabase에서 현재 인증된 사용자의 프로필과 활성 가족 정보를 조회합니다.
   * 두 쿼리를 병렬로 실행하여 성능을 최적화합니다.
   *
   * 쿼리 구조:
   *   - users 테이블: 사용자 프로필 (이름, 닉네임, 성별 등)
   *   - family_members 테이블: 활성 멤버십 + 가족 정보 JOIN
   */
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

      // 사용자 프로필과 활성 가족을 병렬로 조회
      const [userResult, membershipResult] = await Promise.all([
        supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single(),
        supabase
          .from('family_members')
          .select(`
            *,
            family:family_id (*)
          `)
          .eq('user_id', authUser.id)
          .eq('is_active', true)
          .single(),
      ]);

      if (userResult.error) {
        throw new Error('사용자 정보를 불러오는데 실패했습니다');
      }

      // 멤버십 데이터 타입 변환 (JOIN된 family 포함)
      const membership = membershipResult.data as (FamilyMember & { family: Family }) | null;

      // UserWithFamily 객체 구성
      setUser({
        ...(userResult.data as User),
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

  // 초기 로드
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /**
   * 인증 상태 변경 감지
   *
   * @description Supabase Auth의 상태 변경을 구독합니다.
   * 로그인, 로그아웃, 토큰 갱신 시 사용자 정보를 다시 조회합니다.
   *
   * 처리 이벤트:
   *   - SIGNED_IN: 로그인 완료 → 사용자 정보 조회
   *   - SIGNED_OUT: 로그아웃 → 사용자 정보 초기화
   *   - TOKEN_REFRESHED: 토큰 갱신 → 사용자 정보 재조회
   */
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
    /** 활성 가족 존재 여부 - 조건부 렌더링에 유용 */
    hasFamily: !!user?.activeFamily,
    refreshUser: fetchUser,
  };
}
