'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, MessageSquare, Phone, Mail, Tag, X, 
  ChevronRight, Loader2, Upload, AlertCircle, FileText, 
  Sliders, UserX, Check, Trash2, Filter, Sparkles, Flame, 
  Calendar, CreditCard, CheckCircle2, Globe, Send, Lock, 
  Copy, ExternalLink, ShoppingBag, Clock, RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { LIFECYCLE_STAGES } from '@/components/conversations/InboxSidebarNav';
import { createMemoryState } from '@/lib/useMemoryState';
import { useConfirm, useAlert } from '@/context/DialogContext';

const useMemoryState = createMemoryState();

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  lifecycle_stage: string;
  tags: string[];
  platform: string;
  is_opted_out: boolean;
  unread_count: number;
  last_message_at: string;
  last_message_preview: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

const PRESET_TAGS = ['VIP', 'Wholesale Buyer', 'High Value', 'Urgent', 'Instagram Lead', 'Website Inquiry', 'Follow-up'];

export default function ContactsPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const showAlert = useAlert();

  const [contacts, setContacts] = useMemoryState<Contact[]>('contacts', []);
  const [loading, setLoading] = useMemoryState('loading', true);
  const [search, setSearch] = useMemoryState('search', '');
  const [selected, setSelectedState] = useMemoryState<Contact | null>('selected', null);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [tenantId, setTenantId] = useMemoryState<string | null>('tenant_id', null);

  // Embedded Chat Feed State
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [composerMode, setComposerMode] = useState<'public' | 'note'>('public');
  const [sendingReply, setSendingReply] = useState(false);

  // Add Contact Form State
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newLifecycle, setNewLifecycle] = useState('new_lead');
  const [newTags, setNewTags] = useState<string[]>(['VIP']);
  const [customTagInput, setCustomTagInput] = useState('');

  // CSV Importer Form State
  const [showCSV, setShowCSV] = useState(false);
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [csvPreview, setCSVPreview] = useState<any[]>([]);
  const [csvHeaders, setCSVHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({
    name: '', phone: '', email: '', tags: ''
  });
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extra Orders & Bookings
  const [orders, setOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // 1. Load active user's tenant ID
  useEffect(() => {
    async function fetchTenant() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single();
          if (profile?.tenant_id) {
            setTenantId(profile.tenant_id);
          }
        }
      } catch (err) {
        console.error('Failed to load tenant ID:', err);
      }
    }
    fetchTenant();
  }, []);

  // 2. Fetch contacts from Supabase
  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        const mapped: Contact[] = data.map((conv: any) => ({
          id: conv.id,
          name: conv.customer_name || 'Website Visitor',
          phone: conv.external_conversation_id || conv.customer_phone || '',
          email: conv.customer_email || '',
          lifecycle_stage: conv.lifecycle_stage || 'new_lead',
          tags: Array.isArray(conv.tags) ? conv.tags : [],
          platform: conv.platform || 'whatsapp',
          is_opted_out: conv.is_opted_out || false,
          unread_count: conv.unread_count || 0,
          last_message_at: conv.last_message_at || conv.updated_at,
          last_message_preview: conv.last_message_preview || '',
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          tenant_id: conv.tenant_id,
        }));

        setContacts(mapped);

        // Auto-select first contact if none selected
        if (mapped.length > 0 && !selected) {
          setSelected(mapped[0]);
        } else if (selected) {
          const updatedSelected = mapped.find(c => c.id === selected.id);
          if (updatedSelected) setSelectedState(updatedSelected);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setSelected = (c: Contact) => {
    setSelectedState(c);
    if (c) {
      fetchContactDetails(c);
    }
  };

  // 3. Fetch embedded chat history, orders, and appointments for selected contact
  const fetchContactDetails = async (c: Contact) => {
    setLoadingChat(true);
    try {
      // Fetch last 10 messages (including internal notes)
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: true })
        .limit(10);
      if (msgs) setRecentMessages(msgs);

      // Fetch orders for this tenant
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', c.tenant_id)
        .order('created_at', { ascending: false })
        .limit(2);
      if (orderData) setOrders(orderData);

      // Fetch appointments
      const { data: apptData } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', c.tenant_id)
        .order('start_time', { ascending: false })
        .limit(2);
      if (apptData) setAppointments(apptData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    fetchContacts();

    const channel = supabase
      .channel('contacts-crm-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchContacts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 4. Update Lifecycle Stage with Live Sync
  const handleUpdateLifecycle = async (contact: Contact, newStage: string) => {
    try {
      await supabase.from('conversations').update({
        lifecycle_stage: newStage,
        updated_at: new Date().toISOString(),
      }).eq('id', contact.id);

      // Add audit system event to conversation
      await supabase.from('messages').insert([{
        tenant_id: contact.tenant_id,
        conversation_id: contact.id,
        sender_type: 'system_event',
        content: `Lifecycle stage updated to "${LIFECYCLE_STAGES.find(s => s.id === newStage)?.label || newStage}" via Contacts CRM`,
        metadata: { event_type: 'lifecycle_change', new_value: newStage },
      }]);

      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, lifecycle_stage: newStage } : c));
      if (selected?.id === contact.id) {
        setSelectedState(prev => prev ? { ...prev, lifecycle_stage: newStage } : null);
      }
    } catch (err: any) {
      console.error('Failed to update stage:', err);
    }
  };

  // 5. Add / Remove Custom Tags with Live Sync
  const handleAddTag = async (contact: Contact, tagToAdd: string) => {
    if (!tagToAdd.trim() || contact.tags.includes(tagToAdd.trim())) return;
    const updatedTags = [...contact.tags, tagToAdd.trim()];

    try {
      await supabase.from('conversations').update({
        tags: updatedTags,
        updated_at: new Date().toISOString(),
      }).eq('id', contact.id);

      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, tags: updatedTags } : c));
      if (selected?.id === contact.id) {
        setSelectedState(prev => prev ? { ...prev, tags: updatedTags } : null);
      }
    } catch (e) {
      console.error('Failed to add tag:', e);
    }
  };

  const handleRemoveTag = async (contact: Contact, tagToRemove: string) => {
    const updatedTags = contact.tags.filter(t => t !== tagToRemove);
    try {
      await supabase.from('conversations').update({
        tags: updatedTags,
        updated_at: new Date().toISOString(),
      }).eq('id', contact.id);

      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, tags: updatedTags } : c));
      if (selected?.id === contact.id) {
        setSelectedState(prev => prev ? { ...prev, tags: updatedTags } : null);
      }
    } catch (e) {
      console.error('Failed to remove tag:', e);
    }
  };

  // 6. Toggle Marketing Opt-Out
  const toggleOptOut = async (contact: Contact) => {
    const newStatus = !contact.is_opted_out;
    try {
      await supabase.from('conversations').update({
        is_opted_out: newStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', contact.id);

      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, is_opted_out: newStatus } : c));
      if (selected?.id === contact.id) {
        setSelectedState(prev => prev ? { ...prev, is_opted_out: newStatus } : null);
      }
    } catch (e) {
      console.error('Failed to toggle opt-out:', e);
    }
  };

  // 7. Embedded Quick Reply / Internal Note Sender
  const handleSendQuickReply = async () => {
    if (!selected || !replyText.trim() || sendingReply) return;
    setSendingReply(true);

    const isNote = composerMode === 'note';
    const textToSend = replyText.trim();
    setReplyText('');

    try {
      if (isNote) {
        const { data } = await supabase.from('messages').insert([{
          tenant_id: selected.tenant_id,
          conversation_id: selected.id,
          sender_type: 'internal_note',
          content: textToSend,
          metadata: { author_name: 'Agent (Contacts)' },
        }]).select().single();

        if (data) setRecentMessages(prev => [...prev, data]);
      } else {
        // Insert public agent message
        const { data: insertedMsg } = await supabase.from('messages').insert([{
          tenant_id: selected.tenant_id,
          conversation_id: selected.id,
          sender_type: 'agent',
          content: textToSend,
        }]).select().single();

        if (insertedMsg) {
          setRecentMessages(prev => [...prev, insertedMsg]);

          // Call /api/chat/send
          await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message_id: insertedMsg.id }),
          });

          await supabase.from('conversations').update({
            last_message_at: new Date().toISOString(),
            last_message_preview: textToSend.slice(0, 100),
            updated_at: new Date().toISOString(),
          }).eq('id', selected.id);
        }
      }
    } catch (e: any) {
      alert(`Could not send: ${e.message}`);
    } finally {
      setSendingReply(false);
    }
  };

  // 8. Create Manual Contact
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone || !tenantId) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          tenant_id: tenantId,
          platform: 'whatsapp',
          external_conversation_id: newPhone.trim(),
          customer_phone: newPhone.trim(),
          customer_name: newName.trim(),
          customer_email: newEmail.trim() || null,
          lifecycle_stage: newLifecycle,
          tags: newTags,
          unread_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setShowAdd(false);
        setNewName(''); setNewPhone(''); setNewEmail('');
        await fetchContacts();
      }
    } catch (err: any) {
      alert(`Failed to save contact: ${err.message}`);
    }
  };

  // Filter contacts by search query & segment list selection
  const filteredContacts = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = !search || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.tags.some(t => t.toLowerCase().includes(q));

    if (selectedSegment === 'all') return matchesSearch;
    if (selectedSegment === 'opted-out') return matchesSearch && c.is_opted_out;
    if (selectedSegment.startsWith('tag:')) {
      const tagQuery = selectedSegment.replace('tag:', '');
      return matchesSearch && c.tags.includes(tagQuery);
    }
    // Filter by lifecycle stage ID
    return matchesSearch && c.lifecycle_stage === selectedSegment;
  });

  const activeStage = LIFECYCLE_STAGES.find(s => s.id === selected?.lifecycle_stage) || LIFECYCLE_STAGES[0];

  return (
    <div style={{ height: 'calc(100vh - 84px)', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* ── LEFT PANE: Contacts List & Segmentation ─── */}
        <div style={{
          width: 360,
          flexShrink: 0,
          background: '#ffffff',
          borderRight: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          {/* Top Header */}
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
                  Contacts CRM
                </h2>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  {filteredContacts.length} active customer{filteredContacts.length === 1 ? '' : 's'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setShowAdd(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                    background: '#dc2626', color: '#ffffff', border: 'none', cursor: 'pointer',
                  }}
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: 10, top: 10 }} />
              <input
                type="text"
                placeholder="Search name, phone, tags..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '7px 10px 7px 32px', borderRadius: 8,
                  border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 12.5, outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Segment Chips (Lifecycle + Tags) */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
              <button
                onClick={() => setSelectedSegment('all')}
                style={{
                  padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: selectedSegment === 'all' ? '#111827' : '#f3f4f6',
                  color: selectedSegment === 'all' ? '#ffffff' : '#4b5563',
                  border: 'none', whiteSpace: 'nowrap'
                }}
              >
                All ({contacts.length})
              </button>

              {LIFECYCLE_STAGES.map(s => {
                const count = contacts.filter(c => c.lifecycle_stage === s.id).length;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSegment(s.id)}
                    style={{
                      padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: selectedSegment === s.id ? s.color : s.bg,
                      color: selectedSegment === s.id ? '#ffffff' : s.color,
                      border: 'none', whiteSpace: 'nowrap'
                    }}
                  >
                    {s.label} ({count})
                  </button>
                );
              })}

              <button
                onClick={() => setSelectedSegment('tag:VIP')}
                style={{
                  padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: selectedSegment === 'tag:VIP' ? '#d97706' : '#fef3c7',
                  color: selectedSegment === 'tag:VIP' ? '#ffffff' : '#92400e',
                  border: 'none', whiteSpace: 'nowrap'
                }}
              >
                VIP ({contacts.filter(c => c.tags.includes('VIP')).length})
              </button>
            </div>
          </div>

          {/* Contact Cards Stream */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                No contacts match criteria
              </div>
            ) : (
              filteredContacts.map(c => {
                const isSel = selected?.id === c.id;
                const cStage = LIFECYCLE_STAGES.find(s => s.id === c.lifecycle_stage) || LIFECYCLE_STAGES[0];
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelected(c)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      background: isSel ? '#fef2f2' : '#ffffff',
                      borderLeft: isSel ? '3.5px solid #dc2626' : '3.5px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: isSel ? '#dc2626' : '#e5e7eb',
                          color: isSel ? '#ffffff' : '#374151',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700,
                        }}>
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 1 }}>
                            {c.phone}
                          </div>
                        </div>
                      </div>

                      {/* Lifecycle stage pill */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '2px 7px', borderRadius: 10,
                        background: cStage.bg, color: cStage.color,
                        fontSize: 10.5, fontWeight: 700,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: cStage.color }} />
                        {cStage.label}
                      </span>
                    </div>

                    {/* Tag pills */}
                    {c.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6, paddingLeft: 40 }}>
                        {c.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            style={{
                              padding: '1px 6px', borderRadius: 4, fontSize: 10.5, fontWeight: 600,
                              background: '#f3f4f6', color: '#4b5563',
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANE: Interactive 360° Contact Workspace ─ */}
        {selected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: '#ffffff' }}>
            
            {/* 1. Header Toolbar */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                  color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800,
                }}>
                  {selected.name.slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>
                      {selected.name}
                    </h1>

                    {/* Stage Dropdown Selector */}
                    <select
                      value={selected.lifecycle_stage}
                      onChange={e => handleUpdateLifecycle(selected, e.target.value)}
                      style={{
                        padding: '4px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: activeStage.bg, color: activeStage.color,
                        border: `1px solid ${activeStage.color}44`, outline: 'none', cursor: 'pointer',
                      }}
                    >
                      {LIFECYCLE_STAGES.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 12, color: '#6b7280' }}>
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>WhatsApp</span>
                    <span>•</span>
                    <span>{selected.phone}</span>
                    <span>•</span>
                    <span>Created: {new Date(selected.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => router.push(`/conversations?conversation=${selected.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: '#dc2626', color: '#ffffff', border: 'none', cursor: 'pointer',
                  }}
                >
                  <MessageSquare size={14} />
                  <span>Open Full Chat Thread</span>
                </button>

                {selected.phone && (
                  <a
                    href={`https://wa.me/${selected.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      background: '#dcfce7', color: '#16a34a', textDecoration: 'none',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    <Phone size={14} />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* 2. Main Detail Content Grid */}
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
              
              {/* LEFT COLUMN: Contact Attributes & Tag Cloud */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Contact Attributes Card */}
                <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', padding: 18 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', marginBottom: 14 }}>
                    Contact CRM Properties
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ color: '#6b7280' }}>Phone / ID</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{selected.phone}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ color: '#6b7280' }}>Email Address</span>
                      <span style={{ color: selected.email ? '#111827' : '#9ca3af' }}>{selected.email || 'Not provided'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ color: '#6b7280' }}>Marketing Opt-In</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                          background: selected.is_opted_out ? '#fee2e2' : '#dcfce7',
                          color: selected.is_opted_out ? '#dc2626' : '#16a34a',
                        }}>
                          {selected.is_opted_out ? 'Opted Out' : 'Subscribed'}
                        </span>
                        <button
                          onClick={() => toggleOptOut(selected)}
                          style={{ fontSize: 11, color: '#6b7280', textDecoration: 'underline', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          {selected.is_opted_out ? 'Subscribe' : 'Opt Out'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tag Cloud & Custom Labels Card */}
                <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', padding: 18 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
                    Custom Labels & Segmentation Tags
                  </div>

                  {/* Active Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {selected.tags.length === 0 ? (
                      <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No tags assigned yet</span>
                    ) : (
                      selected.tags.map(t => (
                        <span
                          key={t}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                            background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                          }}
                        >
                          #{t}
                          <X
                            size={12}
                            onClick={() => handleRemoveTag(selected, t)}
                            style={{ cursor: 'pointer', opacity: 0.7 }}
                          />
                        </span>
                      ))
                    )}
                  </div>

                  {/* Preset quick buttons */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>
                    Quick Preset Tags:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {PRESET_TAGS.map(pt => {
                      const isAssigned = selected.tags.includes(pt);
                      return (
                        <button
                          key={pt}
                          onClick={() => isAssigned ? handleRemoveTag(selected, pt) : handleAddTag(selected, pt)}
                          style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                            background: isAssigned ? '#dbeafe' : '#f3f4f6',
                            color: isAssigned ? '#1d4ed8' : '#4b5563',
                            border: 'none',
                          }}
                        >
                          {isAssigned ? `✓ ${pt}` : `+ ${pt}`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Tag Input */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      placeholder="Type custom tag & press Enter..."
                      value={customTagInput}
                      onChange={e => setCustomTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customTagInput.trim()) {
                            handleAddTag(selected, customTagInput.trim());
                            setCustomTagInput('');
                          }
                        }
                      }}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none' }}
                    />
                    <button
                      onClick={() => {
                        if (customTagInput.trim()) {
                          handleAddTag(selected, customTagInput.trim());
                          setCustomTagInput('');
                        }
                      }}
                      style={{ padding: '6px 12px', borderRadius: 6, background: '#111827', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Orders & Bookings Summary */}
                <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', padding: 18 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
                    eCommerce & Appointment History
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {orders.length > 0 ? (
                      orders.map(o => (
                        <div key={o.id} style={{ padding: '8px 10px', borderRadius: 6, background: '#f9fafb', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                          <span>Order #{o.id.slice(0, 6)} ({o.status})</span>
                          <span style={{ fontWeight: 700, color: '#16a34a' }}>PKR {o.total_amount || 0}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No recent eCommerce orders</div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Live Embedded Chat & Quick Reply Composer */}
              <div style={{
                background: '#ffffff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)',
                display: 'flex', flexDirection: 'column', height: 600, overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={15} color="#dc2626" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Live Conversation Feed</span>
                  </div>
                  <button
                    onClick={() => fetchContactDetails(selected)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                    title="Refresh Chat Feed"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>

                {/* Message Stream */}
                <div style={{ flex: 1, padding: 14, overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {loadingChat ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                      <Loader2 size={18} className="animate-spin" />
                    </div>
                  ) : recentMessages.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 12.5 }}>
                      No messages yet with this contact
                    </div>
                  ) : (
                    recentMessages.map(m => {
                      if (m.sender_type === 'internal_note') {
                        return (
                          <div key={m.id} style={{ background: '#fefce8', border: '1px solid #fef08a', padding: '8px 10px', borderRadius: 8, fontSize: 12, color: '#713f12' }}>
                            <div style={{ fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', marginBottom: 2 }}>🔒 Internal Note</div>
                            {m.content}
                          </div>
                        );
                      }
                      const isOut = m.sender_type === 'agent' || m.sender_type === 'bot';
                      return (
                        <div
                          key={m.id}
                          style={{
                            alignSelf: isOut ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            padding: '8px 12px',
                            borderRadius: isOut ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                            background: isOut ? '#dc2626' : '#ffffff',
                            color: isOut ? '#ffffff' : '#111827',
                            fontSize: 12.5,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          {m.content}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick Reply Composer */}
                <div style={{ padding: 12, borderTop: '1px solid rgba(0,0,0,0.08)', background: '#ffffff' }}>
                  {/* Mode switcher */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <button
                      onClick={() => setComposerMode('public')}
                      style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        background: composerMode === 'public' ? '#111827' : '#f3f4f6',
                        color: composerMode === 'public' ? '#ffffff' : '#4b5563', border: 'none',
                      }}
                    >
                      💬 Public WhatsApp
                    </button>
                    <button
                      onClick={() => setComposerMode('note')}
                      style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        background: composerMode === 'note' ? '#ca8a04' : '#f3f4f6',
                        color: composerMode === 'note' ? '#ffffff' : '#4b5563', border: 'none',
                      }}
                    >
                      🔒 Internal Note
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      placeholder={composerMode === 'note' ? 'Write internal note for team...' : 'Reply to customer on WhatsApp...'}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendQuickReply();
                        }
                      }}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12.5, outline: 'none' }}
                    />
                    <button
                      onClick={handleSendQuickReply}
                      disabled={!replyText.trim() || sendingReply}
                      style={{
                        padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                        background: composerMode === 'note' ? '#ca8a04' : '#dc2626',
                        color: '#fff', border: 'none', cursor: 'pointer',
                      }}
                    >
                      {sendingReply ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
            Select a contact to view 360° details
          </div>
        )}
      </div>

      {/* ── ADD CONTACT MODAL ───────────────────────── */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <form onSubmit={handleAddContact} style={{ background: '#ffffff', borderRadius: 14, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Add New Contact</h3>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}>WhatsApp Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 923242059198"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Email (Optional)</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Initial Lifecycle Stage</label>
              <select
                value={newLifecycle}
                onChange={e => setNewLifecycle(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
              >
                {LIFECYCLE_STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '8px 14px', borderRadius: 8, background: '#f3f4f6', border: 'none', color: '#4b5563', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                Save Contact
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
