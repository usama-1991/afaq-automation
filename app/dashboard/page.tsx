'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  MessageSquare, Users, Zap, TrendingUp, RefreshCw,
  ArrowUpRight, ArrowDownRight, MessageCircle, Activity,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// ── Palette ──────────────────────────────────────────────────
const RED   = '#dc2626';
const RED_L = '#fef2f2';
const GREEN = '#10b981';
const BLUE  = '#3b82f6';
const AMB   = '#f59e0b';
const PURP  = '#8b5cf6';
const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: '#25D366',
  messenger: '#0084ff',
  instagram: '#e1306c',
};

// ── Helpers ───────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

// ── Sub-components ────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color, bg, trend, trendUp,
}: {
  label: string; value: string | number; sub: string;
  icon: any; color: string; bg: string;
  trend?: string; trendUp?: boolean;
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 22px',
      border: '1px solid rgba(220,38,38,0.07)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column', gap: 14,
      transition: 'box-shadow 0.2s, transform 0.2s',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)';
      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11, background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={19} color={color} strokeWidth={2} />
        </div>
        {trend && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11.5, fontWeight: 600,
            color: trendUp ? GREEN : '#ef4444',
            background: trendUp ? '#ecfdf5' : '#fef2f2',
            padding: '3px 8px', borderRadius: 20,
          }}>
            {trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
          {label}
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#111827', letterSpacing: '-1.5px', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 5 }}>{sub}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children, action }: {
  title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 22px',
      border: '1px solid rgba(220,38,38,0.07)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#111827', borderRadius: 10, padding: '8px 14px',
      color: '#fff', fontSize: 12, lineHeight: 1.6,
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState({ conversations: 0, messages: 0, agentMessages: 0, customers: 0 });
  const [channels, setChannels] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    setRefreshing(true);
    try {
      // Conversations
      const { data: convs } = await supabase.from('conversations').select('id, platform, customer_name, created_at');
      // Messages
      const { data: msgs } = await supabase.from('messages').select('id, sender_type, created_at, conversation_id');

      if (convs && msgs) {
        // Stats
        const agentMsgs = msgs.filter((m: any) => m.sender_type === 'agent');
        const uniqueCustomers = new Set(convs.map((c: any) => c.id)).size;

        setStats({
          conversations: convs.length,
          messages: msgs.length,
          agentMessages: agentMsgs.length,
          customers: uniqueCustomers,
        });

        // Channel breakdown
        const channelCount: Record<string, number> = {};
        convs.forEach((c: any) => { channelCount[c.platform] = (channelCount[c.platform] || 0) + 1; });
        setChannels(Object.entries(channelCount).map(([name, value]: any) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: CHANNEL_COLORS[name] || '#9ca3af',
        })));

        // Recent conversations (last 5)
        const sorted = [...convs].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
        const withMsgCount = sorted.map((c: any) => ({
          ...c,
          msgCount: msgs.filter((m: any) => m.conversation_id === c.id).length,
        }));
        setRecent(withMsgCount);

        // Volume — last 7 days
        const days: { time: string; inbound: number; outbound: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const label = d.toLocaleDateString('en', { weekday: 'short' });
          const dateStr = d.toISOString().split('T')[0];
          days.push({
            time: label,
            inbound: msgs.filter((m: any) => m.sender_type === 'customer' && m.created_at.startsWith(dateStr)).length,
            outbound: msgs.filter((m: any) => m.sender_type === 'agent' && m.created_at.startsWith(dateStr)).length,
          });
        }
        setVolumeData(days);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ padding: '28px 28px 40px', minHeight: '100%', background: '#faf9f9' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 12.5, color: '#9ca3af', fontWeight: 500, marginBottom: 4 }}>{dateLabel}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.7px', lineHeight: 1.1 }}>
            {greeting} 👋
          </h1>
          <p style={{ fontSize: 13.5, color: '#6b7280', marginTop: 5 }}>
            Here's what's happening across your channels today.
          </p>
        </div>
        <button
          onClick={fetchAll}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 10,
            border: '1px solid rgba(220,38,38,0.15)',
            background: '#fff', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, color: '#6b7280',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.15s',
          }}
        >
          <RefreshCw size={13} style={refreshing ? { animation: 'spin 0.8s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard
          label="Total Conversations" value={fmt(stats.conversations)}
          sub="All channels combined"
          icon={MessageSquare} color={RED} bg={RED_L}
          trend="+12%" trendUp={true}
        />
        <StatCard
          label="Total Messages" value={fmt(stats.messages)}
          sub="Inbound & outbound"
          icon={Activity} color={BLUE} bg="#eff6ff"
          trend="+8%" trendUp={true}
        />
        <StatCard
          label="Agent Replies" value={fmt(stats.agentMessages)}
          sub="Sent from this CRM"
          icon={Zap} color={AMB} bg="#fffbeb"
          trend="+24%" trendUp={true}
        />
        <StatCard
          label="Active Contacts" value={fmt(stats.customers)}
          sub="Unique conversations"
          icon={Users} color={PURP} bg="#f5f3ff"
        />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 20 }}>

        {/* Volume Chart */}
        <SectionCard
          title="Message Volume"
          subtitle="Last 7 days — inbound vs agent replies"
        >
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={RED} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={RED} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE} stopOpacity={0.14} />
                    <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="inbound" name="Inbound" stroke={RED} strokeWidth={2.5} fill="url(#gin)" dot={false} />
                <Area type="monotone" dataKey="outbound" name="Outbound" stroke={BLUE} strokeWidth={2} fill="url(#gout)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
            {[{ color: RED, label: 'Inbound' }, { color: BLUE, label: 'Outbound (Agent)' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 3, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 11.5, color: '#9ca3af', fontWeight: 500 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Channel Pie */}
        <SectionCard title="Channel Breakdown" subtitle="Conversations by platform">
          {channels.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
              No data yet
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart width={170} height={170}>
                  <Pie
                    data={channels} cx={80} cy={80}
                    innerRadius={50} outerRadius={76}
                    paddingAngle={3} dataKey="value"
                    strokeWidth={0}
                  >
                    {channels.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                </PieChart>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 4 }}>
                {channels.map((c: any) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                      <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{c.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>{c.value}</span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>conv.</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* ── Recent Conversations ── */}
      <SectionCard
        title="Recent Conversations"
        subtitle="Latest active threads across all channels"
        action={
          <a href="/conversations" style={{ fontSize: 12.5, color: RED, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View all <ArrowUpRight size={13} />
          </a>
        }
      >
        {loading ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading…</div>
        ) : recent.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No conversations yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 90px', gap: 12, padding: '0 12px 10px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span>Customer</span>
              <span>Channel</span>
              <span style={{ textAlign: 'center' }}>Messages</span>
              <span style={{ textAlign: 'right' }}>Date</span>
            </div>
            {recent.map((c: any, i: number) => {
              const channelColor = CHANNEL_COLORS[c.platform] || '#9ca3af';
              const initials = (c.customer_name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
              const date = new Date(c.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' });
              return (
                <a key={c.id} href="/conversations" style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 120px 80px 90px',
                    gap: 12, padding: '11px 12px', borderRadius: 10,
                    alignItems: 'center',
                    borderTop: i > 0 ? '1px solid rgba(220,38,38,0.05)' : 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fef8f8'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    {/* Customer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, ${RED}, #f87171)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff',
                      }}>{initials}</div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>
                          {c.customer_name || c.external_conversation_id}
                        </div>
                      </div>
                    </div>
                    {/* Channel */}
                    <div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 20,
                        background: channelColor + '18',
                        color: channelColor,
                        fontSize: 11.5, fontWeight: 600,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: channelColor, display: 'inline-block' }} />
                        {c.platform.charAt(0).toUpperCase() + c.platform.slice(1)}
                      </span>
                    </div>
                    {/* Message count */}
                    <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111827' }}>
                      {c.msgCount}
                    </div>
                    {/* Date */}
                    <div style={{ textAlign: 'right', fontSize: 12, color: '#9ca3af' }}>
                      {date}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </SectionCard>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
