'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, MessageSquare, Clock, Zap, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, Smartphone, Globe 
} from 'lucide-react';

interface AgentPerformance {
  name: string;
  role: string;
  chatsResolved: number;
  avgResponseTime: string;
  csat: string;
  load: number;
}

const mockAgents: AgentPerformance[] = [
  { name: 'Usama Habib', role: 'Admin', chatsResolved: 284, avgResponseTime: '1m 12s', csat: '98.5%', load: 26 },
  { name: 'Sarah Connor', role: 'Manager', chatsResolved: 210, avgResponseTime: '2m 04s', csat: '96.2%', load: 60 },
  { name: 'Alina Khan', role: 'Agent', chatsResolved: 175, avgResponseTime: '1m 55s', csat: '94.8%', load: 25 },
  { name: 'John Doe', role: 'Agent', chatsResolved: 94, avgResponseTime: '3m 48s', csat: '89.0%', load: 100 },
];

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // SVG Chart path generators based on timeRange
  const getInboundPath = () => {
    if (timeRange === '24h') return 'M0 80 Q 20 40, 40 70 T 80 30 T 120 50 T 160 20 T 200 45 T 240 15 T 280 60 T 320 30 T 360 40';
    if (timeRange === '30d') return 'M0 90 L 30 75 L 60 85 L 90 60 L 120 45 L 150 70 L 180 50 L 210 30 L 240 40 L 270 20 L 300 25 L 330 15 L 360 10';
    return 'M0 70 L 60 50 L 120 85 L 180 40 L 240 30 L 300 65 L 360 20'; // 7d default
  };

  const getOutboundPath = () => {
    if (timeRange === '24h') return 'M0 90 Q 20 70, 40 85 T 80 55 T 120 65 T 160 45 T 200 60 T 240 35 T 280 75 T 320 50 T 360 55';
    if (timeRange === '30d') return 'M0 95 L 30 85 L 60 90 L 90 75 L 120 60 L 150 80 L 180 65 L 210 45 L 240 50 L 270 35 L 300 40 L 330 25 L 360 20';
    return 'M0 85 L 60 65 L 120 95 L 180 55 L 240 45 L 300 80 L 360 35'; // 7d default
  };

  return (
    <div style={{ padding: '28px', background: '#faf9f9', minHeight: 'calc(100vh - 98px)' }}>
      
      {/* ── HEADER NAVIGATION ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.4px', margin: 0 }}>
            Reports & Analytics
          </h1>
          <p style={{ fontSize: 12.5, color: '#6b7280', marginTop: 3 }}>
            Monitor real-time communication flows, response speeds, channel breakouts, and agent workloads.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          
          {/* Time range controller */}
          <div style={{ display: 'flex', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 3 }}>
            {[
              { id: '24h', label: '24 Hours' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
            ].map(btn => {
              const act = timeRange === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setTimeRange(btn.id as any)}
                  style={{
                    padding: '5px 12px', fontSize: 11.5, fontWeight: 700, borderRadius: 6,
                    background: act ? '#dc2626' : 'transparent',
                    color: act ? '#fff' : '#6b7280',
                    border: 'none', cursor: 'pointer', transition: 'all 0.12s'
                  }}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          <button 
            onClick={handleRefresh}
            style={{
              padding: '8px 12px', fontSize: 13, fontWeight: 600,
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fafafa'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin-anim' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KEY PERFORMANCE STATS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        
        {[
          { label: 'Conversations Active', val: '412', delta: '+12.4%', up: true, subtitle: 'Across all active channels', icon: MessageSquare },
          { label: 'AI Resolution Rate', val: '86.2%', delta: '+2.1%', up: true, subtitle: 'Resolved entirely by AI Copilots', icon: Zap },
          { label: 'Avg Human Response Time', val: '2m 14s', delta: '-18%', up: true, subtitle: 'Speed of human ticket pickups', icon: Clock },
          { label: 'Customer CSAT Index', val: '94.6%', delta: '+0.5%', up: true, subtitle: 'User rated post-chat surveys', icon: Users },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid rgba(220,38,38,0.06)', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 750, color: '#6b7280', textTransform: 'uppercase' }}>{stat.label}</span>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={13} color="#dc2626" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{stat.val}</span>
              <span style={{ 
                fontSize: 11, fontWeight: 700, 
                color: stat.up ? '#10b981' : '#ef4444',
                display: 'flex', alignItems: 'center'
              }}>
                {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.delta}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{stat.subtitle}</div>
          </div>
        ))}

      </div>

      {/* ── MAIN CHARTS DIVISION GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 28 }}>
        
        {/* SVG Message Flow Area Chart */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(220,38,38,0.06)', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#111827', margin: 0 }}>Message Flow Activity</h3>
              <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>Inbound vs Outbound messages routed in niche framework</p>
            </div>

            <div style={{ display: 'flex', gap: 16, fontSize: 11, fontWeight: 650 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#dc2626' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
                Inbound Messages
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d1d5db' }} />
                Outbound Responses
              </span>
            </div>
          </div>

          {/* SVG Canvas Chart */}
          <div style={{ position: 'relative', width: '100%', height: 180 }}>
            <svg viewBox="0 0 360 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dc2626" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Outbound grey helper line */}
              <path 
                d={getOutboundPath()} 
                fill="none" 
                stroke="#d1d5db" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
              
              {/* Inbound red primary line with area fill */}
              <path 
                d={`${getInboundPath()} L 360 100 L 0 100 Z`} 
                fill="url(#inboundGrad)"
              />
              <path 
                d={getInboundPath()} 
                fill="none" 
                stroke="#dc2626" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
            </svg>
            
            {/* Chart grids indicator lines */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', opacity: 0.05 }}>
              <div style={{ borderBottom: '1px solid #000', width: '100%' }} />
              <div style={{ borderBottom: '1px solid #000', width: '100%' }} />
              <div style={{ borderBottom: '1px solid #000', width: '100%' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', fontWeight: 600, marginTop: 10, borderTop: '1px solid #f9f8f8', paddingTop: 10 }}>
            {timeRange === '24h' ? (
              <><span>12:00 AM</span><span>06:00 AM</span><span>12:00 PM</span><span>06:00 PM</span><span>11:00 PM</span></>
            ) : timeRange === '30d' ? (
              <><span>May 1</span><span>May 8</span><span>May 15</span><span>May 22</span><span>May 30</span></>
            ) : (
              <><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></>
            )}
          </div>
        </div>

        {/* Channels breakout */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(220,38,38,0.06)', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Channel Breakdown</h3>
          <span style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 20 }}>Message volumes by active channel</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, justifyContent: 'center' }}>
            {[
              { id: 'wa', label: 'WhatsApp Official API', count: 1845, percent: 76, bg: '#25D366' },
              { id: 'ig', label: 'Instagram Direct Messages', count: 395, percent: 16, bg: '#E1306C' },
              { id: 'fb', label: 'Facebook Messenger', count: 182, percent: 8, bg: '#1877F2' },
            ].map(ch => (
              <div key={ch.id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 650 }}>
                  <span style={{ color: '#1f2937' }}>{ch.label}</span>
                  <span style={{ color: '#6b7280' }}>{ch.count} chats ({ch.percent}%)</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${ch.percent}%`, height: '100%', background: ch.bg, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── AGENT PERFORMANCE & LOAD LIST ── */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(220,38,38,0.06)', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Human Staff Performance Rating</h3>
        <p style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 20 }}>Active capacity, resolution performance, and customer satisfaction index</p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(220,38,38,0.04)', background: '#faf9f9' }}>
                <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Staff Name</th>
                <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Role Perms</th>
                <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Resolved Chats</th>
                <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Avg Response Speed</th>
                <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>CSAT Satisfaction</th>
                <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Current Workload</th>
              </tr>
            </thead>
            <tbody>
              {mockAgents.map((ag, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #fdfcfc' }}>
                  <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: '#111827' }}>{ag.name}</td>
                  <td style={{ padding: '14px 18px', fontSize: 12.5, color: '#6b7280' }}>{ag.role}</td>
                  <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: '#111827' }}>{ag.chatsResolved} chats</td>
                  <td style={{ padding: '14px 18px', fontSize: 12.5, color: '#4b5563' }}>{ag.avgResponseTime}</td>
                  <td style={{ padding: '14px 18px', fontSize: 12.5, color: '#10b981', fontWeight: 700 }}>{ag.csat}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11.5, color: '#4b5563', fontWeight: 600 }}>{ag.load}% cap</span>
                      <div style={{ width: 80, height: 5, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${ag.load}%`, height: '100%', background: ag.load >= 80 ? '#ef4444' : '#dc2626', borderRadius: 4 }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin-anim {
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
}
