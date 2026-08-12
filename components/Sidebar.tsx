'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Star, LayoutDashboard, MessageSquare, Users, Bot, Plug, Settings, LogOut, FileText, Megaphone, Folder, BarChart3, Menu, X, ShoppingBag, Crown } from 'lucide-react';
import { useNiche } from '@/context/NicheContext';
import { supabase } from '@/lib/supabase/client';

// Desktop icon-only nav item with CSS tokens - Memoized to prevent re-renders on route/state changes
const NavItem = memo(function NavItem({ href, icon: Icon, label, active, count, onPrefetch }: { href: string; icon: any; label: string; active: boolean; count?: number; onPrefetch?: (href: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const handleMouseEnter = () => {
    setHovered(true);
    if (onPrefetch) onPrefetch(href);
  };
  const handleFocus = () => {
    if (onPrefetch) onPrefetch(href);
  };
  return (
    <Link href={href} title={label} style={{ textDecoration: 'none', position: 'relative' }} onFocus={handleFocus}>
      <div
        style={{
          width: 44, height: 44, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: active ? 'rgba(255, 255, 255, 0.08)' : hovered ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
          color: active ? '#fff' : '#9ca3af',
          transition: 'all 0.15s ease', cursor: 'pointer', position: 'relative',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
      >
        {active && (
          <div style={{
            position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
            width: 3, height: 20, borderRadius: '0 4px 4px 0', background: '#fff',
          }} />
        )}
        <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />

        {/* Badge */}
        {count !== undefined && count > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -2,
            background: '#ef4444', color: '#fff',
            fontSize: 10, fontWeight: 700,
            width: 16, height: 16, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 2px #111827'
          }}>
            {count > 9 ? '9+' : count}
          </div>
        )}

        {/* Tooltip */}
        {hovered && (
          <div style={{
            position: 'fixed', left: 72, zIndex: 9999,
            background: '#1f2937', color: '#fff',
            fontSize: 12, fontWeight: 600,
            padding: '6px 12px', borderRadius: 6,
            whiteSpace: 'nowrap', pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.1)',
            animation: 'fadeUp 0.12s ease',
          }}>
            {label}
            <div style={{
              position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)',
              width: 8, height: 8, background: '#1f2937', rotate: '45deg', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)'
            }} />
          </div>
        )}
      </div>
    </Link>
  );
});

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { niche, nicheId } = useNiche();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [unreadChats, setUnreadChats] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  // Cluster 1: Core
  const clusterCore = useMemo(() => [
    { href: '/dashboard',     icon: LayoutDashboard, label: 'Overview' },
    { href: '/conversations', icon: MessageSquare,   label: 'Chats', count: unreadChats },
    { href: '/contacts',      icon: Users,           label: 'Contacts' },
  ], [unreadChats]);

  // Cluster 2: Commerce & Ops
  const clusterCommerce = useMemo(() => [
    { href: '/orders',        icon: ShoppingBag,     label: 'Orders', count: pendingOrders },
    ...(nicheId === 'ecommerce' ? [{ href: '/reviews', icon: Star, label: 'Reviews' }] : []),
    { href: '/campaigns',     icon: Megaphone,       label: 'Campaigns' },
    { href: '/templates',     icon: FileText,        label: 'Templates' },
    { href: '/media',         icon: Folder,          label: 'Media' },
  ], [pendingOrders, nicheId]);

  // Cluster 3: Intelligence
  const clusterIntelligence = useMemo(() => [
    { href: '/agents',        icon: Bot,             label: 'AI Agents' },
    { href: '/reports',       icon: BarChart3,       label: 'Reports' },
  ], []);

  // Cluster 4: Team & Settings
  const clusterSettings = useMemo(() => [
    { href: '/team',          icon: Users,           label: 'Team' },
    { href: '/settings',      icon: Settings,        label: 'Settings' },
  ], []);

  const allNav = useMemo(() => [...clusterCore, ...clusterCommerce, ...clusterIntelligence, ...clusterSettings], [clusterCore, clusterCommerce, clusterIntelligence, clusterSettings]);
  const MOBILE_NAV = useMemo(() => allNav.slice(0, 5), [allNav]);

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

  useEffect(() => {
    let tableName = 'orders';
    if (['dental', 'salon', 'clinic'].includes(nicheId)) tableName = 'appointments';
    else if (nicheId === 'realestate') tableName = 'leads';

    const fetchCounts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
      const tenantId = profile?.tenant_id;

      if (tenantId) {
        // Orders count
        const { data: orders } = await supabase.from(tableName).select('status, stage').eq('tenant_id', tenantId);
        if (orders) {
          const pending = orders.filter((o: any) => ['pending', 'pending_address', 'new_inquiry'].includes((o.status || o.stage || '').toLowerCase())).length;
          setPendingOrders(pending);
        }
      }

      // Chats count
      const { data: convos } = await supabase.from('conversations').select('unread_count');
      if (convos) {
        const unread = convos.filter((c: any) => c.unread_count > 0).length;
        setUnreadChats(unread);
      }
    };

    fetchCounts();

    // subscriptions
    const convSub = supabase.channel('sidebar_convos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchCounts)
      .subscribe();
      
    const ordersSub = supabase.channel(`sidebar_${tableName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(convSub);
      supabase.removeChannel(ordersSub);
    };
  }, [nicheId]);

  const handlePrefetch = useCallback((href: string) => {
    if (href && href.startsWith('/')) {
      router.prefetch(href);
    }
  }, [router]);

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
          width: 72, background: '#111827', height: '100vh',
          position: 'fixed', left: 0, top: 0,
          flexDirection: 'column', alignItems: 'center',
          borderRight: '1px solid #1f2937', zIndex: 50,
        }}
      >
        {/* Logo */}
        <div style={{
          width: 72, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid #1f2937', flexShrink: 0,
        }}>
          <img src="/Code_Generated_Image.png" alt="Logo" style={{
            width: 48, height: 48, borderRadius: 10, objectFit: 'contain'
          }} />
        </div>

        {/* Nav with Semantic Clusters & Dividers */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 0', overflowY: 'auto' }}>
          {/* Cluster 1: Core */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            {clusterCore.map(item => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} count={(item as any).count} active={pathname === item.href || pathname.startsWith(item.href + '/')} onPrefetch={handlePrefetch} />
            ))}
          </div>

          <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

          {/* Cluster 2: Commerce & Ops */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            {clusterCommerce.map(item => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} count={(item as any).count} active={pathname === item.href || pathname.startsWith(item.href + '/')} onPrefetch={handlePrefetch} />
            ))}
          </div>

          <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

          {/* Cluster 3: Intelligence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            {clusterIntelligence.map(item => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} count={(item as any).count} active={pathname === item.href || pathname.startsWith(item.href + '/')} onPrefetch={handlePrefetch} />
            ))}
          </div>

          <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

          {/* Cluster 4: Team & Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            {clusterSettings.map(item => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} count={(item as any).count} active={pathname === item.href || pathname.startsWith(item.href + '/')} onPrefetch={handlePrefetch} />
            ))}
            {userRole === 'super_admin' && (
              <NavItem href="/admin" icon={Crown} label="Super Admin" active={pathname.startsWith('/admin')} onPrefetch={handlePrefetch} />
            )}
          </div>
        </nav>

        {/* Avatar & Logout */}
        <div style={{ padding: '16px 0', borderTop: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', width: '100%' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--niche-accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer',
            boxShadow: '0 2px 8px var(--primary-glow)',
          }}>
            {niche.label.slice(0, 2).toUpperCase()}
          </div>
          
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 8, borderRadius: 8, transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={20} strokeWidth={1.8} />
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ──────────────────────────────── */}
      <nav className="mobile-bottom-nav" style={{ alignItems: 'stretch', justifyContent: 'space-around', borderTop: '1px solid var(--border)' }}>
        {MOBILE_NAV.map((navItem) => {
          const { href, icon: Icon, label } = navItem;
          const count = (navItem as any).count;
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              style={{ textDecoration: 'none', flex: 1 }}
              onMouseEnter={() => handlePrefetch(href)}
              onFocus={() => handlePrefetch(href)}
            >
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', gap: 3,
                color: active ? 'var(--primary)' : '#9ca3af',
                transition: 'color 0.15s',
                position: 'relative',
              }}>
                <div style={{ position: 'relative' }}>
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.7} />
                  {count !== undefined && count > 0 && (
                    <div style={{
                      position: 'absolute', top: -4, right: -6,
                      background: '#ef4444', color: '#fff',
                      fontSize: 9, fontWeight: 700,
                      width: 14, height: 14, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 0 2px #fff'
                    }}>
                      {count > 9 ? '9+' : count}
                    </div>
                  )}
                </div>
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
                <img src="/Code_Generated_Image.png" alt="Logo" style={{
                  width: 34, height: 34, borderRadius: 10, objectFit: 'contain'
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
              {allNav.map((navItem) => {
                const { href, icon: Icon, label } = navItem;
                const count = (navItem as any).count;
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
                      <div style={{ position: 'relative' }}>
                        <Icon size={18} color={active ? 'var(--primary)' : '#6b7280'} strokeWidth={active ? 2.2 : 1.8} />
                        {count !== undefined && count > 0 && (
                          <div style={{
                            position: 'absolute', top: -4, right: -6,
                            background: '#ef4444', color: '#fff',
                            fontSize: 9, fontWeight: 700,
                            width: 14, height: 14, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 0 0 2px ${active ? 'var(--primary-light)' : '#fafafa'}`
                          }}>
                            {count > 9 ? '9+' : count}
                          </div>
                        )}
                      </div>
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

export default memo(Sidebar);
