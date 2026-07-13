'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNiche } from '@/context/NicheContext';
import { niches } from '@/lib/niches';
import { Check, ArrowRight, MessageSquare, Zap, BarChart2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function OnboardingPage() {
  const { setNicheId, setOnboarded } = useNiche();
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStart = async () => {
    if (!selected) return;
    if (step === 1) { 
      setStep(2); 
      return; 
    }
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      // 1. Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication session not found. Please log in.');
      }

      // 2. Fetch the user's profile to get the tenant_id
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.tenant_id) {
        throw new Error('Associated tenant profile not found.');
      }

      const tenantId = profile.tenant_id;

      // 3. Update public.tenants table with selected niche, name, and phone
      const { error: tenantUpdateError } = await supabase
        .from('tenants')
        .update({
          niche: selected,
          business_name: businessName || niches.find(n => n.id === selected)?.label || 'My Business',
          business_phone: phone || '',
          onboarding_completed: true,
          plan: 'trial',
          plan_status: 'active'
        })
        .eq('id', tenantId);

      if (tenantUpdateError) {
        throw tenantUpdateError;
      }

      // 4. Create or update starting niche agent inside public.agents
      const activeNiche = niches.find(n => n.id === selected);
      if (activeNiche) {
        const { data: existingAgent } = await supabase
          .from('agents')
          .select('id')
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (existingAgent?.id) {
          // Update existing
          await supabase
            .from('agents')
            .update({
              name: activeNiche.agentName,
              prompt: activeNiche.systemRole,
              is_active: true
            })
            .eq('id', existingAgent.id);
        } else {
          // Insert new
          await supabase
            .from('agents')
            .insert({
              tenant_id: tenantId,
              name: activeNiche.agentName,
              prompt: activeNiche.systemRole,
              is_active: true
            });
        }
      }

      // 5. Update local context & state
      setNicheId(selected);
      setOnboarded(true);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Onboarding sync error:', err);
      setErrorMsg(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fff 50%, #fee2e2 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative' }}>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            style={{ 
              position: 'absolute', 
              top: 0, 
              right: 0, 
              fontSize: 13, 
              color: '#4b5563', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '8px 12px', 
              borderRadius: '8px',
              fontWeight: 500
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f3f4f6'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
          >
            Sign Out
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            <img src="/ittisalo-logo.png" alt="Ittisalo" style={{ width: 40, height: 40, borderRadius: 11 }} />
            <span style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>Ittisalo</span>
          </div>
          {step === 1 ? (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.6px', marginBottom: 8 }}>
                What type of business are you?
              </h1>
              <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.5 }}>
                We'll customize your WhatsApp AI agent and dashboard specifically for your industry.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.6px', marginBottom: 8 }}>
                Tell us about your business
              </h1>
              <p style={{ fontSize: 15, color: '#4b5563' }}>Almost there! Just a few details to personalize your dashboard.</p>
            </>
          )}
        </div>

        {errorMsg && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            color: '#b91c1c',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 13.5,
            marginBottom: 20,
            textAlign: 'center',
            fontWeight: 500
          }}>
            {errorMsg}
          </div>
        )}

        {step === 1 && (
          <>
            {/* Features strip */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'center' }}>
              {[
                { icon: MessageSquare, text: 'WhatsApp AI Agent' },
                { icon: BarChart2, text: 'Live CRM Dashboard' },
                { icon: Zap, text: 'Auto-pilot conversations' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  background: '#fff', 
                  border: '1px solid rgba(220,38,38,0.15)', 
                  borderRadius: 20, 
                  padding: '6px 14px', 
                  fontSize: 12.5, 
                  fontWeight: 500, 
                  color: '#dc2626' 
                }}>
                  <Icon size={13} /> {text}
                </div>
              ))}
            </div>

            {/* Niche grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
              {niches.map(niche => (
                <div
                  key={niche.id}
                  onClick={() => setSelected(niche.id)}
                  style={{
                    background: '#fff',
                    border: selected === niche.id ? `2px solid #dc2626` : '1.5px solid rgba(220,38,38,0.12)',
                    borderRadius: 14, padding: '18px 14px',
                    cursor: 'pointer', transition: 'all 0.13s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    position: 'relative',
                    boxShadow: selected === niche.id ? '0 0 0 4px rgba(220,38,38,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                  onMouseEnter={e => { if (selected !== niche.id) (e.currentTarget as HTMLElement).style.borderColor = '#f87171'; }}
                  onMouseLeave={e => { if (selected !== niche.id) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.12)'; }}
                >
                  {selected === niche.id && (
                    <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                  <div style={{ fontSize: 32 }}>{niche.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'center', lineHeight: 1.3 }}>{niche.label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              disabled={!selected}
              style={{
                width: '100%', padding: '14px', fontSize: 15, fontWeight: 600,
                background: selected ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : '#e5e7eb',
                color: selected ? '#fff' : '#9ca3af',
                border: 'none', borderRadius: 12, cursor: selected ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s',
                boxShadow: selected ? '0 4px 14px rgba(220,38,38,0.3)' : 'none',
              }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </>
        )}

        {step === 2 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '12px 14px', background: '#fef2f2', borderRadius: 10 }}>
              <span style={{ fontSize: 24 }}>{niches.find(n => n.id === selected)?.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{niches.find(n => n.id === selected)?.label}</div>
                <div style={{ fontSize: 11.5, color: '#6b7280' }}>Selected niche</div>
              </div>
              <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Change</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Business Name</label>
              <input
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder={`e.g. ${selected === 'restaurant' ? 'Spice Garden Restaurant' : selected === 'dental' ? 'Smile Dental Clinic' : 'Your Business Name'}`}
                style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>WhatsApp Business Number</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
                style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
              {[
                { icon: '🤖', text: 'AI agent pre-configured for your niche' },
                { icon: '📊', text: 'CRM dashboard ready instantly' },
                { icon: '💬', text: 'WhatsApp + Instagram connected' },
              ].map(f => (
                <div key={f.text} style={{ background: '#fef2f2', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
                  <div style={{ fontSize: 11.5, color: '#dc2626', fontWeight: 600, lineHeight: 1.4 }}>{f.text}</div>
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              disabled={loading}
              style={{
                width: '100%', padding: '14px', fontSize: 15, fontWeight: 600,
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
                border: 'none', borderRadius: 12, cursor: loading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
                opacity: loading ? 0.8 : 1
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Customizing Workspace...
                </>
              ) : (
                <>
                  Launch My Dashboard 🚀
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
