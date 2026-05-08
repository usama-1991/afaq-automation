'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNiche } from '@/context/NicheContext';
import { niches } from '@/lib/niches';
import { Check, ArrowRight, MessageSquare, Zap, BarChart2 } from 'lucide-react';

export default function OnboardingPage() {
  const { setNicheId, setOnboarded } = useNiche();
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1);

  const handleStart = () => {
    if (!selected) return;
    if (step === 1) { setStep(2); return; }
    setNicheId(selected);
    setOnboarded(true);
    router.push('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdf4 50%, #fef3c7 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, #4f46e5, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>A</div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>AutoFlow AI</span>
          </div>
          {step === 1 ? (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.6px', marginBottom: 8 }}>
                What type of business are you?
              </h1>
              <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.5 }}>
                We'll customize your WhatsApp AI agent and dashboard specifically for your industry.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.6px', marginBottom: 8 }}>
                Tell us about your business
              </h1>
              <p style={{ fontSize: 15, color: '#6b7280' }}>Almost there! Just a few details to personalize your dashboard.</p>
            </>
          )}
        </div>

        {step === 1 && (
          <>
            {/* Features strip */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'center' }}>
              {[
                { icon: MessageSquare, text: 'WhatsApp AI Agent' },
                { icon: BarChart2, text: 'Live CRM Dashboard' },
                { icon: Zap, text: 'Auto-pilot conversations' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 20, padding: '6px 14px', fontSize: 12.5, fontWeight: 500, color: '#4f46e5' }}>
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
                    background: selected === niche.id ? '#fff' : '#fff',
                    border: selected === niche.id ? `2px solid #2563eb` : '1.5px solid rgba(99,102,241,0.12)',
                    borderRadius: 14, padding: '18px 14px',
                    cursor: 'pointer', transition: 'all 0.13s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    position: 'relative',
                    boxShadow: selected === niche.id ? '0 0 0 4px rgba(37,99,235,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                  onMouseEnter={e => { if (selected !== niche.id) (e.currentTarget as HTMLElement).style.borderColor = '#a5b4fc'; }}
                  onMouseLeave={e => { if (selected !== niche.id) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.12)'; }}
                >
                  {selected === niche.id && (
                    <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                background: selected ? 'linear-gradient(135deg, #4f46e5, #2563eb)' : '#e5e7eb',
                color: selected ? '#fff' : '#9ca3af',
                border: 'none', borderRadius: 12, cursor: selected ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s',
                boxShadow: selected ? '0 4px 14px rgba(79,70,229,0.3)' : 'none',
              }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </>
        )}

        {step === 2 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '12px 14px', background: '#f0f4ff', borderRadius: 10 }}>
              <span style={{ fontSize: 24 }}>{niches.find(n => n.id === selected)?.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{niches.find(n => n.id === selected)?.label}</div>
                <div style={{ fontSize: 11.5, color: '#6b7280' }}>Selected niche</div>
              </div>
              <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', fontSize: 12, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Change</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Business Name</label>
              <input
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder={`e.g. ${selected === 'restaurant' ? 'Spice Garden Restaurant' : selected === 'dental' ? 'Smile Dental Clinic' : 'Your Business Name'}`}
                style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(99,102,241,0.2)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>WhatsApp Business Number</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
                style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(99,102,241,0.2)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
              {[
                { icon: '🤖', text: 'AI agent pre-configured for your niche' },
                { icon: '📊', text: 'CRM dashboard ready instantly' },
                { icon: '💬', text: 'WhatsApp + Instagram connected' },
              ].map(f => (
                <div key={f.text} style={{ background: '#f0f4ff', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
                  <div style={{ fontSize: 11.5, color: '#4f46e5', fontWeight: 500, lineHeight: 1.4 }}>{f.text}</div>
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              style={{
                width: '100%', padding: '14px', fontSize: 15, fontWeight: 600,
                background: 'linear-gradient(135deg, #4f46e5, #2563eb)', color: '#fff',
                border: 'none', borderRadius: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
              }}
            >
              Launch My Dashboard 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
