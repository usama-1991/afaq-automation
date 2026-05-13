'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useNiche } from '@/context/NicheContext';
import { supabase } from '@/lib/supabase/client';
import Sidebar from './Sidebar';
import TopBanner from './TopBanner';

function Spinner() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, color: '#fff', fontWeight: 800,
        boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
      }}>A</div>
      <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>Loading AutoFlow AI…</div>
      <div style={{
        width: 32, height: 32,
        border: '3px solid #fecaca',
        borderTop: '3px solid #dc2626',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { onboarded, hydrated } = useNiche();
  const [session, setSession] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const isOnboarding = pathname === '/onboarding';
  const isLogin = pathname === '/login';
  const isAdminRoute = pathname.startsWith('/admin');

  useEffect(() => {
    supabase.auth.getSession().then((response: any) => {
      setSession(response.data.session);
      setSessionChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, currentSession: any) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hydrated || !sessionChecked) return;

    if (!session) {
      // User is not logged in: must be on /login
      if (!isLogin) {
        router.replace('/login');
      }
      return;
    }

    const isAdminUser = session.user?.email === 'admin@autoflow.ai';

    // User IS logged in:
    if (pathname === '/') {
      if (isAdminUser) router.replace('/admin');
      else router.replace(onboarded ? '/dashboard' : '/onboarding');
      return;
    }

    if (isLogin) {
      // Already logged in, no need to see login page again
      if (isAdminUser) router.replace('/admin');
      else router.replace(onboarded ? '/dashboard' : '/onboarding');
      return;
    }

    if (!isAdminUser && !onboarded && !isOnboarding && !isAdminRoute) {
      router.replace('/onboarding');
      return;
    }

    if (!isAdminUser && onboarded && isOnboarding) {
      router.replace('/dashboard');
      return;
    }

  }, [onboarded, hydrated, isOnboarding, isLogin, isAdminRoute, pathname, router, session, sessionChecked]);

  // Show spinner until we've read localStorage and checked auth
  if (!hydrated || !sessionChecked) return <Spinner />;

  // Root '/' is a redirect gateway
  if (pathname === '/') return <Spinner />;

  // Onboarding or Login page — no sidebar/banner
  if (isOnboarding || isLogin) return <>{children}</>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBanner />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{
          marginLeft: 64, flex: 1,
          minHeight: 'calc(100vh - 38px)',
          background: '#faf9f9',
          overflowY: 'auto',
          paddingTop: 0,
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
