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
    <div style={{
      background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
      border: '1px solid #fde68a',
      borderRadius: 12,
      padding: '16px 20px',
      marginBottom: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      boxShadow: '0 2px 8px rgba(245,158,11,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <AlertTriangle size={20} color="#d97706" />
        </div>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: '#92400e', marginBottom: 2 }}>
            Connect your WhatsApp Business Account
          </div>
          <div style={{ fontSize: 13, color: '#b45309' }}>
            To start receiving messages, run campaigns, and use the AI agent, you must link your Meta account.
          </div>
        </div>
      </div>
      <button
        onClick={() => router.push('/settings?tab=Channels+%26+APIs')}
        style={{
          padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: '#d97706', color: '#fff', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#b45309'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#d97706'}
      >
        Connect Now <ArrowRight size={14} />
      </button>
    </div>
  );
}
