'use client';

import { Suspense, useState, useEffect, useRef, memo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, ArrowLeft, Loader2, ArrowUpDown, 
  MessageSquare, SlidersHorizontal, Check 
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useNiche } from '@/context/NicheContext';
import { createMemoryState } from '@/lib/useMemoryState';

// ── Modular Team Inbox Components ──────────────────────────────────
import { InboxSidebarNav, QueueType, LIFECYCLE_STAGES } from '@/components/conversations/InboxSidebarNav';
import { ConversationCard } from '@/components/conversations/ConversationCard';
import { ConversationHeader } from '@/components/conversations/ConversationHeader';
import { InternalNoteBubble } from '@/components/conversations/InternalNoteBubble';
import { SystemEventBubble } from '@/components/conversations/SystemEventBubble';
import { CollaborativeComposer } from '@/components/conversations/CollaborativeComposer';
import { Customer360Drawer } from '@/components/conversations/Customer360Drawer';

const useMemoryState = createMemoryState();

function ConversationsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── Core State ──────────────────────────────────────────────────
  const [convos, setConversations] = useMemoryState<any[]>('convos', []);
  const [selected, setSelectedState] = useMemoryState<any>('selected', null);
  const [messages, setMessages] = useMemoryState<any[]>('messages', []);
  const [loading, setLoading] = useMemoryState('loading', true);
  const [sending, setSending] = useState(false);

  // ── Navigation & Filter State ───────────────────────────────────
  const [currentQueue, setCurrentQueue] = useState<QueueType>('all');
  const [currentLifecycle, setCurrentLifecycle] = useState<string | null>(null);
  const [currentTeam, setCurrentTeam] = useState<string | null>(null);
  const [currentChannel, setCurrentChannel] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'waiting' | 'unreplied'>('newest');

  // ── Team Collaboration & Canned Snippets ────────────────────────
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [cannedSnippets, setCannedSnippets] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [currentUserName, setCurrentUserName] = useState<string>('Agent');
  const [tenantBusinessName, setTenantBusinessName] = useState('Ittisalo');

  // ── Drawer & Mobile State ───────────────────────────────────────
  const [is360DrawerOpen, setIs360DrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'nav' | 'list' | 'chat'>('list');

  const bottomRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // ── Check Mobile Screen ─────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Select Conversation Handler ─────────────────────────────────
  const setSelected = async (c: any) => {
    setSelectedState(c);
    if (isMobile) setMobileView('chat');
    if (c) {
      fetchMessages(c.id);
      if (c.unread_count > 0) {
        // Reset unread count
        await supabase.from('conversations').update({ unread_count: 0 }).eq('id', c.id);
        setConversations(prev => prev.map(conv => conv.id === c.id ? { ...conv, unread_count: 0 } : conv));
      }
    }
  };

  // ── Fetch Conversations ─────────────────────────────────────────
  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) console.error('Fetch error:', error.message);
      if (data) setConversations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch Messages for Selected Conversation ────────────────────
  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  // ── Fetch User & Team Data ──────────────────────────────────────
  useEffect(() => {
    const initUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUserId(user.id);

        const { data: profile } = await supabase.from('users').select('tenant_id, full_name').eq('id', user.id).single();
        if (!profile?.tenant_id) return;
        if (profile.full_name) setCurrentUserName(profile.full_name);

        const tenantId = profile.tenant_id;

        // 1. Fetch team members
        const { data: members } = await supabase
          .from('users')
          .select('id, full_name, email, role')
          .eq('tenant_id', tenantId)
          .order('full_name');
        if (members) setTeamMembers(members);

        // 2. Fetch teams
        const { data: teamList } = await supabase
          .from('teams')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name');
        if (teamList) setTeams(teamList);

        // 3. Fetch canned snippets
        const { data: snippets } = await supabase
          .from('canned_responses')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('shortcut');
        if (snippets) setCannedSnippets(snippets);

        // 4. Fetch tenant info
        const { data: tenant } = await supabase
          .from('tenants')
          .select('business_name')
          .eq('id', tenantId)
          .maybeSingle();
        if (tenant?.business_name) setTenantBusinessName(tenant.business_name);
      } catch (e) {
        console.error('Error fetching init team data:', e);
      }
    };

    initUserData();
    fetchConversations();

    // Realtime subscriptions
    const convSub = supabase
      .channel('conversations_team_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchConversations)
      .subscribe();

    return () => {
      supabase.removeChannel(convSub);
    };
  }, []);

  // ── Realtime Messages Subscription ──────────────────────────────
  useEffect(() => {
    if (!selected?.id) return;
    fetchMessages(selected.id);

    const msgSub = supabase
      .channel(`messages_rt_${selected.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `conversation_id=eq.${selected.id}` 
      }, (payload: any) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgSub);
    };
  }, [selected?.id]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Deep link support (?conversation=id)
  useEffect(() => {
    const targetId = searchParams.get('conversation');
    if (targetId && convos.length > 0) {
      const match = convos.find(c => c.id === targetId);
      if (match) setSelected(match);
    }
  }, [searchParams, convos]);

  // ── Calculate Queue Counts ──────────────────────────────────────
  const counts = {
    all: convos.filter(c => c.status !== 'resolved').length,
    mine: convos.filter(c => c.assigned_to === currentUserId && c.status !== 'resolved').length,
    unassigned: convos.filter(c => !c.assigned_to && c.status !== 'resolved').length,
    ai_active: convos.filter(c => c.bot_enabled !== false && !c.assigned_to && c.status !== 'resolved').length,
    ai_escalated: convos.filter(c => (c.unread_count || 0) > 3 && c.status !== 'resolved').length,
    resolved: convos.filter(c => c.status === 'resolved').length,
    lifecycle: LIFECYCLE_STAGES.reduce((acc, stage) => {
      acc[stage.id] = convos.filter(c => c.lifecycle_stage === stage.id && c.status !== 'resolved').length;
      return acc;
    }, {} as Record<string, number>),
    teams: teams.reduce((acc, team) => {
      acc[team.id] = convos.filter(c => c.team_id === team.id && c.status !== 'resolved').length;
      return acc;
    }, {} as Record<string, number>),
  };

  // ── Filter & Sort Conversation Stream ───────────────────────────
  const filteredConversations = convos.filter(c => {
    // 1. Queue filter
    if (currentQueue === 'mine' && c.assigned_to !== currentUserId) return false;
    if (currentQueue === 'unassigned' && c.assigned_to) return false;
    if (currentQueue === 'ai_active' && (c.bot_enabled === false || c.assigned_to)) return false;
    if (currentQueue === 'ai_escalated' && (c.unread_count || 0) <= 3) return false;
    if (currentQueue === 'resolved') {
      if (c.status !== 'resolved') return false;
    } else {
      if (c.status === 'resolved') return false;
    }

    // 2. Lifecycle filter
    if (currentLifecycle && c.lifecycle_stage !== currentLifecycle) return false;

    // 3. Team queue filter
    if (currentTeam && c.team_id !== currentTeam) return false;

    // 4. Channel filter
    if (currentChannel !== 'all' && c.platform !== currentChannel) return false;

    // 5. Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (c.customer_name || '').toLowerCase().includes(q);
      const matchPhone = (c.customer_phone || c.external_conversation_id || '').toLowerCase().includes(q);
      const matchMsg = (c.last_message_preview || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchMsg) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'unreplied') {
      return (b.unread_count || 0) - (a.unread_count || 0);
    }
    if (sortBy === 'waiting') {
      const aTime = new Date(a.last_message_at || a.updated_at).getTime();
      const bTime = new Date(b.last_message_at || b.updated_at).getTime();
      return aTime - bTime; // Oldest waiting first
    }
    // Default newest
    const aTime = new Date(a.updated_at || a.created_at).getTime();
    const bTime = new Date(b.updated_at || b.created_at).getTime();
    return bTime - aTime;
  });

  // ── Send Message / Internal Note Handler ────────────────────────
  const handleSendMessage = async (content: string, isInternalNote: boolean) => {
    if (!selected || !content.trim()) return;
    setSending(true);

    const tempId = 'temp_' + Date.now();
    const newMsgObj = {
      id: tempId,
      conversation_id: selected.id,
      tenant_id: selected.tenant_id,
      sender_type: isInternalNote ? 'internal_note' : 'agent',
      content: content,
      created_at: new Date().toISOString(),
      metadata: isInternalNote ? {
        author_name: currentUserName,
        author_id: currentUserId,
      } : {},
    };

    // Optimistic UI update
    setMessages(prev => [...prev, newMsgObj]);

    try {
      if (isInternalNote) {
        // Save internal note directly
        const { data, error } = await supabase
          .from('messages')
          .insert([{
            tenant_id: selected.tenant_id,
            conversation_id: selected.id,
            sender_type: 'internal_note',
            content: content,
            metadata: {
              author_name: currentUserName,
              author_id: currentUserId,
            }
          }])
          .select('id')
          .single();

        if (error) throw error;
        if (data?.id) {
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m));
        }
      } else {
        // 1. Insert public agent message into messages table
        const { data: insertedMsg, error: insertErr } = await supabase
          .from('messages')
          .insert([{
            tenant_id: selected.tenant_id,
            conversation_id: selected.id,
            sender_type: 'agent',
            content: content,
          }])
          .select('id')
          .single();

        if (insertErr) throw insertErr;

        if (insertedMsg?.id) {
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: insertedMsg.id } : m));

          // 2. Dispatch via /api/chat/send with message_id
          const res = await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message_id: insertedMsg.id,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.warn('[Dispatch Warning]:', errData.error);
          }

          // 3. Update conversation last_message_preview and timestamp
          await supabase.from('conversations').update({
            last_message_at: new Date().toISOString(),
            last_message_preview: content.slice(0, 100),
            updated_at: new Date().toISOString()
          }).eq('id', selected.id);
        }

        // Auto-assign to current user if unassigned
        if (!selected.assigned_to && currentUserId) {
          await supabase.from('conversations').update({
            assigned_to: currentUserId,
            assigned_at: new Date().toISOString(),
            bot_enabled: false,
          }).eq('id', selected.id);

          setSelectedState((prev: any) => prev ? { ...prev, assigned_to: currentUserId, bot_enabled: false } : prev);
        }
      }
    } catch (err: any) {
      console.error('[Send Message Error]:', err.message);
      alert(`Could not send message: ${err.message}`);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // ── Lifecycle Stage Change Handler ──────────────────────────────
  const handleUpdateLifecycle = async (stageId: string) => {
    if (!selected) return;
    const stageObj = LIFECYCLE_STAGES.find(s => s.id === stageId);

    // 1. Update DB
    await supabase.from('conversations').update({
      lifecycle_stage: stageId,
      updated_at: new Date().toISOString()
    }).eq('id', selected.id);

    // 2. Insert System Audit Event
    await supabase.from('messages').insert([{
      tenant_id: selected.tenant_id,
      conversation_id: selected.id,
      sender_type: 'system_event',
      content: `Lifecycle stage updated to "${stageObj?.label || stageId}" by ${currentUserName}`,
      metadata: { event_type: 'lifecycle_change', new_value: stageId }
    }]);

    setSelectedState((prev: any) => prev ? { ...prev, lifecycle_stage: stageId } : prev);
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, lifecycle_stage: stageId } : c));
  };

  // ── Assign Member Handler ───────────────────────────────────────
  const handleAssignMember = async (userId: string | null) => {
    if (!selected) return;
    const memberObj = teamMembers.find(m => m.id === userId);

    await supabase.from('conversations').update({
      assigned_to: userId,
      assigned_at: userId ? new Date().toISOString() : null,
      bot_enabled: userId ? false : true,
      updated_at: new Date().toISOString()
    }).eq('id', selected.id);

    const eventText = userId 
      ? `Conversation assigned to ${memberObj?.full_name || 'Agent'} by ${currentUserName}`
      : `Assignment cleared (Returned to AI Bot) by ${currentUserName}`;

    await supabase.from('messages').insert([{
      tenant_id: selected.tenant_id,
      conversation_id: selected.id,
      sender_type: 'system_event',
      content: eventText,
      metadata: { event_type: 'assignment_change', assigned_to: userId }
    }]);

    setSelectedState((prev: any) => prev ? { ...prev, assigned_to: userId, bot_enabled: !userId } : prev);
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, assigned_to: userId, bot_enabled: !userId } : c));
  };

  // ── Assign Team Queue Handler ───────────────────────────────────
  const handleAssignTeam = async (teamId: string | null) => {
    if (!selected) return;
    const teamObj = teams.find(t => t.id === teamId);

    await supabase.from('conversations').update({
      team_id: teamId,
      updated_at: new Date().toISOString()
    }).eq('id', selected.id);

    if (teamId) {
      await supabase.from('messages').insert([{
        tenant_id: selected.tenant_id,
        conversation_id: selected.id,
        sender_type: 'system_event',
        content: `Transferred to team "${teamObj?.name || 'Department'}" by ${currentUserName}`,
        metadata: { event_type: 'team_transfer', team_id: teamId }
      }]);
    }

    setSelectedState((prev: any) => prev ? { ...prev, team_id: teamId } : prev);
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, team_id: teamId } : c));
  };

  // ── Toggle AI Bot Handler ───────────────────────────────────────
  const handleToggleBot = async (enabled: boolean) => {
    if (!selected) return;

    await supabase.from('conversations').update({
      bot_enabled: enabled,
      assigned_to: enabled ? null : (selected.assigned_to || currentUserId),
      updated_at: new Date().toISOString()
    }).eq('id', selected.id);

    await supabase.from('messages').insert([{
      tenant_id: selected.tenant_id,
      conversation_id: selected.id,
      sender_type: 'system_event',
      content: enabled ? `AI Bot resumed by ${currentUserName}` : `AI Bot paused (Human takeover) by ${currentUserName}`,
      metadata: { event_type: 'bot_toggle', bot_enabled: enabled }
    }]);

    setSelectedState((prev: any) => prev ? { ...prev, bot_enabled: enabled, assigned_to: enabled ? null : (prev.assigned_to || currentUserId) } : prev);
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, bot_enabled: enabled, assigned_to: enabled ? null : (c.assigned_to || currentUserId) } : c));
  };

  // ── Resolve Conversation Handler ────────────────────────────────
  const handleResolveConversation = async () => {
    if (!selected) return;

    await supabase.from('conversations').update({
      status: 'resolved',
      closed_at: new Date().toISOString(),
      closed_by: currentUserId,
      updated_at: new Date().toISOString()
    }).eq('id', selected.id);

    await supabase.from('messages').insert([{
      tenant_id: selected.tenant_id,
      conversation_id: selected.id,
      sender_type: 'system_event',
      content: `Conversation resolved & closed by ${currentUserName}`,
      metadata: { event_type: 'resolve' }
    }]);

    setSelectedState((prev: any) => prev ? { ...prev, status: 'resolved' } : prev);
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, status: 'resolved' } : c));
  };

  return (
    <div style={{ height: 'calc(100vh - 84px)', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* ── LEFT PANE: Inbox Navigation & Smart Queues ── */}
        {(!isMobile || mobileView === 'nav') && (
          <InboxSidebarNav
            currentQueue={currentQueue}
            onSelectQueue={setCurrentQueue}
            currentLifecycle={currentLifecycle}
            onSelectLifecycle={setCurrentLifecycle}
            currentTeam={currentTeam}
            onSelectTeam={setCurrentTeam}
            currentChannel={currentChannel}
            onSelectChannel={setCurrentChannel}
            counts={counts}
            teams={teams}
            currentUserId={currentUserId}
          />
        )}

        {/* ── MIDDLE PANE: High-Velocity Stream ────────── */}
        {(!isMobile || mobileView === 'list') && (
          <div style={{
            width: isMobile ? '100%' : 340,
            flexShrink: 0,
            background: '#ffffff',
            borderRight: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}>
            {/* Search & Sort Controls */}
            <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: 10, top: 10 }} />
                <input
                  type="text"
                  placeholder="Search chats, contacts, notes..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '7px 10px 7px 32px', borderRadius: 8,
                    border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 12.5, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Sort selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11.5, color: '#6b7280', fontWeight: 600 }}>
                  {filteredConversations.length} conversation{filteredConversations.length === 1 ? '' : 's'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => setSortBy('newest')}
                    style={{
                      padding: '3px 7px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: sortBy === 'newest' ? '#f3f4f6' : 'transparent',
                      color: sortBy === 'newest' ? '#111827' : '#9ca3af',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    Newest
                  </button>
                  <button
                    onClick={() => setSortBy('waiting')}
                    style={{
                      padding: '3px 7px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: sortBy === 'waiting' ? '#fef3c7' : 'transparent',
                      color: sortBy === 'waiting' ? '#b45309' : '#9ca3af',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    Wait Time (SLA)
                  </button>
                </div>
              </div>
            </div>

            {/* Conversation List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#9ca3af' }}>
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                  No conversations in this queue
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <ConversationCard
                    key={conv.id}
                    conversation={conv}
                    isSelected={selected?.id === conv.id}
                    onSelect={() => setSelected(conv)}
                    teamMembers={teamMembers}
                    currentUserId={currentUserId}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ── RIGHT PANE: Omnichannel Live Workspace ──── */}
        {(!isMobile || mobileView === 'chat') && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', minWidth: 0 }}>
            {selected ? (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {isMobile && (
                    <button
                      onClick={() => setMobileView('list')}
                      style={{ padding: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <div style={{ flex: 1 }}>
                    <ConversationHeader
                      conversation={selected}
                      teamMembers={teamMembers}
                      teams={teams}
                      currentUserId={currentUserId}
                      onUpdateLifecycle={handleUpdateLifecycle}
                      onAssignMember={handleAssignMember}
                      onAssignTeam={handleAssignTeam}
                      onToggleBot={handleToggleBot}
                      onResolveConversation={handleResolveConversation}
                      onToggle360Sidebar={() => setIs360DrawerOpen(!is360DrawerOpen)}
                      is360SidebarOpen={is360DrawerOpen}
                    />
                  </div>
                </div>

                {/* Message Feed & Collaboration Thread */}
                <div 
                  ref={chatScrollRef}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px 20px',
                    background: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {messages.map(msg => {
                    // Internal Note
                    if (msg.sender_type === 'internal_note') {
                      return <InternalNoteBubble key={msg.id} note={msg} currentUserId={currentUserId} />;
                    }

                    // System Event / Audit Marker
                    if (msg.sender_type === 'system_event') {
                      return <SystemEventBubble key={msg.id} event={msg} />;
                    }

                    // Regular Customer or Bot/Agent Chat Message
                    const isOutbound = msg.sender_type === 'agent' || msg.sender_type === 'bot';
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isOutbound ? 'flex-end' : 'flex-start',
                          maxWidth: '82%',
                          alignSelf: isOutbound ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: isOutbound ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                            background: isOutbound ? '#dc2626' : '#ffffff',
                            color: isOutbound ? '#ffffff' : '#111827',
                            fontSize: 13.5,
                            lineHeight: 1.5,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            border: isOutbound ? 'none' : '1px solid rgba(0,0,0,0.07)',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {msg.content}
                        </div>

                        <div style={{
                          fontSize: 10.5,
                          color: '#9ca3af',
                          marginTop: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          <span>{msg.sender_type === 'bot' ? '🤖 AI Bot' : msg.sender_type === 'agent' ? '👤 Agent' : 'Customer'}</span>
                          <span>•</span>
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Collaborative Dual-Mode Composer */}
                <CollaborativeComposer
                  onSendMessage={handleSendMessage}
                  cannedSnippets={cannedSnippets}
                  teamMembers={teamMembers}
                  conversation={selected}
                  businessName={tenantBusinessName}
                  sending={sending}
                />
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', gap: 12 }}>
                <MessageSquare size={48} strokeWidth={1.2} />
                <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Select a conversation</div>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Choose a chat from the inbox queue to view history and collaborate with your team.</p>
              </div>
            )}
          </div>
        )}

        {/* ── CUSTOMER 360° DRAWER (Right Sidebar) ───── */}
        {selected && is360DrawerOpen && (
          <Customer360Drawer
            conversation={selected}
            onClose={() => setIs360DrawerOpen(false)}
            teamMembers={teamMembers}
            teams={teams}
          />
        )}
      </div>
    </div>
  );
}

export default function ConversationsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading Team Inbox...</div>}>
      <ConversationsInner />
    </Suspense>
  );
}
