'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { FileText, ChevronLeft, ChevronRight, Filter, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_type: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  description: string | null;
  ip_address: string | null;
  created_at: string;
  actor: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    actorType: '',
    action: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
      });
      if (filters.actorType) params.set('actorType', filters.actorType);
      if (filters.action) params.set('action', filters.action);

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setLogs(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : '감사 로그를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadLogs(1);
  }, [filters, loadLogs]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: '로그인',
      logout: '로그아웃',
      create: '생성',
      update: '수정',
      delete: '삭제',
      account_deletion_requested: '탈퇴 요청',
      account_deletion_cancelled: '탈퇴 취소',
      account_deleted: '계정 삭제',
    };
    return labels[action] || action;
  };

  const getActorTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      user: '사용자',
      admin: '관리자',
      system: '시스템',
    };
    return labels[type] || type;
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold">감사 로그</h1>
            <p className="text-gray-500 text-sm">전체 {pagination.total}건</p>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filters.actorType}
            onChange={(e) => setFilters(f => ({ ...f, actorType: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">모든 주체</option>
            <option value="user">사용자</option>
            <option value="admin">관리자</option>
            <option value="system">시스템</option>
          </select>
          <select
            value={filters.action}
            onChange={(e) => setFilters(f => ({ ...f, action: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">모든 행동</option>
            <option value="login">로그인</option>
            <option value="logout">로그아웃</option>
            <option value="create">생성</option>
            <option value="update">수정</option>
            <option value="delete">삭제</option>
            <option value="account_deletion_requested">탈퇴 요청</option>
          </select>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* 로그 테이블 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">시간</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">주체</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">행동</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">대상</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">설명</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    로그가 없습니다
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="inline-flex px-2 py-0.5 text-xs bg-gray-100 rounded">
                          {getActorTypeLabel(log.actor_type)}
                        </span>
                        {log.actor && (
                          <p className="text-sm text-gray-600 mt-1">{log.actor.name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-sm">{getActionLabel(log.action)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.target_type || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {log.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="border-t px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {pagination.total}건 중 {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}건
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadLogs(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-sm">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadLogs(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
