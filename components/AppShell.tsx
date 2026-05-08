'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useNiche } from '@/context/NicheContext';
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

  const isOnboarding = pathname === '/onboarding';

  useEffect(() => {
    // Only redirect AFTER localStorage has been read (hydrated)
    if (!hydrated) return;

    // Root '/' is a pure redirect gateway — always send somewhere
    if (pathname === '/') {
      router.replace(onboarded ? '/dashboard' : '/onboarding');
      return;
    }

    // Any other protected route: kick back to onboarding if not done
    if (!onboarded && !isOnboarding) {
      router.replace('/onboarding');
    }

    // Already onboarded but somehow on /onboarding — send to dashboard
    if (onboarded && isOnboarding) {
      router.replace('/dashboard');
    }
  }, [onboarded, hydrated, isOnboarding, pathname, router]);

  // Show spinner until we've read localStorage — prevents blank screen flash
  if (!hydrated) return <Spinner />;

  // Root '/' is always a redirect — show spinner while that fires
  if (pathname === '/') return <Spinner />;

  // Onboarding page — no sidebar/banner
  if (isOnboarding) return <>{children}</>;

  // If not onboarded yet but somehow here — show spinner while redirect fires
  if (!onboarded) return <Spinner />;

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
