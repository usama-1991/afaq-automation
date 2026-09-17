'use client';

import React, { memo } from 'react';
import { 
  Inbox, User, UserX, Bot, AlertTriangle, CheckCircle2, 
  Flame, Calendar, CreditCard, Sparkles, 
  Users, ChevronDown, ChevronRight, Hash, Globe,
  Archive
} from 'lucide-react';

export type QueueType = 
  | 'all' 
  | 'mine' 
  | 'unassigned' 
  | 'ai_active' 
  | 'ai_escalated' 
  | 'resolved';

export interface InboxNavProps {
  currentQueue: QueueType;
  onSelectQueue: (queue: QueueType) => void;
  currentLifecycle: string | null;
  onSelectLifecycle: (stage: string | null) => void;
  currentTeam: string | null;
  onSelectTeam: (teamId: string | null) => void;
  currentChannel: string;
  onSelectChannel: (channel: string) => void;
  counts: {
    all: number;
    mine: number;
    unassigned: number;
    ai_active: number;
    ai_escalated: number;
    resolved: number;
    lifecycle: Record<string, number>;
    teams: Record<string, number>;
  };
  teams: Array<{ id: string; name: string; color: string }>;
  currentUserId?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const LIFECYCLE_STAGES = [
  { id: 'new_lead', label: 'New Lead', icon: Sparkles, color: '#3b82f6', bg: '#eff6ff' },
  { id: 'hot_lead', label: 'Hot Lead', icon: Flame, color: '#ef4444', bg: '#fef2f2' },
  { id: 'appointment_booked', label: 'Appt Booked', icon: Calendar, color: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'payment_pending', label: 'Payment Due', icon: CreditCard, color: '#f59e0b', bg: '#fffbeb' },
  { id: 'customer', label: 'Customer / Won', icon: CheckCircle2, color: '#10b981', bg: '#ecfdf5' },
];

export const InboxSidebarNav = memo(function InboxSidebarNav({
  currentQueue,
  onSelectQueue,
  currentLifecycle,
  onSelectLifecycle,
  currentTeam,
  onSelectTeam,
  currentChannel,
  onSelectChannel,
  counts,
  teams,
}: InboxNavProps) {
  const [expandLifecycle, setExpandLifecycle] = React.useState(true);
  const [expandTeams, setExpandTeams] = React.useState(true);

  return (
    <div style={{
      width: 240,
      flexShrink: 0,
      borderRight: '1px solid rgba(0,0,0,0.07)',
      background: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      userSelect: 'none',
      overflowY: 'auto',
    }}>
      {/* ── Section 1: Core Queues ──────────────────────── */}
      <div style={{ padding: '14px 10px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#9ca3af', padding: '0 8px', marginBottom: 6 }}>
          Inboxes
        </div>

        <button
          onClick={() => { onSelectQueue('all'); onSelectLifecycle(null); onSelectTeam(null); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 10px', borderRadius: 8, fontSize: 13, fontWeight: currentQueue === 'all' && !currentLifecycle && !currentTeam ? 600 : 500,
            color: currentQueue === 'all' && !currentLifecycle && !currentTeam ? '#111827' : '#4b5563',
            background: currentQueue === 'all' && !currentLifecycle && !currentTeam ? '#ffffff' : 'transparent',
            boxShadow: currentQueue === 'all' && !currentLifecycle && !currentTeam ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Inbox size={15} color={currentQueue === 'all' && !currentLifecycle && !currentTeam ? '#dc2626' : '#6b7280'} />
            <span>All Open</span>
          </div>
          {counts.all > 0 && (
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: currentQueue === 'all' && !currentLifecycle && !currentTeam ? '#fee2e2' : '#e5e7eb', color: currentQueue === 'all' && !currentLifecycle && !currentTeam ? '#dc2626' : '#4b5563' }}>
              {counts.all}
            </span>
          )}
        </button>

        <button
          onClick={() => { onSelectQueue('mine'); onSelectLifecycle(null); onSelectTeam(null); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 10px', borderRadius: 8, fontSize: 13, fontWeight: currentQueue === 'mine' ? 600 : 500,
            color: currentQueue === 'mine' ? '#111827' : '#4b5563',
            background: currentQueue === 'mine' ? '#ffffff' : 'transparent',
            boxShadow: currentQueue === 'mine' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 2, transition: 'all 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={15} color={currentQueue === 'mine' ? '#2563eb' : '#6b7280'} />
            <span>Assigned to Me</span>
          </div>
          {counts.mine > 0 && (
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: currentQueue === 'mine' ? '#dbeafe' : '#e5e7eb', color: currentQueue === 'mine' ? '#2563eb' : '#4b5563' }}>
              {counts.mine}
            </span>
          )}
        </button>

        <button
          onClick={() => { onSelectQueue('unassigned'); onSelectLifecycle(null); onSelectTeam(null); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 10px', borderRadius: 8, fontSize: 13, fontWeight: currentQueue === 'unassigned' ? 600 : 500,
            color: currentQueue === 'unassigned' ? '#111827' : '#4b5563',
            background: currentQueue === 'unassigned' ? '#ffffff' : 'transparent',
            boxShadow: currentQueue === 'unassigned' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 2, transition: 'all 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserX size={15} color={currentQueue === 'unassigned' ? '#f59e0b' : '#6b7280'} />
            <span>Unassigned</span>
          </div>
          {counts.unassigned > 0 && (
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: currentQueue === 'unassigned' ? '#fef3c7' : '#e5e7eb', color: currentQueue === 'unassigned' ? '#d97706' : '#4b5563' }}>
              {counts.unassigned}
            </span>
          )}
        </button>

        <button
          onClick={() => { onSelectQueue('ai_active'); onSelectLifecycle(null); onSelectTeam(null); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 10px', borderRadius: 8, fontSize: 13, fontWeight: currentQueue === 'ai_active' ? 600 : 500,
            color: currentQueue === 'ai_active' ? '#111827' : '#4b5563',
            background: currentQueue === 'ai_active' ? '#ffffff' : 'transparent',
            boxShadow: currentQueue === 'ai_active' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 2, transition: 'all 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={15} color={currentQueue === 'ai_active' ? '#8b5cf6' : '#6b7280'} />
            <span>AI Active</span>
          </div>
          {counts.ai_active > 0 && (
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: currentQueue === 'ai_active' ? '#f3e8ff' : '#e5e7eb', color: currentQueue === 'ai_active' ? '#8b5cf6' : '#4b5563' }}>
              {counts.ai_active}
            </span>
          )}
        </button>

        <button
          onClick={() => { onSelectQueue('ai_escalated'); onSelectLifecycle(null); onSelectTeam(null); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 10px', borderRadius: 8, fontSize: 13, fontWeight: currentQueue === 'ai_escalated' ? 600 : 500,
            color: currentQueue === 'ai_escalated' ? '#dc2626' : '#4b5563',
            background: currentQueue === 'ai_escalated' ? '#fef2f2' : 'transparent',
            boxShadow: currentQueue === 'ai_escalated' ? '0 1px 3px rgba(220,38,38,0.1)' : 'none',
            border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 2, transition: 'all 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={15} color="#dc2626" />
            <span>Needs Attention</span>
          </div>
          {counts.ai_escalated > 0 && (
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: '#fee2e2', color: '#dc2626' }}>
              {counts.ai_escalated}
            </span>
          )}
        </button>

        <button
          onClick={() => { onSelectQueue('resolved'); onSelectLifecycle(null); onSelectTeam(null); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 10px', borderRadius: 8, fontSize: 13, fontWeight: currentQueue === 'resolved' ? 600 : 500,
            color: currentQueue === 'resolved' ? '#111827' : '#6b7280',
            background: currentQueue === 'resolved' ? '#ffffff' : 'transparent',
            border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 2, transition: 'all 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Archive size={15} color="#9ca3af" />
            <span>Resolved / Closed</span>
          </div>
          {counts.resolved > 0 && (
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{counts.resolved}</span>
          )}
        </button>
      </div>

      <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 12px' }} />

      {/* ── Section 2: Lifecycle Stages ─────────────────── */}
      <div style={{ padding: '8px 10px' }}>
        <button
          onClick={() => setExpandLifecycle(!expandLifecycle)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#9ca3af',
          }}
        >
          <span>Lifecycle Journey</span>
          {expandLifecycle ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {expandLifecycle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
            {LIFECYCLE_STAGES.map(stage => {
              const Icon = stage.icon;
              const isActive = currentLifecycle === stage.id;
              const count = counts.lifecycle[stage.id] || 0;
              return (
                <button
                  key={stage.id}
                  onClick={() => { onSelectLifecycle(isActive ? null : stage.id); onSelectTeam(null); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderRadius: 8, fontSize: 12.5, fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#111827' : '#4b5563',
                    background: isActive ? '#ffffff' : 'transparent',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                    <span>{stage.label}</span>
                  </div>
                  {count > 0 && (
                    <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 12px' }} />

      {/* ── Section 3: Teams & Departments ─────────────── */}
      <div style={{ padding: '8px 10px', flex: 1 }}>
        <button
          onClick={() => setExpandTeams(!expandTeams)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#9ca3af',
          }}
        >
          <span>Team Queues</span>
          {expandTeams ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {expandTeams && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
            {teams.length === 0 ? (
              <div style={{ fontSize: 12, color: '#9ca3af', padding: '6px 8px' }}>No teams created</div>
            ) : (
              teams.map(team => {
                const isActive = currentTeam === team.id;
                const count = counts.teams[team.id] || 0;
                return (
                  <button
                    key={team.id}
                    onClick={() => { onSelectTeam(isActive ? null : team.id); onSelectLifecycle(null); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px', borderRadius: 8, fontSize: 12.5, fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#111827' : '#4b5563',
                      background: isActive ? '#ffffff' : 'transparent',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                      border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Users size={13} color={team.color || '#6b7280'} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                        {team.name}
                      </span>
                    </div>
                    {count > 0 && (
                      <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{count}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Section 4: Channel Quick Toggles ───────────── */}
      <div style={{ padding: '10px', borderTop: '1px solid rgba(0,0,0,0.07)', background: '#f3f4f6' }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#9ca3af', marginBottom: 6 }}>
          Channel Filter
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'whatsapp', label: 'WhatsApp' },
            { id: 'messenger', label: 'Messenger' },
            { id: 'instagram', label: 'Instagram' },
            { id: 'web_widget', label: 'Website' },
          ].map(ch => (
            <button
              key={ch.id}
              onClick={() => onSelectChannel(ch.id)}
              style={{
                padding: '5px 4px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                textAlign: 'center', cursor: 'pointer', border: '1px solid transparent',
                background: currentChannel === ch.id ? '#ffffff' : 'transparent',
                color: currentChannel === ch.id ? '#111827' : '#6b7280',
                boxShadow: currentChannel === ch.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
