import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  // 1. VAPID 키 확인
  diagnostics.vapid = {
    publicKeySet: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    privateKeySet: !!process.env.VAPID_PRIVATE_KEY,
    publicKeyLength: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length || 0,
    privateKeyLength: process.env.VAPID_PRIVATE_KEY?.length || 0,
  };

  // 2. Supabase 서비스 키 확인
  diagnostics.supabase = {
    urlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  try {
    const supabase = await createClient();

    // 3. 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    diagnostics.user = user ? {
      id: user.id,
      email: user.email,
    } : null;

    if (user) {
      // 4. 사용자의 가족 정보 확인
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', user.id)
        .single();

      const userRecord = userData as { family_id: string | null } | null;
      diagnostics.userRecord = {
        familyId: userRecord?.family_id || null,
        error: userError?.message || null,
      };

      // 5. 가족 멤버 확인
      if (userRecord?.family_id) {
        const { data: members, error: membersError } = await supabase
          .from('family_members')
          .select('user_id, role')
          .eq('family_id', userRecord.family_id);

        diagnostics.familyMembers = {
          count: members?.length || 0,
          members: members || [],
          error: membersError?.message || null,
        };
      }

      // 6. 푸시 구독 확인
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('id, user_id, created_at')
        .eq('user_id', user.id);

      diagnostics.pushSubscriptions = {
        count: subscriptions?.length || 0,
        subscriptions: subscriptions?.map(s => ({
          id: s.id,
          createdAt: s.created_at,
        })) || [],
        error: subError?.message || null,
      };
    }
  } catch (error) {
    diagnostics.error = error instanceof Error ? error.message : 'Unknown error';
  }

  console.log('[Push Test] Diagnostics:', JSON.stringify(diagnostics, null, 2));

  return NextResponse.json(diagnostics);
}
