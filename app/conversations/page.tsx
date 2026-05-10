'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Send, MessageSquare, Loader2, ChevronDown, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// ── Official brand SVG icons ────────────────────────────────────────
function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function MessengerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242C9.535 22.018 10.74 22.222 12 22.222c6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963L10.48 12.09 5.2 14.963l5.828-6.19 2.763 2.913 5.24-2.913-5.84 6.19z" />
    </svg>
  );
}

function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

// ── Platform config ─────────────────────────────────────────────────
const PLATFORM: Record<string, { label: string; color: string; bg: string; icon: (s?: number) => React.ReactNode }> = {
  whatsapp:  { label: 'WhatsApp',  color: '#25D366', bg: '#dcfce7', icon: (s) => <WhatsAppIcon size={s} />  },
  messenger: { label: 'Messenger', color: '#0084ff', bg: '#dbeafe', icon: (s) => <MessengerIcon size={s} /> },
  instagram: { label: 'Instagram', color: '#e1306c', bg: '#fce7f3', icon: (s) => <InstagramIcon size={s} /> },
};

const FILTERS = [
  { key: 'all',       label: 'All Channels' },
  { key: 'whatsapp',  label: 'WhatsApp'     },
  { key: 'messenger', label: 'Messenger'    },
  { key: 'instagram', label: 'Instagram'    },
];

