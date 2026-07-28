'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Star, LayoutDashboard, MessageSquare, Users, Bot, Plug, Settings, LogOut, FileText, Megaphone, Folder, BarChart3, Menu, X, ShoppingBag, Crown } from 'lucide-react';
import { useNiche } from '@/context/NicheContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

// Desktop icon-only nav item with CSS tokens
function NavItem({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={href} title={label} style={{ textDecoration: 'none', position: 'relative' }}>
      <div
        style={{
          width: 40, height: 40, borderRadius: 11,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: active ? 'var(--primary-light)' : hovered ? 'rgba(168, 37, 63, 0.06)' : 'transparent',
          color: active || hovered ? 'var(--primary)' : '#9ca3af',
          transition: 'all 0.15s ease', cursor: 'pointer', position: 'relative',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {active && (
          <div style={{
            position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)',
            width: 3, height: 20, borderRadius: 2, background: 'var(--primary)',
          }} />
        )}
        <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />

        {/* Tooltip */}
        {hovered && (
          <div style={{
            position: 'fixed', left: 72, zIndex: 9999,
            background: '#111827', color: '#fff',
            fontSize: 12, fontWeight: 500,
            padding: '5px 10px', borderRadius: 7,
            whiteSpace: 'nowrap', pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            animation: 'fadeUp 0.12s ease',
          }}>
            {label}
            <div style={{
              position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)',
              width: 8, height: 8, background: '#111827', rotate: '45deg',
            }} />
          </div>
        )}
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { niche, nicheId } = useNiche();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Cluster 1: Core
  const clusterCore = [
    { href: '/dashboard',     icon: LayoutDashboard, label: 'Overview' },
    { href: '/conversations', icon: MessageSquare,   label: 'Chats' },
    { href: '/contacts',      icon: Users,           label: 'Contacts' },
  ];

  // Cluster 2: Commerce & Ops
  const clusterCommerce = [
    { href: '/orders',        icon: ShoppingBag,     label: 'Orders' },
    ...(nicheId === 'ecommerce' ? [{ href: '/reviews', icon: Star, label: 'Reviews' }] : []),
    { href: '/campaigns',     icon: Megaphone,       label: 'Campaigns' },
    { href: '/templates',     icon: FileText,        label: 'Templates' },
    { href: '/media',         icon: Folder,          label: 'Media' },
  ];

  // Cluster 3: Intelligence
  const clusterIntelligence = [
    { href: '/agents',        icon: Bot,             label: 'AI Agents' },
    { href: '/reports',       icon: BarChart3,       label: 'Reports' },
  ];

  // Cluster 4: Team & Settings
  const clusterSettings = [
    { href: '/team',          icon: Users,           label: 'Team' },
    { href: '/settings',      icon: Settings,        label: 'Settings' },
  ];

  const allNav = [...clusterCore, ...clusterCommerce, ...clusterIntelligence, ...clusterSettings];
  const MOBILE_NAV = allNav.slice(0, 5);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
        if (data) setUserRole(data.role);
      }
    };
    fetchRole();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside
        className="desktop-sidebar"
        style={{
          width: 64, background: '#fff', height: '100vh',
          position: 'fixed', left: 0, top: 0,
          flexDirection: 'column', alignItems: 'center',
          borderRight: '1px solid var(--border)', zIndex: 50,
        }}
      >
        {/* Logo */}
        <div style={{
          width: 64, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <img src="/ittisalo-logo.png" alt="Ittisalo" style={{
            width: 34, height: 34, borderRadius: 10, mixBlendMode: 'multiply',
            boxShadow: '0 4px 12px var(--primary-glow)',
          }} />
        </div>

        {/* Nav with Semantic Clusters & Dividers */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 0', overflowY: 'auto' }}>
          {/* Cluster 1: Core */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            {clusterCore.map(item => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={pathname === item.href || pathname.startsWith(item.href + '/')} />
            ))}
          </div>

          <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '2px 0' }} />

          {/* Cluster 2: Commerce & Ops */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            {clusterCommerce.map(item => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={pathname === item.href || pathname.startsWith(item.href + '/')} />
            ))}
          </div>

          <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '2px 0' }} />

          {/* Cluster 3: Intelligence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            {clusterIntelligence.map(item => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={pathname === item.href || pathname.startsWith(item.href + '/')} />
            ))}
          </div>

          <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '2px 0' }} />

          {/* Cluster 4: Team & Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            {clusterSettings.map(item => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={pathname === item.href || pathname.startsWith(item.href + '/')} />
            ))}
            {userRole === 'super_admin' && (
              <NavItem href="/admin" icon={Crown} label="Super Admin" active={pathname.startsWith('/admin')} />
            )}
          </div>
        </nav>

        {/* Avatar & Logout */}
        <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--niche-accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer',
            boxShadow: '0 2px 8px var(--primary-glow)',
          }}>
            {niche.label.slice(0, 2).toUpperCase()}
          </div>
          
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 8, borderRadius: 8, transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={18} strokeWidth={1.8} />
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ──────────────────────────────── */}
      <nav className="mobile-bottom-nav" style={{ alignItems: 'stretch', justifyContent: 'space-around', borderTop: '1px solid var(--border)' }}>
        {MOBILE_NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              style={{ textDecoration: 'none', flex: 1 }}
            >
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', gap: 3,
                color: active ? 'var(--primary)' : '#9ca3af',
                transition: 'color 0.15s',
              }}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.7} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, lineHeight: 1 }}>{label}</span>
                {active && (
                  <div style={{
                    position: 'absolute', top: 0,
                    width: 28, height: 2.5, borderRadius: 2,
                    background: 'var(--primary)',
                  }} />
                )}
              </div>
            </Link>
          );
        })}

        {/* More button → opens a full-screen overlay */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 3, border: 'none', background: 'none',
            cursor: 'pointer', color: '#9ca3af', padding: 0,
          }}
        >
          <Menu size={20} strokeWidth={1.7} />
          <span style={{ fontSize: 10, fontWeight: 500 }}>More</span>
        </button>
      </nav>

      {/* ── Mobile Full-Menu Overlay ──────────────────────── */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        }} onClick={() => setMobileMenuOpen(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: '#fff', borderRadius: '20px 20px 0 0',
              padding: '20px 16px 32px',
              animation: 'slideInUp 0.28s ease',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
            }}
          >
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb', margin: '0 auto 20px' }} />

            {/* Logo + close */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/ittisalo-logo.png" alt="Ittisalo" style={{
                  width: 34, height: 34, borderRadius: 10, mixBlendMode: 'multiply',
                }} />
                <span style={{ fontWeight: 700, fontSize: 16, color: '#111827', fontFamily: 'var(--font-jakarta)' }}>Ittisalo</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}
              >
                <X size={18} color="#374151" />
              </button>
            </div>

            {/* All nav items in a grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {allNav.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px', borderRadius: 12,
                      background: active ? 'var(--primary-light)' : '#fafafa',
                      border: `1px solid ${active ? 'var(--primary-glow)' : 'rgba(0,0,0,0.05)'}`,
                    }}>
                      <Icon size={18} color={active ? 'var(--primary)' : '#6b7280'} strokeWidth={active ? 2.2 : 1.8} />
                      <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? 'var(--primary)' : '#374151' }}>
                        {label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {userRole === 'super_admin' && (
              <div style={{ marginBottom: 16 }}>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 12,
                    textDecoration: 'none', fontWeight: 600, fontSize: 14,
                    background: pathname.startsWith('/admin') ? 'var(--primary-light)' : '#111827',
                    color: pathname.startsWith('/admin') ? 'var(--primary)' : '#fff',
                    transition: 'background 0.2s', border: pathname.startsWith('/admin') ? '1px solid var(--border)' : 'none'
                  }}
                >
                  <Crown size={18} />
                  Super Admin
                </Link>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px', borderRadius: 12, border: '1px solid var(--border)',
                background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
