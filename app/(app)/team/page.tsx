'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Sparkles, Hash, 
  Trash2, Edit3, Plus, Check, Loader2, Zap, 
  Mail, Phone, AlertCircle, Info, Lock
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function TeamManagementPage() {
  const [activeTab, setActiveTab] = useState<'teams' | 'members' | 'snippets'>('teams');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State
  const [teams, setTeams] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Modals & Forms
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', description: '', color: '#dc2626' });

  const [showSnippetModal, setShowSnippetModal] = useState(false);
  const [snippetForm, setSnippetForm] = useState({ shortcut: '', title: '', content: '', category: 'General' });

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({ email: '', fullName: '', role: 'agent' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
      if (!profile?.tenant_id) return;
      setTenantId(profile.tenant_id);

      const tid = profile.tenant_id;

      // 1. Fetch teams
      const { data: teamData } = await supabase.from('teams').select('*').eq('tenant_id', tid).order('name');
      if (teamData) setTeams(teamData);

      // 2. Fetch members
      const { data: memberData } = await supabase.from('users').select('id, email, full_name, role, created_at').eq('tenant_id', tid).order('full_name');
      if (memberData) setMembers(memberData);

      // 3. Fetch snippets
      const { data: snippetData } = await supabase.from('canned_responses').select('*').eq('tenant_id', tid).order('shortcut');
      if (snippetData) setSnippets(snippetData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Create Team ─────────────────────────────────────────────
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !teamForm.name.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('teams').insert([{
        tenant_id: tenantId,
        name: teamForm.name.trim(),
        description: teamForm.description.trim(),
        color: teamForm.color,
      }]).select().single();

      if (error) throw error;
      if (data) setTeams(prev => [...prev, data]);
      setShowTeamModal(false);
      setTeamForm({ name: '', description: '', color: '#dc2626' });
    } catch (err: any) {
      alert(`Failed to create team: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete Team ─────────────────────────────────────────────
  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team department?')) return;
    try {
      await supabase.from('teams').delete().eq('id', id);
      setTeams(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      alert(`Error deleting team: ${err.message}`);
    }
  };

  // ── Create Canned Snippet ───────────────────────────────────
  const handleCreateSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !snippetForm.shortcut.trim() || !snippetForm.content.trim()) return;
    setSaving(true);
    try {
      const cleanShortcut = snippetForm.shortcut.trim().replace(/^\//, '').toLowerCase();
      const { data, error } = await supabase.from('canned_responses').insert([{
        tenant_id: tenantId,
        shortcut: cleanShortcut,
        title: snippetForm.title.trim() || cleanShortcut,
        content: snippetForm.content.trim(),
        category: snippetForm.category || 'General',
      }]).select().single();

      if (error) throw error;
      if (data) setSnippets(prev => [...prev, data]);
      setShowSnippetModal(false);
      setSnippetForm({ shortcut: '', title: '', content: '', category: 'General' });
    } catch (err: any) {
      alert(`Failed to create snippet: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete Canned Snippet ───────────────────────────────────
  const handleDeleteSnippet = async (id: string) => {
    if (!confirm('Delete this canned snippet?')) return;
    try {
      await supabase.from('canned_responses').delete().eq('id', id);
      setSnippets(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(`Error deleting snippet: ${err.message}`);
    }
  };

  const COLOR_SWATCHES = ['#dc2626', '#2563eb', '#16a34a', '#8b5cf6', '#d97706', '#db2777', '#0891b2', '#4b5563'];

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 20px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>
          Team & Agent Workspace
        </h1>
        <p style={{ fontSize: 13.5, color: '#6b7280', marginTop: 4 }}>
          Manage department queues, assign agents to team inboxes, and configure canned quick snippets.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 24 }}>
        {[
          { id: 'teams', label: 'Department Teams', icon: Users, count: teams.length },
          { id: 'members', label: 'Team Members', icon: Shield, count: members.length },
          { id: 'snippets', label: 'Canned Snippets (/ Shortcuts)', icon: Zap, count: snippets.length },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', fontSize: 13.5, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#dc2626' : '#6b7280',
                borderBottom: isActive ? '2px solid #dc2626' : '2px solid transparent',
                background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                cursor: 'pointer', marginBottom: -1, transition: 'all 0.15s',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: isActive ? '#fee2e2' : '#f3f4f6', color: isActive ? '#dc2626' : '#6b7280' }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : (
        <>
          {/* ── TAB 1: Department Teams ─────────────────────── */}
          {activeTab === 'teams' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Department Queues</h3>
                  <p style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2, margin: 0 }}>Group conversations by specialized team (e.g. Sales, Technical Support, VIP).</p>
                </div>
                <button
                  onClick={() => setShowTeamModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: '#dc2626', color: '#ffffff', border: 'none', cursor: 'pointer',
                  }}
                >
                  <Plus size={15} />
                  <span>New Team Queue</span>
                </button>
              </div>

              {teams.length === 0 ? (
                <div style={{ background: '#ffffff', borderRadius: 12, padding: 40, textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Users size={36} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>No teams created yet</div>
                  <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 360, margin: '6px auto 16px' }}>Create department teams to categorize tickets and filter team inboxes.</p>
                  <button onClick={() => setShowTeamModal(true)} style={{ padding: '8px 16px', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Create First Team</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {teams.map(team => (
                    <div
                      key={team.id}
                      style={{
                        background: '#ffffff', borderRadius: 12, padding: 18,
                        border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: team.color || '#dc2626' }} />
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{team.name}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteTeam(team.id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                            title="Delete Team"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <p style={{ fontSize: 12.5, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                          {team.description || 'No description provided'}
                        </p>
                      </div>

                      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: '#9ca3af' }}>
                        <span>Queue ID: {team.id.slice(0, 8)}</span>
                        <span style={{ color: team.color, fontWeight: 600 }}>Active Queue</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: Team Members ────────────────────────── */}
          {activeTab === 'members' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Team Members</h3>
                  <p style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2, margin: 0 }}>Members who can reply to conversations, triage queues, and write internal notes.</p>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid rgba(0,0,0,0.07)', color: '#6b7280', fontWeight: 600 }}>
                      <th style={{ padding: '12px 16px' }}>Name & Email</th>
                      <th style={{ padding: '12px 16px' }}>Role</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px' }}>Joined Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => (
                      <tr key={member.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{member.full_name || 'Team Member'}</div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{member.email}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                            background: member.role === 'admin' ? '#fee2e2' : '#eff6ff',
                            color: member.role === 'admin' ? '#dc2626' : '#2563eb',
                            textTransform: 'uppercase'
                          }}>
                            {member.role || 'Agent'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#16a34a', fontSize: 12, fontWeight: 600 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                            Active
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 12 }}>
                          {member.created_at ? new Date(member.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 3: Canned Snippets (/ Shortcuts) ───────── */}
          {activeTab === 'snippets' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Canned Quick Responses</h3>
                  <p style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2, margin: 0 }}>Type <code style={{ background: '#f3f4f6', padding: '2px 5px', borderRadius: 4, fontWeight: 700 }}>/shortcut</code> in any chat to instantly insert pre-saved templates.</p>
                </div>
                <button
                  onClick={() => setShowSnippetModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: '#dc2626', color: '#ffffff', border: 'none', cursor: 'pointer',
                  }}
                >
                  <Plus size={15} />
                  <span>New Canned Snippet</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {snippets.map(s => (
                  <div
                    key={s.id}
                    style={{
                      background: '#ffffff', borderRadius: 12, padding: 18,
                      border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: 6 }}>
                            /{s.shortcut}
                          </span>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{s.title}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteSnippet(s.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                          title="Delete Snippet"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5, background: '#f9fafb', padding: '10px 12px', borderRadius: 8, whiteSpace: 'pre-wrap' }}>
                        {s.content}
                      </p>
                    </div>

                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
                      <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{s.category || 'General'}</span>
                      <span>Supports variables: $customer.name, $business.name</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── CREATE TEAM MODAL ─────────────────────────────── */}
      {showTeamModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <form onSubmit={handleCreateTeam} style={{ background: '#ffffff', borderRadius: 14, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Create Department Team Queue</h3>
            
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Team Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Sales APAC, Billing, VIP Accounts"
                value={teamForm.name}
                onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Description</label>
              <textarea
                rows={2}
                placeholder="Responsibilities of this department queue..."
                value={teamForm.description}
                onChange={e => setTeamForm({ ...teamForm, description: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Badge Color</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {COLOR_SWATCHES.map(c => (
                  <div
                    key={c}
                    onClick={() => setTeamForm({ ...teamForm, color: c })}
                    style={{
                      width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: teamForm.color === c ? '2.5px solid #111827' : '2px solid transparent',
                      boxSizing: 'border-box'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setShowTeamModal(false)} style={{ padding: '8px 14px', borderRadius: 8, background: '#f3f4f6', border: 'none', color: '#4b5563', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── CREATE SNIPPET MODAL ──────────────────────────── */}
      {showSnippetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <form onSubmit={handleCreateSnippet} style={{ background: '#ffffff', borderRadius: 14, width: '100%', maxWidth: 480, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Create Canned Response</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Shortcut</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: 9, color: '#9ca3af', fontWeight: 700 }}>/</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. promo"
                    value={snippetForm.shortcut}
                    onChange={e => setSnippetForm({ ...snippetForm, shortcut: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px 9px 24px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Promo Code Offer"
                  value={snippetForm.title}
                  onChange={e => setSnippetForm({ ...snippetForm, title: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Message Content</label>
              <textarea
                rows={4}
                required
                placeholder="Type your response template... Use $customer.name, $business.name for dynamic fields."
                value={snippetForm.content}
                onChange={e => setSnippetForm({ ...snippetForm, content: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Category</label>
              <select
                value={snippetForm.category}
                onChange={e => setSnippetForm({ ...snippetForm, category: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
              >
                <option value="General">General</option>
                <option value="Greetings">Greetings</option>
                <option value="Orders">Orders & Shipping</option>
                <option value="Support">Support & Inquiries</option>
                <option value="Sales">Sales & Promotions</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setShowSnippetModal(false)} style={{ padding: '8px 14px', borderRadius: 8, background: '#f3f4f6', border: 'none', color: '#4b5563', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save Snippet'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
