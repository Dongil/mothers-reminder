// 관리자 인증 유틸리티
// v1.5: 시스템 관리자 권한 체크

import { createClient } from '@/lib/supabase/server';
import type { AdminPermission } from '@/types/database';

export interface AdminAuthResult {
  isAdmin: boolean;
  userId: string | null;
  permissions: AdminPermission[];
  hasPermission: (permission: AdminPermission) => boolean;
}

interface AdminData {
  permissions: string[];
}

/**
 * 현재 사용자의 관리자 권한 확인
 */
export async function checkAdminAuth(): Promise<AdminAuthResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      isAdmin: false,
      userId: null,
      permissions: [],
      hasPermission: () => false,
    };
  }

  const { data: adminData } = await supabase
    .from('system_admins')
    .select('permissions')
    .eq('user_id', user.id)
    .single();

  if (!adminData) {
    return {
      isAdmin: false,
      userId: user.id,
      permissions: [],
      hasPermission: () => false,
    };
  }

  const typedAdminData = adminData as AdminData;
  const permissions = typedAdminData.permissions as AdminPermission[];

  return {
    isAdmin: true,
    userId: user.id,
    permissions,
    hasPermission: (permission: AdminPermission) => {
      // super 권한은 모든 권한 포함
      if (permissions.includes('super')) return true;
      // write 권한은 read 권한 포함
      if (permission === 'read' && permissions.includes('write')) return true;
      return permissions.includes(permission);
    },
  };
}

/**
 * 관리자 권한 필수 체크 (미들웨어용)
 * 권한이 없으면 에러 응답 반환
 */
export async function requireAdmin(requiredPermission?: AdminPermission): Promise<{
  success: true;
  auth: AdminAuthResult;
} | {
  success: false;
  error: string;
  status: number;
}> {
  const auth = await checkAdminAuth();

  if (!auth.isAdmin) {
    return {
      success: false,
      error: '관리자 권한이 필요합니다',
      status: 403,
    };
  }

  if (requiredPermission && !auth.hasPermission(requiredPermission)) {
    return {
      success: false,
      error: `${requiredPermission} 권한이 필요합니다`,
      status: 403,
    };
  }

  return {
    success: true,
    auth,
  };
}
