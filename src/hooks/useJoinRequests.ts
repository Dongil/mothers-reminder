'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FamilyJoinRequest, Family, User } from '@/types/database';

interface JoinRequestWithDetails extends FamilyJoinRequest {
  family?: Family;
  user?: Pick<User, 'id' | 'name' | 'nickname' | 'gender' | 'email'>;
}

interface FamilySearchResult {
  id: string;
  name: string;
  code: string;
  created_at: string;
  is_member: boolean;
  has_pending_request: boolean;
  admin: { name: string; nickname: string | null } | null;
  members: Array<{ id: string; name: string; nickname: string | null }>;
}

interface UseJoinRequestsReturn {
  sentRequests: JoinRequestWithDetails[];
  receivedRequests: JoinRequestWithDetails[];
  loading: boolean;
  error: string | null;
  refreshRequests: () => Promise<void>;
  sendRequest: (familyId: string, message?: string) => Promise<boolean>;
  cancelRequest: (requestId: string) => Promise<boolean>;
  acceptRequest: (requestId: string) => Promise<boolean>;
  rejectRequest: (requestId: string) => Promise<boolean>;
  searchFamilies: (name: string) => Promise<FamilySearchResult[]>;
}

export function useJoinRequests(): UseJoinRequestsReturn {
  const [sentRequests, setSentRequests] = useState<JoinRequestWithDetails[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<JoinRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSentRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/join-requests?type=sent', {
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      setSentRequests(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  }, []);

  const fetchReceivedRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/join-requests?type=received', {
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      setReceivedRequests(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSentRequests(), fetchReceivedRequests()]);
    setLoading(false);
  }, [fetchSentRequests, fetchReceivedRequests]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const sendRequest = useCallback(async (familyId: string, message?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/join-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_id: familyId, message }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '참여 요청 전송에 실패했습니다');
      }

      await fetchSentRequests();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      return false;
    }
  }, [fetchSentRequests]);

  const cancelRequest = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/join-requests/${requestId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '요청 취소에 실패했습니다');
      }

      await fetchSentRequests();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      return false;
    }
  }, [fetchSentRequests]);

  const acceptRequest = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '수락에 실패했습니다');
      }

      await fetchReceivedRequests();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      return false;
    }
  }, [fetchReceivedRequests]);

  const rejectRequest = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '거절에 실패했습니다');
      }

      await fetchReceivedRequests();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      return false;
    }
  }, [fetchReceivedRequests]);

  const searchFamilies = useCallback(async (name: string): Promise<FamilySearchResult[]> => {
    try {
      const response = await fetch(`/api/families/search?name=${encodeURIComponent(name)}`, {
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '검색에 실패했습니다');
      }

      return result.data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      return [];
    }
  }, []);

  return {
    sentRequests,
    receivedRequests,
    loading,
    error,
    refreshRequests: fetchAll,
    sendRequest,
    cancelRequest,
    acceptRequest,
    rejectRequest,
    searchFamilies,
  };
}
