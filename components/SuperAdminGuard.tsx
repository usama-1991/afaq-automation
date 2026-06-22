'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userProfile?.role === 'super_admin') {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        router.push('/dashboard'); // Kick regular users out
      }
    };

    checkAuth();
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f9' }}>
        <Loader2 className="animate-spin" size={32} color="#dc2626" />
      </div>
    );
  }

  if (isAuthorized === false) {
    return null;
  }

  return <>{children}</>;
}
