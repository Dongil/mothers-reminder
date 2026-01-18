'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

interface HeaderProps {
  familyName?: string;
}

export function Header({ familyName = '우리 가족' }: HeaderProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(formatDate(now));
      setCurrentTime(formatTime(now));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b-2 border-gray-100 px-8 py-6">
      <div className="flex items-center justify-between">
        {/* 좌측: 가족 이름 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{familyName}</h1>
          <p className="text-lg text-gray-500 mt-1">메시지 보드</p>
        </div>

        {/* 중앙: 날짜 및 시간 */}
        <div className="text-center">
          <p className="text-2xl font-medium text-gray-900">{currentDate}</p>
          <p className="text-4xl font-light text-blue-600 mt-1">{currentTime}</p>
        </div>

        {/* 우측: 모바일 화면 전환 버튼 */}
        <button
          onClick={() => router.push('/home')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title="메시지 관리 화면으로 전환"
        >
          <Smartphone className="w-5 h-5" />
          <span className="text-lg">관리</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
