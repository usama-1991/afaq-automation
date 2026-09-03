'use client';

import { Suspense, useState, useEffect, useRef, memo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Send, MessageSquare, Loader2, ChevronDown, Check, Paperclip, FileText, Image as ImageIcon, File, Eye, ArrowLeft, UserCheck, Bot, CheckCircle2, AlertTriangle, UserPlus, X as XIcon, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useNiche } from '@/context/NicheContext';

// ── Official brand SVG icons ────────────────────────────────────────
const WhatsAppIcon = memo(function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
});

const MessengerIcon = memo(function MessengerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242C9.535 22.018 10.74 22.222 12 22.222c6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963L10.48 12.09 5.2 14.963l5.828-6.19 2.763 2.913 5.24-2.913-5.84 6.19z" />
    </svg>
  );
});

const InstagramIcon = memo(function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
});

// ── Platform config ─────────────────────────────────────────────────
const PLATFORM: Record<string, { label: string; color: string; bg: string; icon: (s?: number) => React.ReactNode }> = {
  whatsapp:   { label: 'WhatsApp',     color: '#25D366', bg: '#dcfce7', icon: (s) => <WhatsAppIcon size={s} />  },
  messenger:  { label: 'Messenger',    color: '#0084ff', bg: '#dbeafe', icon: (s) => <MessengerIcon size={s} /> },
  instagram:  { label: 'Instagram',    color: '#e1306c', bg: '#fce7f3', icon: (s) => <InstagramIcon size={s} /> },
  web_widget: { label: 'Website Chat', color: '#4f46e5', bg: '#e0e7ff', icon: (s) => <Globe size={s || 14} /> },
};

const FILTERS = [
  { key: 'all',        label: 'All Channels' },
  { key: 'whatsapp',   label: 'WhatsApp'     },
  { key: 'messenger',  label: 'Messenger'    },
  { key: 'instagram',  label: 'Instagram'    },
  { key: 'web_widget', label: 'Website'      },
];

const PlatformBadge = memo(function PlatformBadge({ platform }: { platform: string }) {
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
});

