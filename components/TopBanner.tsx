'use client';

import { useState, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';
import { usePlan } from '@/context/PlanContext';

function TopBanner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { trialDaysLeft, tenantInfo } = usePlan();
  
  const trialEndsDate = useMemo(() => {
    return tenantInfo?.trial_ends_at 
      ? new Date(tenantInfo.trial_ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';
  }, [tenantInfo?.trial_ends_at]);

  return (
    <div style={{
      background: 'linear-gradient(90deg, #b91c1c 0%, #dc2626 50%, #ef4444 100%)',
      color: '#fff',
      height: 38,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      fontSize: 12.5,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexShrink: 0,
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
        <Sparkles size={13} fill="#fbbf24" color="#fbbf24" style={{ flexShrink: 0 }} />
        {/* Full text on desktop */}
        <span className="banner-trial-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Your Free Trial ends in <strong>{trialDaysLeft ?? 0} days</strong>{trialEndsDate ? ` on ${trialEndsDate}` : ''}. Experience the future of Omni-channel AI.
        </span>
        {/* Short text on mobile */}
        <span className="banner-trial-text-short" style={{ fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Trial ends in <strong>{trialDaysLeft ?? 0} days</strong>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span 
          onClick={() => router.push('/onboarding')}
          className="banner-trial-text"
          style={{ fontSize: 12, opacity: 0.85, cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap' }}
        >
          Onboarding
        </span>
        <button 
          onClick={() => router.push('/settings?tab=Usage%20Quotas')}
          className="banner-upgrade-btn"
          style={{
            background: 'rgba(255,255,255,0.18)', color: '#fff',
            border: '1.5px solid rgba(255,255,255,0.4)',
            borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            backdropFilter: 'blur(4px)', whiteSpace: 'nowrap',
          }}
        >
          Upgrade
        </button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', opacity: 0.7, flexShrink: 0 }}>
          <X size={14} color="#fff" />
        </button>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .banner-trial-text { display: none !important; }
          .banner-upgrade-btn { display: none !important; }
          .banner-trial-text-short { display: inline !important; }
        }
        @media (min-width: 768px) {
          .banner-trial-text-short { display: none !important; }
          .banner-trial-text { display: inline !important; }
        }
      `}</style>
    </div>
  );
}

export default memo(TopBanner);
