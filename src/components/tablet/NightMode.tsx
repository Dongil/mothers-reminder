'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

interface NightModeProps {
  isActive: boolean;
  onExit: () => void;
}

export function NightMode({ isActive, onExit }: NightModeProps) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center cursor-pointer"
      onClick={onExit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onExit();
        }
      }}
    >
      {/* 시계 */}
      <div className="text-white text-center mb-8">
        <Moon className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-7xl font-light tracking-wider">{currentTime}</p>
      </div>

      {/* 안내 메시지 */}
      <div className="text-gray-500 text-center">
        <p className="text-xl mb-2">야간 모드</p>
        <p className="text-lg">화면을 터치하면 해제됩니다</p>
      </div>

      {/* 하단 아이콘 */}
      <div className="absolute bottom-12 flex items-center gap-3 text-gray-600">
        <Sun className="w-6 h-6" />
        <span className="text-lg">터치하여 깨우기</span>
      </div>
    </div>
  );
}

export default NightMode;
