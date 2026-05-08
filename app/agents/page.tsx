'use client';

import { useState } from 'react';
import { Plus, Bot, Trash2, Save, Eye, Check, ChevronDown, Minus, Globe, Upload, Sliders } from 'lucide-react';
import { useNiche } from '@/context/NicheContext';

const tones = ['Professional', 'Friendly', 'Enthusiastic', 'Empathetic', 'Direct'];
const languages = ['English (US)', 'Urdu', 'Arabic', 'Spanish', 'French', 'German', 'Hindi'];
const voices = ['Puck (Neutral)', 'Aria (Female)', 'Omar (Male)', 'Sofia (Female)', 'Adam (Male)'];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width: 44, height: 24, background: checked ? '#2563eb' : '#e5e7eb', borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</div>
      <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{label}</span>
    </div>
  );
}

export default function AgentsPage() {
  const { niche } = useNiche();
  const [agentName, setAgentName] = useState(niche.agentName);
  const [greeting, setGreeting] = useState(niche.greeting);
  const [systemRole, setSystemRole] = useState(niche.systemRole);
  const [channels, setChannels] = useState({ whatsapp: true, instagram: false, facebook: false });
  const [tone, setTone] = useState('Professional');
  const [dos, setDos] = useState(niche.dos);
  const [donts, setDonts] = useState(niche.donts);
  const [newDo, setNewDo] = useState('');
  const [newDont, setNewDont] = useState('');
  const [selectedLangs, setSelectedLangs] = useState<Record<string, boolean>>({ 'English (US)': true });
  const [selectedVoice, setSelectedVoice] = useState(voices[0]);
  const [humanHandoff, setHumanHandoff] = useState(false);
  const [galleryCards, setGalleryCards] = useState(true);
  const [maxCards, setMaxCards] = useState(5);
  const [published, setPublished] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saved, setSaved] = useState(false);

  const kb = niche.knowledgeBase;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePublish = () => {
    setPublished(true);
    setPaused(false);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 38px)' }}>
      {/* Left sidebar: agent list */}
      <div style={{ width: 280, background: '#fff', borderRight: '1px solid rgba(99,102,241,0.1)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '18px 16px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 14 }}>AI Agents</h2>
          <button style={{
            width: '100%', padding: '10px', fontSize: 13.5, fontWeight: 600,
            background: 'linear-gradient(135deg, #4f46e5, #2563eb)', color: '#fff',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: '0 3px 10px rgba(79,70,229,0.25)',
          }}>
            <Plus size={15} /> Add New Agent
          </button>
        </div>

        <div style={{ padding: '0 12px', flex: 1 }}>
          {/* Current agent card */}
          <div style={{ background: '#f0f4ff', border: '1.5px solid #a5b4fc', borderRadius: 12, padding: '12px 14px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{agentName}</div>
                <div style={{ fontSize: 11.5, color: '#6b7280' }}>
                  {published ? `Live · ${Object.values(channels).filter(Boolean).length} Channel(s)` : 'Draft · 0 Channels'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main: agent config */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f8f9ff' }}>
        {/* Top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid rgba(99,102,241,0.1)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 2 }}>
              <span style={{ color: '#2563eb', cursor: 'pointer' }}>Agents</span> › {agentName}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>Agent Configuration</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Paused toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#f3f4f6', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)' }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: paused ? '#6b7280' : '#9ca3af' }}>PAUSED</span>
              <Toggle checked={!paused} onChange={() => setPaused(!paused)} />
            </div>
            <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#f3f4f6', color: '#374151', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 9, cursor: 'pointer' }}>
              <Eye size={14} /> Preview
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 9, cursor: 'pointer' }}>
              <Trash2 size={13} /> Delete
            </button>
            <button onClick={handlePublish} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg, #4f46e5, #2563eb)', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', boxShadow: '0 3px 10px rgba(79,70,229,0.2)' }}>
              <Save size={13} /> Save & Publish
            </button>
          </div>
        </div>

        <div style={{ padding: '24px', maxWidth: 820 }}>
          {/* ── Agent Identity ── */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 16, border: '1px solid rgba(99,102,241,0.1)' }}>
            <SectionHeader icon="🤖" label="Agent Identity" />
            <div style={{ display: 'flex', gap: 28 }}>
              {/* Avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #dbeafe, #eff6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', border: '2px solid #bfdbfe' }}>
                  <Bot size={36} color="#2563eb" />
                  <div style={{ position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 12 }}>✏️</span>
                  </div>
                </div>
                <span style={{ fontSize: 10.5, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>AVATAR ICON</span>
              </div>

              {/* Fields */}
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Agent Name</label>
                  <input value={agentName} onChange={e => setAgentName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, border: '1.5px solid rgba(99,102,241,0.2)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Greeting Message</label>
                  <textarea value={greeting} onChange={e => setGreeting(e.target.value)} rows={3}
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #2563eb', borderRadius: 9, background: '#fff', fontFamily: 'inherit', color: '#111', resize: 'vertical', lineHeight: 1.6, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>System Role</label>
                  <textarea value={systemRole} onChange={e => setSystemRole(e.target.value)} rows={4}
                    placeholder="Describe how the agent should behave and its core purpose..."
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(99,102,241,0.2)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', resize: 'vertical', lineHeight: 1.6, outline: 'none' }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Active Channels ── */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 16, border: '1px solid rgba(99,102,241,0.1)' }}>
            <SectionHeader icon="📡" label="Active Channels" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { id: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#25D366' },
                { id: 'instagram', label: 'Instagram', icon: '📸', color: '#E1306C' },
                { id: 'facebook', label: 'Facebook Messenger', icon: '📘', color: '#1877F2' },
              ].map(ch => {
                const active = channels[ch.id as keyof typeof channels];
                return (
                  <div key={ch.id} onClick={() => setChannels(prev => ({ ...prev, [ch.id]: !prev[ch.id as keyof typeof channels] }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${active ? ch.color : 'rgba(99,102,241,0.12)'}`, background: active ? `${ch.color}08` : '#fafafa', cursor: 'pointer', transition: 'all 0.12s' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${active ? ch.color : '#d1d5db'}`, background: active ? ch.color : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {active && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${ch.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{ch.icon}</div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: active ? '#111827' : '#6b7280' }}>{ch.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Knowledge Base ── */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 16, border: '1px solid rgba(99,102,241,0.1)' }}>
            <SectionHeader icon="🧠" label="Knowledge Base" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {kb.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f8f9ff', borderRadius: 10, border: '1px solid rgba(99,102,241,0.1)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {item.type === 'PDF' ? '📄' : item.type === 'Spreadsheet' ? '📊' : '📝'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{item.name}</div>
                    <div style={{ fontSize: 11.5, color: '#6b7280' }}>{item.description}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', background: '#d1fae5', padding: '3px 9px', borderRadius: 10 }}>● LINKED</span>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                    <Trash2 size={13} color="#9ca3af" />
                  </button>
                </div>
              ))}
            </div>
            {/* Upload area */}
            <div style={{ border: '2px dashed rgba(99,102,241,0.2)', borderRadius: 12, padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#f8f9ff', transition: 'all 0.12s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#a5b4fc'; (e.currentTarget as HTMLElement).style.background = '#f0f4ff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)'; (e.currentTarget as HTMLElement).style.background = '#f8f9ff'; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Upload size={18} color="#2563eb" />
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827', marginBottom: 3 }}>Click to add training data or links</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Menus, Guidelines, URLs, or Files</div>
            </div>
          </div>

          {/* ── Personality ── */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 16, border: '1px solid rgba(99,102,241,0.1)' }}>
            <SectionHeader icon="✨" label="Personality" />
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 10 }}>Tone of Voice</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {tones.map(t => (
                  <button key={t} onClick={() => setTone(t)} style={{
                    padding: '7px 18px', fontSize: 13, fontWeight: 500, borderRadius: 20, cursor: 'pointer',
                    background: tone === t ? '#2563eb' : '#fff',
                    color: tone === t ? '#fff' : '#374151',
                    border: tone === t ? 'none' : '1.5px solid #e5e7eb',
                    transition: 'all 0.12s',
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Do's */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>👍</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Do's</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  {dos.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                      <span style={{ fontSize: 12.5, color: '#374151', flex: 1 }}>{d}</span>
                      <button onClick={() => setDos(dos.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <Minus size={12} color="#9ca3af" />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={newDo} onChange={e => setNewDo(e.target.value)} placeholder="e.g. Always be polite"
                    style={{ flex: 1, padding: '7px 10px', fontSize: 12.5, border: '1px solid rgba(99,102,241,0.2)', borderRadius: 7, background: '#fff', fontFamily: 'inherit', color: '#111', outline: 'none' }}
                    onKeyDown={e => { if (e.key === 'Enter' && newDo) { setDos([...dos, newDo]); setNewDo(''); } }}
                  />
                  <button onClick={() => { if (newDo) { setDos([...dos, newDo]); setNewDo(''); } }}
                    style={{ width: 30, height: 30, borderRadius: '50%', background: '#10b981', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={14} color="#fff" />
                  </button>
                </div>
              </div>
              {/* Don'ts */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>🚫</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Don'ts</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  {donts.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                      <span style={{ fontSize: 12.5, color: '#374151', flex: 1 }}>{d}</span>
                      <button onClick={() => setDonts(donts.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <Minus size={12} color="#9ca3af" />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={newDont} onChange={e => setNewDont(e.target.value)} placeholder="e.g. Never argue"
                    style={{ flex: 1, padding: '7px 10px', fontSize: 12.5, border: '1px solid rgba(99,102,241,0.2)', borderRadius: 7, background: '#fff', fontFamily: 'inherit', color: '#111', outline: 'none' }}
                    onKeyDown={e => { if (e.key === 'Enter' && newDont) { setDonts([...donts, newDont]); setNewDont(''); } }}
                  />
                  <button onClick={() => { if (newDont) { setDonts([...donts, newDont]); setNewDont(''); } }}
                    style={{ width: 30, height: 30, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={14} color="#fff" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Voice AI ── */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 16, border: '1px solid rgba(99,102,241,0.1)' }}>
            <SectionHeader icon="🎙️" label="Voice AI Configuration" />
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 12 }}>Supported Languages & Voices</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {languages.map(lang => {
                const on = !!selectedLangs[lang];
                return (
                  <div key={lang} onClick={() => setSelectedLangs(prev => ({ ...prev, [lang]: !prev[lang] }))}
                    style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${on ? '#2563eb' : '#e5e7eb'}`, background: on ? '#f0f4ff' : '#fafafa', cursor: 'pointer', transition: 'all 0.12s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${on ? '#2563eb' : '#d1d5db'}`, background: on ? '#2563eb' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {on && <Check size={11} color="#fff" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: on ? '#111827' : '#6b7280' }}>{lang}</span>
                    </div>
                    {on && (
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>VOICE:</span>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)}
                            style={{ width: '100%', padding: '5px 28px 5px 10px', fontSize: 12.5, border: '1px solid rgba(99,102,241,0.2)', borderRadius: 7, background: '#fff', fontFamily: 'inherit', color: '#111', appearance: 'none', cursor: 'pointer', outline: 'none' }}>
                            {voices.map(v => <option key={v}>{v}</option>)}
                          </select>
                          <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Human Handoff ── */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', marginBottom: 16, border: '1px solid rgba(99,102,241,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🤝</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Human Handoff</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Transfer to a human agent when AI cannot resolve</div>
                </div>
              </div>
              <Toggle checked={humanHandoff} onChange={() => setHumanHandoff(!humanHandoff)} />
            </div>
          </div>

          {/* ── AI Capabilities ── */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 16, border: '1px solid rgba(99,102,241,0.1)' }}>
            <SectionHeader icon="⚡" label="AI Capabilities" />
            <p style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 16 }}>Internal tools and extensions.</p>
            <div style={{ background: '#f8f9ff', borderRadius: 10, padding: '16px', border: '1px solid rgba(99,102,241,0.1)', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: galleryCards ? 14 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🖼️</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>Product Gallery Cards</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Allow AI to send product carousels on Instagram & WhatsApp</div>
                  </div>
                </div>
                <Toggle checked={galleryCards} onChange={() => setGalleryCards(!galleryCards)} />
              </div>
              {galleryCards && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>Max Cards per Suggestion</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{maxCards}</span>
                  </div>
                  <input type="range" min={1} max={10} value={maxCards} onChange={e => setMaxCards(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }} />
                </div>
              )}
            </div>
          </div>

          {/* ── Advanced System Prompt ── */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(99,102,241,0.1)', overflow: 'hidden', marginBottom: 24 }}>
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <ChevronDown size={16} color="#2563eb" style={{ transform: showAdvanced ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
              <Sliders size={15} color="#2563eb" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2563eb' }}>Advanced System Prompt</span>
            </button>
            {showAdvanced && (
              <div style={{ padding: '0 24px 20px' }}>
                <textarea rows={6} placeholder="Add custom instructions beyond the system role..."
                  style={{ width: '100%', padding: '12px 14px', fontSize: 13, border: '1.5px solid rgba(99,102,241,0.2)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', resize: 'vertical', lineHeight: 1.6, outline: 'none' }} />
              </div>
            )}
          </div>

          <button onClick={handleSave} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', fontSize: 14, fontWeight: 600,
            background: saved ? '#10b981' : 'linear-gradient(135deg, #4f46e5, #2563eb)', color: '#fff',
            border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,70,229,0.25)', transition: 'background 0.2s',
          }}>
            {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
