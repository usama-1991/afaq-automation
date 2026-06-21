'use client';

import { usePlan } from '@/context/PlanContext';
import { useRouter } from 'next/navigation';
import { Check, ArrowLeft } from 'lucide-react';

export default function PricingPage() {
  const { tenantInfo } = usePlan();
  const router = useRouter();

  const handleUpgrade = (planName: string) => {
    // Instead of a payment gateway, we use WhatsApp for early access
    const msg = `Hi! I want to upgrade my AutoFlow AI workspace (${tenantInfo?.business_name || 'My Business'}) to the ${planName} plan.`;
    window.open(`https://wa.me/923000000000?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f9', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        <button 
          onClick={() => router.push('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 30 }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#111827', letterSpacing: '-1px', marginBottom: 12 }}>
            Simple, Transparent Pricing
          </h1>
          <p style={{ fontSize: 16, color: '#4b5563', maxWidth: 600, margin: '0 auto' }}>
            Choose the plan that fits your business. Upgrade anytime as you grow.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          
          {/* Starter Plan */}
          <div style={{ background: '#fff', borderRadius: 24, padding: '32px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Starter</div>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>Perfect for small businesses getting started with WhatsApp AI.</div>
            <div style={{ marginBottom: 30 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#111827', letterSpacing: '-1px' }}>Rs 4,999</span>
              <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>/mo</span>
            </div>
            <button onClick={() => handleUpgrade('Starter')} style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#f3f4f6', color: '#374151', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 32 }}>
              {tenantInfo?.plan === 'starter' ? 'Current Plan' : 'Choose Starter'}
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              {[
                '500 Conversations / month',
                '1 AI Agent Configuration',
                '2 Team Members',
                '5 WhatsApp Templates',
                '2 Broadcast Campaigns',
                'GPT-4o Mini AI Model',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={12} color="#10b981" /></div>
                  <span style={{ fontSize: 14, color: '#4b5563', fontWeight: 500 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Growth Plan */}
          <div style={{ background: '#111827', borderRadius: 24, padding: '32px', border: '1px solid #374151', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', position: 'relative', transform: 'scale(1.05)', zIndex: 10 }}>
            <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Popular</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Growth</div>
            <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>For growing brands that need multi-channel support.</div>
            <div style={{ marginBottom: 30 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>Rs 9,999</span>
              <span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 500 }}>/mo</span>
            </div>
            <button onClick={() => handleUpgrade('Growth')} style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 32 }}>
              {tenantInfo?.plan === 'growth' ? 'Current Plan' : 'Upgrade to Growth'}
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              {[
                '2,000 Conversations / month',
                '3 AI Agent Configurations',
                '5 Team Members',
                '20 WhatsApp Templates',
                '10 Broadcast Campaigns',
                'GPT-4o Premium Model',
                'Instagram & Messenger Included',
                'Advanced Analytics',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={12} color="#10b981" /></div>
                  <span style={{ fontSize: 14, color: '#e5e7eb', fontWeight: 500 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Enterprise Plan */}
          <div style={{ background: '#fff', borderRadius: 24, padding: '32px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Enterprise</div>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>Maximum limits and priority support for large operations.</div>
            <div style={{ marginBottom: 30 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#111827', letterSpacing: '-1px' }}>Rs 24,999</span>
              <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>/mo</span>
            </div>
            <button onClick={() => handleUpgrade('Enterprise')} style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#fef2f2', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 32 }}>
              {tenantInfo?.plan === 'enterprise' ? 'Current Plan' : 'Contact for Enterprise'}
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              {[
                'Unlimited Conversations',
                '10 AI Agent Configurations',
                '25 Team Members',
                '100 WhatsApp Templates',
                '50 Broadcast Campaigns',
                'All Growth Features',
                'Priority 24/7 Support',
                'Custom Branding Removal',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={12} color="#10b981" /></div>
                  <span style={{ fontSize: 14, color: '#4b5563', fontWeight: 500 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
