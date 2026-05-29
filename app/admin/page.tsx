"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Shield, Building, Users, Activity, RefreshCw, Plus, Check, AlertCircle, Loader2 } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  business_name?: string;
  niche?: string;
  created_at: string;
}

interface AdminUser {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
  tenant_name: string | null;
  email: string | null;
}

interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
}

const tabs = ['Tenants', 'Users', 'Audit'] as const;
type Tab = typeof tabs[number];

export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Tenants');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);

    // Fetch tenants
    const { data: tenantsData } = await supabase.from("tenants").select("*");
    if (tenantsData) setTenants(tenantsData);

    // Fetch users (try RPC first, fallback to direct query)
    try {
      const { data: usersRPC } = await supabase.rpc("get_admin_users");
      if (usersRPC) setUsers(usersRPC);
    } catch {
      try {
        const { data: usersData } = await supabase.from("users").select("*");
        if (usersData) {
          setUsers(usersData.map((u: any) => ({
            id: u.id,
            full_name: u.full_name,
            role: u.role,
            created_at: u.created_at,
            tenant_name: null,
            email: null,
          })));
        }
      } catch { /* silently fail */ }
    }

    // Fetch audit logs
    try {
      const { data: auditData } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (auditData) setAuditLogs(auditData);
    } catch { /* audit_logs table may not exist yet */ }

    setLoading(false);
  };

  const roleColors: Record<string, { bg: string; color: string; border: string }> = {
    super_admin: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
    admin:       { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
    agent:       { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  };

  const statCards = [
    { label: 'Total Clients', value: tenants.length || 0, icon: Building, iconBg: '#eef2ff', iconColor: '#6366f1' },
    { label: 'Active Clients', value: tenants.length || 0, icon: Check, iconBg: '#ecfdf5', iconColor: '#10b981' },
    { label: 'Audit Events', value: auditLogs.length || 0, icon: Activity, iconBg: '#fffbeb', iconColor: '#f59e0b' },
    { label: 'Total Users', value: users.length || 0, icon: Users, iconBg: '#f5f3ff', iconColor: '#8b5cf6' },
  ];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            <Shield size={14} /> Super Admin
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>Admin Panel</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={fetchAllData}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', fontSize: 13, fontWeight: 600,
              background: '#fff', color: '#6b7280',
              border: '1px solid rgba(220,38,38,0.15)', borderRadius: 9,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <RefreshCw size={13} style={loading ? { animation: 'spin 0.8s linear infinite' } : {}} /> Refresh
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', fontSize: 13, fontWeight: 700,
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
            border: 'none', borderRadius: 9, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(220,38,38,0.2)',
          }}>
            <Plus size={14} /> New Client
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} style={{
              background: '#fff', padding: '18px 20px', borderRadius: 14,
              border: '1px solid rgba(220,38,38,0.06)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: card.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                <Icon size={16} color={card.iconColor} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(220,38,38,0.08)', marginBottom: 24 }}>
        {tabs.map(t => {
          const active = activeTab === t;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '10px 20px', fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? '#dc2626' : '#6b7280',
                background: 'none', border: 'none',
                borderBottom: active ? '2.5px solid #dc2626' : '2.5px solid transparent',
                marginBottom: -1.5, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading data...
        </div>
      ) : (
        <>
          {/* Tenants Tab */}
          {activeTab === 'Tenants' && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(220,38,38,0.06)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(220,38,38,0.08)' }}>
                    {['Client', 'Niche', 'Plan', 'Status', 'Created', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(220,38,38,0.04)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{t.business_name || t.name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{t.id.split('-')[0]}...</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                          background: '#fef2f2', color: '#dc2626', textTransform: 'capitalize',
                        }}>
                          {t.niche || 'general'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <select style={{
                          fontSize: 12, border: '1px solid rgba(220,38,38,0.12)', borderRadius: 7,
                          padding: '5px 8px', background: '#fafafa', color: '#374151', outline: 'none',
                          fontFamily: 'inherit',
                        }}>
                          <option>starter</option>
                          <option>pro</option>
                          <option>enterprise</option>
                        </select>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>active</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12.5, color: '#6b7280' }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button style={{
                          fontSize: 12, fontWeight: 600, color: '#ef4444', background: 'none',
                          border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
                          transition: 'all 0.15s',
                        }}>
                          Suspend
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                        No tenants found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'Users' && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(220,38,38,0.06)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(220,38,38,0.08)' }}>
                    {['Name', 'Email', 'Role', 'Tenant', 'Created'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const rc = roleColors[u.role] || roleColors.agent;
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(220,38,38,0.04)' }}>
                        <td style={{ padding: '14px 16px', fontSize: 13.5, fontWeight: 600, color: '#111827' }}>
                          {u.full_name || 'Anonymous'}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 12.5, color: '#6b7280' }}>
                          {u.email || '—'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                            background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 12.5, color: '#6b7280' }}>
                          {u.tenant_name || 'N/A'}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 12.5, color: '#6b7280' }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Audit Tab */}
          {activeTab === 'Audit' && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(220,38,38,0.06)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(220,38,38,0.08)' }}>
                    {['Timestamp', 'Action', 'User', 'Tenant ID', 'Details'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(220,38,38,0.04)' }}>
                      <td style={{ padding: '14px 16px', fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                          background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 11.5, color: '#6b7280', fontFamily: 'monospace' }}>
                        {log.user_id ? log.user_id.split('-')[0] + '...' : 'System'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 11.5, color: '#6b7280', fontFamily: 'monospace' }}>
                        {log.tenant_id ? log.tenant_id.split('-')[0] + '...' : 'System'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <pre style={{
                          fontSize: 11, background: '#fafafa', padding: '6px 8px', borderRadius: 6,
                          maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          border: '1px solid rgba(220,38,38,0.06)', margin: 0,
                        }}>
                          {JSON.stringify(log.details)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <AlertCircle size={20} color="#d1d5db" />
                          <span>No audit logs found. Run the Supabase SQL migration to start capturing events.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
