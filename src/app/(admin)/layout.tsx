'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Home,
  BarChart3,
  Activity,
  FileText,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: '대시보드', icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/admin/users', label: '사용자 관리', icon: <Users className="w-5 h-5" /> },
  { href: '/admin/families', label: '가족 관리', icon: <Home className="w-5 h-5" /> },
  { href: '/admin/statistics', label: '통계', icon: <BarChart3 className="w-5 h-5" /> },
  { href: '/admin/system', label: '시스템', icon: <Activity className="w-5 h-5" /> },
  { href: '/admin/audit-logs', label: '감사 로그', icon: <FileText className="w-5 h-5" /> },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState<string>('');

  const supabase = createClient();

  useEffect(() => {
    const loadAdmin = async () => {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();

        if (userData) {
          setAdminName((userData as { name: string }).name);
        }
      }
    };

    loadAdmin();
  }, [supabase]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 모바일 헤더 */}
      <header className="lg:hidden bg-gray-900 text-white p-4 flex items-center justify-between">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-gray-800 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="font-bold">관리자 대시보드</h1>
        <div className="w-10" /> {/* 균형 맞추기 */}
      </header>

      {/* 모바일 사이드바 오버레이 */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`fixed lg:fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-50 transform transition-transform lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <h1 className="font-bold text-lg">관리자</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 관리자 정보 */}
        {adminName && (
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-sm text-gray-400">로그인</p>
            <p className="text-sm font-medium truncate">{adminName}</p>
          </div>
        )}

        {/* 네비게이션 */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* 하단 메뉴 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <Link
            href="/home"
            className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors mb-2"
          >
            <Home className="w-5 h-5" />
            <span>사용자 페이지로</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="lg:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
