'use client';

import React, { memo, useState, useRef, useEffect } from 'react';
import { 
  Send, Lock, MessageSquare, Sparkles, Paperclip, 
  Smile, Zap, Bot, Languages, FileText, Check, 
  X, Loader2, Wand2
} from 'lucide-react';

export interface CollaborativeComposerProps {
  onSendMessage: (text: string, isInternalNote: boolean) => Promise<void>;
  onSendMedia?: (file: File) => Promise<void>;
  cannedSnippets: Array<{ id: string; shortcut: string; title: string; content: string; category: string }>;
  teamMembers: Array<{ id: string; full_name: string; email: string }>;
  conversation: any;
  businessName?: string;
  tenantId?: string;
  sending: boolean;
}

const DEFAULT_SNIPPETS = [
  { id: 'def_hello', shortcut: 'hello', title: 'Warm Welcome', content: 'Hello $customer.name! 👋 Thank you for reaching out to $business.name. How may I assist you today?', category: 'Greetings' },
  { id: 'def_order', shortcut: 'order', title: 'Order Status Check', content: 'Could you please provide your 4-digit Order ID so I can quickly check the real-time shipping status for you?', category: 'Orders' },
  { id: 'def_hours', shortcut: 'hours', title: 'Business Hours', content: 'Our official operating hours are Monday to Saturday, 9:00 AM – 8:00 PM. Messages received after hours will be answered first thing in the morning!', category: 'General' },
  { id: 'def_agent', shortcut: 'agent', title: 'Agent Introduction', content: 'My name is $agent.name. I will be handling your inquiry today. Please let me know the details so I can assist you directly.', category: 'Support' },
  { id: 'def_transfer', shortcut: 'transfer', title: 'Team Transfer', content: 'I am transferring your conversation to our specialized $team.name who can best assist you with this. Please stay connected!', category: 'Support' },
  { id: 'def_discount', shortcut: 'discount', title: 'Special Discount', content: 'We are delighted to offer you a 10% exclusive discount today! Use promo code SAVE10 at checkout.', category: 'Sales' },
  { id: 'def_close', shortcut: 'close', title: 'Resolve & Close', content: 'Thank you for contacting $business.name! Please let us know if you need anything else. Have a wonderful day!', category: 'Greetings' },
];

