'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, Save, ArrowLeft, Shield, Mail, Check, Copy, UserPlus, Users, MessageSquare, Megaphone, Zap, BarChart2, FileText, ChevronRight, Crown } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────
interface Agent {
  id: string;
  name: string;
  email: string;
  role: 'Agent' | 'Admin' | 'Team Lead';
  permissions: Record<string, number>;
}

// defaultAgents removed

const PERMISSION_CATEGORIES = [
  { id: 'Lead Management', label: 'Lead Management', icon: MessageSquare, max: 14, color: '#10b981' },
  { id: 'Live Chat', label: 'Live Chat', icon: MessageSquare, max: 5, color: '#10b981' },
  { id: 'Templates', label: 'Templates', icon: FileText, max: 6, color: '#10b981' },
  { id: 'Campaigns', label: 'Campaigns', icon: Megaphone, max: 4, color: '#f59e0b' },
  { id: 'Reports', label: 'Reports', icon: BarChart2, max: 2, color: '#10b981' },
  { id: 'User Management', label: 'User Management', icon: Users, max: 1, color: '#10b981' },
];

import { supabase } from '@/lib/supabase/client';
import { useEffect } from 'react';

export default function TeamPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [tenantId, setTenantId] = useState<string>('');
  
  // Create state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isTeamLead, setIsTeamLead] = useState(false);
  const [tempPermissions, setTempPermissions] = useState<Record<string, number>>({});

  // Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState({ email: '', password: '' });
  const [copied, setCopied] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id);
        const { data: usersData } = await supabase.from('users').select('*').eq('tenant_id', profile.tenant_id);
        
        if (usersData) {
          const formattedAgents: Agent[] = usersData.map((u: any) => ({
            id: u.id,
            name: u.full_name || 'Unnamed Agent',
            email: u.email || 'No Email',
            role: u.role === 'admin' ? 'Admin' : u.role === 'Team Lead' ? 'Team Lead' : 'Agent',
            permissions: u.permissions || {}
          }));
          setAgents(formattedAgents);
        }
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleCreateNew = () => {
    setEditingAgent(null);
    setNewName('');
    setNewEmail('');
    setIsTeamLead(false);
    // Set default max permissions for everything initially, or custom defaults
    const defaults: Record<string, number> = {};
    PERMISSION_CATEGORIES.forEach(c => { defaults[c.id] = c.max; });
    setTempPermissions(defaults);
    setView('edit');
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setNewName(agent.name);
    setNewEmail(agent.email);
    setIsTeamLead(agent.role === 'Team Lead');
    setTempPermissions({ ...agent.permissions });
    setView('edit');
  };

  const handleSave = async () => {
    setLoading(true);
    if (editingAgent) {
      // Update existing
      try {
        const dbRole = isTeamLead ? 'Team Lead' : 'agent';
        await supabase.from('users').update({
          full_name: newName || editingAgent.name,
          email: newEmail || editingAgent.email,
          role: dbRole,
          permissions: tempPermissions
        }).eq('id', editingAgent.id);
        
        await fetchAgents();
        setView('list');
      } catch (err) {
        alert('Failed to update agent.');
      }
    } else {
      // Create new
      if (!newName || !newEmail) {
        setLoading(false);
        return alert('Name and email are required to create an agent.');
      }
      
      try {
        const res = await fetch('/api/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName,
            email: newEmail,
            role: isTeamLead ? 'Team Lead' : 'Agent',
            permissions: tempPermissions,
            tenantId: tenantId
          })
        });
        
        const data = await res.json();
        
        if (data.success) {
          setGeneratedCreds({ email: newEmail, password: data.tempPass });
          await fetchAgents();
          setShowSuccessModal(true);
        } else {
          alert('Error: ' + data.error);
        }
      } catch (err) {
        alert('Failed to create agent.');
      }
    }
    setLoading(false);
  };

  const totalPerms = Object.values(tempPermissions).reduce((acc, val) => acc + val, 0);
  const activeCategories = Object.values(tempPermissions).filter(v => v > 0).length;

  return (
    <div style={{ padding: '32px 32px 50px', minHeight: '100%', background: '#faf9f9' }}>
      
      {view === 'list' && (
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', letterSpacing: '-0.5px' }}>Team</h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Manage your support team and role permissions.</p>
            </div>
            <button 
              onClick={handleCreateNew}
              style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <UserPlus size={16} /> Invite Member
            </button>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(agent => (
                  <tr key={agent.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600, color: '#111827' }}>{agent.name}</td>
                    <td style={{ padding: '16px 24px', fontSize: 14, color: '#4b5563' }}>{agent.email}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        background: agent.role === 'Admin' ? '#fef2f2' : agent.role === 'Team Lead' ? '#fffbeb' : '#ecfdf5',
                        color: agent.role === 'Admin' ? '#dc2626' : agent.role === 'Team Lead' ? '#d97706' : '#10b981',
                        padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 
                      }}>
                        {agent.role}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleEdit(agent)}
                        style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Manage Permissions
                      </button>
                    </td>
                  </tr>
                ))}
                {agents.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 30, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>No team members found. Invite one to get started.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'edit' && (
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '85vh' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', letterSpacing: '-0.5px' }}>
                {editingAgent ? 'Role Assignment' : 'Create Agent'}
              </h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                {editingAgent ? `Manage permissions for ${editingAgent.name}` : `Assign roles and permissions for a new team member`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {editingAgent && (
                <button style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={16} /> Promote to Admin
                </button>
              )}
              {editingAgent && (
                <button style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Edit size={16} /> Edit Agent
                </button>
              )}
              <button 
                onClick={() => setView('list')}
                style={{ background: '#111827', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Back to Team
              </button>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {!editingAgent && (
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <input 
                  type="text" placeholder="Member Full Name" value={newName} onChange={e => setNewName(e.target.value)}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none' }}
                />
                <input 
                  type="email" placeholder="Member Email Address" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none' }}
                />
              </div>
            )}

            <div style={{ background: '#fffcf2', border: '1px solid #fef08a', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Crown size={18} color="#d97706" />
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#92400e' }}>Team lead</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#b45309', marginBottom: 12 }}>
                    Team leads see their own chats, all chats assigned to agents on their team, and unassigned conversations. Only one team lead per team.
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Mark as team lead</div>
                  <div style={{ fontSize: 12, color: '#b45309' }}>Assign a team first (Team Management).</div>
                </div>
                <div 
                  onClick={() => setIsTeamLead(!isTeamLead)}
                  style={{ 
                    width: 44, height: 24, background: isTeamLead ? '#10b981' : '#e5e7eb', 
                    borderRadius: 12, position: 'relative', cursor: 'pointer', transition: '0.2s' 
                  }}
                >
                  <div style={{ position: 'absolute', top: 2, left: isTeamLead ? 22 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
              {PERMISSION_CATEGORIES.map(cat => {
                const isFull = tempPermissions[cat.id] === cat.max;
                const isEmpty = tempPermissions[cat.id] === 0;
                return (
                  <div key={cat.id} 
                    onClick={() => {
                      setTempPermissions(prev => ({
                        ...prev,
                        [cat.id]: prev[cat.id] === cat.max ? 0 : cat.max
                      }));
                    }}
                    style={{ 
                    background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: '20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.01)',
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <cat.icon size={20} color="#6b7280" strokeWidth={1.5} />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{cat.label}</div>
                        <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>
                          {tempPermissions[cat.id]} of {cat.max} permissions selected
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: isFull ? '#10b981' : isEmpty ? '#e5e7eb' : '#f59e0b' }} />
                      <ChevronRight size={16} color="#9ca3af" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)', padding: '20px 24px', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>Permission Summary</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                Total permissions selected: {totalPerms} across {activeCategories} categories
              </div>
            </div>
            <button 
              onClick={handleSave}
              disabled={loading}
              style={{ background: '#10b981', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '28px 32px' }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0, marginBottom: 8 }}>Team Member Invited!</h2>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0, marginBottom: 24 }}>The team member account has been created successfully.</p>
              
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
                    <span style={{ fontWeight: 700, color: '#374151' }}>Email:</span>
                    <span style={{ color: '#4b5563' }}>{generatedCreds.email}</span>
                  </div>
                  <button onClick={() => handleCopy(generatedCreds.email, 'email')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === 'email' ? '#10b981' : '#9ca3af' }}>
                    {copied === 'email' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
                    <span style={{ fontWeight: 700, color: '#374151' }}>Temporary Password:</span>
                    <span style={{ color: '#4b5563', fontFamily: 'monospace', fontWeight: 600 }}>{generatedCreds.password}</span>
                  </div>
                  <button onClick={() => handleCopy(generatedCreds.password, 'pass')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === 'pass' ? '#10b981' : '#9ca3af' }}>
                    {copied === 'pass' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <p style={{ fontSize: 12.5, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                A confirmation email has been sent to the team member. They can use these credentials to sign in to Ittisalo at app.ittisalo.io/login and will be prompted to reset their password on their first login.
              </p>
            </div>
            <div style={{ padding: '16px 32px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setShowSuccessModal(false); setView('list'); }}
                style={{ background: '#111827', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

