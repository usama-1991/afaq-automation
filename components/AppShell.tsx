'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useNiche } from '@/context/NicheContext';
import { usePlan } from '@/context/PlanContext';
import { supabase } from '@/lib/supabase/client';
import Sidebar from './Sidebar';
import TopBanner from './TopBanner';
import MetaGateBanner from './MetaGateBanner';
import { User, Bot, Plug, Settings, LogOut, ChevronDown, Building, ShieldAlert, AlertCircle } from 'lucide-react';

function Spinner() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16,
    }}>
      <img src="/ittisalo-logo.png" alt="Ittisalo" style={{
        width: 44, height: 44, borderRadius: 12,
        boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
      }} />
      <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>Loading Ittisalo…</div>
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
  const { onboarded, hydrated, niche, setNicheId, setOnboarded } = useNiche();
  const { tenantInfo, planLoaded } = usePlan();
  const [session, setSession] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userEmail, setUserEmail] = useState('usamahabib1991@gmail.com');
  const [userName, setUserName] = useState('Usama Habib');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOnboarding = pathname === '/onboarding';
  const isLogin = pathname === '/login';
  const isAdminRoute = pathname.startsWith('/admin');

  const bootstrapTenantNiche = async (user: any) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (profile?.tenant_id) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('niche')
          .eq('id', profile.tenant_id)
          .single();

        if (tenant?.niche && tenant.niche !== 'general') {
          setNicheId(tenant.niche);
          setOnboarded(true);
        }
      }
    } catch (err) {
      console.error('Error bootstrapping tenant niche:', err);
    }
  };

  useEffect(() => {
    if (!supabase) {
      console.error('Supabase client is not initialized. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing.');
      setSessionChecked(true);
      return;
    }

    // Fail-safe timeout: Dismiss the loading screen after 2.5 seconds no matter what
    const failSafeTimeout = setTimeout(() => {
      console.warn('Supabase auth check timed out. Dismissing loading screen via fail-safe.');
      setSessionChecked(true);
    }, 2500);

    supabase.auth.getSession().then((response: any) => {
      clearTimeout(failSafeTimeout);
      const currentSession = response?.data?.session;
      setSession(currentSession);
      if (currentSession?.user) {
        setUserEmail(currentSession.user.email || 'usamahabib1991@gmail.com');
        setUserName(currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || 'Usama Habib');
        bootstrapTenantNiche(currentSession.user);
      }
      setSessionChecked(true);
    }).catch((err: any) => {
      clearTimeout(failSafeTimeout);
      console.error('Error getting session:', err);
      setSessionChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, currentSession: any) => {
      setSession(currentSession);
      if (currentSession?.user) {
        setUserEmail(currentSession.user.email || 'usamahabib1991@gmail.com');
        setUserName(currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || 'Usama Habib');
        bootstrapTenantNiche(currentSession.user);
      }
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/update-password');
      }
    });

    // Close dropdown on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      subscription?.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !sessionChecked) return;

    if (!session) {
      if (!isLogin && pathname !== '/update-password') {
        router.replace('/login');
      }
      return;
    }

    const isAdminUser = session.user?.email === 'admin@ittisalo.io';

    if (pathname === '/') {
      if (isAdminUser) router.replace('/admin');
      else router.replace(onboarded ? '/dashboard' : '/onboarding');
      return;
    }

    if (isLogin) {
      if (isAdminUser) router.replace('/admin');
      else router.replace(onboarded ? '/dashboard' : '/onboarding');
      return;
    }

    if (pathname === '/update-password') {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowDropdown(false);
    router.push('/login');
  };

  // Show spinner until we've read localStorage and checked auth
  if (!hydrated || !sessionChecked) {
    if (!supabase) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20,
          padding: 20, textAlign: 'center',
        }}>
          <div style={{
            width: 54, height: 54, borderRadius: 14,
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, color: '#fff', fontWeight: 800,
            boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
          }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Supabase Configuration Missing</h2>
          <p style={{ fontSize: 14, color: '#4b5563', maxWidth: 450, lineHeight: 1.5, margin: 0 }}>
            Ittisalo could not initialize the database client because environment variables are not configured on your server.
          </p>
          <div style={{
            background: '#fff', border: '1px solid rgba(220,38,38,0.15)',
            padding: '12px 18px', borderRadius: 10, fontSize: 13, color: '#dc2626',
            fontWeight: 600, fontFamily: 'monospace', textAlign: 'left',
          }}>
            NEXT_PUBLIC_SUPABASE_URL<br />
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </div>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            Please add these keys to your Railway environment variables and redeploy to get online.
          </p>
        </div>
      );
    }
    return <Spinner />;
  }

  // Root '/' is a redirect gateway
  if (pathname === '/') return <Spinner />;

  // Full screen pages — no sidebar/banner
  if (isOnboarding || isLogin || pathname === '/update-password') return <>{children}</>;

  const initials = userName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'U';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBanner />
      {planLoaded && tenantInfo && tenantInfo.plan_status !== 'active' && !isAdminRoute && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <AlertCircle size={16} color="#dc2626" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#b91c1c' }}>
            (!) No Subscription Found. Please <a href="/dashboard" style={{ textDecoration: 'underline', color: '#b91c1c', cursor: 'pointer' }}>subscribe</a> to use the service.
          </span>
        </div>
      )}
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginLeft: 'var(--sidebar-w)', position: 'relative' }}>
          
          {/* Unified Sticky Header Bar */}
          <header style={{
            height: 60, background: '#fff', borderBottom: '1px solid rgba(220,38,38,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', position: 'sticky', top: 38, zIndex: 40,
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Mobile logo */}
              <div className="mobile-only" style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: '#fff', fontWeight: 800, flexShrink: 0,
              }}>A</div>
              <div style={{
                background: '#fef2f2', padding: '4px 10px', borderRadius: 8,
                border: '1px solid rgba(220,38,38,0.15)',
                fontSize: 12, fontWeight: 700, color: '#dc2626',
                whiteSpace: 'nowrap',
              }}>
                {niche?.label || 'General'}
              </div>
              <div className="desktop-only" style={{ fontSize: 14.5, fontWeight: 700, color: '#1f2937', letterSpacing: '-0.3px' }}>
                Ittisalo Studio <span style={{ fontSize: 11.5, color: '#dc2626', fontWeight: 600 }}>(Admin)</span>
              </div>
            </div>

            {/* Profile Avatar Trigger */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '5px 10px', borderRadius: 10,
                  transition: 'background 0.15s',
                  background: showDropdown ? '#fef2f2' : 'transparent',
                }}
                onMouseEnter={e => { if(!showDropdown) e.currentTarget.style.background = '#fff5f5'; }}
                onMouseLeave={e => { if(!showDropdown) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12.5, fontWeight: 700, color: '#fff',
                  boxShadow: '0 2px 8px rgba(220,38,38,0.25)',
                }}>
                  {initials}
                </div>
                <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', lineHeight: 1.2 }}>{userName}</span>
                  <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>{userEmail.length > 20 ? userEmail.slice(0, 17) + '...' : userEmail}</span>
                </div>
                <ChevronDown className="desktop-only" size={14} color="#9ca3af" style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </div>

              {/* GORGEOUS GLASSMORPHIC RED DROP-DOWN MENU */}
              {showDropdown && (
                <div style={{
                  position: 'absolute', right: 0, marginTop: 8, width: 230,
                  background: 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(220,38,38,0.12)', borderRadius: 12,
                  boxShadow: '0 10px 25px rgba(220,38,38,0.15)',
                  padding: '8px', zIndex: 1000,
                  animation: 'fadeUp 0.15s ease-out',
                }}>
                  {/* Account Header */}
                  <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid rgba(220,38,38,0.06)' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{userName}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{userEmail}</div>
                  </div>

                  {/* Menu Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
                    {[
                      { label: 'My Profile', icon: User, href: '/settings?tab=Business' },
                      { label: 'AI Copilot Config', icon: Bot, href: '/agents' },
                      { label: 'Connected Channels', icon: Plug, href: '/integrations' },
                      { label: 'System Settings', icon: Settings, href: '/settings' },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setShowDropdown(false);
                          router.push(item.href);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 9,
                          padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                          fontSize: 12.5, fontWeight: 550, color: '#4b5563',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#fef2f2';
                          e.currentTarget.style.color = '#dc2626';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#4b5563';
                        }}
                      >
                        <item.icon size={15} />
                        <span>{item.label}</span>
                      </div>
                    ))}

                    <div style={{ height: 1, background: 'rgba(220,38,38,0.06)', margin: '4px 0' }} />

                    <div
                      onClick={handleLogout}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9,
                        padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                        fontSize: 12.5, fontWeight: 600, color: '#ef4444',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#fee2e2';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <LogOut size={15} />
                      <span>Log out</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </header>
          
          {/* Main Content Area */}
          <main style={{ flex: 1, overflowY: 'auto', background: '#faf9f9', position: 'relative' }}>
            <div style={{ padding: '24px' }}>
              {!isAdminRoute && <MetaGateBanner />}
              {children}
            </div>
          </main>
        </div>
      </div>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 767px) {
          .desktop-only { display: none !important; }
        }
        @media (min-width: 768px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}
