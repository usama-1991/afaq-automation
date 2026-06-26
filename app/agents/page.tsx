'use client';

import { useState, useEffect } from 'react';
import { Plus, Bot, Trash2, Save, Eye, Check, ChevronDown, Minus, Globe, Upload, Sliders, Users, User, Shield, Activity, Power, Mail, HelpCircle } from 'lucide-react';
import { useNiche } from '@/context/NicheContext';
import { supabase } from '@/lib/supabase/client';

const tones = ['Professional', 'Friendly', 'Enthusiastic', 'Empathetic', 'Direct'];
const languages = ['English (US)', 'Urdu', 'Arabic', 'Spanish', 'French', 'German', 'Hindi'];
const voices = ['Puck (Neutral)', 'Aria (Female)', 'Omar (Male)', 'Sofia (Female)', 'Adam (Male)'];

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Agent' | 'Manager' | 'Admin';
  capacity: number;
  activeChats: number;
  online: boolean;
}

const defaultTeam: TeamMember[] = [
  { id: '1', name: 'Usama Habib', email: 'usamahabib1991@gmail.com', role: 'Admin', capacity: 15, activeChats: 4, online: true },
  { id: '2', name: 'Sarah Connor', email: 'sarah.c@ittisalo.io', role: 'Manager', capacity: 10, activeChats: 6, online: true },
  { id: '3', name: 'John Doe', email: 'john.doe@ittisalo.io', role: 'Agent', capacity: 8, activeChats: 8, online: false },
  { id: '4', name: 'Alina Khan', email: 'alina.k@ittisalo.io', role: 'Agent', capacity: 12, activeChats: 3, online: true },
];

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <div onClick={() => !disabled && onChange()} style={{ 
      width: 42, height: 22, 
      background: checked ? '#dc2626' : '#e5e7eb', 
      borderRadius: 11, position: 'relative', 
      cursor: disabled ? 'not-allowed' : 'pointer', 
      transition: 'background 0.2s', flexShrink: 0,
      opacity: disabled ? 0.6 : 1,
    }}>
      <div style={{ 
        position: 'absolute', top: 2, 
        left: checked ? 22 : 2, 
        width: 18, height: 18, 
        background: '#fff', borderRadius: '50%', 
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
      }} />
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</div>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{label}</span>
    </div>
  );
}

