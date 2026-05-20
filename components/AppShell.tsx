'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useNiche } from '@/context/NicheContext';
import { supabase } from '@/lib/supabase/client';
import Sidebar from './Sidebar';
import TopBanner from './TopBanner';
import { User, Bot, Plug, Settings, LogOut, ChevronDown, Building, ShieldAlert } from 'lucide-react';

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
  const { onboarded, hydrated, niche } = useNiche();
  const [session, setSession] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userEmail, setUserEmail] = useState('usamahabib1991@gmail.com');
  const [userName, setUserName] = useState('Usama Habib');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOnboarding = pathname === '/onboarding';
  const isLogin = pathname === '/login';
  const isAdminRoute = pathname.startsWith('/admin');

  useEffect(() => {
    supabase.auth.getSession().then((response: any) => {
      setSession(response.data.session);
      if (response.data.session?.user) {
        setUserEmail(response.data.session.user.email || 'usamahabib1991@gmail.com');
        setUserName(response.data.session.user.user_metadata?.full_name || response.data.session.user.email?.split('@')[0] || 'Usama Habib');
      }
      setSessionChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, currentSession: any) => {
      setSession(currentSession);
      if (currentSession?.user) {
        setUserEmail(currentSession.user.email || 'usamahabib1991@gmail.com');
        setUserName(currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || 'Usama Habib');
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
      subscription.unsubscribe();
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

    const isAdminUser = session.user?.email === 'admin@autoflow.ai';

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
  if (!hydrated || !sessionChecked) return <Spinner />;

  // Root '/' is a redirect gateway
  if (pathname === '/') return <Spinner />;

  // Full screen pages — no sidebar/banner
  if (isOnboarding || isLogin || pathname === '/update-password') return <>{children}</>;

  const initials = userName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'U';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBanner />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginLeft: 64, position: 'relative' }}>
          
          {/* Unified Sticky Header Bar */}
          <header style={{
            height: 60, background: '#fff', borderBottom: '1px solid rgba(220,38,38,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px', position: 'sticky', top: 38, zIndex: 40,
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: '#fef2f2', padding: '5px 12px', borderRadius: 8,
                border: '1px solid rgba(220,38,38,0.15)',
                fontSize: 13, fontWeight: 700, color: '#dc2626',
              }}>
                {niche?.label || 'General'} Niche
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1f2937', letterSpacing: '-0.3px' }}>
                AutoFlow Studio <span style={{ fontSize: 11.5, color: '#dc2626', fontWeight: 600 }}>(Admin)</span>
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', lineHeight: 1.2 }}>{userName}</span>
                  <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>{userEmail.length > 20 ? userEmail.slice(0, 17) + '...' : userEmail}</span>
                </div>
                <ChevronDown size={14} color="#9ca3af" style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
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
          <main style={{
            flex: 1,
            background: '#faf9f9',
            overflowY: 'auto',
          }}>
            {children}
          </main>
        </div>
      </div>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
