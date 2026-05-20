'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Users, Bot, Plug, Settings, LogOut, FileText, Megaphone, Folder, BarChart3 } from 'lucide-react';
import { useNiche } from '@/context/NicheContext';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

const nav = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Overview' },
  { href: '/conversations', icon: MessageSquare,   label: 'Conversations' },
  { href: '/contacts',      icon: Users,           label: 'Contacts' },
  { href: '/agents',        icon: Bot,             label: 'AI Agents' },
  { href: '/templates',     icon: FileText,        label: 'Templates' },
  { href: '/campaigns',     icon: Megaphone,       label: 'Campaigns' },
  { href: '/media',         icon: Folder,          label: 'Media Library' },
  { href: '/reports',       icon: BarChart3,       label: 'Reports' },
  { href: '/integrations',  icon: Plug,            label: 'Integrations' },
  { href: '/settings',      icon: Settings,        label: 'Settings' },
];

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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { niche } = useNiche();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside style={{
      width: 64, background: '#fff', height: '100vh',
      position: 'fixed', left: 0, top: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      borderRight: '1px solid rgba(220,38,38,0.08)', zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        width: 64, height: 98, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: '1px solid rgba(220,38,38,0.07)', flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, color: '#fff', fontWeight: 800,
          boxShadow: '0 4px 12px rgba(220,38,38,0.35)',
        }}>A</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '14px 0' }}>
        {nav.map(({ href, icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return <NavItem key={href} href={href} icon={icon} label={label} active={active} />;
        })}
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
  );
}
