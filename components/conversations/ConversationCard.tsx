'use client';

import React, { memo } from 'react';
import { Bot, User, Globe, AlertCircle, Clock } from 'lucide-react';
import { LIFECYCLE_STAGES } from './InboxSidebarNav';

export interface ConversationCardProps {
  conversation: any;
  isSelected: boolean;
  onSelect: () => void;
  teamMembers: any[];
  currentUserId?: string;
}

function formatRelativeTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getSlaStatus(lastMessageAt: string, unreadCount: number) {
  if (!unreadCount || !lastMessageAt) return null;
  const diffMinutes = (Date.now() - new Date(lastMessageAt).getTime()) / 60000;
  if (diffMinutes > 60) return { label: `${Math.floor(diffMinutes / 60)}h waiting`, color: '#dc2626', bg: '#fee2e2' }; // Red: Over 1h
  if (diffMinutes > 15) return { label: `${Math.floor(diffMinutes)}m waiting`, color: '#d97706', bg: '#fef3c7' }; // Amber: Over 15m
  return { label: `${Math.floor(diffMinutes)}m ago`, color: '#2563eb', bg: '#eff6ff' }; // Blue: Normal
}

export const ConversationCard = memo(function ConversationCard({
  conversation,
  isSelected,
  onSelect,
  teamMembers,
  currentUserId
}: ConversationCardProps) {
  const c = conversation;
  const isUnread = (c.unread_count || 0) > 0;
  const stage = LIFECYCLE_STAGES.find(s => s.id === c.lifecycle_stage) || LIFECYCLE_STAGES[0];
  const assignedUser = teamMembers.find(m => m.id === c.assigned_to);
  const isAssignedToMe = currentUserId && c.assigned_to === currentUserId;
  const sla = getSlaStatus(c.last_message_at || c.updated_at, c.unread_count);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'whatsapp':
        return <span style={{ color: '#16a34a', fontSize: 11, fontWeight: 700 }}>WhatsApp</span>;
      case 'instagram':
        return <span style={{ color: '#db2777', fontSize: 11, fontWeight: 700 }}>Instagram</span>;
      case 'messenger':
        return <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700 }}>Messenger</span>;
      case 'web_widget':
        return <span style={{ color: '#4f46e5', fontSize: 11, fontWeight: 700 }}>Website</span>;
      default:
        return <span style={{ color: '#6b7280', fontSize: 11, fontWeight: 700 }}>{platform}</span>;
    }
  };

  const initials = (c.customer_name || 'Visitor')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '12px 14px',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        background: isSelected ? '#fef2f2' : isUnread ? '#ffffff' : '#fafafa',
        borderLeft: isSelected ? '3.5px solid #dc2626' : isUnread ? '3.5px solid #3b82f6' : '3.5px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        position: 'relative',
      }}
    >
      {/* Top row: Customer Name & Relative Time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: isSelected ? 'linear-gradient(135deg, #dc2626, #ef4444)' : '#e5e7eb',
            color: isSelected ? '#ffffff' : '#374151',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
          }}>
            {initials}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 13.5, fontWeight: isUnread ? 700 : 600,
              color: '#111827',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 140
            }}>
              {c.customer_name || c.customer_phone || 'Website Visitor'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              {getPlatformIcon(c.platform)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <span style={{ fontSize: 11, color: isUnread ? '#2563eb' : '#9ca3af', fontWeight: isUnread ? 700 : 500 }}>
            {formatRelativeTime(c.updated_at || c.last_message_at)}
          </span>
          {isUnread && (
            <span style={{
              background: '#dc2626', color: '#ffffff',
              fontSize: 10.5, fontWeight: 700,
              padding: '1px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center'
            }}>
              {c.unread_count}
            </span>
          )}
        </div>
      </div>

      {/* Middle row: Last message preview */}
      <div style={{
        fontSize: 12.5,
        color: isUnread ? '#1f2937' : '#6b7280',
        fontWeight: isUnread ? 600 : 400,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        marginBottom: 8, paddingLeft: 40
      }}>
        {c.last_message_preview || 'No messages yet'}
      </div>

      {/* Bottom row: Lifecycle stage pill + Assignee / AI indicator + SLA badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 40 }}>
        {/* Lifecycle pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 7px', borderRadius: 6,
          background: stage.bg, color: stage.color,
          fontSize: 11, fontWeight: 600,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: stage.color }} />
          <span>{stage.label}</span>
        </div>

        {/* Assignee / Bot status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {sla && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
              background: sla.bg, color: sla.color
            }}>
              {sla.label}
            </span>
          )}

          {c.assigned_to ? (
            <div title={`Assigned to ${assignedUser?.full_name || 'Team member'}`} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '2px 6px', borderRadius: 12,
              background: isAssignedToMe ? '#dbeafe' : '#f3f4f6',
              color: isAssignedToMe ? '#1e40af' : '#4b5563',
              fontSize: 10.5, fontWeight: 600
            }}>
              <User size={11} />
              <span style={{ maxWidth: 65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isAssignedToMe ? 'You' : assignedUser?.full_name?.split(' ')[0] || 'Agent'}
              </span>
            </div>
          ) : c.bot_enabled !== false ? (
            <div title="AI Bot responding automatically" style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 6px', borderRadius: 12,
              background: '#f3e8ff', color: '#7e22ce',
              fontSize: 10.5, fontWeight: 600
            }}>
              <Bot size={11} />
              <span>AI</span>
            </div>
          ) : (
            <span style={{ fontSize: 10.5, color: '#9ca3af' }}>Unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
});
