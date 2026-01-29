'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, Home, Users, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Family {
  id: string;
  name: string;
  code: string;
  created_by: string | null;
  created_at: string;
  memberCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminFamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFamilies = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/families?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setFamilies(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : '가족 목록을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadFamilies(1);
  }, [loadFamilies]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadFamilies(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Home className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold">가족 관리</h1>
            <p className="text-gray-500 text-sm">전체 {pagination.total}개</p>
          </div>
        </div>
      </div>

      {/* 검색 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="가족 이름 또는 코드 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button type="submit" variant="primary">
            검색
          </Button>
        </form>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* 가족 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))
        ) : families.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            가족이 없습니다
          </div>
        ) : (
          families.map((family) => (
            <div key={family.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{family.name}</h3>
                  <p className="text-sm text-gray-500 font-mono">{family.code}</p>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{family.memberCount}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                생성일: {formatDate(family.created_at)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadFamilies(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            이전
          </Button>
          <span className="text-sm text-gray-600">
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadFamilies(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            다음
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
