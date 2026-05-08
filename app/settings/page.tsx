'use client';

import { useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { useNiche } from '@/context/NicheContext';
import { niches } from '@/lib/niches';

const tabs = ['Business', 'API Keys', 'Notifications', 'Appearance', 'Billing'] as const;
type Tab = typeof tabs[number];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{
      width: 44, height: 24, background: checked ? '#2563eb' : '#e5e7eb',
      borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        width: 20, height: 20, background: '#fff', borderRadius: '50%',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

function Field({ label, defaultValue, type = 'text', hint }: { label: string; defaultValue?: string; type?: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>
      <input defaultValue={defaultValue} type={type} style={{
        width: '100%', maxWidth: 440, padding: '10px 12px', fontSize: 13.5,
        border: '1.5px solid rgba(99,102,241,0.2)', borderRadius: 9, background: '#fafafa',
        fontFamily: 'inherit', color: '#111', outline: 'none',
      }} />
      {hint && <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

// Notification items as a controlled component outside the map
const defaultNotifications = [
  { id: 'new_conv',    label: 'New conversation',        desc: 'Alert when a new customer message comes in', on: true },
  { id: 'offline',     label: 'AI agent offline',         desc: 'Notify if the AI agent stops responding', on: true },
  { id: 'handoff',     label: 'Human handoff triggered',  desc: 'When AI escalates to a human agent', on: true },
  { id: 'new_contact', label: 'New contact added',        desc: 'When a new customer is captured', on: false },
  { id: 'daily',       label: 'Daily summary',            desc: 'Receive a daily performance report at 9am', on: true },
  { id: 'weekly',      label: 'Weekly analytics',         desc: 'Summary of weekly performance every Monday', on: false },
];

export default function SettingsPage() {
  const { niche, setNicheId, setOnboarded } = useNiche();
  const [tab, setTab] = useState<Tab>('Business');
  const [saved, setSaved] = useState(false);
  // All notification toggles stored as one state object — NO hooks inside map
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(defaultNotifications.map(n => [n.id, n.on]))
  );

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const handleNicheChange = (id: string) => setNicheId(id);
  const handleReset = () => { setOnboarded(false); window.location.href = '/onboarding'; };

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', letterSpacing: '-0.5px' }}>Settings</h1>
        <p style={{ fontSize: 13.5, color: '#6b7280', marginTop: 3 }}>Manage your account, integrations, and preferences</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(99,102,241,0.12)', marginBottom: 28 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '9px 18px', fontSize: 13,
            fontWeight: tab === t ? 600 : 400,
            color: tab === t ? '#2563eb' : '#6b7280',
            background: 'none', border: 'none',
            borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: -1, cursor: 'pointer', transition: 'all 0.12s',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ maxWidth: 600 }}>

        {/* ── Business ── */}
        {tab === 'Business' && (
          <div>
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', marginBottom: 20, border: '1px solid rgba(99,102,241,0.1)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Business Type</div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                Changing your niche updates the AI agent prompts, knowledge base, and dashboard labels.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {niches.map(n => (
                  <div key={n.id} onClick={() => handleNicheChange(n.id)} style={{
                    padding: '12px 10px', borderRadius: 10, cursor: 'pointer',
                    border: niche.id === n.id ? '2px solid #2563eb' : '1.5px solid rgba(99,102,241,0.12)',
                    background: niche.id === n.id ? '#f0f4ff' : '#fafafa',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    transition: 'all 0.12s', position: 'relative',
                  }}>
                    {niche.id === n.id && (
                      <div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={9} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                    <span style={{ fontSize: 22 }}>{n.icon}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: niche.id === n.id ? '#1e40af' : '#374151', textAlign: 'center', lineHeight: 1.3 }}>{n.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <Field label="Business Name" defaultValue="My Business" />
            <Field label="Owner Name" defaultValue="Afaq Butt" />
            <Field label="WhatsApp Number" defaultValue="+92 300 0000000" hint="The number your AI agent replies from" />
            <Field label="Business Location" defaultValue="Karachi, Pakistan" />
            <Field label="Website" type="url" hint="Optional — used for knowledge base" />
            <div style={{ marginTop: 20, padding: '16px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>⚠️ Reset Onboarding</div>
              <p style={{ fontSize: 12.5, color: '#7f1d1d', marginBottom: 12 }}>Takes you back to the niche selection screen.</p>
              <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                <RefreshCw size={13} /> Restart Setup
              </button>
            </div>
          </div>
        )}

        {/* ── API Keys ── */}
        {tab === 'API Keys' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(99,102,241,0.1)' }}>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>Keep these secret. Never share API keys publicly.</p>
            {[
              { label: 'OpenAI API Key', value: 'sk-proj-••••••••••••5aB2', hint: 'Powers AI agent responses' },
              { label: 'Meta WhatsApp Token', value: 'EAAGm••••••••••••3kL', hint: 'Sends & receives WhatsApp messages' },
              { label: 'n8n Webhook Secret', value: 'n8n_••••••••••••xF7G', hint: 'Authenticates n8n automation calls' },
              { label: 'Google Sheets API Key', value: 'AIza••••••••••••_M9', hint: 'Exports data to Google Sheets' },
              { label: 'EasyPaisa Merchant ID', value: '••••••••••••••••', hint: 'Payment processing in Pakistan' },
            ].map(k => (
              <div key={k.label} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>{k.label}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input defaultValue={k.value} type="password" style={{ flex: 1, padding: '9px 12px', fontSize: 13, border: '1.5px solid rgba(99,102,241,0.2)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', outline: 'none' }} />
                  <button style={{ padding: '8px 12px', fontSize: 12, border: '1px solid rgba(99,102,241,0.15)', borderRadius: 9, background: '#fff', cursor: 'pointer', color: '#4f46e5', fontWeight: 500 }}>Show</button>
                </div>
                {k.hint && <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 3 }}>{k.hint}</p>}
              </div>
            ))}
          </div>
        )}

        {/* ── Notifications ── */}
        {tab === 'Notifications' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(99,102,241,0.1)' }}>
            {defaultNotifications.map(n => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(99,102,241,0.07)' }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: '#111827' }}>{n.label}</div>
                  <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>{n.desc}</div>
                </div>
                <Toggle
                  checked={notifs[n.id]}
                  onChange={() => setNotifs(prev => ({ ...prev, [n.id]: !prev[n.id] }))}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Appearance ── */}
        {tab === 'Appearance' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(99,102,241,0.1)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Brand Color</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              {['#2563eb', '#4f46e5', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#111827'].map(c => (
                <div key={c} style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer', border: c === '#2563eb' ? '3px solid #111' : '3px solid transparent' }} />
              ))}
              <input type="color" defaultValue="#2563eb" style={{ width: 32, height: 32, padding: 0, border: '1px solid rgba(99,102,241,0.2)', borderRadius: '50%', cursor: 'pointer' }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Dashboard Logo</div>
            <div style={{ border: '2px dashed rgba(99,102,241,0.2)', borderRadius: 12, padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#f8f9ff', marginBottom: 20 }}>
              <div style={{ fontSize: 13.5, color: '#6b7280' }}>+ Upload your business logo</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>PNG or SVG, max 1MB</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Agent Avatar</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['🤖', '💬', '⚡', '🎯', '🌟'].map(e => (
                <div key={e} style={{ width: 48, height: 48, borderRadius: 12, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, cursor: 'pointer', border: '2px solid transparent', transition: 'border 0.12s' }}
                  onMouseEnter={ev => (ev.currentTarget as HTMLElement).style.borderColor = '#2563eb'}
                  onMouseLeave={ev => (ev.currentTarget as HTMLElement).style.borderColor = 'transparent'}
                >{e}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── Billing ── */}
        {tab === 'Billing' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #1e40af 100%)', borderRadius: 14, padding: '20px 24px', marginBottom: 16, color: '#fff' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Current Plan</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>Growth Plan</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Trial ends June 3, 2026 · Free for 7 more days</div>
            </div>
            {[
              { name: 'Starter', price: '$49', priceLocal: 'PKR 13,600', features: ['WhatsApp channel', '500 conversations', 'Basic analytics', 'Email support'], current: false },
              { name: 'Growth', price: '$149', priceLocal: 'PKR 41,300', features: ['All channels (WA + IG + FB)', 'Unlimited conversations', 'Advanced analytics', 'Human handoff', 'Priority support'], current: true },
              { name: 'Enterprise', price: '$399', priceLocal: 'PKR 110,700', features: ['White-label dashboard', 'Unlimited agents', 'API access', 'Custom integrations', 'Dedicated support'], current: false },
            ].map(plan => (
              <div key={plan.name} style={{ background: '#fff', borderRadius: 14, padding: '20px', marginBottom: 12, border: plan.current ? '2px solid #2563eb' : '1px solid rgba(99,102,241,0.1)', position: 'relative' }}>
                {plan.current && <span style={{ position: 'absolute', top: -10, left: 20, background: '#2563eb', color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>Current Plan</span>}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{plan.name}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{plan.price}<span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>/mo</span></div>
                    <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{plan.priceLocal}/mo</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#374151' }}>
                      <Check size={12} color="#10b981" strokeWidth={3} /> {f}
                    </div>
                  ))}
                </div>
                <button style={{ width: '100%', padding: '9px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', background: plan.current ? '#f3f4f6' : 'linear-gradient(135deg, #4f46e5, #2563eb)', color: plan.current ? '#6b7280' : '#fff', border: plan.current ? '1px solid #e5e7eb' : 'none' }}>
                  {plan.current ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab !== 'Billing' && (
          <button onClick={handleSave} style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', fontSize: 14, fontWeight: 600, background: saved ? '#10b981' : 'linear-gradient(135deg, #4f46e5, #2563eb)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,70,229,0.25)', transition: 'background 0.2s' }}>
            {saved ? <><Check size={15} /> Saved!</> : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  );
}
