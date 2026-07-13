'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Users, Bot, Plug, Settings, LogOut, FileText, Megaphone, Folder, BarChart3, Menu, X, ShoppingBag, Crown } from 'lucide-react';
import { useNiche } from '@/context/NicheContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

const nav = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Overview' },
  { href: '/conversations', icon: MessageSquare,   label: 'Chats' },
  { href: '/contacts',      icon: Users,           label: 'Contacts' },
  { href: '/orders',        icon: ShoppingBag,     label: 'Orders' },
  { href: '/campaigns',     icon: Megaphone,       label: 'Campaigns' },
  { href: '/agents',        icon: Bot,             label: 'AI Agents' },
  { href: '/team',          icon: Users,           label: 'Team' },
  { href: '/templates',     icon: FileText,        label: 'Templates' },
  { href: '/media',         icon: Folder,          label: 'Media' },
  { href: '/reports',       icon: BarChart3,       label: 'Reports' },
  { href: '/settings',      icon: Settings,        label: 'Settings' },
];

// Desktop icon-only nav item
function NavItem({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={href} title={label} style={{ textDecoration: 'none', position: 'relative' }}>
      <div
        style={{
          width: 40, height: 40, borderRadius: 11,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: active ? '#fef2f2' : hovered ? '#fff5f5' : 'transparent',
          color: active || hovered ? '#dc2626' : '#9ca3af',
          transition: 'all 0.15s ease', cursor: 'pointer', position: 'relative',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {active && (
          <div style={{
            position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)',
            width: 3, height: 20, borderRadius: 2, background: '#dc2626',
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

// Bottom nav shown only on mobile — shows first 5 primary items
const MOBILE_NAV = nav.slice(0, 5);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { niche } = useNiche();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

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
          borderRight: '1px solid rgba(220,38,38,0.08)', zIndex: 50,
        }}
      >
        {/* Logo */}
        <div style={{
          width: 64, height: 98, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid rgba(220,38,38,0.07)', flexShrink: 0,
        }}>
          <img src="/ittisalo-logo.svg" alt="Ittisalo" style={{
            width: 34, height: 34, borderRadius: 10,
            boxShadow: '0 4px 12px rgba(220,38,38,0.35)',
          }} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '14px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            {nav.map(item => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={pathname === item.href || pathname.startsWith(item.href + '/')} />
            ))}
            {userRole === 'super_admin' && (
              <NavItem href="/admin" icon={Crown} label="Super Admin" active={pathname.startsWith('/admin')} />
            )}
          </div>
        </nav>

        {/* Avatar & Logout */}
        <div style={{ padding: '14px 0', borderTop: '1px solid rgba(220,38,38,0.07)', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #dc2626, #f59e0b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
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
            onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fff5f5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={18} strokeWidth={1.8} />
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ──────────────────────────────── */}
      <nav className="mobile-bottom-nav" style={{ alignItems: 'stretch', justifyContent: 'space-around' }}>
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
                color: active ? '#dc2626' : '#9ca3af',
                transition: 'color 0.15s',
              }}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.7} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, lineHeight: 1 }}>{label}</span>
                {active && (
                  <div style={{
                    position: 'absolute', top: 0,
                    width: 28, height: 2.5, borderRadius: 2,
                    background: '#dc2626',
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
                <img src="/ittisalo-logo.svg" alt="Ittisalo" style={{
                  width: 34, height: 34, borderRadius: 10,
                }} />
                <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Ittisalo</span>
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
              {nav.map(({ href, icon: Icon, label }) => {
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
                      background: active ? '#fef2f2' : '#fafafa',
                      border: `1px solid ${active ? 'rgba(220,38,38,0.2)' : 'rgba(0,0,0,0.05)'}`,
                    }}>
                      <Icon size={18} color={active ? '#dc2626' : '#6b7280'} strokeWidth={active ? 2.2 : 1.8} />
                      <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#dc2626' : '#374151' }}>
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
                    background: pathname.startsWith('/admin') ? '#fef2f2' : '#111827',
                    color: pathname.startsWith('/admin') ? '#dc2626' : '#fff',
                    transition: 'background 0.2s', border: pathname.startsWith('/admin') ? '1px solid #fecaca' : 'none'
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
                padding: '13px', borderRadius: 12, border: '1px solid rgba(220,38,38,0.2)',
                background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: 14, cursor: 'pointer',
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
