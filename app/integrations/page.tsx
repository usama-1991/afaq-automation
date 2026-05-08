'use client';

import { useState } from 'react';
import { Check, ExternalLink, AlertCircle } from 'lucide-react';
import { useNiche } from '@/context/NicheContext';

const allIntegrations = [
  {
    category: 'Messaging Channels',
    items: [
      { id: 'whatsapp', name: 'WhatsApp Business', icon: '💬', desc: 'Connect via Meta Business API. Handle messages, orders, and support.', connected: true, required: true },
      { id: 'instagram', name: 'Instagram DMs', icon: '📸', desc: 'Reply to Instagram DMs and story mentions automatically.', connected: false },
      { id: 'facebook', name: 'Facebook Messenger', icon: '📘', desc: 'Handle Facebook Page messages with your AI agent.', connected: false },
    ],
  },
  {
    category: 'Automation',
    items: [
      { id: 'n8n', name: 'n8n Workflows', icon: '⚡', desc: 'Core automation engine connecting all your flows.', connected: true, required: true },
      { id: 'zapier', name: 'Zapier', icon: '🔗', desc: 'Connect with 5,000+ apps via Zapier workflows.', connected: false },
    ],
  },
  {
    category: 'Payments',
    items: [
      { id: 'easypaisa', name: 'EasyPaisa', icon: '🏦', desc: 'Accept mobile payments in Pakistan via EasyPaisa.', connected: true },
      { id: 'jazzcash', name: 'JazzCash', icon: '🏦', desc: 'Accept JazzCash mobile payments from Pakistani customers.', connected: false },
      { id: 'stripe', name: 'Stripe', icon: '💳', desc: 'International card payments for global customers.', connected: false },
    ],
  },
  {
    category: 'Data & CRM',
    items: [
      { id: 'sheets', name: 'Google Sheets', icon: '📊', desc: 'Export contacts, leads, and orders to Google Sheets.', connected: true },
      { id: 'notion', name: 'Notion', icon: '📓', desc: 'Sync contacts and conversation notes to Notion.', connected: false },
    ],
  },
  {
    category: 'AI Models',
    items: [
      { id: 'openai', name: 'OpenAI GPT-4o', icon: '🤖', desc: 'Default AI model powering your agent responses.', connected: true, required: true },
      { id: 'claude', name: 'Claude Sonnet', icon: '🧠', desc: 'Alternative AI model for more nuanced responses.', connected: false },
    ],
  },
];

export default function IntegrationsPage() {
  const { niche } = useNiche();
  const [connected, setConnected] = useState<Record<string, boolean>>(
    Object.fromEntries(allIntegrations.flatMap(g => g.items).map(i => [i.id, i.connected]))
  );

  const totalConnected = Object.values(connected).filter(Boolean).length;
  const total = allIntegrations.flatMap(g => g.items).length;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 860 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', letterSpacing: '-0.5px', marginBottom: 4 }}>Integrations</h1>
        <p style={{ fontSize: 13.5, color: '#6b7280' }}>Connect your {niche.label} to messaging channels, payment gateways, and tools.</p>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 24, border: '1px solid rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Setup Progress</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{totalConnected}/{total} connected</span>
          </div>
          <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(totalConnected / total) * 100}%`, background: 'linear-gradient(90deg, #4f46e5, #2563eb)', borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      {/* Integration groups */}
      {allIntegrations.map(group => (
        <div key={group.category} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            {group.category}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {group.items.map(item => {
              const isConnected = connected[item.id];
              return (
                <div key={item.id} style={{
                  background: '#fff', borderRadius: 12, padding: '16px',
                  border: isConnected ? '1.5px solid #a5b4fc' : '1px solid rgba(99,102,241,0.1)',
                  transition: 'all 0.15s', position: 'relative',
                  boxShadow: isConnected ? '0 0 0 3px rgba(99,102,241,0.06)' : '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                  {(item as any).required && (
                    <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 9.5, fontWeight: 600, color: '#4f46e5', background: '#eff6ff', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>REQUIRED</span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f8f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1px solid rgba(99,102,241,0.1)' }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{item.name}</div>
                      {isConnected && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#10b981', fontWeight: 500 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> Connected
                        </div>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.5, marginBottom: 12 }}>{item.desc}</p>
                  <button
                    onClick={() => setConnected(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    style={{
                      width: '100%', padding: '8px', fontSize: 12.5, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
                      background: isConnected ? '#f0fdf4' : 'linear-gradient(135deg, #4f46e5, #2563eb)',
                      color: isConnected ? '#065f46' : '#fff',
                      border: isConnected ? '1px solid #bbf7d0' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      transition: 'all 0.12s',
                    }}
                  >
                    {isConnected ? <><Check size={13} /> Connected</> : <>+ Connect</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