function PlatformBadge({ platform }: { platform: string }) {
  const p = PLATFORM[platform] ?? { label: platform, color: '#6b7280', bg: '#f3f4f6', icon: () => null };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 9px', borderRadius: 20,
      background: p.bg, color: p.color,
      fontSize: 11, fontWeight: 600,
    }}>
      {p.icon(11)} {p.label}
    </span>
  );
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #dc2626, #ef4444)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#fff',
    }}>
      {initials}
    </div>
  );
}

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Channel Filter Dropdown ─────────────────────────────────────────
function ChannelFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = FILTERS.find(f => f.key === value)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 11px', borderRadius: 8, cursor: 'pointer',
          border: '1px solid rgba(220,38,38,0.2)',
          background: value !== 'all' ? '#fef2f2' : '#fff',
          color: value !== 'all' ? '#dc2626' : '#374151',
          fontSize: 12, fontWeight: 600,
          transition: 'all 0.15s',
        }}
      >
        {value !== 'all' && PLATFORM[value] && (
          <span style={{ color: PLATFORM[value].color }}>{PLATFORM[value].icon(12)}</span>
        )}
        {current.label}
        <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
          background: '#fff', borderRadius: 10, width: 180,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.07)',
          overflow: 'hidden',
        }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => { onChange(f.key); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 14px', background: f.key === value ? '#fef2f2' : 'transparent',
                border: 'none', cursor: 'pointer', fontSize: 13,
                color: f.key === value ? '#dc2626' : '#374151', fontWeight: f.key === value ? 600 : 400,
                textAlign: 'left', transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (f.key !== value) (e.currentTarget as HTMLElement).style.background = '#faf9f9'; }}
              onMouseLeave={e => { if (f.key !== value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {f.key !== 'all' && PLATFORM[f.key] && (
                  <span style={{ color: PLATFORM[f.key].color }}>{PLATFORM[f.key].icon(14)}</span>
                )}
                {f.label}
                {f.key === 'all' && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 2 }}>(default)</span>}
              </span>
              {f.key === value && <Check size={13} color="#dc2626" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function ConversationsPage() {
  const [convos, setConvos] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase.from('conversations').select('*').order('updated_at', { ascending: false });
      if (error) console.error('Fetch error:', error.message);
      if (data) setConvos(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  useEffect(() => {
    fetchConversations();
    const sub = supabase.channel('conversations_rt').on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchConversations).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetchMessages(selected.id);
    const sub = supabase.channel(`messages_rt_${selected.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selected.id}` },
        (payload: any) => setMessages(prev => [...prev, payload.new]))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [selected?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!reply.trim() || !selected || sending) return;
    setSending(true);
    const content = reply.trim();
    setReply('');
    await supabase.from('messages').insert([{ conversation_id: selected.id, sender_type: 'agent', content }]);
    setSending(false);
  };

  const filtered = convos.filter(c => {
    const matchSearch = !search || (c.customer_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchChannel = channelFilter === 'all' || c.platform === channelFilter;
    return matchSearch && matchChannel;
  });

  return (
    <div style={{ height: 'calc(100vh - 38px)', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px 12px', background: '#fff', borderBottom: '1px solid rgba(220,38,38,0.08)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px', margin: 0 }}>Live Conversations</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2, marginBottom: 0 }}>Real-time chat across WhatsApp, Messenger, and Instagram</p>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT: Conversation List */}
        <div style={{ width: 300, background: '#fff', borderRight: '1px solid rgba(220,38,38,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {/* Search + Filter */}
          <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid rgba(220,38,38,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                style={{ width: '100%', padding: '7px 10px 7px 28px', fontSize: 12.5, boxSizing: 'border-box', border: '1px solid rgba(220,38,38,0.12)', borderRadius: 8, background: '#faf9f9', outline: 'none', color: '#111827' }}
              />
            </div>
            <ChannelFilter value={channelFilter} onChange={setChannelFilter} />
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                <Loader2 size={18} color="#dc2626" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                {channelFilter !== 'all' ? `No ${PLATFORM[channelFilter]?.label ?? channelFilter} conversations` : 'No conversations yet'}
              </div>
            ) : filtered.map(c => {
              const isSelected = selected?.id === c.id;
              const p = PLATFORM[c.platform];
              return (
                <div key={c.id} onClick={() => setSelected(c)} style={{
                  padding: '11px 14px', cursor: 'pointer',
                  borderBottom: '1px solid rgba(220,38,38,0.05)',
                  background: isSelected ? '#fef2f2' : 'transparent',
                  borderLeft: isSelected ? '3px solid #dc2626' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar name={c.customer_name || '?'} size={38} />
                      {/* Official platform icon dot */}
                      <span style={{
                        position: 'absolute', bottom: -1, right: -1,
                        width: 17, height: 17, borderRadius: '50%',
                        background: p?.color ?? '#6b7280',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', border: '2px solid #fff',
                      }}>
                        {p ? p.icon(9) : null}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.customer_name || c.external_conversation_id}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                        {p?.label ?? c.platform}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER: Chat Window */}
        {selected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#faf9f9', minWidth: 0 }}>
            {/* Chat header */}
            <div style={{ padding: '10px 18px', background: '#fff', borderBottom: '1px solid rgba(220,38,38,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={selected.customer_name || '?'} size={34} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{selected.customer_name || selected.external_conversation_id}</div>
                <PlatformBadge platform={selected.platform} />
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 40 }}>No messages yet</div>
              ) : messages.map((m, i) => {
                if (!m.content || m.content.trim() === '') return null;
                const isAgent = m.sender_type === 'agent' || m.sender_type === 'bot';
                return (
                  <div key={m.id ?? i} style={{ display: 'flex', justifyContent: isAgent ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '72%' }}>
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: isAgent ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                        background: isAgent ? '#dc2626' : '#fff',
                        color: isAgent ? '#fff' : '#111827',
                        fontSize: 13.5, lineHeight: 1.55,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                      }}>
                        {m.content}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 3, textAlign: isAgent ? 'right' : 'left', paddingLeft: isAgent ? 0 : 4, paddingRight: isAgent ? 4 : 0 }}>
                        {m.sender_type === 'bot' ? 'AI Assistant' : isAgent ? 'You' : selected.customer_name || 'Customer'} · {formatTime(m.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid rgba(220,38,38,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#faf9f9', borderRadius: 24, border: '1px solid rgba(220,38,38,0.12)', padding: '6px 8px 6px 16px' }}>
                <input
                  value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={`Reply via ${PLATFORM[selected.platform]?.label ?? selected.platform}…`}
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: '#111827' }}
                />
                <button onClick={handleSend} disabled={!reply.trim() || sending} style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: reply.trim() && !sending ? '#dc2626' : '#e5e7eb',
                  border: 'none', cursor: reply.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
                }}>
                  {sending ? <Loader2 size={14} color="#fff" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} color={reply.trim() ? '#fff' : '#9ca3af'} />}
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 5, paddingLeft: 4 }}>Press Enter to send · powered by Meta Cloud API</div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: '#faf9f9' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={24} color="#dc2626" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Select a conversation</div>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>Pick a chat from the list to start replying</div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
