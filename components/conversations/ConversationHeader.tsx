'use client';

import React, { memo, useState, useRef, useEffect } from 'react';
import { 
  User, Users, Bot, CheckCircle2, AlertTriangle, 
  ChevronDown, Archive, Clock, MoreVertical, 
  SidebarClose, SidebarOpen, Sparkles, Flame, 
  Calendar, CreditCard, ShieldCheck, X, Check, Globe,
  Pencil
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { LIFECYCLE_STAGES } from './InboxSidebarNav';

export interface ConversationHeaderProps {
  conversation: any;
  teamMembers: any[];
  teams: any[];
  currentUserId?: string;
  activeViewers?: Array<{ id: string; name: string }>;
  onUpdateLifecycle: (stage: string) => Promise<void>;
  onAssignMember: (userId: string | null) => Promise<void>;
  onAssignTeam: (teamId: string | null) => Promise<void>;
  onToggleBot: (enabled: boolean) => Promise<void>;
  onResolveConversation: () => Promise<void>;
  onToggle360Sidebar: () => void;
  is360SidebarOpen: boolean;
  isTenantAiPaused?: boolean;
}

export const ConversationHeader = memo(function ConversationHeader({
  conversation,
  teamMembers,
  teams,
  currentUserId,
  activeViewers = [],
  onUpdateLifecycle,
  onAssignMember,
  onAssignTeam,
  onToggleBot,
  onResolveConversation,
  onToggle360Sidebar,
  is360SidebarOpen,
  isTenantAiPaused = false,
}: ConversationHeaderProps) {
  const c = conversation;
  const [showLifecycleMenu, setShowLifecycleMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Editable customer name
  const [displayName, setDisplayName] = useState(c.customer_name || 'Website Visitor');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(c.customer_name || '');

  useEffect(() => {
    setDisplayName(c.customer_name || 'Website Visitor');
    setNameInput(c.customer_name || '');
  }, [c.customer_name]);

  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      setIsEditingName(false);
      return;
    }
    const newName = nameInput.trim();
    setDisplayName(newName);
    c.customer_name = newName;
    setIsEditingName(false);
    try {
      await supabase.from('conversations').update({ customer_name: newName }).eq('id', c.id);
    } catch (err) {
      console.error('Failed to update name:', err);
    }
  };

  const lifecycleRef = useRef<HTMLDivElement>(null);
  const assignRef = useRef<HTMLDivElement>(null);

  const currentStage = LIFECYCLE_STAGES.find(s => s.id === c.lifecycle_stage) || LIFECYCLE_STAGES[0];
  const assignedMember = teamMembers.find(m => m.id === c.assigned_to);
  const assignedTeam = teams.find(t => t.id === c.team_id);
  const isBotActive = c.bot_enabled !== false && !c.assigned_to;

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (lifecycleRef.current && !lifecycleRef.current.contains(e.target as Node)) setShowLifecycleMenu(false);
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) setShowAssignMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleStageChange = async (stageId: string) => {
    setUpdating(true);
    setShowLifecycleMenu(false);
    try {
      await onUpdateLifecycle(stageId);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignMember = async (userId: string | null) => {
    setUpdating(true);
    setShowAssignMenu(false);
    try {
      await onAssignMember(userId);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignTeam = async (teamId: string | null) => {
    setUpdating(true);
    setShowAssignMenu(false);
    try {
      await onAssignTeam(teamId);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{
      borderBottom: '1px solid rgba(0,0,0,0.08)',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* ── Main Top Bar ───────────────────────────────── */}
      <div style={{
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        {/* Left: Customer Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700,
          }}>
            {(displayName || 'Visitor').slice(0, 2).toUpperCase()}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isEditingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    autoFocus
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#111827',
                      padding: '2px 8px',
                      borderRadius: 6,
                      border: '1.5px solid #dc2626',
                      outline: 'none',
                      background: '#fff',
                      width: 170,
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    title="Save name"
                    style={{
                      background: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Check size={13} strokeWidth={3} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    title="Cancel"
                    style={{
                      background: '#f3f4f6',
                      color: '#6b7280',
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => setIsEditingName(true)}
                  title="Click to edit contact name"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    borderRadius: 6,
                    padding: '2px 4px',
                    marginLeft: -4,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </span>
                  <Pencil size={12} color="#9ca3af" />
                </div>
              )}

              {/* Lifecycle Stage Switcher Pill */}
              <div ref={lifecycleRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowLifecycleMenu(!showLifecycleMenu)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 9px', borderRadius: 16,
                    background: currentStage.bg, color: currentStage.color,
                    border: `1px solid ${currentStage.color}33`,
                    fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: currentStage.color }} />
                  <span>{currentStage.label}</span>
                  <ChevronDown size={12} />
                </button>

                {/* Dropdown Menu */}
                {showLifecycleMenu && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: 4,
                    background: '#ffffff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.12)', zIndex: 50,
                    width: 180, overflow: 'hidden', padding: 4,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', padding: '4px 8px' }}>
                      Update Lifecycle Stage
                    </div>
                    {LIFECYCLE_STAGES.map(stage => {
                      const Icon = stage.icon;
                      const isSelected = stage.id === c.lifecycle_stage;
                      return (
                        <button
                          key={stage.id}
                          onClick={() => handleStageChange(stage.id)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '7px 8px', borderRadius: 6, fontSize: 12.5, fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? stage.color : '#374151',
                            background: isSelected ? stage.bg : 'transparent',
                            border: 'none', cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Icon size={13} color={stage.color} />
                            <span>{stage.label}</span>
                          </div>
                          {isSelected && <Check size={13} color={stage.color} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: 12, color: '#6b7280' }}>
              <span style={{ fontWeight: 600, color: c.platform === 'whatsapp' ? '#16a34a' : c.platform === 'instagram' ? '#db2777' : '#4f46e5' }}>
                {c.platform === 'web_widget' ? 'Website Chat' : c.platform?.toUpperCase()}
              </span>
              <span>•</span>
              <span>{c.customer_phone || c.external_conversation_id || 'ID: ' + c.id?.slice(0, 8)}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions & Assignment Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Assignee & Team Selector */}
          <div ref={assignRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAssignMenu(!showAssignMenu)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                background: assignedMember ? '#eff6ff' : '#f3f4f6',
                border: assignedMember ? '1px solid #bfdbfe' : '1px solid rgba(0,0,0,0.08)',
                color: assignedMember ? '#1d4ed8' : '#374151',
                fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <User size={13} />
              <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {assignedMember ? assignedMember.full_name : assignedTeam ? `Team: ${assignedTeam.name}` : 'Unassigned'}
              </span>
              <ChevronDown size={13} />
            </button>

            {/* Assign Menu Dropdown */}
            {showAssignMenu && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4,
                background: '#ffffff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.12)', zIndex: 50,
                width: 220, overflow: 'hidden', padding: 4,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', padding: '4px 8px' }}>
                  Assign Team Member
                </div>

                {/* Self Assign */}
                {currentUserId && (
                  <button
                    onClick={() => handleAssignMember(currentUserId)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 8px', borderRadius: 6, fontSize: 12.5, fontWeight: 600,
                      color: '#2563eb', background: '#eff6ff', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <User size={13} />
                    <span>Assign to Myself</span>
                  </button>
                )}

                {/* All Members */}
                {teamMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleAssignMember(member.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 8px', borderRadius: 6, fontSize: 12.5,
                      color: member.id === c.assigned_to ? '#2563eb' : '#374151',
                      background: member.id === c.assigned_to ? '#f0fdf4' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span>{member.full_name}</span>
                    {member.id === c.assigned_to && <Check size={13} color="#2563eb" />}
                  </button>
                ))}

                <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

                <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', padding: '4px 8px' }}>
                  Assign to Department Team
                </div>
                {teams.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleAssignTeam(t.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 8px', borderRadius: 6, fontSize: 12.5,
                      color: t.id === c.team_id ? '#dc2626' : '#374151',
                      background: t.id === c.team_id ? '#fef2f2' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={13} color={t.color || '#6b7280'} />
                      <span>{t.name}</span>
                    </div>
                    {t.id === c.team_id && <Check size={13} color="#dc2626" />}
                  </button>
                ))}

                <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

                {/* Unassign / Reset */}
                <button
                  onClick={() => { handleAssignMember(null); handleAssignTeam(null); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 8px', borderRadius: 6, fontSize: 12,
                    color: '#6b7280', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <X size={13} />
                  <span>Clear Assignment (Return to Bot)</span>
                </button>
              </div>
            )}
          </div>

          {/* AI Bot Toggle / Takeover */}
          <button
            onClick={() => {
              if (isTenantAiPaused) {
                alert('AI Engine is paused for this workspace by Super Admin. Individual conversations cannot be switched to AI mode.');
                return;
              }
              onToggleBot(!isBotActive);
            }}
            disabled={isTenantAiPaused}
            title={
              isTenantAiPaused
                ? "AI Engine is paused for this workspace by Super Admin"
                : isBotActive
                ? "AI Bot is actively answering. Click to pause."
                : "AI Bot is paused. Click to resume."
            }
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 10px', borderRadius: 8,
              background: isTenantAiPaused ? '#fef3c7' : isBotActive ? '#f3e8ff' : '#f3f4f6',
              border: isTenantAiPaused ? '1px solid #fde68a' : isBotActive ? '1px solid #d8b4fe' : '1px solid rgba(0,0,0,0.08)',
              color: isTenantAiPaused ? '#b45309' : isBotActive ? '#7e22ce' : '#6b7280',
              fontSize: 12, fontWeight: 700,
              cursor: isTenantAiPaused ? 'not-allowed' : 'pointer',
              opacity: isTenantAiPaused ? 0.85 : 1,
            }}
          >
            <Bot size={13} />
            <span>{isTenantAiPaused ? 'AI Locked (Admin)' : isBotActive ? 'AI Active' : 'AI Paused'}</span>
          </button>

          {/* Resolve / Close Button */}
          <button
            onClick={onResolveConversation}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 8,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <CheckCircle2 size={13} />
            <span>Resolve</span>
          </button>

          {/* Customer 360 Drawer Toggle */}
          <button
            onClick={onToggle360Sidebar}
            title={is360SidebarOpen ? "Close Customer 360 Sidebar" : "Open Customer 360 Sidebar"}
            style={{
              padding: '7px', borderRadius: 8,
              background: is360SidebarOpen ? '#eff6ff' : '#f3f4f6',
              border: is360SidebarOpen ? '1px solid #bfdbfe' : '1px solid rgba(0,0,0,0.08)',
              color: is360SidebarOpen ? '#2563eb' : '#4b5563',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {is360SidebarOpen ? <SidebarClose size={16} /> : <SidebarOpen size={16} />}
          </button>
        </div>
      </div>

      {/* ── Active Agent Presence Banner (Collision Detection) ─ */}
      {activeViewers.length > 0 && (
        <div style={{
          padding: '4px 18px',
          background: '#eff6ff',
          borderTop: '1px solid #dbeafe',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11.5,
          color: '#1e40af',
          fontWeight: 600,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
          <span>
            {activeViewers.map(v => v.name).join(', ')} {activeViewers.length === 1 ? 'is' : 'are'} currently viewing this chat
          </span>
        </div>
      )}
    </div>
  );
});
