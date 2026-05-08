'use client';

import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

export default function TopBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div style={{
      background: 'linear-gradient(90deg, #b91c1c 0%, #dc2626 50%, #ef4444 100%)',
      color: '#fff',
      height: 38,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      fontSize: 12.5,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sparkles size={13} fill="#fbbf24" color="#fbbf24" />
        <span>Your Growth Plan trial ends in <strong>7 days</strong> on Jun 3, 2026. Experience the future of Omni-channel AI.</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, opacity: 0.85, cursor: 'pointer', textDecoration: 'underline' }}>Onboarding checklist</span>
        <button style={{
          background: 'rgba(255,255,255,0.18)', color: '#fff',
          border: '1.5px solid rgba(255,255,255,0.4)',
          borderRadius: 20, padding: '3px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          backdropFilter: 'blur(4px)',
        }}>Upgrade now</button>
        <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', opacity: 0.7 }}>
          <X size={14} color="#fff" />
        </button>
      </div>
    </div>
  );
}
