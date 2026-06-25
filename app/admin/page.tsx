'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import SuperAdminGuard from '@/components/SuperAdminGuard';
import { Crown, Search, Building2, Calendar, MessageSquare, Zap, Activity, AlertCircle, Save, X, Check } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  plan: string;
  plan_status: string;
  trial_ends_at: string;
  meta_connected: boolean;
  business_name: string;
  admin_notes: string;
  created_at: string;
}

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit states
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const fetchTenants = async () => {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setTenants(data as Tenant[]);
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleManage = (t: Tenant) => {
    setSelectedTenant(t);
    setEditPlan(t.plan || 'trial');
    setEditStatus(t.plan_status || 'active');
    setEditNotes(t.admin_notes || '');
  };

  const handleSave = async () => {
    if (!selectedTenant) return;
    setSaving(true);
    
    const { error } = await supabase
      .from('tenants')
      .update({
        plan: editPlan,
        plan_status: editStatus,
        admin_notes: editNotes,
        plan_changed_at: new Date().toISOString()
      })
      .eq('id', selectedTenant.id);

    if (!error) {
      setTenants(prev => prev.map(t => t.id === selectedTenant.id ? { ...t, plan: editPlan, plan_status: editStatus, admin_notes: editNotes } : t));
      setSelectedTenant(null);
    } else {
      alert('Failed to save changes. Are you sure you are a Super Admin?');
    }
    setSaving(false);
  };

  const filteredTenants = tenants.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase()) || 
    t.business_name?.toLowerCase().includes(search.toLowerCase())
  );

  const activeSubs = tenants.filter(t => t.plan_status === 'active' && t.plan !== 'trial').length;
  const trialSubs = tenants.filter(t => t.plan === 'trial').length;

  return (
    <SuperAdminGuard>
      <div style={{ padding: '32px 32px 100px', minHeight: '100vh', background: '#111827' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Platform Control</h1>
              <p style={{ fontSize: 14, color: '#9ca3af', margin: 0, marginTop: 4 }}>Super Admin Dashboard</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
            <div style={{ background: '#1f2937', borderRadius: 16, padding: '24px', border: '1px solid #374151' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#9ca3af', marginBottom: 12 }}><Building2 size={16} /> Total Workspaces</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>{tenants.length}</div>
            </div>
            <div style={{ background: '#1f2937', borderRadius: 16, padding: '24px', border: '1px solid #374151' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#9ca3af', marginBottom: 12 }}><Zap size={16} /> Active Subscriptions</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#10b981' }}>{activeSubs} <span style={{ fontSize: 16, color: '#6b7280', fontWeight: 600 }}>PAID</span></div>
            </div>
            <div style={{ background: '#1f2937', borderRadius: 16, padding: '24px', border: '1px solid #374151' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#9ca3af', marginBottom: 12 }}><Calendar size={16} /> Users on Trial</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#f59e0b' }}>{trialSubs} <span style={{ fontSize: 16, color: '#6b7280', fontWeight: 600 }}>TRIAL</span></div>
            </div>
          </div>

          <div style={{ background: '#1f2937', borderRadius: 16, border: '1px solid #374151', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Registered Businesses</h2>
              <div style={{ position: 'relative', width: 300 }}>
                <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Search tenants..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8, background: '#111827', border: '1px solid #4b5563', color: '#fff', outline: 'none', fontSize: 14 }}
                />
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#111827', borderBottom: '1px solid #374151' }}>
                  <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Workspace</th>
                  <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Current Plan</th>
                  <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Meta Setup</th>
                  <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #374151', background: '#1f2937' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.business_name || t.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, fontFamily: 'monospace' }}>ID: {t.id.slice(0,8)}...</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        background: t.plan === 'enterprise' ? '#1e1b4b' : t.plan === 'growth' ? '#172554' : t.plan === 'trial' ? '#422006' : '#111827',
                        color: t.plan === 'enterprise' ? '#818cf8' : t.plan === 'growth' ? '#60a5fa' : t.plan === 'trial' ? '#facc15' : '#e5e7eb',
                        padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' 
                      }}>
                        {t.plan ? t.plan.toUpperCase() : 'NONE'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        background: t.plan_status === 'active' ? '#064e3b' : t.plan_status === 'suspended' ? '#7f1d1d' : '#4b5563',
                        color: t.plan_status === 'active' ? '#34d399' : t.plan_status === 'suspended' ? '#fca5a5' : '#fff',
                        padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 
                      }}>
                        {t.plan_status ? t.plan_status.toUpperCase() : 'UNKNOWN'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {t.meta_connected ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: 13, fontWeight: 600 }}><Check size={14} /> Connected</div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9ca3af', fontSize: 13 }}><AlertCircle size={14} /> Pending</div>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleManage(t)}
                        style={{ background: '#374151', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manage Modal */}
        {selectedTenant && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#1f2937', borderRadius: 16, width: '100%', maxWidth: 500, border: '1px solid #374151', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Manage Workspace</h2>
                <button onClick={() => setSelectedTenant(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div style={{ padding: '24px' }}>
                
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#d1d5db', marginBottom: 8 }}>Subscription Plan</label>
                  <select 
                    value={editPlan} 
                    onChange={e => setEditPlan(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: '#111827', border: '1px solid #4b5563', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' }}
                  >
                    <option value="trial">Trial (14 Days)</option>
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#d1d5db', marginBottom: 8 }}>Account Status</label>
                  <select 
                    value={editStatus} 
                    onChange={e => setEditStatus(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: '#111827', border: '1px solid #4b5563', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' }}
                  >
                    <option value="active">Active (Good Standing)</option>
                    <option value="suspended">Suspended (Lock out user)</option>
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#d1d5db', marginBottom: 8 }}>Admin Notes (Internal)</label>
                  <textarea 
                    value={editNotes} 
                    onChange={e => setEditNotes(e.target.value)}
                    rows={4}
                    placeholder="E.g. Paid via bank transfer on June 20th"
                    style={{ width: '100%', padding: '12px', background: '#111827', border: '1px solid #4b5563', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <button 
                  onClick={handleSave}
                  disabled={saving}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                </button>

              </div>
            </div>
          </div>
        )}

      </div>
    </SuperAdminGuard>
  );
}