export default function AgentsPage() {
  const { niche } = useNiche();
  
  // Tab controller: 'ai' or 'team'
  const [activeTab, setActiveTab] = useState<'ai' | 'team'>('ai');

  // AI Agent States
  const [agentName, setAgentName] = useState(niche.agentName);
  const [greeting, setGreeting] = useState(niche.greeting);
  const [systemRole, setSystemRole] = useState(niche.systemRole);
  const [channels, setChannels] = useState({ whatsapp: true, instagram: false, facebook: false });
  const [tone, setTone] = useState('Professional');
  const [dos, setDos] = useState<string[]>(niche.dos || []);
  const [donts, setDonts] = useState<string[]>(niche.donts || []);
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

  // Human Team states
  const [teamList, setTeamList] = useState<TeamMember[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);
  
  // Form to add human team member
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<'Agent' | 'Manager' | 'Admin'>('Agent');
  const [addCapacity, setAddCapacity] = useState(10);
  const [teamSaved, setTeamSaved] = useState(false);

  const kb = niche.knowledgeBase || [];

  const syncAgentToDB = async (updatedPublished?: boolean, updatedPaused?: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile?.tenant_id) return;

      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .maybeSingle();

      const isPub = updatedPublished !== undefined ? updatedPublished : published;
      const isPaused = updatedPaused !== undefined ? updatedPaused : paused;

      const agentData = {
        tenant_id: profile.tenant_id,
        name: agentName,
        prompt: systemRole,
        is_active: isPub && !isPaused
      };

      if (existingAgent?.id) {
        await supabase
          .from('agents')
          .update(agentData)
          .eq('id', existingAgent.id);
      } else {
        await supabase
          .from('agents')
          .insert(agentData);
      }
    } catch (err) {
      console.error('Error syncing agent to Supabase:', err);
    }
  };

  // Load team data from localstorage or defaults
  useEffect(() => {
    const stored = localStorage.getItem('autoflow_team_members');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTeamList(parsed);
        if (parsed.length > 0) {
          setSelectedTeamMember(parsed[0]);
        }
      } catch (e) {
        setTeamList(defaultTeam);
        setSelectedTeamMember(defaultTeam[0]);
      }
    } else {
      setTeamList(defaultTeam);
      setSelectedTeamMember(defaultTeam[0]);
      localStorage.setItem('autoflow_team_members', JSON.stringify(defaultTeam));
    }

    const loadAgentFromDBAndLocal = async () => {
      // 1. Try to load from Supabase database first
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

          if (profile?.tenant_id) {
            const { data: agent } = await supabase
              .from('agents')
              .select('*')
              .eq('tenant_id', profile.tenant_id)
              .maybeSingle();

            if (agent) {
              if (agent.name) setAgentName(agent.name);
              if (agent.prompt) setSystemRole(agent.prompt);
              setPublished(agent.is_active);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load agent from Supabase", err);
      }

      // 2. Overlay with local storage configs if they exist
      const storedAi = localStorage.getItem(`autoflow_ai_config_${niche.id}`);
      if (storedAi) {
        try {
          const parsed = JSON.parse(storedAi);
          if (parsed.agentName) setAgentName(parsed.agentName);
          if (parsed.greeting) setGreeting(parsed.greeting);
          if (parsed.systemRole) setSystemRole(parsed.systemRole);
          if (parsed.channels) setChannels(parsed.channels);
          if (parsed.tone) setTone(parsed.tone);
          if (parsed.dos) setDos(parsed.dos);
          if (parsed.donts) setDonts(parsed.donts);
          if (parsed.selectedLangs) setSelectedLangs(parsed.selectedLangs);
          if (parsed.selectedVoice) setSelectedVoice(parsed.selectedVoice);
          if (parsed.humanHandoff !== undefined) setHumanHandoff(parsed.humanHandoff);
          if (parsed.galleryCards !== undefined) setGalleryCards(parsed.galleryCards);
          if (parsed.maxCards) setMaxCards(parsed.maxCards);
          if (parsed.published !== undefined) setPublished(parsed.published);
          if (parsed.paused !== undefined) setPaused(parsed.paused);
        } catch (e) {
          console.error("Failed to load local AI settings", e);
        }
      }
    };

    loadAgentFromDBAndLocal();
  }, [niche]);

  const handleSaveAI = async () => {
    const aiConfig = {
      agentName, greeting, systemRole, channels, tone, dos, donts,
      selectedLangs, selectedVoice, humanHandoff, galleryCards, maxCards,
      published, paused
    };
    localStorage.setItem(`autoflow_ai_config_${niche.id}`, JSON.stringify(aiConfig));
    await syncAgentToDB();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePublishAI = async () => {
    setPublished(true);
    setPaused(false);
    const aiConfig = {
      agentName, greeting, systemRole, channels, tone, dos, donts,
      selectedLangs, selectedVoice, humanHandoff, galleryCards, maxCards,
      published: true, paused: false
    };
    localStorage.setItem(`autoflow_ai_config_${niche.id}`, JSON.stringify(aiConfig));
    await syncAgentToDB(true, false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Human Team handlers
  const handleSaveTeamMember = () => {
    if (!selectedTeamMember) return;
    const updated = teamList.map(member => 
      member.id === selectedTeamMember.id ? selectedTeamMember : member
    );
    setTeamList(updated);
    localStorage.setItem('autoflow_team_members', JSON.stringify(updated));
    setTeamSaved(true);
    setTimeout(() => setTeamSaved(false), 2000);
  };

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addEmail) return;

    const newMember: TeamMember = {
      id: Math.random().toString(36).substr(2, 9),
      name: addName,
      email: addEmail,
      role: addRole,
      capacity: addCapacity,
      activeChats: 0,
      online: true
    };

    const updated = [...teamList, newMember];
    setTeamList(updated);
    localStorage.setItem('autoflow_team_members', JSON.stringify(updated));
    setSelectedTeamMember(newMember);
    setShowAddTeam(false);
    
    // Simulate sending email invitation
    alert(`An invitation email has been successfully sent to ${addEmail}. The user can click the link in the email to join your workspace.`);

    setAddName('');
    setAddEmail('');
    setAddRole('Agent');
    setAddCapacity(10);
  };

  const handleDeleteTeamMember = (id: string) => {
    const updated = teamList.filter(member => member.id !== id);
    setTeamList(updated);
    localStorage.setItem('autoflow_team_members', JSON.stringify(updated));
    if (selectedTeamMember?.id === id) {
      setSelectedTeamMember(updated.length > 0 ? updated[0] : null);
    }
  };

  return (
    <div className="split-pane-root" style={{ display: 'flex', height: 'calc(100vh - 98px)', background: '#fcfcfc' }}>
      
      <div className="split-left-panel" style={{ 
        width: 290, background: '#fff', 
        borderRight: '1px solid rgba(220,38,38,0.08)', 
        display: 'flex', flexDirection: 'column', flexShrink: 0 
      }}>
        {/* Sub-header controls */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(220,38,38,0.08)' }}>
          <button 
            onClick={() => setActiveTab('ai')} 
            style={{ 
              flex: 1, padding: '15px 6px', fontSize: 13, fontWeight: 700, 
              color: '#dc2626', 
              border: 'none', background: 'none', 
              borderBottom: '2.5px solid #dc2626', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s'
            }}
          >
            <Bot size={15} />
            AI Config
          </button>
        </div>

        {/* Sidebar Content lists */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {activeTab === 'ai' ? (
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#374151' }}>Active AI Agents</span>
                <span style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>1 Total</span>
              </div>
              
              {/* Agent card */}
              <div style={{ 
                background: '#fef2f2', border: '1.5px solid rgba(220,38,38,0.25)', 
                borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(220,38,38,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 38, height: 38, borderRadius: 10, 
                    background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <Bot size={19} color="#dc2626" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{agentName}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                      {published ? `Live · ${Object.values(channels).filter(Boolean).length} Channel(s)` : 'Draft · Offline'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ padding: '16px 16px 8px 16px' }}>
                <button 
                  onClick={() => setShowAddTeam(true)}
                  style={{
                    width: '100%', padding: '9px', fontSize: 13, fontWeight: 700,
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
                    border: 'none', borderRadius: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    boxShadow: '0 3px 10px rgba(220,38,38,0.2)',
                  }}
                >
                  <Plus size={15} /> Add Team Member
                </button>
              </div>

              {/* Human Agent list items */}
              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {teamList.map(member => {
                  const isSel = selectedTeamMember?.id === member.id;
                  const loadPercent = Math.min(100, Math.round((member.activeChats / member.capacity) * 100));
                  return (
                    <div 
                      key={member.id}
                      onClick={() => { setSelectedTeamMember(member); setShowAddTeam(false); }}
                      style={{
                        padding: '12px 14px', borderRadius: 11, cursor: 'pointer',
                        background: isSel ? '#fef2f2' : 'transparent',
                        border: isSel ? '1px solid rgba(220,38,38,0.15)' : '1px solid transparent',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { if(!isSel) e.currentTarget.style.background = '#fff5f5'; }}
                      onMouseLeave={e => { if(!isSel) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Avatar Circle */}
                          <div style={{ position: 'relative' }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'linear-gradient(135deg, #fee2e2, #fef2f2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 700, color: '#dc2626',
                            }}>
                              {member.name.split(' ').map(w => w[0]).join('').toUpperCase()}
                            </div>
                            <div style={{
                              position: 'absolute', bottom: -1, right: -1,
                              width: 10, height: 10, borderRadius: '50%',
                              background: member.online ? '#10b981' : '#d1d5db',
                              border: '2px solid #fff'
                            }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{member.name}</div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>{member.role}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Live capacity meter */}
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#9ca3af', marginBottom: 3 }}>
                          <span>Active: {member.activeChats}/{member.capacity} Chats</span>
                          <span style={{ color: loadPercent >= 80 ? '#ef4444' : '#6b7280', fontWeight: 600 }}>{loadPercent}% Cap</span>
                        </div>
                        <div style={{ width: '100%', height: 5, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${loadPercent}%`, height: '100%', 
                            background: loadPercent >= 80 ? '#ef4444' : loadPercent >= 50 ? '#f59e0b' : '#dc2626',
                            borderRadius: 4 
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="split-right-panel" style={{ flex: 1, overflowY: 'auto', background: '#faf9f9' }}>
        
        {/* AI CONFIG VIEW */}
        {activeTab === 'ai' && (
          <div>
            {/* Top sticky action header */}
            <div className="agents-action-header" style={{ 
              background: '#fff', borderBottom: '1px solid rgba(220,38,38,0.06)', 
              padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              position: 'sticky', top: 0, zIndex: 10 
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
                  <span style={{ color: '#dc2626', cursor: 'pointer' }}>Agents</span> › {agentName}
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>AI Copilot Config</h2>
              </div>
              <div className="agents-header-btns" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: paused ? '#ef4444' : '#10b981' }}>{paused ? 'PAUSED' : 'ACTIVE'}</span>
                  <Toggle checked={!paused} onChange={() => setPaused(!paused)} />
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', fontSize: 13, fontWeight: 600, background: '#f3f4f6', color: '#374151', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 9, cursor: 'pointer' }}>
                  <Eye size={14} /> Preview
                </button>
                <button onClick={handlePublishAI} style={{ 
                  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13, fontWeight: 700, 
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', 
                  border: 'none', borderRadius: 9, cursor: 'pointer', 
                  boxShadow: '0 3px 10px rgba(220,38,38,0.2)' 
                }}>
                  <Save size={13} /> Save & Publish
                </button>
              </div>
            </div>

            <div className="agents-config-panel" style={{ padding: '28px', maxWidth: 840 }}>
              
              {/* Identity */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 18, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <SectionHeader icon="🤖" label="Agent Identity" />
                <div className="agents-identity-row" style={{ display: 'flex', gap: 28 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                      width: 80, height: 80, borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #fee2e2, #fef2f2)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      position: 'relative', border: '2px solid rgba(220,38,38,0.15)' 
                    }}>
                      <Bot size={36} color="#dc2626" />
                    </div>
                    <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>SYSTEM ROBOT</span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Agent Name</label>
                      <input value={agentName} onChange={e => setAgentName(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', outline: 'none' }} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Greeting Message</label>
                      <textarea value={greeting} onChange={e => setGreeting(e.target.value)} rows={3}
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #dc2626', borderRadius: 9, background: '#fff', fontFamily: 'inherit', color: '#111', resize: 'vertical', lineHeight: 1.6, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>System Role</label>
                      <textarea value={systemRole} onChange={e => setSystemRole(e.target.value)} rows={4}
                        placeholder="Describe how the agent should behave and its core purpose..."
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', resize: 'vertical', lineHeight: 1.6, outline: 'none' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Channels */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 18, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <SectionHeader icon="📡" label="Active Channels" />
                <div className="agents-channels-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { id: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#25D366' },
                    { id: 'instagram', label: 'Instagram', icon: '📸', color: '#E1306C' },
                    { id: 'facebook', label: 'Facebook Messenger', icon: '📘', color: '#1877F2' },
                  ].map(ch => {
                    const active = channels[ch.id as keyof typeof channels];
                    return (
                      <div key={ch.id} onClick={() => setChannels(prev => ({ ...prev, [ch.id]: !prev[ch.id as keyof typeof channels] }))}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, 
                          border: `1.5px solid ${active ? '#dc2626' : 'rgba(220,38,38,0.08)'}`, 
                          background: active ? '#fef2f2' : '#fafafa', cursor: 'pointer', transition: 'all 0.12s' 
                        }}>
                        <div style={{ 
                          width: 20, height: 20, borderRadius: 5, 
                          border: `2px solid ${active ? '#dc2626' : '#d1d5db'}`, 
                          background: active ? '#dc2626' : '#fff', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                        }}>
                          {active && <Check size={12} color="#fff" strokeWidth={3} />}
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${ch.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{ch.icon}</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#dc2626' : '#6b7280' }}>{ch.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Personality */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 18, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <SectionHeader icon="✨" label="AI Tone & Guidelines" />
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>Tone of Voice</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {tones.map(t => (
                      <button key={t} onClick={() => setTone(t)} style={{
                        padding: '7px 18px', fontSize: 13, fontWeight: 600, borderRadius: 20, cursor: 'pointer',
                        background: tone === t ? '#dc2626' : '#fff',
                        color: tone === t ? '#fff' : '#374151',
                        border: tone === t ? 'none' : '1.5px solid #e5e7eb',
                        transition: 'all 0.12s',
                      }}>{t}</button>
                    ))}
                  </div>
                </div>

                <div className="agents-donts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Do's */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: 16 }}>👍</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>Approved Responses (Do's)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                      {dos.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                          <span style={{ fontSize: 12, color: '#1f2937', flex: 1 }}>{d}</span>
                          <button onClick={() => setDos(dos.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                            <Minus size={12} color="#9ca3af" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input value={newDo} onChange={e => setNewDo(e.target.value)} placeholder="e.g. Keep answers friendly"
                        style={{ flex: 1, padding: '7px 10px', fontSize: 12.5, border: '1px solid rgba(220,38,38,0.1)', borderRadius: 7, background: '#fff', fontFamily: 'inherit', color: '#111', outline: 'none' }}
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
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>Restricted Topics (Don'ts)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                      {donts.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                          <span style={{ fontSize: 12, color: '#1f2937', flex: 1 }}>{d}</span>
                          <button onClick={() => setDonts(donts.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                            <Minus size={12} color="#9ca3af" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input value={newDont} onChange={e => setNewDont(e.target.value)} placeholder="e.g. Don't offer discounts"
                        style={{ flex: 1, padding: '7px 10px', fontSize: 12.5, border: '1px solid rgba(220,38,38,0.1)', borderRadius: 7, background: '#fff', fontFamily: 'inherit', color: '#111', outline: 'none' }}
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

              {/* Voice Config */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 18, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <SectionHeader icon="🎙️" label="Voice AI Configuration (WhatsApp Audio Messages)" />
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 12 }}>Supported Languages & AI Voices</label>
                <div className="agents-voice-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {languages.map(lang => {
                    const on = !!selectedLangs[lang];
                    return (
                      <div key={lang} onClick={() => setSelectedLangs(prev => ({ ...prev, [lang]: !prev[lang] }))}
                        style={{ 
                          padding: '12px 14px', borderRadius: 10, 
                          border: `1.5px solid ${on ? '#dc2626' : '#e5e7eb'}`, 
                          background: on ? '#fef2f2' : '#fafafa', cursor: 'pointer', transition: 'all 0.12s' 
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ 
                            width: 18, height: 18, borderRadius: 4, 
                            border: `2px solid ${on ? '#dc2626' : '#d1d5db'}`, 
                            background: on ? '#dc2626' : '#fff', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                          }}>
                            {on && <Check size={11} color="#fff" strokeWidth={3} />}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: on ? '#dc2626' : '#6b7280' }}>{lang}</span>
                        </div>
                        {on && (
                          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 750 }}>VOICE MODEL:</span>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)}
                                style={{ width: '100%', padding: '5px 28px 5px 10px', fontSize: 12, border: '1px solid rgba(220,38,38,0.15)', borderRadius: 7, background: '#fff', fontFamily: 'inherit', color: '#111', appearance: 'none', cursor: 'pointer', outline: 'none' }}>
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

              {/* Handoff */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', marginBottom: 18, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤝</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Smart Human Handoff Routing</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>Automatically pauses AI and notifies active team members if user asks for human or becomes confused</div>
                    </div>
                  </div>
                  <Toggle checked={humanHandoff} onChange={() => setHumanHandoff(!humanHandoff)} />
                </div>
              </div>

              {/* Knowledge Base */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 18, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <SectionHeader icon="🧠" label="Linked Knowledge Documents" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  {kb.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fdfcfc', borderRadius: 10, border: '1px solid rgba(220,38,38,0.05)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        {item.type === 'PDF' ? '📄' : item.type === 'Spreadsheet' ? '📊' : '📝'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.name}</div>
                        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 1 }}>{item.description}</div>
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '3px 9px', borderRadius: 10, border: '1px solid rgba(220,38,38,0.08)' }}>● LINKED</span>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                        <Trash2 size={13} color="#9ca3af" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Upload area */}
                <div style={{ 
                  border: '2px dashed rgba(220,38,38,0.15)', borderRadius: 12, 
                  padding: '24px', textAlign: 'center', cursor: 'pointer', 
                  background: '#fdfcfc', transition: 'all 0.12s' 
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#dc2626'; (e.currentTarget as HTMLElement).style.background = '#fef2f2'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.15)'; (e.currentTarget as HTMLElement).style.background = '#fdfcfc'; }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <Upload size={18} color="#dc2626" />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 3 }}>Click to upload training documents / context files</div>
                  <div style={{ fontSize: 11.5, color: '#9ca3af' }}>Supports .pdf, .csv, .txt files up to 25MB</div>
                </div>
              </div>

              {/* Advanced Prompt */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(220,38,38,0.06)', overflow: 'hidden', marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <button onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <ChevronDown size={16} color="#dc2626" style={{ transform: showAdvanced ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                  <Sliders size={15} color="#dc2626" />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#dc2626' }}>Advanced Developer System Prompt Override</span>
                </button>
                {showAdvanced && (
                  <div style={{ padding: '0 24px 20px' }}>
                    <textarea rows={6} placeholder="Inject specialized raw agent guidelines. Note: This will prepend the general personality directives..."
                      style={{ width: '100%', padding: '12px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', resize: 'vertical', lineHeight: 1.6, outline: 'none' }} />
                  </div>
                )}
              </div>

              {/* Save changes sticky trigger */}
              <button onClick={handleSaveAI} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', fontSize: 14, fontWeight: 700,
                background: saved ? '#10b981' : 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
                border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,0.2)', transition: 'background 0.2s',
              }}>
                {saved ? <><Check size={15} /> Saved Successfully!</> : <><Save size={15} /> Save Configuration</>}
              </button>
            </div>
          </div>
        )}

        {/* TEAM / HUMAN CAPACITY VIEW */}
        {activeTab === 'team' && (
          <div>
            {showAddTeam ? (
              <div style={{ padding: '28px', maxWidth: 640 }}>
                <div style={{ background: '#fff', borderRadius: 14, padding: '28px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={18} color="#dc2626" />
                    Register New Human Agent
                  </h3>

                  <form onSubmit={handleAddTeamMember}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Full Name</label>
                      <input 
                        type="text" 
                        required 
                        value={addName} 
                        onChange={e => setAddName(e.target.value)} 
                        placeholder="Usama Habib"
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none' }}
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Email Address</label>
                      <input 
                        type="email" 
                        required 
                        value={addEmail} 
                        onChange={e => setAddEmail(e.target.value)} 
                        placeholder="usama@ittisalo.io"
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Role Profile</label>
                        <select 
                          value={addRole} 
                          onChange={e => setAddRole(e.target.value as any)}
                          style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none', background: '#fff' }}
                        >
                          <option>Agent</option>
                          <option>Manager</option>
                          <option>Admin</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Max Chat Capacity</label>
                        <input 
                          type="number" 
                          min={1} 
                          max={50} 
                          required 
                          value={addCapacity} 
                          onChange={e => setAddCapacity(Number(e.target.value))}
                          style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button 
                        type="button" 
                        onClick={() => setShowAddTeam(false)}
                        style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, border: '1px solid #e5e7eb', background: '#fff', color: '#4b5563', borderRadius: 9, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', boxShadow: '0 3px 10px rgba(220,38,38,0.2)' }}
                      >
                        Add to Team
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : selectedTeamMember ? (
              <div>
                {/* Top Action Header */}
                <div style={{ 
                  background: '#fff', borderBottom: '1px solid rgba(220,38,38,0.06)', 
                  padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  position: 'sticky', top: 0, zIndex: 10 
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
                      <span style={{ color: '#dc2626' }}>Team</span> › {selectedTeamMember.name}
                    </div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>Agent Capacity Settings</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: selectedTeamMember.online ? '#10b981' : '#6b7280' }}>
                        {selectedTeamMember.online ? 'ONLINE' : 'OFFLINE'}
                      </span>
                      <Toggle checked={selectedTeamMember.online} onChange={() => setSelectedTeamMember(prev => prev ? { ...prev, online: !prev.online } : null)} />
                    </div>
                    <button 
                      onClick={() => handleDeleteTeamMember(selectedTeamMember.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', fontSize: 13, fontWeight: 600, background: '#fff', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 9, cursor: 'pointer' }}
                    >
                      <Trash2 size={13} /> Remove Agent
                    </button>
                    <button 
                      onClick={handleSaveTeamMember}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13, fontWeight: 700, 
                        background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', 
                        border: 'none', borderRadius: 9, cursor: 'pointer', 
                        boxShadow: '0 3px 10px rgba(220,38,38,0.2)' 
                      }}
                    >
                      <Save size={13} /> Save Settings
                    </button>
                  </div>
                </div>

                <div style={{ padding: '28px', maxWidth: 800 }}>
                  
                  {/* Status Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                    
                    {/* Capacity box */}
                    <div style={{ background: '#fff', border: '1px solid rgba(220,38,38,0.06)', padding: '18px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={22} color="#dc2626" />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: '#9ca3af', fontWeight: 600 }}>MAX CAPACITY</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginTop: 2 }}>{selectedTeamMember.capacity} Chats</div>
                      </div>
                    </div>

                    {/* Active Workload box */}
                    <div style={{ background: '#fff', border: '1px solid rgba(220,38,38,0.06)', padding: '18px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Power size={22} color="#dc2626" />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: '#9ca3af', fontWeight: 600 }}>ACTIVE DISPATCHES</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginTop: 2 }}>{selectedTeamMember.activeChats} Chats</div>
                      </div>
                    </div>

                    {/* Role Status box */}
                    <div style={{ background: '#fff', border: '1px solid rgba(220,38,38,0.06)', padding: '18px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={22} color="#dc2626" />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: '#9ca3af', fontWeight: 600 }}>ROLE PERMISSION</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginTop: 2 }}>{selectedTeamMember.role}</div>
                      </div>
                    </div>
                  </div>

                  {/* Settings card */}
                  <div style={{ background: '#fff', borderRadius: 14, padding: '24px', border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)', marginBottom: 24 }}>
                    <SectionHeader icon="⚙️" label="Agent Configuration Details" />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Full Display Name</label>
                        <input 
                          type="text" 
                          value={selectedTeamMember.name}
                          onChange={e => setSelectedTeamMember({ ...selectedTeamMember, name: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Role Assignment</label>
                        <select 
                          value={selectedTeamMember.role}
                          onChange={e => setSelectedTeamMember({ ...selectedTeamMember, role: e.target.value as any })}
                          style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none', background: '#fff' }}
                        >
                          <option>Agent</option>
                          <option>Manager</option>
                          <option>Admin</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>System Email Address (Primary Sign-in)</label>
                      <input 
                        type="email" 
                        value={selectedTeamMember.email}
                        onChange={e => setSelectedTeamMember({ ...selectedTeamMember, email: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none' }}
                      />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>Maximum Concurrent Chat Capacity Limit</label>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#dc2626' }}>{selectedTeamMember.capacity} Chats Max</span>
                      </div>
                      <input 
                        type="range" 
                        min={1} 
                        max={30} 
                        value={selectedTeamMember.capacity}
                        onChange={e => setSelectedTeamMember({ ...selectedTeamMember, capacity: Number(e.target.value) })}
                        style={{ width: '100%', accentColor: '#dc2626', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, display: 'block' }}>
                        Controls the auto-routing limit of conversations directed to this agent. Once this capacity is met, incoming conversations bypass this agent until active chats are completed.
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#fff8f8', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(220,38,38,0.08)', marginTop: 24 }}>
                      <Activity size={18} color="#dc2626" />
                      <div style={{ fontSize: 11.5, color: '#b91c1c', fontWeight: 600 }}>
                        Active Workload: currently holding {selectedTeamMember.activeChats} open chats. ({selectedTeamMember.capacity - selectedTeamMember.activeChats} slots remaining).
                      </div>
                    </div>
                  </div>

                  <button onClick={handleSaveTeamMember} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', fontSize: 14, fontWeight: 700,
                    background: teamSaved ? '#10b981' : 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
                    border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,0.2)', transition: 'background 0.2s',
                  }}>
                    {teamSaved ? <><Check size={15} /> Saved Successfully!</> : <><Save size={15} /> Save Member Configuration</>}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 40, gap: 12 }}>
                <Users size={48} color="#d1d5db" />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#4b5563' }}>No Human Agents Active</div>
                <div style={{ fontSize: 12.5, color: '#9ca3af', textAlign: 'center', maxWidth: 280 }}>
                  Add staff members to your support/sales team to direct conversations that escape the AI agents.
                </div>
                <button 
                  onClick={() => setShowAddTeam(true)}
                  style={{
                    padding: '8px 20px', fontSize: 13, fontWeight: 700,
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    marginTop: 8, display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Plus size={14} /> Add First Member
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

