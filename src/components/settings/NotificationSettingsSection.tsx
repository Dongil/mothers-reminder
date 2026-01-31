'use client';

import React, { useState } from 'react';
import { Bell, ChevronDown, ChevronUp, MessageSquare, UserPlus } from 'lucide-react';
import { useSettings } from '@/hooks';
import { usePushNotification } from '@/hooks/usePushNotification';

export function NotificationSettingsSection() {
  const { settings, updateSettings, loading } = useSettings();
  const {
    isSupported,
    permission,
    isSubscribed,
    loading: pushLoading,
    error: pushError,
    subscribe,
    unsubscribe,
  } = usePushNotification();
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleJoinRequestToggle = async () => {
    if (!settings) return;
    await updateSettings({ notify_join_request: !settings.notify_join_request });
  };

  const handleNewMessageToggle = async () => {
    if (!settings) return;
    await updateSettings({ notify_new_message: !settings.notify_new_message });
  };

  if (loading || !settings) {
    return (
      <section className="bg-white rounded-lg shadow p-4">
        <div className="text-gray-500">로딩 중...</div>
      </section>
    );
  }

  const getPushStatusText = () => {
    if (pushError) return pushError;
    if (!isSupported) return '이 브라우저에서 지원되지 않습니다';
    if (permission === 'denied') return '브라우저 설정에서 알림을 허용해주세요';
    if (isSubscribed) return '알림이 활성화되어 있습니다';
    return '알림을 활성화하세요';
  };

  const statusTextColor = pushError ? 'text-red-500' : 'text-gray-500';

  return (
    <section className="bg-white rounded-lg shadow">
      {/* 헤더 */}
      <button
        className="w-full px-4 py-3 flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">알림 설정</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* 푸시 알림 활성화 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-medium text-gray-900">푸시 알림</div>
                <div className={`text-sm ${statusTextColor}`}>{getPushStatusText()}</div>
              </div>
            </div>
            <button
              onClick={handlePushToggle}
              disabled={!isSupported || permission === 'denied' || pushLoading}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isSubscribed ? 'bg-blue-600' : 'bg-gray-300'
              } ${!isSupported || permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  isSubscribed ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 알림 종류별 설정 (푸시가 활성화된 경우만) */}
          {isSubscribed && (
            <div className="space-y-3 p-3 border rounded-lg">
              {/* 가족 참여 요청 알림 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium text-gray-900">가족 참여 요청 알림</div>
                    <div className="text-sm text-gray-500">새로운 참여 요청 시 알림</div>
                  </div>
                </div>
                <button
                  onClick={handleJoinRequestToggle}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.notify_join_request !== false ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.notify_join_request !== false ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 새 메시지 알림 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="font-medium text-gray-900">새 메시지 알림</div>
                    <div className="text-sm text-gray-500">가족이 새 메시지를 작성하면 알림</div>
                  </div>
                </div>
                <button
                  onClick={handleNewMessageToggle}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.notify_new_message !== false ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.notify_new_message !== false ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