export const CollaborativeComposer = memo(function CollaborativeComposer({
  onSendMessage,
  onSendMedia,
  cannedSnippets = [],
  teamMembers = [],
  conversation,
  businessName = 'Ittisalo',
  sending,
}: CollaborativeComposerProps) {
  const [mode, setMode] = useState<'public' | 'note'>('public');
  const [text, setText] = useState('');
  const [showSnippets, setShowSnippets] = useState(false);
  const [snippetSearch, setSnippetSearch] = useState('');
  const [selectedSnippetIndex, setSelectedSnippetIndex] = useState(0);

  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [threadSummary, setThreadSummary] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combine custom snippets with default built-in snippets
  const allSnippets = React.useMemo(() => {
    const map = new Map();
    DEFAULT_SNIPPETS.forEach(s => map.set(s.shortcut.toLowerCase(), s));
    cannedSnippets.forEach(s => map.set(s.shortcut.toLowerCase(), s));
    return Array.from(map.values());
  }, [cannedSnippets]);

  // Filter snippets based on '/'
  const filteredSnippets = allSnippets.filter(s => 
    s.shortcut.toLowerCase().includes(snippetSearch.toLowerCase()) || 
    s.title.toLowerCase().includes(snippetSearch.toLowerCase())
  );

  // Filter team members based on '@'
  const filteredMentions = teamMembers.filter(m => 
    m.full_name?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Handle typing & shortcut triggers
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Check for snippet trigger '/'
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const slashMatch = textBeforeCursor.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
    if (slashMatch) {
      setShowSnippets(true);
      setSnippetSearch(slashMatch[1]);
      setSelectedSnippetIndex(0);
    } else {
      setShowSnippets(false);
    }

    // Check for mention trigger '@' (especially in note mode)
    const atMatch = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_-]*)$/);
    if (atMatch) {
      setShowMentions(true);
      setMentionSearch(atMatch[1]);
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  // Replace placeholders in snippet content
  const formatSnippet = (content: string) => {
    return content
      .replace(/\$customer\.name/g, conversation?.customer_name || 'there')
      .replace(/\$business\.name/g, businessName)
      .replace(/\$team\.name/g, 'our team')
      .replace(/\$agent\.name/g, 'our agent');
  };

  const applySnippet = (snippet: typeof allSnippets[0]) => {
    const cursor = textareaRef.current?.selectionStart || text.length;
    const textBeforeCursor = text.slice(0, cursor);
    const textAfterCursor = text.slice(cursor);
    const newBefore = textBeforeCursor.replace(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/, (match, p1, offset, fullStr) => {
      return match.startsWith(' ') ? ' ' : '';
    });
    const formatted = formatSnippet(snippet.content);
    setText(newBefore + formatted + ' ' + textAfterCursor);
    setShowSnippets(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const applyMention = (member: typeof teamMembers[0]) => {
    const cursor = textareaRef.current?.selectionStart || text.length;
    const textBeforeCursor = text.slice(0, cursor);
    const textAfterCursor = text.slice(cursor);
    const newBefore = textBeforeCursor.replace(/@([a-zA-Z0-9_-]*)$/, '');
    setText(newBefore + `@${member.full_name.replace(/\s+/g, '_')} ` + textAfterCursor);
    setShowMentions(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSnippets && filteredSnippets.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSnippetIndex((prev) => (prev + 1) % filteredSnippets.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSnippetIndex((prev) => (prev - 1 + filteredSnippets.length) % filteredSnippets.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applySnippet(filteredSnippets[selectedSnippetIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSnippets(false);
        return;
      }
    }

    if (showMentions && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % filteredMentions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev - 1 + filteredMentions.length) % filteredMentions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applyMention(filteredMentions[selectedMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }

    // Ctrl+Enter or Cmd+Enter or Enter without Shift to send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const isNote = mode === 'note';
    let messageToSend = text.trim();

    // If messageToSend is a slash command like "/hello", auto-expand it
    const trimmedSlash = messageToSend.startsWith('/') ? messageToSend.slice(1).toLowerCase() : null;
    if (trimmedSlash) {
      const matchSnippet = allSnippets.find(s => s.shortcut.toLowerCase() === trimmedSlash);
      if (matchSnippet) {
        messageToSend = formatSnippet(matchSnippet.content);
      }
    }

    setText('');
    setShowSnippets(false);
    setShowMentions(false);
    await onSendMessage(messageToSend, isNote);
  };

  // ── AI Co-pilot: Polish / Refine Tone ────────────────
  const handleRefineTone = async (tone: 'professional' | 'friendly' | 'concise') => {
    if (!text.trim()) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/copilot/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          tone: tone,
          customer_name: conversation?.customer_name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.refinedText) setText(data.refinedText);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // ── AI Co-pilot: Summarize Thread ───────────────────
  const handleSummarizeThread = async () => {
    if (!conversation?.id) return;
    setIsGeneratingAi(true);
    setShowAiModal(true);
    try {
      const res = await fetch('/api/ai/copilot/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversation.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setThreadSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
      setThreadSummary('Failed to generate summary.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div style={{
      borderTop: mode === 'note' ? '2px solid #facc15' : '1px solid rgba(0,0,0,0.08)',
      background: mode === 'note' ? '#fefce8' : '#ffffff',
      padding: '12px 18px',
      position: 'relative',
      transition: 'background 0.15s ease',
    }}>
      {/* ── Snippets Autocomplete Popover ─────────────── */}
      {showSnippets && filteredSnippets.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 18, marginBottom: 8,
          background: '#ffffff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 60,
          width: 320, maxHeight: 240, overflowY: 'auto', padding: 4,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', padding: '4px 8px' }}>
            Canned Snippets (Press Tab or Enter)
          </div>
          {filteredSnippets.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => applySnippet(s)}
              style={{
                padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
                background: idx === selectedSnippetIndex ? '#eff6ff' : 'transparent',
                display: 'flex', flexDirection: 'column', gap: 2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: idx === selectedSnippetIndex ? '#2563eb' : '#111827' }}>
                  /{s.shortcut}
                </span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>{s.title}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Mentions Autocomplete Popover ─────────────── */}
      {showMentions && filteredMentions.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 18, marginBottom: 8,
          background: '#ffffff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 60,
          width: 260, maxHeight: 200, overflowY: 'auto', padding: 4,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', padding: '4px 8px' }}>
            Mention Team Member
          </div>
          {filteredMentions.map((m, idx) => (
            <div
              key={m.id}
              onClick={() => applyMention(m)}
              style={{
                padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                background: idx === selectedMentionIndex ? '#eff6ff' : 'transparent',
                fontSize: 12.5, fontWeight: 600, color: '#111827',
              }}
            >
              @{m.full_name}
            </div>
          ))}
        </div>
      )}

      {/* ── Top Bar: Dual Mode Tabs & AI Co-pilot Tools ─ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        {/* Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#e5e7eb', padding: 2, borderRadius: 8 }}>
          <button
            onClick={() => setMode('public')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              background: mode === 'public' ? '#ffffff' : 'transparent',
              color: mode === 'public' ? '#111827' : '#6b7280',
              boxShadow: mode === 'public' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              border: 'none', cursor: 'pointer',
            }}
          >
            <MessageSquare size={13} />
            <span>Public Reply</span>
          </button>

          <button
            onClick={() => setMode('note')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              background: mode === 'note' ? '#fef08a' : 'transparent',
              color: mode === 'note' ? '#854d0e' : '#6b7280',
              boxShadow: mode === 'note' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              border: 'none', cursor: 'pointer',
            }}
          >
            <Lock size={13} />
            <span>Internal Note</span>
          </button>
        </div>

        {/* AI Co-Pilot Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={handleSummarizeThread}
            title="Summarize entire conversation with AI"
            disabled={isGeneratingAi}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 600,
              background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff',
              cursor: 'pointer',
            }}
          >
            {isGeneratingAi ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            <span>Summarize</span>
          </button>

          {text.trim() && (
            <button
              onClick={() => handleRefineTone('professional')}
              title="Refine draft with AI"
              disabled={isGeneratingAi}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                cursor: 'pointer',
              }}
            >
              <Wand2 size={12} />
              <span>Refine Tone</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Textarea Input ─────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === 'note'
              ? 'Type an internal team note... (Use @ to mention teammates)'
              : 'Type a message... (Type / for canned snippets, $ for dynamic variables)'
          }
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 13.5,
            lineHeight: 1.5,
            border: mode === 'note' ? '1.5px solid #fde047' : '1px solid rgba(0,0,0,0.12)',
            borderRadius: 10,
            background: mode === 'note' ? '#ffffff' : '#fafafa',
            color: '#111827',
            outline: 'none',
            resize: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── Bottom Action Row ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Attachment Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0] && onSendMedia) onSendMedia(e.target.files[0]);
            }}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach Image or Document"
            style={{
              padding: '6px', borderRadius: 6, background: 'transparent',
              border: 'none', color: '#6b7280', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Paperclip size={16} />
          </button>

          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            {mode === 'note' ? '🔒 Private Note' : '💬 Public Customer Message'} • Press Enter to send
          </span>
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: mode === 'note' ? '#ca8a04' : '#dc2626',
            color: '#ffffff', border: 'none',
            cursor: !text.trim() || sending ? 'not-allowed' : 'pointer',
            opacity: !text.trim() || sending ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          <span>{mode === 'note' ? 'Save Note' : 'Send'}</span>
        </button>
      </div>

      {/* ── AI Thread Summary Modal ────────────────────── */}
      {showAiModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 14, width: '100%', maxWidth: 520,
            padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="#7e22ce" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                  AI Conversation Summary
                </h3>
              </div>
              <button
                onClick={() => { setShowAiModal(false); setThreadSummary(null); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: '#f9fafb', padding: 16, borderRadius: 10,
              fontSize: 13.5, color: '#374151', lineHeight: 1.6, minHeight: 100,
            }}>
              {isGeneratingAi ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Analyzing conversation and synthesizing key points...</span>
                </div>
              ) : (
                threadSummary || 'No summary available.'
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                onClick={() => { setShowAiModal(false); setThreadSummary(null); }}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: '#111827', color: '#ffffff', border: 'none', cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
