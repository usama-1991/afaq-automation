'use client';

import React, { memo } from 'react';
import { Lock, User } from 'lucide-react';

export interface InternalNoteBubbleProps {
  note: {
    id: string;
    content: string;
    created_at: string;
    metadata?: {
      author_name?: string;
      author_id?: string;
      mentions?: string[];
    };
  };
  currentUserId?: string;
}

function formatNoteTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function renderNoteContentWithMentions(content: string) {
  if (!content) return null;
  // Match @words or @"Full Names"
  const parts = content.split(/(@[a-zA-Z0-9_.-]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span
          key={index}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '1px 6px',
            margin: '0 2px',
            borderRadius: 4,
            background: 'rgba(37, 99, 235, 0.15)',
            color: '#1d4ed8',
            fontWeight: 700,
            fontSize: 12.5,
          }}
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export const InternalNoteBubble = memo(function InternalNoteBubble({ note }: InternalNoteBubbleProps) {
  const authorName = note.metadata?.author_name || 'Team Member';

  return (
    <div style={{
      margin: '12px auto',
      width: '92%',
      maxWidth: 620,
      background: '#fefce8',
      border: '1.5px solid #fef08a',
      borderRadius: 12,
      padding: '12px 16px',
      boxShadow: '0 1px 4px rgba(234, 179, 8, 0.08)',
      position: 'relative',
    }}>
      {/* Header with lock icon, author, and timestamp */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '2px 7px', borderRadius: 4,
            background: '#fef08a', color: '#854d0e',
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4
          }}>
            <Lock size={11} />
            <span>Internal Note</span>
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#713f12' }}>
            {authorName}
          </span>
        </div>

        <span style={{ fontSize: 11, color: '#a16207' }}>
          {formatNoteTime(note.created_at)}
        </span>
      </div>

      {/* Note Body */}
      <div style={{
        fontSize: 13.5,
        color: '#422006',
        lineHeight: 1.5,
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap'
      }}>
        {renderNoteContentWithMentions(note.content)}
      </div>

      <div style={{ marginTop: 6, fontSize: 10.5, color: '#a16207', fontStyle: 'italic' }}>
        🔒 Visible only to internal team members • Never sent to customer
      </div>
    </div>
  );
});
