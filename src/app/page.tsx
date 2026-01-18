'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const LAST_PAGE_KEY = 'mothers-reminder-last-page';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 1. localStorage에서 마지막 방문 페이지 확인
    const lastPage = localStorage.getItem(LAST_PAGE_KEY);

    if (lastPage && (lastPage === '/home' || lastPage === '/display')) {
      router.replace(lastPage);
      return;
    }

    // 2. 화면 크기로 기기 타입 감지 (768px 이상이면 태블릿)
    const isTablet = window.innerWidth >= 768;

    if (isTablet) {
      router.replace('/display');
    } else {
      router.replace('/home');
    }
  }, [router]);

  // 로딩 중 표시
  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-6xl mb-4">💬</div>
        <p className="text-2xl font-medium">잠시만 기다려주세요...</p>
      </div>
    </div>
  );
}
