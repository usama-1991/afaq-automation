'use client';

import { usePlan } from '@/context/PlanContext';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export default function MetaGateBanner() {
  const { tenantInfo, planLoaded } = usePlan();
  const router = useRouter();

  if (!planLoaded || !tenantInfo) return null;
  if (tenantInfo.meta_connected) return null;

  return (
    <div 
      className="page-header-row"
      style={{
        background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
        border: '1px solid #fde68a',
        borderRadius: 12,
        padding: '16px 18px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        boxShadow: '0 2px 8px rgba(245,158,11,0.05)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <AlertTriangle size={19} color="#d97706" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 2 }}>
            Connect your WhatsApp Business Account
          </div>
          <div style={{ fontSize: 12.5, color: '#b45309', lineHeight: 1.4 }}>
            To start receiving messages, run campaigns, and use the AI agent, link your Meta account.
          </div>
        </div>
      </div>
      <button
        onClick={() => router.push('/settings?tab=Channels+%26+APIs')}
        style={{
          padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: '#d97706', color: '#fff', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0,
          minHeight: 44,
          transition: 'background 0.2s',
        }}
        className="mobile-full-width"
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#b45309'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#d97706'}
      >
        Connect Now <ArrowRight size={14} />
      </button>
      <style>{`
        @media (max-width: 640px) {
          .mobile-full-width { width: 100% !important; margin-top: 4px; }
        }
      `}</style>
    </div>
  );
}
