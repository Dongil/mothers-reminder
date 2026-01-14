'use client';

import React, { useEffect, useState } from 'react';
import { formatDate, formatTime } from '@/lib/utils';

interface HeaderProps {
  familyName?: string;
}

export function Header({ familyName = '우리 가족' }: HeaderProps) {
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

        {/* 우측: 날짜 및 시간 */}
        <div className="text-right">
          <p className="text-2xl font-medium text-gray-900">{currentDate}</p>
          <p className="text-4xl font-light text-blue-600 mt-1">{currentTime}</p>
        </div>
      </div>
    </header>
  );
}

export default Header;