const Avatar = memo(function Avatar({ name, size = 36 }: { name: string; size?: number }) {
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
});

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function renderMarkdown(content: string) {
  if (!content) return null;
  // 1. Escape HTML to prevent XSS
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // 2. Parse Explicit Markdown Media & Links FIRST
  html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g, '<div style="margin: 8px 0;"><img src="$2" alt="$1" style="max-width: 100%; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1);" /></div>');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">$1</a>');

  // 3. Auto-link raw URLs safely without matching inside already created HTML tags
  let parts = html.split(/(<[^>]+>)/g);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('<') && parts[i].endsWith('>')) continue;
    
    parts[i] = parts[i].replace(/(https?:\/\/[^\s"'<>]+)/gi, (url) => {
      const trailingPunc = url.match(/[.,;!?)]+$/);
      let cleanUrl = url;
      let suffix = '';
      if (trailingPunc) {
        cleanUrl = url.slice(0, -trailingPunc[0].length);
        suffix = trailingPunc[0];
      }
      
      const isImage = /\.(jpeg|jpg|gif|png|webp|bmp)(?:\?.*)?$/i.test(cleanUrl);
      if (isImage) {
        return `<div style="margin: 8px 0;"><img src="${cleanUrl}" alt="Attached Image" style="max-width: 100%; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1);" /></div>` + suffix;
      } else {
        return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${cleanUrl}</a>` + suffix;
      }
    });
  }
  html = parts.join('');

  // 4. Parse text formatting (*bold*, _italic_, ~strike~) ONLY outside of HTML tags to prevent URL mangling
  parts = html.split(/(<[^>]+>)/g);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('<') && parts[i].endsWith('>')) continue;
    
    let text = parts[i];
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
    text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
    text = text.replace(/~([^~]+)~/g, '<del>$1</del>');
    parts[i] = text;
  }
  html = parts.join('');
  
  return <div dangerouslySetInnerHTML={{ __html: html }} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} />;
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

import { createMemoryState } from '@/lib/useMemoryState';

// ── In-Memory Cache for SPA Transitions ───────────────────────
const useMemoryState = createMemoryState();

// ── Main Page ──────────────────────────────────────────────────────
function ConversationsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [convos, setConversations] = useMemoryState<any[]>('convos', []);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [selected, setSelectedState] = useMemoryState<any>('selected', null);
  const setSelected = async (c: any) => {
    setSelectedState(c);
    if (isMobile) setMobileView('chat');
    if (c && c.unread_count > 0) {
      // Reset unread count in DB
      await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', c.id);
      
      // Update local state immediately
      setConversations(prev => prev.map(conv => 
        conv.id === c.id ? { ...conv, unread_count: 0 } : conv
      ));
    }
  };
  const [messages, setMessages] = useMemoryState<any[]>('messages', []);
  const [reply, setReply] = useState('');
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useMemoryState('loading', true);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [activeQuickCategory, setActiveQuickCategory] = useState(0);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const assignRef = useRef<HTMLDivElement>(null);
  const { niche } = useNiche();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase.from('conversations').select('*').order('updated_at', { ascending: false });
      if (error) console.error('Fetch error:', error.message);
      if (data) setConversations(data);
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

  // Fetch team members (all users in the tenant)
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
        if (!profile?.tenant_id) return;
        const { data: members } = await supabase
          .from('users')
          .select('id, full_name, email, role')
          .eq('tenant_id', profile.tenant_id)
          .order('full_name');
        if (members) setTeamMembers(members);
      } catch (e) { console.error('Error fetching team:', e); }
    };
    fetchTeam();
  }, []);

  // Close assign dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) {
        setShowAssignDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-select conversation from URL param (deep-link from Contacts page)
  useEffect(() => {
    const targetId = searchParams.get('conversation');
    if (targetId && convos.length > 0) {
      const match = convos.find(c => c.id === targetId);
      if (match) {
        setSelected(match);
        // Clean the URL without reloading
        router.replace('/conversations', { scroll: false });
      }
    }
  }, [searchParams, convos]);

  useEffect(() => {
    if (!selected) return;
    fetchMessages(selected.id);
    const sub = supabase.channel(`messages_rt_${selected.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selected.id}` },
        (payload: any) => setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        }))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [selected?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!reply.trim() || !selected || sending) return;
    setSending(true);
    const content = reply.trim();
    setReply('');
    
    // 1. Optimistic Message Insertion (instant UI rendering)
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      tenant_id: selected.tenant_id,
      conversation_id: selected.id,
      sender_type: 'agent',
      content,
      created_at: new Date().toISOString(),
      status: 'sending'
    };
    setMessages(prev => [...prev, optimisticMsg]);
    
    // 2. Auto take-over: If AI is active (unassigned), assign to current human agent so AI pauses
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!selected.assigned_to && user?.id) {
        await supabase.from('conversations').update({
          status: 'open',
          assigned_to: user.id,
          assigned_at: new Date().toISOString(),
        }).eq('id', selected.id);
        setSelectedState((prev: any) => prev ? { ...prev, status: 'open', assigned_to: user.id } : prev);
        setConversations((prev: any[]) => prev.map((c: any) => c.id === selected.id ? { ...c, status: 'open', assigned_to: user.id } : c));
      }
    } catch (e) {
      console.error('Auto take-over error:', e);
    }

    // 3. Background DB Insert & API Dispatch
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        tenant_id: selected.tenant_id,
        conversation_id: selected.id,
        sender_type: 'agent',
        content
      }])
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save agent message:', error.message);
      // Revert optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert(`Failed to send message: ${error.message}`);
    } else if (data?.id) {
      // Reconcile optimistic ID with real database ID
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id, status: 'sent' } : m));

      // Update conversation preview and timestamp
      await supabase.from('conversations').update({
        last_message_at: new Date().toISOString(),
        last_message_preview: content.slice(0, 100),
        updated_at: new Date().toISOString()
      }).eq('id', selected.id);

      // Trigger direct dispatch via secure API route proxy
      fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: data.id })
      })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error('Direct dispatch proxy failed:', errData.error || res.statusText);
        } else {
          console.log('Direct dispatch proxy succeeded:', await res.json().catch(() => ({})));
        }
      })
      .catch(err => console.error('Failed to trigger direct dispatch proxy:', err));
    }

    setSending(false);
  };

  // ── Handoff actions ──────────────────────────────────────────────────
  const handleAssign = async (memberId: string | null) => {
    if (!selected) return;
    setAssignLoading(true);
    setShowAssignDropdown(false);
    try {
      await supabase.from('conversations').update({
        status: memberId ? 'open' : 'open',
        assigned_to: memberId,
        assigned_at: memberId ? new Date().toISOString() : null,
      }).eq('id', selected.id);
      setSelectedState((prev: any) => prev ? { ...prev, assigned_to: memberId } : prev);
      setConversations((prev: any[]) => prev.map((c: any) => c.id === selected.id ? { ...c, assigned_to: memberId } : c));
    } catch (e) { console.error('Assign error:', e); }
    setAssignLoading(false);
  };

  const handleTakeOver = async () => {
    if (!selected) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('conversations').update({
      status: 'open',
      assigned_to: user?.id ?? null,
      assigned_at: new Date().toISOString(),
    }).eq('id', selected.id);
    setSelectedState((prev: any) => prev ? { ...prev, status: 'open', assigned_to: user?.id } : prev);
    setConversations((prev: any[]) => prev.map((c: any) => c.id === selected.id ? { ...c, status: 'open', assigned_to: user?.id } : c));
  };

  const handleHandBackToAI = async () => {
    if (!selected) return;
    await supabase.from('conversations').update({
      status: 'open',
      assigned_to: null,
      assigned_at: null,
    }).eq('id', selected.id);
    setSelectedState((prev: any) => prev ? { ...prev, status: 'open', assigned_to: null } : prev);
    setConversations((prev: any[]) => prev.map((c: any) => c.id === selected.id ? { ...c, status: 'open', assigned_to: null } : c));
  };

  const handleResolve = async () => {
    if (!selected) return;
    await supabase.from('conversations').update({
      status: 'resolved',
      assigned_to: null,
    }).eq('id', selected.id);
    setSelectedState((prev: any) => prev ? { ...prev, status: 'resolved' } : prev);
    setConversations((prev: any[]) => prev.map((c: any) => c.id === selected.id ? { ...c, status: 'resolved' } : c));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileUrl = event.target?.result as string;
      if (!fileUrl) return;

      let category: 'Images' | 'Documents' | 'Videos' | 'Audio' = 'Documents';
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
        category = 'Images';
      } else if (['mp4', 'mov', 'webm', 'avi'].includes(ext || '')) {
        category = 'Videos';
      } else if (['mp3', 'wav', 'ogg', 'aac'].includes(ext || '')) {
        category = 'Audio';
      }

      let sizeStr = '0 KB';
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb >= 1) {
        sizeStr = `${sizeMb.toFixed(1)} MB`;
      } else {
        sizeStr = `${(file.size / 1024).toFixed(0)} KB`;
      }

      const formattedContent = `[Media: ${category}] ${file.name}|${fileUrl}`;
      
      // 1. Optimistic media insertion
      const tempId = `temp_media_${Date.now()}`;
      const optimisticMediaMsg = {
        id: tempId,
        tenant_id: selected.tenant_id,
        conversation_id: selected.id,
        sender_type: 'agent',
        content: formattedContent,
        created_at: new Date().toISOString(),
        status: 'sending'
      };
      setMessages(prev => [...prev, optimisticMediaMsg]);

      // Auto take-over if AI active
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!selected.assigned_to && user?.id) {
          await supabase.from('conversations').update({
            status: 'open',
            assigned_to: user.id,
            assigned_at: new Date().toISOString(),
          }).eq('id', selected.id);
          setSelectedState((prev: any) => prev ? { ...prev, status: 'open', assigned_to: user.id } : prev);
          setConversations((prev: any[]) => prev.map((c: any) => c.id === selected.id ? { ...c, status: 'open', assigned_to: user.id } : c));
        }
      } catch (errAuto) {
        console.error('Auto take-over error on media:', errAuto);
      }

      // 2. Background DB Insert & API Dispatch
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          tenant_id: selected.tenant_id,
          conversation_id: selected.id,
          sender_type: 'agent',
          content: formattedContent
        }])
        .select('id')
        .single();

      if (error) {
        console.error('Failed to save media agent message:', error.message);
        setMessages(prev => prev.filter(m => m.id !== tempId));
        alert(`Failed to send media: ${error.message}`);
      } else if (data?.id) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id, status: 'sent' } : m));

        // Update conversation preview and timestamp
        await supabase.from('conversations').update({
          last_message_at: new Date().toISOString(),
          last_message_preview: `[Media: ${category}] ${file.name}`,
          updated_at: new Date().toISOString()
        }).eq('id', selected.id);

        // Trigger direct dispatch via secure API route proxy
        fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message_id: data.id })
        })
        .then(async res => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.error('Media direct dispatch proxy failed:', errData.error || res.statusText);
          } else {
            console.log('Media direct dispatch proxy succeeded:', await res.json().catch(() => ({})));
          }
        })
        .catch(err => console.error('Failed to trigger media direct dispatch proxy:', err));
      }

      try {
        const stored = localStorage.getItem('ittisalo_media_library');
        const library = stored ? JSON.parse(stored) : [];
        const newMedia = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          category,
          size: sizeStr,
          url: fileUrl,
          addedAt: new Date().toISOString().split('T')[0]
        };
        library.unshift(newMedia);
        localStorage.setItem('ittisalo_media_library', JSON.stringify(library));
      } catch (err) {
        console.error('Error saving to media vault:', err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const filtered = convos.filter(c => {
    const matchSearch = !search || (c.customer_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchChannel = channelFilter === 'all' || c.platform === channelFilter;
    const convStatus = c.status || 'open';
    const matchStatus = statusFilter === 'all' || convStatus === statusFilter;
    return matchSearch && matchChannel && matchStatus;
  });

  const STATUS_TABS = [
    { key: 'all',      label: 'All',      count: convos.length },
    { key: 'open',     label: 'Open',     count: convos.filter(c => (c.status || 'open') === 'open').length },
    { key: 'resolved', label: 'Resolved', count: convos.filter(c => c.status === 'resolved').length },
    { key: 'pending',  label: 'Pending',  count: convos.filter(c => c.status === 'pending').length },
  ];

  return (
    <div className="conversations-root" style={{ height: 'calc(100vh - 98px)', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 10px', background: '#fff', borderBottom: '1px solid rgba(220,38,38,0.08)' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px', margin: 0 }}>Live Conversations</h1>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2, marginBottom: 0 }}>Real-time chat across WhatsApp, Messenger, and Instagram</p>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT: Conversation List */}
        <div style={{
          width: isMobile ? '100%' : 300,
          background: '#fff',
          borderRight: isMobile ? 'none' : '1px solid rgba(220,38,38,0.08)',
          display: isMobile && mobileView === 'chat' ? 'none' : 'flex',
          flexDirection: 'column', flexShrink: 0,
        }}>
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
            {/* Status filter tabs */}
            <div style={{ display: 'flex', gap: 2, background: '#faf9f9', borderRadius: 8, padding: 3, border: '1px solid rgba(220,38,38,0.1)' }}>
              {STATUS_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  style={{
                    flex: 1, padding: '5px 4px', fontSize: 11.5, fontWeight: 600,
                    borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: statusFilter === tab.key ? '#dc2626' : 'transparent',
                    color: statusFilter === tab.key ? '#fff' : '#6b7280',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                  }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span style={{
                      fontSize: 9.5, fontWeight: 700,
                      background: statusFilter === tab.key ? 'rgba(255,255,255,0.3)' : 'rgba(220,38,38,0.1)',
                      color: statusFilter === tab.key ? '#fff' : '#dc2626',
                      borderRadius: 10, padding: '0px 5px', minWidth: 16, textAlign: 'center',
                    }}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
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
              const isPending = c.status === 'pending';
              return (
                <div key={c.id} onClick={() => setSelected(c)} style={{
                  padding: '11px 14px', cursor: 'pointer',
                  borderBottom: '1px solid rgba(220,38,38,0.05)',
                  background: isSelected ? '#fef2f2' : isPending ? '#fffbeb' : 'transparent',
                  borderLeft: isSelected ? '3px solid #dc2626' : isPending ? '3px solid #f59e0b' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar name={c.customer_name || '?'} size={38} />
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isPending ? '#92400e' : '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.customer_name || c.external_conversation_id}
                        </div>
                        {isPending && (
                          <span style={{ fontSize: 9, fontWeight: 700, background: '#f59e0b', color: '#fff', borderRadius: 8, padding: '1px 5px', whiteSpace: 'nowrap' }}>NEEDS AGENT</span>
                        )}
                        {!isPending && c.unread_count > 0 && (
                          <div style={{
                            background: '#25d366', color: '#fff',
                            minWidth: 18, height: 18, borderRadius: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 700, padding: '0 5px'
                          }}>
                            {c.unread_count}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: isPending ? '#d97706' : '#9ca3af', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {isPending ? '⚠️ Human handoff requested' : (p?.label ?? c.platform)}
                        {c.assigned_to && (() => {
                          const agent = teamMembers.find(m => m.id === c.assigned_to);
                          return agent ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '1px 6px', fontSize: 10, fontWeight: 700, border: '1px solid rgba(220,38,38,0.15)' }}>
                              <UserCheck size={9} /> {(agent.full_name || agent.email || '').split(' ')[0]}
                            </span>
                          ) : null;
                        })()}
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
          <div style={{
            flex: 1, display: isMobile && mobileView === 'list' ? 'none' : 'flex',
            flexDirection: 'column', background: '#faf9f9', minWidth: 0,
          }}>
            {/* Chat header */}
            <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid rgba(220,38,38,0.08)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {isMobile && (
                <button onClick={() => setMobileView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px 2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <ArrowLeft size={20} />
                </button>
              )}
              <Avatar name={selected.customer_name || '?'} size={34} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{selected.customer_name || selected.external_conversation_id}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <PlatformBadge platform={selected.platform} />
                  {selected.status === 'pending' && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', borderRadius: 8, padding: '1px 7px' }}>⚠️ Awaiting Human Agent</span>
                  )}
                  {selected.status === 'resolved' && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 8, padding: '1px 7px' }}>✅ Resolved</span>
                  )}
                </div>
              </div>
              {/* Handoff action buttons */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>

                {/* ── Assigned-to badge ── */}
                {selected.assigned_to && (() => {
                  const agent = teamMembers.find(m => m.id === selected.assigned_to);
                  return agent ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef2f2', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 20, padding: '4px 10px 4px 6px' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#dc2626,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                        {(agent.full_name || agent.email || '?').slice(0,2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#dc2626', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {agent.full_name || agent.email}
                      </span>
                      <button onClick={() => handleAssign(null)} title="Unassign" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', padding: 0 }}>
                        <XIcon size={12} />
                      </button>
                    </div>
                  ) : null;
                })()}

                {/* ── Assign dropdown ── */}
                {selected.status !== 'resolved' && (
                  <div ref={assignRef} style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowAssignDropdown(o => !o)}
                      disabled={assignLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 12px', borderRadius: 8,
                        border: '1px solid rgba(220,38,38,0.2)', cursor: 'pointer',
                        background: showAssignDropdown ? '#fef2f2' : '#fff',
                        color: '#dc2626', fontSize: 12, fontWeight: 700,
                        transition: 'all 0.15s',
                      }}
                    >
                      {assignLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={12} />}
                      Assign
                      <ChevronDown size={11} style={{ transform: showAssignDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>

                    {showAssignDropdown && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 300,
                        background: '#fff', borderRadius: 12, width: 220,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.13)', border: '1px solid rgba(220,38,38,0.1)',
                        overflow: 'hidden',
                      }}>
                        <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assign to Team Member</div>
                        </div>
                        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                          {teamMembers.length === 0 ? (
                            <div style={{ padding: '12px 14px', fontSize: 12.5, color: '#9ca3af' }}>No team members found.</div>
                          ) : teamMembers.map(member => {
                            const isAssigned = selected.assigned_to === member.id;
                            const initials = (member.full_name || member.email || '?').slice(0, 2).toUpperCase();
                            return (
                              <button
                                key={member.id}
                                onClick={() => handleAssign(member.id)}
                                style={{
                                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '9px 14px', background: isAssigned ? '#fef2f2' : 'transparent',
                                  border: 'none', cursor: 'pointer', textAlign: 'left',
                                  transition: 'background 0.12s',
                                }}
                                onMouseEnter={e => { if (!isAssigned) (e.currentTarget as HTMLElement).style.background = '#fafafa'; }}
                                onMouseLeave={e => { if (!isAssigned) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                              >
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: isAssigned ? '#dc2626' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: isAssigned ? '#fff' : '#374151', flexShrink: 0 }}>
                                  {initials}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: isAssigned ? '#dc2626' : '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {member.full_name || member.email}
                                  </div>
                                  <div style={{ fontSize: 10.5, color: '#9ca3af', textTransform: 'capitalize' }}>{member.role || 'Agent'}</div>
                                </div>
                                {isAssigned && <Check size={13} color="#dc2626" style={{ flexShrink: 0 }} />}
                              </button>
                            );
                          })}
                        </div>
                        {selected.assigned_to && (
                          <div style={{ borderTop: '1px solid #f3f4f6' }}>
                            <button
                              onClick={() => handleAssign(null)}
                              style={{
                                width: '100%', padding: '9px 14px', background: 'transparent',
                                border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                                color: '#9ca3af', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                                transition: 'background 0.12s',
                              }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            >
                              <XIcon size={12} /> Unassign
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selected.status === 'pending' && (
                  <button onClick={handleTakeOver} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 700,
                    boxShadow: '0 2px 6px var(--primary-glow)',
                    transition: 'opacity 0.15s',
                  }} className="hover:opacity-90">
                    <UserCheck size={13} /> Take Over
                  </button>
                )}
                {(selected.status === 'open' || !selected.status) && selected.assigned_to && (
                  <button onClick={handleHandBackToAI} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-strong)', cursor: 'pointer',
                    background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 12, fontWeight: 700,
                  }} className="hover:bg-[var(--surface2)]">
                    <Bot size={13} /> Hand Back to AI
                  </button>
                )}
                {selected.status !== 'resolved' && (
                  <button onClick={handleResolve} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(21,127,61,0.25)', cursor: 'pointer',
                    background: 'var(--success-bg)', color: 'var(--success)', fontSize: 12, fontWeight: 700,
                  }} className="hover:opacity-90">
                    <CheckCircle2 size={13} /> Resolve
                  </button>
                )}
              </div>
            </div>
            {/* Pending handoff banner */}
            {selected.status === 'pending' && (
              <div style={{
                padding: '10px 16px', background: 'var(--warn-bg)',
                borderBottom: '1px solid rgba(180,116,14,0.3)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <AlertTriangle size={16} color="var(--warn)" />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#92400e' }}>Human handoff requested — AI has stopped replying. </span>
                  <span style={{ fontSize: 12, color: '#b45309' }}>Click <strong>Take Over</strong> to handle this conversation manually, or <strong>Hand Back to AI</strong> to resume AI replies.</span>
                </div>
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 40 }}>No messages yet</div>
              ) : messages.map((m, i) => {
                if (!m.content || m.content.trim() === '') return null;
                const isAgent = m.sender_type === 'agent' || m.sender_type === 'bot';
                
                const mediaRegex = /^\[Media:\s*(Images|Documents|Videos|Audio)\]\s*([^|]+)\|(.+)$/i;
                const match = m.content.match(mediaRegex);
                
                let isMedia = false;
                let mediaElement = null;
                
                if (match) {
                  isMedia = true;
                  const [_, category, fileName, fileUrl] = match;
                  const catLower = category.toLowerCase();
                  
                  if (catLower === 'images') {
                    mediaElement = (
                      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', background: isAgent ? 'rgba(0,0,0,0.1)' : '#f3f4f6', maxWidth: 300 }}>
                        <img src={fileUrl} alt={fileName} style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover' }} />
                        <div style={{ padding: '8px 12px', background: isAgent ? 'rgba(0,0,0,0.15)' : '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <span style={{ fontSize: 11.5, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: isAgent ? '#fff' : '#374151', flex: 1 }}>{fileName}</span>
                          <a href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: isAgent ? '#fff' : '#dc2626', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Eye size={12} /> View
                          </a>
                        </div>
                      </div>
                    );
                  } else if (catLower === 'audio') {
                    mediaElement = (
                      <div style={{ padding: 10, background: isAgent ? 'rgba(255,255,255,0.15)' : '#f3f4f6', borderRadius: 12, minWidth: 260 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: isAgent ? '#fff' : '#374151', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={13} /> {fileName}
                        </div>
                        <audio src={fileUrl} controls style={{ width: '100%', height: 32, outline: 'none' }} />
                      </div>
                    );
                  } else if (catLower === 'videos') {
                    mediaElement = (
                      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', background: '#000', maxWidth: 300 }}>
                        <video src={fileUrl} controls style={{ width: '100%', maxHeight: 180, display: 'block' }} />
                        <div style={{ padding: '8px 12px', background: isAgent ? 'rgba(255,255,255,0.15)' : '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <span style={{ fontSize: 11.5, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: isAgent ? '#fff' : '#374151', flex: 1 }}>{fileName}</span>
                          <a href={fileUrl} download={fileName} style={{ textDecoration: 'none', color: isAgent ? '#fff' : '#dc2626', fontSize: 11, fontWeight: 700 }}>
                            Download
                          </a>
                        </div>
                      </div>
                    );
                  } else {
                    mediaElement = (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', borderRadius: 12,
                        background: isAgent ? 'rgba(255,255,255,0.15)' : '#f3f4f6',
                        border: '1px solid rgba(0,0,0,0.05)', minWidth: 220, maxWidth: 300
                      }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: isAgent ? 'rgba(255,255,255,0.2)' : 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={18} color={isAgent ? '#fff' : '#dc2626'} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: isAgent ? '#fff' : '#111827', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {fileName}
                          </div>
                          <a href={fileUrl} download={fileName} style={{ fontSize: 11, fontWeight: 700, color: isAgent ? 'rgba(255,255,255,0.85)' : '#dc2626', textDecoration: 'none', display: 'inline-block', marginTop: 2 }}>
                            Download File
                          </a>
                        </div>
                      </div>
                    );
                  }
                }

                return (
                  <div key={m.id ?? i} style={{ display: 'flex', justifyContent: isAgent ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '72%' }}>
                      {isMedia ? (
                        mediaElement
                      ) : (
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: isAgent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isAgent ? 'var(--info-bg)' : '#ffffff',
                          color: isAgent ? 'var(--info)' : 'var(--text-primary)',
                          border: isAgent ? '1px solid rgba(43,95,168,0.15)' : '1px solid var(--border)',
                          fontSize: 13.5, lineHeight: 1.55,
                          boxShadow: 'var(--shadow-sm)',
                        }}>
                          {renderMarkdown(m.content)}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, justifyContent: isAgent ? 'flex-end' : 'flex-start', paddingLeft: isAgent ? 0 : 4, paddingRight: isAgent ? 4 : 0 }}>
                        {m.sender_type === 'bot' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EAF0F9', color: '#2B5FA8', padding: '1px 6px', borderRadius: 10, fontWeight: 700, fontSize: 10 }}>
                            <Bot size={11} /> AI Agent (99% conf)
                          </span>
                        ) : isAgent ? (
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>You</span>
                        ) : (
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selected.customer_name || 'Customer'}</span>
                        )}
                        <span>·</span>
                        <span>{formatTime(m.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid rgba(220,38,38,0.08)', position: 'relative' }}>
              {niche && niche.quickReplies && niche.quickReplies.length > 0 && (
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <button 
                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                    style={{
                      background: '#fef2f2',
                      border: '1px solid rgba(220,38,38,0.15)',
                      borderRadius: 16,
                      padding: '5px 12px',
                      fontSize: 12,
                      fontWeight: 650,
                      color: '#dc2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                  >
                    ⚡ Quick Replies
                  </button>
                  
                  {showQuickReplies && (
                    <div style={{
                      position: 'absolute',
                      bottom: 34,
                      left: 0,
                      width: 320,
                      background: '#fff',
                      border: '1px solid rgba(220,38,38,0.12)',
                      borderRadius: 12,
                      boxShadow: '0 8px 24px rgba(220,38,38,0.15)',
                      padding: 12,
                      zIndex: 50,
                    }}>
                      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 6, marginBottom: 8, overflowX: 'auto' }}>
                        {niche.quickReplies.map((cat: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => setActiveQuickCategory(index)}
                            style={{
                              background: activeQuickCategory === index ? '#dc2626' : 'transparent',
                              color: activeQuickCategory === index ? '#fff' : '#6b7280',
                              border: 'none',
                              borderRadius: 12,
                              padding: '4px 8px',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {cat.category}
                          </button>
                        ))}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                        {niche.quickReplies[activeQuickCategory]?.replies.map((replyItem: any, index: number) => (
                          <div
                            key={index}
                            onClick={() => {
                              setReply(replyItem.text);
                              setShowQuickReplies(false);
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: 8,
                              background: '#fafafa',
                              border: '1px solid #f3f4f6',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              textAlign: 'left'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#fef2f2';
                              e.currentTarget.style.borderColor = 'rgba(220,38,38,0.15)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#fafafa';
                              e.currentTarget.style.borderColor = '#f3f4f6';
                            }}
                          >
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#dc2626', marginBottom: 2 }}>{replyItem.label}</div>
                            <div style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{replyItem.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#faf9f9', borderRadius: 24, border: '1px solid rgba(220,38,38,0.12)', padding: '6px 8px 6px 16px' }}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
                <button 
                  onClick={triggerFileInput} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: '#9ca3af', 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '0 4px', 
                    transition: 'color 0.2s' 
                  }} 
                  onMouseEnter={e => e.currentTarget.style.color = '#dc2626'} 
                  onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                >
                  <Paperclip size={18} />
                </button>
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
          <div style={{
            flex: 1,
            display: isMobile ? 'none' : 'flex',
            alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: '#faf9f9',
          }}>
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

export default function ConversationsPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>}>
      <ConversationsInner />
    </Suspense>
  );
}
