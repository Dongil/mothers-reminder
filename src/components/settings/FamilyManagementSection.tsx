'use client';

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Check,
  X,
  Copy,
  Search,
  Trash2,
  Edit2,
  LogOut,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFamilies, useJoinRequests, useUser } from '@/hooks';

interface FamilySearchResult {
  id: string;
  name: string;
  code: string;
  created_at: string;
  is_member: boolean;
  has_pending_request: boolean;
}

export function FamilyManagementSection() {
  const { user, refreshUser } = useUser();
  const { families, createFamily, updateFamily, deleteFamily, setActiveFamily, leaveFamily } = useFamilies();
  const { sentRequests, receivedRequests, sendRequest, cancelRequest, acceptRequest, rejectRequest, searchFamilies } = useJoinRequests();

  const [isExpanded, setIsExpanded] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FamilySearchResult[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<FamilySearchResult | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleCreateFamily = async () => {
    if (!newFamilyName.trim()) return;
    setIsLoading(true);
    const result = await createFamily(newFamilyName.trim());
    if (result) {
      setNewFamilyName('');
      setShowCreateForm(false);
      await refreshUser();
    }
    setIsLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    const results = await searchFamilies(searchQuery.trim());
    setSearchResults(results);
    setSelectedFamily(null);
    setIsLoading(false);
  };

  const handleSendRequest = async (family: FamilySearchResult) => {
    setIsLoading(true);
    const success = await sendRequest(family.id);
    if (success) {
      // 검색 결과 업데이트 - 요청 보낸 가족의 상태 변경
      setSearchResults(prev =>
        prev.map(f => f.id === family.id ? { ...f, has_pending_request: true } : f)
      );
      setSelectedFamily(null);
    }
    setIsLoading(false);
  };

  const handleSetActive = async (familyId: string) => {
    setIsLoading(true);
    await setActiveFamily(familyId);
    await refreshUser();
    setIsLoading(false);
  };

  const handleUpdateFamily = async (id: string) => {
    if (!editingName.trim()) return;
    setIsLoading(true);
    await updateFamily(id, editingName.trim());
    setEditingId(null);
    setEditingName('');
    setIsLoading(false);
  };

  const handleDeleteFamily = async (id: string) => {
    if (!confirm('정말 이 가족을 삭제하시겠습니까? 모든 메시지가 삭제됩니다.')) return;
    setIsLoading(true);
    await deleteFamily(id);
    await refreshUser();
    setIsLoading(false);
  };

  const handleLeaveFamily = async (familyId: string) => {
    if (!confirm('정말 이 가족에서 탈퇴하시겠습니까?')) return;
    setIsLoading(true);
    await leaveFamily(familyId);
    await refreshUser();
    setIsLoading(false);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('코드가 복사되었습니다!');
  };

  return (
    <section className="bg-white rounded-lg shadow">
      {/* 헤더 */}
      <button
        className="w-full px-4 py-3 flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">가족 관리</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-6">
          {/* 내가 만든 가족 섹션 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded" />
              <Label className="text-sm font-semibold text-gray-700">내가 만든 가족</Label>
            </div>

            {families.filter(f => f.membership.role === 'admin').length === 0 ? (
              <p className="text-sm text-gray-500 py-2 pl-3">만든 가족이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {families.filter(f => f.membership.role === 'admin').map(({ membership, family, admin }) => (
                  <div
                    key={family.id}
                    className={`p-3 rounded-lg border ${
                      membership.is_active
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    {editingId === family.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          placeholder="가족 이름"
                        />
                        <Button
                          variant="primary"
                          size="icon"
                          onClick={() => handleUpdateFamily(family.id)}
                          disabled={isLoading}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{family.name}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!membership.is_active && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetActive(family.id)}
                                disabled={isLoading}
                              >
                                선택
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingId(family.id);
                                setEditingName(family.name);
                              }}
                              title="가족 이름 수정"
                            >
                              <Edit2 className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteFamily(family.id)}
                              disabled={isLoading}
                              title="가족 삭제"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        {membership.is_active && (
                          <div className="mt-1 text-xs text-blue-600">현재 활성 가족</div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 가족 생성 */}
          {showCreateForm ? (
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <Label>새 가족 이름</Label>
              <div className="flex gap-2">
                <Input
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  placeholder="예: 김씨 가족"
                />
                <Button
                  variant="primary"
                  onClick={handleCreateFamily}
                  disabled={isLoading || !newFamilyName.trim()}
                >
                  만들기
                </Button>
                <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              새 가족 만들기
            </Button>
          )}

          {/* 구분선 */}
          <div className="border-t border-gray-200 my-4" />

          {/* 참여한 가족 섹션 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-green-500 rounded" />
              <Label className="text-sm font-semibold text-gray-700">참여한 가족</Label>
            </div>

            {families.filter(f => f.membership.role === 'member').length === 0 ? (
              <p className="text-sm text-gray-500 py-2 pl-3">참여한 가족이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {families.filter(f => f.membership.role === 'member').map(({ membership, family, admin }) => (
                  <div
                    key={family.id}
                    className={`p-3 rounded-lg border ${
                      membership.is_active
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{family.name}</div>
                        <div className="text-sm text-gray-500">
                          {admin && (
                            <span>관리자: {admin.name}{admin.nickname ? `(${admin.nickname})` : ''}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!membership.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetActive(family.id)}
                            disabled={isLoading}
                          >
                            선택
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleLeaveFamily(family.id)}
                          disabled={isLoading}
                          title="가족 탈퇴"
                        >
                          <LogOut className="w-4 h-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                    {membership.is_active && (
                      <div className="mt-1 text-xs text-green-600">현재 활성 가족</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 가족 검색 & 참여 */}
          {showSearchForm ? (
            <div className="p-3 bg-gray-50 rounded-lg space-y-3">
              <Label>가족 이름으로 검색</Label>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="가족 이름 입력"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  disabled={isLoading || !searchQuery.trim()}
                >
                  검색
                </Button>
              </div>

              {/* 검색 결과 리스트 */}
              {hasSearched && (
                <div className="space-y-2">
                  {searchResults.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">검색 결과가 없습니다</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">{searchResults.length}개의 가족을 찾았습니다</p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {searchResults.map((family) => (
                          <div
                            key={family.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedFamily?.id === family.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedFamily(family)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-gray-900">{family.name}</div>
                              {family.is_member ? (
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">멤버</span>
                              ) : family.has_pending_request ? (
                                <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">요청중</span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 선택된 가족에 참여 요청 */}
              {selectedFamily && !selectedFamily.is_member && !selectedFamily.has_pending_request && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleSendRequest(selectedFamily)}
                  disabled={isLoading}
                >
                  &apos;{selectedFamily.name}&apos; 가족에 참여 요청 보내기
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowSearchForm(false);
                  setSearchQuery('');
                  setSearchResults([]);
                  setSelectedFamily(null);
                  setHasSearched(false);
                }}
              >
                닫기
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowSearchForm(true)}
            >
              <Search className="w-4 h-4 mr-2" />
              가족 찾아 참여하기
            </Button>
          )}

          {/* 받은 참여 요청 */}
          {receivedRequests.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">받은 참여 요청</Label>
              {receivedRequests.map((request) => (
                <div key={request.id} className="p-3 border-2 border-amber-400 bg-amber-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">
                        {request.user?.gender === 'male' ? '👨' : '👩'}{' '}
                        <span className="text-amber-900">
                          {request.user?.name}
                          {request.user?.nickname && (
                            <span className="text-amber-700 ml-1">({request.user.nickname})</span>
                          )}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-0.5">
                        → {request.family?.name} 가족 참여 요청
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => acceptRequest(request.id)}
                        disabled={isLoading}
                      >
                        수락
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => rejectRequest(request.id)}
                        disabled={isLoading}
                      >
                        거절
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 보낸 참여 요청 */}
          {sentRequests.filter(r => r.status === 'pending').length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">보낸 참여 요청</Label>
              {sentRequests
                .filter(r => r.status === 'pending')
                .map((request) => (
                  <div key={request.id} className="p-3 border rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium">{request.family?.name}</div>
                      <div className="text-sm text-yellow-600">대기 중</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelRequest(request.id)}
                      disabled={isLoading}
                    >
                      취소
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
