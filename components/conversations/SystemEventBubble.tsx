'use client';

import React, { memo } from 'react';
import { 
  Sparkles, Flame, Calendar, CreditCard, CheckCircle2, 
  UserCheck, Bot, Clock, AlertCircle, ArrowRightLeft, 
  Archive, ShoppingBag
} from 'lucide-react';

export interface SystemEventProps {
  event: {
    id: string;
    content: string;
    created_at: string;
    metadata?: {
      event_type?: string;
      actor_name?: string;
      old_value?: string;
      new_value?: string;
    };
  };
}

function getEventIcon(eventType?: string, content?: string) {
  const text = (content || '').toLowerCase();
  if (text.includes('lifecycle') || text.includes('stage') || text.includes('lead')) return <Sparkles size={12} color="#3b82f6" />;
  if (text.includes('order')) return <ShoppingBag size={12} color="#10b981" />;
  if (text.includes('appointment') || text.includes('booking')) return <Calendar size={12} color="#8b5cf6" />;
  if (text.includes('assign') || text.includes('transfer')) return <UserCheck size={12} color="#f59e0b" />;
  if (text.includes('bot') || text.includes('ai')) return <Bot size={12} color="#7e22ce" />;
  if (text.includes('resolved') || text.includes('closed')) return <Archive size={12} color="#6b7280" />;
  return <CheckCircle2 size={12} color="#6b7280" />;
}

export const SystemEventBubble = memo(function SystemEventBubble({ event }: SystemEventProps) {
  const icon = getEventIcon(event.metadata?.event_type, event.content);
  const time = event.created_at ? new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '10px 0',
      width: '100%',
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 20,
        background: '#f3f4f6',
        border: '1px solid rgba(0,0,0,0.06)',
        color: '#4b5563',
        fontSize: 12,
        fontWeight: 500,
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      }}>
        {icon}
        <span>{event.content}</span>
        {time && <span style={{ color: '#9ca3af', fontSize: 10.5, marginLeft: 2 }}>{time}</span>}
      </div>
    </div>
  );
});
