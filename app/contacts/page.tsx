'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, MessageSquare, Phone, Mail, Tag, X, 
  ChevronRight, Loader2, Upload, AlertCircle, FileText, 
  Sliders, UserX, Check, Trash2, Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const tagColors: Record<string, { background: string; color: string }> = {
  VIP:        { background: '#fef3c7', color: '#92400e' },
  Regular:    { background: '#fee2e2', color: '#991b1b' },
  New:        { background: '#d1fae5', color: '#065f46' },
  'Hot Lead': { background: '#fce7f3', color: '#9d174d' },
};

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  visits: number;
  lastVisit: string;
  totalSpent: string;
  tags: string[];
  platform: string;
  optedOut?: boolean;
}

import { createMemoryState } from '@/lib/useMemoryState';

const useMemoryState = createMemoryState();

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useMemoryState<Contact[]>('contacts', []);
  const [loading, setLoading] = useMemoryState('loading', true);
  const [search, setSearch] = useMemoryState('search', '');
  const [selected, setSelected] = useMemoryState<Contact | null>('selected', null);
  
  // Segmentation and list selection state
  const [selectedSegment, setSelectedSegment] = useMemoryState<'all' | 'VIP' | 'New' | 'Hot Lead' | 'opted-out'>('selectedSegment', 'all');

  // Tenant ID from database
  const [tenantId, setTenantId] = useMemoryState<string | null>('tenantId', null);

  // Add Contact Form State
  const [showAdd, setShowAdd] = useMemoryState('showAdd', false);
  const [newName, setNewName] = useMemoryState('newName', '');
  const [newPhone, setNewPhone] = useMemoryState('newPhone', '');
  const [newEmail, setNewEmail] = useMemoryState('newEmail', '');
  const [newTags, setNewTags] = useMemoryState<string[]>('newTags', ['New']);

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

  // Load active user's tenant ID
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
        console.error("Failed to load tenant ID:", err);
      }
    }
    fetchTenant();
  }, []);

  // Fetch conversations (contacts) and merge local storage metadata
  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (!error && data) {
        // Read local storage metadata map: phone -> { email, tags, optedOut }
        let metaMap: Record<string, { email?: string; tags?: string[]; optedOut?: boolean }> = {};
        try {
          const stored = localStorage.getItem('ittisalo_contact_meta');
          if (stored) metaMap = JSON.parse(stored);
        } catch (_) {}

        const mapped = data.map((conv: any) => {
          const phoneNum = conv.external_conversation_id || '';
          const meta = metaMap[phoneNum] || {};
          
          return {
            id: conv.id,
            name: conv.customer_name || 'Unknown User',
            phone: phoneNum,
            email: conv.customer_email || meta.email || '',
            visits: conv.unread_count || 0,
            lastVisit: new Date(conv.updated_at).toLocaleDateString(),
            totalSpent: '—',
            tags: meta.tags || ['New'],
            platform: conv.platform || 'whatsapp',
            optedOut: meta.optedOut || false
          };
        });

        setContacts(mapped);
        
        // Auto-select first contact if none selected
        if (mapped.length > 0 && !selected) {
          setSelected(mapped[0]);
        } else if (selected) {
          // Sync selected object if lists updated
          const updatedSelected = mapped.find((c: Contact) => c.id === selected.id);
          if (updatedSelected) setSelected(updatedSelected);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();

    const channel = supabase.channel('contacts-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchContacts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Filter contacts by search query & segment list selection
  const filtered = contacts.filter(c => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    
    if (selectedSegment === 'all') return matchesSearch;
    if (selectedSegment === 'opted-out') return matchesSearch && c.optedOut;
    return matchesSearch && c.tags.includes(selectedSegment) && !c.optedOut;
  });

  // Save manual contact to Supabase and merge metadata
  const handleAdd = async () => {
    if (!newName || !newPhone) return;
    setLoading(true);

    try {
      // Check if contact already exists
      const existing = contacts.find(c => c.phone === newPhone);
      if (existing) {
        alert("A contact with this phone number already exists!");
        setLoading(false);
        return;
      }

      // Save to Supabase (conversations)
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          tenant_id: tenantId,
          platform: 'whatsapp',
          external_conversation_id: newPhone,
          customer_name: newName,
          unread_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Save metadata (email, tags)
        let metaMap: Record<string, { email?: string; tags?: string[]; optedOut?: boolean }> = {};
        try {
          const stored = localStorage.getItem('ittisalo_contact_meta');
          if (stored) metaMap = JSON.parse(stored);
        } catch (_) {}

        metaMap[newPhone] = {
          email: newEmail,
          tags: newTags,
          optedOut: false
        };
        localStorage.setItem('ittisalo_contact_meta', JSON.stringify(metaMap));

        await fetchContacts();
        setShowAdd(false);
        setNewName(''); setNewPhone(''); setNewEmail(''); setNewTags(['New']);
      }
    } catch (err: any) {
      alert("Error saving contact: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Opt-Out state of contact
  const toggleOptOut = (contact: Contact) => {
    const newOptOutStatus = !contact.optedOut;
    
    let metaMap: Record<string, { email?: string; tags?: string[]; optedOut?: boolean }> = {};
    try {
      const stored = localStorage.getItem('ittisalo_contact_meta');
      if (stored) metaMap = JSON.parse(stored);
    } catch (_) {}

    metaMap[contact.phone] = {
      ...metaMap[contact.phone],
      optedOut: newOptOutStatus
    };
    localStorage.setItem('ittisalo_contact_meta', JSON.stringify(metaMap));

    // Update locally instantly
    setContacts(prev => prev.map(c => c.phone === contact.phone ? { ...c, optedOut: newOptOutStatus } : c));
    if (selected?.phone === contact.phone) {
      setSelected(prev => prev ? { ...prev, optedOut: newOptOutStatus } : null);
    }
  };

  // Remove tag from contact
  const handleRemoveTag = (contact: Contact, tagToRemove: string) => {
    const updatedTags = contact.tags.filter(t => t !== tagToRemove);
    updateContactMeta(contact.phone, { tags: updatedTags });
  };

  // Add tag to contact
  const handleAddTag = (contact: Contact, tagToAdd: string) => {
    if (contact.tags.includes(tagToAdd)) return;
    const updatedTags = [...contact.tags, tagToAdd];
    updateContactMeta(contact.phone, { tags: updatedTags });
  };

  // Helper to update local metadata
  const updateContactMeta = (phone: string, updates: { email?: string; tags?: string[]; optedOut?: boolean }) => {
    let metaMap: Record<string, { email?: string; tags?: string[]; optedOut?: boolean }> = {};
    try {
      const stored = localStorage.getItem('ittisalo_contact_meta');
      if (stored) metaMap = JSON.parse(stored);
    } catch (_) {}

    metaMap[phone] = {
      ...metaMap[phone],
      ...updates
    };
    localStorage.setItem('ittisalo_contact_meta', JSON.stringify(metaMap));

    // Refetch/merge contacts state
    fetchContacts();
  };

  // CSV Parsing logic (pure JS, self-contained)
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCSVFile(file);
    parseCSV(file);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      if (lines.length === 0) {
        setImportError("CSV file is empty.");
        return;
      }

      // Simple CSV row parser handling quotes/commas
      const parseRow = (rowText: string) => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < rowText.length; i++) {
          const char = rowText[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseRow(lines[0]);
      setCSVHeaders(headers);

      // Extract raw rows
      const parsedRows: any[] = [];
      for (let i = 1; i < Math.min(lines.length, 100); i++) {
        if (!lines[i].trim()) continue;
        const columns = parseRow(lines[i]);
        if (columns.length > 0) {
          const rowObj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = columns[idx] || '';
          });
          parsedRows.push(rowObj);
        }
      }
      setCSVPreview(parsedRows);

      // Auto-detect mappings based on header names
      const newMap = { name: '', phone: '', email: '', tags: '' };
      headers.forEach(h => {
        const low = h.toLowerCase();
        if (low.includes('name') || low.includes('first') || low.includes('full')) newMap.name = h;
        else if (low.includes('phone') || low.includes('mobile') || low.includes('contact') || low.includes('number')) newMap.phone = h;
        else if (low.includes('mail') || low.includes('address')) newMap.email = h;
        else if (low.includes('tag') || low.includes('segment') || low.includes('label')) newMap.tags = h;
      });
      setColumnMap(newMap);
      setImportError('');
    };
    reader.readAsText(file);
  };

  const executeCSVImport = async () => {
    if (!csvFile || !columnMap.name || !columnMap.phone) {
      setImportError("Please map the 'Full Name' and 'Phone Number' columns to proceed.");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/);
        const headers = csvHeaders;
        const nameKey = columnMap.name;
        const phoneKey = columnMap.phone;
        const emailKey = columnMap.email;
        const tagsKey = columnMap.tags;

        // Parse Row Helper
        const parseRow = (rowText: string) => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < rowText.length; i++) {
            const char = rowText[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const rowsToImport: { name: string; phone: string; email: string; tags: string[] }[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const columns = parseRow(line);
          
          const rowObj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = columns[idx] || '';
          });

          const cName = rowObj[nameKey];
          const cPhone = rowObj[phoneKey]?.replace(/[^0-9+]/g, ''); // strip letters and symbols
          const cEmail = emailKey ? rowObj[emailKey] : '';
          const cTagsRaw = tagsKey ? rowObj[tagsKey] : '';
          const cTags = cTagsRaw ? cTagsRaw.split(';').map(t => t.trim()).filter(Boolean) : ['New'];

          if (cName && cPhone) {
            rowsToImport.push({
              name: cName,
              phone: cPhone,
              email: cEmail,
              tags: cTags
            });
          }
        }

        if (rowsToImport.length === 0) {
          setImportError("No valid rows found to import.");
          setIsImporting(false);
          return;
        }

        // Read existing metadata
        let metaMap: Record<string, { email?: string; tags?: string[]; optedOut?: boolean }> = {};
        try {
          const stored = localStorage.getItem('ittisalo_contact_meta');
          if (stored) metaMap = JSON.parse(stored);
        } catch (_) {}

        // Import in sequential batches
        const total = rowsToImport.length;
        for (let k = 0; k < total; k++) {
          const contactToSave = rowsToImport[k];
          
          // Duplicate detection (Skip if already in local contacts list)
          const isDuplicate = contacts.some(c => c.phone === contactToSave.phone);
          if (!isDuplicate) {
            try {
              // Insert conversation into Supabase
              await supabase
                .from('conversations')
                .insert({
                  tenant_id: tenantId,
                  platform: 'whatsapp',
                  external_conversation_id: contactToSave.phone,
                  customer_name: contactToSave.name,
                  unread_count: 0
                });
            } catch (err) {
              console.error("Supabase insert failed for:", contactToSave.phone, err);
            }
          }

          // Save metadata locally
          metaMap[contactToSave.phone] = {
            email: contactToSave.email,
            tags: contactToSave.tags,
            optedOut: false
          };

          setImportProgress(Math.round(((k + 1) / total) * 100));
        }

        localStorage.setItem('ittisalo_contact_meta', JSON.stringify(metaMap));

        // Finish up
        await fetchContacts();
        setIsImporting(false);
        setShowCSV(false);
        setCSVFile(null);
        setCSVPreview([]);
      };
      reader.readAsText(csvFile);
    } catch (err: any) {
      setImportError(err.message || "Bulk import failed.");
      setIsImporting(false);
    }
  };

  return (
    <div className="split-pane-root" style={{ display: 'flex', height: 'calc(100vh - 98px)' }}>
      
      <div className="split-left-panel" style={{ width: 310, background: '#fff', borderRight: '1px solid rgba(220,38,38,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        
        {/* Contacts Header & Add button */}
        <div style={{ padding: '18px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
              Contacts
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <button 
                title="Bulk CSV Import"
                onClick={() => setShowCSV(true)}
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: '#fef2f2', border: '1px solid rgba(220,38,38,0.2)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
              >
                <Upload size={14} color="#dc2626" />
              </button>
              <button onClick={() => setShowAdd(true)} style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(220,38,38,0.2)',
              }}>
                <Plus size={15} color="#fff" />
              </button>
            </div>
          </div>
          
          {/* Search box */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts by name or phone..."
              style={{ width: '100%', padding: '8px 10px 8px 28px', fontSize: 12.5, border: '1px solid rgba(220,38,38,0.15)', borderRadius: 8, background: '#fff5f5', fontFamily: 'inherit', color: '#111', outline: 'none' }} />
          </div>

          {/* Segmentation Dropdown / Horizontal Tabs */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'VIP', label: 'VIP' },
              { key: 'New', label: 'New' },
              { key: 'Hot Lead', label: 'Hot' },
              { key: 'opted-out', label: 'Opt-Out' }
            ].map(s => {
              const active = selectedSegment === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setSelectedSegment(s.key as any)}
                  style={{
                    padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 20,
                    border: active ? '1px solid #dc2626' : '1px solid #e5e7eb',
                    background: active ? '#dc2626' : '#fff',
                    color: active ? '#fff' : '#6b7280',
                    cursor: 'pointer', transition: 'all 0.1s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats counter strip */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(220,38,38,0.08)', borderBottom: '1px solid rgba(220,38,38,0.08)', background: '#fafafa' }}>
          {[
            { label: 'Total', value: contacts.length },
            { label: 'VIPs', value: contacts.filter(c => c.tags.includes('VIP')).length },
            { label: 'Opt-Out', value: contacts.filter(c => c.optedOut).length }
          ].map(s => (
            <div key={s.label} style={{ flex: 1, padding: '6px 0', textAlign: 'center', borderRight: '1px solid rgba(220,38,38,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 750, color: '#1f2937' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scrollable contact list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12.5 }}>No contacts found matching criteria</div>
          ) : filtered.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} style={{
              padding: '11px 16px', cursor: 'pointer',
              borderBottom: '1px solid rgba(220,38,38,0.05)',
              background: selected?.id === c.id ? '#fef2f2' : 'transparent',
              borderLeft: selected?.id === c.id ? '3px solid #dc2626' : '3px solid transparent',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { if (selected?.id !== c.id) (e.currentTarget as HTMLElement).style.background = '#fff5f5'; }}
            onMouseLeave={e => { if (selected?.id !== c.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ 
                  width: 34, height: 34, borderRadius: '50%', 
                  background: c.optedOut 
                    ? '#9ca3af' 
                    : 'linear-gradient(135deg, #dc2626, #b91c1c)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 
                }}>
                  {c.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: c.optedOut ? 'line-through' : 'none' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {c.optedOut && <UserX size={10} color="#ef4444" />}
                    <span>{c.phone}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {c.optedOut ? (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' }}>
                      OUT
                    </span>
                  ) : (
                    c.tags.slice(0, 1).map((tag: string) => (
                      <span key={tag} style={{ fontSize: 9.5, fontWeight: 600, padding: '1px 6px', borderRadius: 10, ...(tagColors[tag] ?? { background: '#f3f4f6', color: '#374151' }) }}>
                        {tag}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(220,38,38,0.08)', background: '#fff' }}>
          <button onClick={() => setShowAdd(true)} style={{
            width: '100%', padding: '9px', fontSize: 13, fontWeight: 600,
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
            border: 'none', borderRadius: 9, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: '0 3px 8px rgba(220,38,38,0.2)',
          }}>
            <Plus size={14} /> Add New Contact
          </button>
        </div>
      </div>

      {/* Right panel: contact details */}
      {selected ? (
        <div className="split-right-panel" style={{ flex: 1, background: '#fff5f5', overflowY: 'auto' }}>
          
          {/* Top profile view */}
          <div className="contact-profile-header" style={{ background: '#fff', borderBottom: '1px solid rgba(220,38,38,0.1)', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
              <div style={{ 
                width: 58, height: 58, borderRadius: '50%', 
                background: selected.optedOut 
                  ? '#9ca3af' 
                  : 'linear-gradient(135deg, #dc2626, #b91c1c)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
                boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
              }}>
                {selected.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h2 style={{ fontSize: 19.5, fontWeight: 750, color: '#111827', margin: 0, textDecoration: selected.optedOut ? 'line-through' : 'none' }}>
                    {selected.name}
                  </h2>
                  {selected.optedOut && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' }}>
                      Opted Out
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {selected.tags.map((tag: string) => (
                    <span key={tag} style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 10, ...(tagColors[tag] ?? { background: '#f3f4f6', color: '#374151' }) }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="contact-profile-actions" style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={selected.optedOut}
                  onClick={() => router.push(`/conversations?conversation=${selected.id}`)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 15px', fontSize: 12.5, fontWeight: 600, 
                    background: selected.optedOut ? '#d1d5db' : 'linear-gradient(135deg, #dc2626, #b91c1c)', 
                    color: '#fff', border: 'none', borderRadius: 8, cursor: selected.optedOut ? 'default' : 'pointer',
                    boxShadow: selected.optedOut ? 'none' : '0 2px 6px rgba(220,38,38,0.2)' 
                  }}>
                  <MessageSquare size={13} /> Chat Thread
                </button>
                <button
                  disabled={selected.optedOut}
                  onClick={() => router.push(`/conversations?conversation=${selected.id}`)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 15px', fontSize: 12.5, fontWeight: 600, 
                    background: '#fff', color: selected.optedOut ? '#9ca3af' : '#374151', 
                    border: '1px solid rgba(220,38,38,0.15)', borderRadius: 8, cursor: selected.optedOut ? 'default' : 'pointer' 
                  }}>
                  <Phone size={13} /> Call
                </button>
              </div>
            </div>
          </div>

                <div className="contacts-detail-grid" style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            
            {/* Contact details */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>👤</span> Contact Information
              </div>
              {[
                { icon: Phone, label: 'Phone / ID', value: selected.phone },
                { icon: Mail, label: 'Email Address', value: selected.email || 'Not provided' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(220,38,38,0.05)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={13} color="#dc2626" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 13, color: '#1f2937', fontWeight: 550, marginTop: 1, wordBreak: 'break-all' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Lead & Opt-out Settings */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🛡️</span> Opt-out & Lead Status
              </div>
              <div style={{ background: selected.optedOut ? '#fee2e2' : '#f0fdf4', borderRadius: 10, padding: '14px', border: selected.optedOut ? '1px solid #fca5a5' : '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: selected.optedOut ? '#991b1b' : '#065f46' }}>
                    {selected.optedOut ? 'Opted Out of Messages' : 'Subscribed to Marketing'}
                  </div>
                  <div style={{ fontSize: 11.5, color: selected.optedOut ? '#ef4444' : '#047857', marginTop: 2, lineHeight: 1.3 }}>
                    {selected.optedOut 
                      ? 'AI bot will not reply and no templates can be sent.' 
                      : 'AI bot response is active and campaigns will deliver.'}
                  </div>
                </div>
                
                {/* Toggle control */}
                <button 
                  onClick={() => toggleOptOut(selected)}
                  style={{
                    padding: '6px 12px', fontSize: 11.5, fontWeight: 700, borderRadius: 8,
                    background: selected.optedOut ? '#ef4444' : '#f3f4f6',
                    color: selected.optedOut ? '#fff' : '#4b5563',
                    border: '1px solid rgba(0,0,0,0.05)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {selected.optedOut ? 'Re-Subscribe' : 'Opt Out'}
                </button>
              </div>

              {/* Tag modification widget */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 650, color: '#4b5563', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tag size={12} /> Modify tags / lists:
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['VIP', 'Regular', 'New', 'Hot Lead'].map(tag => {
                    const hasTag = selected.tags.includes(tag);
                    return (
                      <button 
                        key={tag} 
                        onClick={() => hasTag ? handleRemoveTag(selected, tag) : handleAddTag(selected, tag)}
                        style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 20,
                          border: hasTag ? '1.5px solid #dc2626' : '1px dashed rgba(220,38,38,0.3)',
                          background: hasTag ? '#fef2f2' : 'transparent',
                          color: hasTag ? '#dc2626' : '#6b7280',
                          fontWeight: hasTag ? 600 : 500,
                          cursor: 'pointer', transition: 'all 0.12s'
                        }}
                      >
                        {hasTag ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Platform statistics */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📊</span> Engagement Stats
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Unread Texts', value: String(selected.visits), icon: '💬' },
                  { label: 'Last Activity', value: selected.lastVisit, icon: '🕐' },
                  { label: 'Channel Source', value: selected.platform, icon: '📱', capitalize: true },
                  { label: 'Status', value: selected.optedOut ? 'Blocked' : 'Active', icon: '⚡' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fafafa', borderRadius: 10, padding: '12px', border: '1px solid rgba(220,38,38,0.04)' }}>
                    <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 750, color: '#111827', textTransform: s.capitalize ? 'capitalize' : 'none' }}>{s.value}</div>
                    <div style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 550, marginTop: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Micro conversation thread history */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>💬</span> Channel Thread
              </div>
              <div 
                onClick={() => !selected.optedOut && router.push(`/conversations?conversation=${selected.id}`)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(220,38,38,0.05)', 
                  cursor: selected.optedOut ? 'default' : 'pointer' 
                }}>
                <span style={{ fontSize: 16 }}>📱</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#374151', fontWeight: 550 }}>
                    {selected.optedOut ? 'Messaging disabled (Opted Out)' : 'View full conversations thread...'}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{selected.lastVisit}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: selected.optedOut ? '#fee2e2' : '#d1fae5', color: selected.optedOut ? '#ef4444' : '#065f46' }}>
                  {selected.optedOut ? 'Suspended' : 'Live'}
                </span>
                <ChevronRight size={13} color="#9ca3af" />
              </div>
              <button
                disabled={selected.optedOut}
                onClick={() => router.push(`/conversations?conversation=${selected.id}`)}
                style={{ 
                  marginTop: 12, width: '100%', padding: '8px', fontSize: 12.5, fontWeight: 600, 
                  border: '1px solid rgba(220,38,38,0.15)', borderRadius: 8, 
                  background: selected.optedOut ? '#f3f4f6' : '#fff5f5', 
                  color: selected.optedOut ? '#9ca3af' : '#dc2626', 
                  cursor: selected.optedOut ? 'default' : 'pointer', transition: 'all 0.15s' 
                }}
                onMouseEnter={e => { if(!selected.optedOut) e.currentTarget.style.background = '#fee2e2'; }}
                onMouseLeave={e => { if(!selected.optedOut) e.currentTarget.style.background = '#fff5f5'; }}
              >
                Go to Inbox Chat Window →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: '#fff5f5' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>👤</div>
          <div style={{ fontSize: 15, fontWeight: 650, color: '#111827' }}>Select a contact</div>
          <div style={{ fontSize: 12.5, color: '#6b7280' }}>Choose an entry on the list to view detailed CRM engagement profile</div>
        </div>
      )}

      {/* MODAL 1: Add manual contact modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', width: 400, boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontSize: 16.5, fontWeight: 750, color: '#111827', margin: 0 }}>Add New CRM Contact</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={16} color="#9ca3af" /></button>
            </div>
            
            {[
              { label: 'Full Name *', value: newName, setter: setNewName, placeholder: 'e.g. Usama Habib' },
              { label: 'Phone Number / ID *', value: newPhone, setter: setNewPhone, placeholder: 'e.g. 923203967645' },
              { label: 'Email Address (optional)', value: newEmail, setter: setNewEmail, placeholder: 'e.g. contact@domain.com' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12.5, fontWeight: 650, color: '#374151', display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', outline: 'none' }} />
              </div>
            ))}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12.5, fontWeight: 650, color: '#374151', display: 'block', marginBottom: 6 }}>Custom Segmentation tags</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['VIP', 'Regular', 'New', 'Hot Lead'].map(tag => {
                  const active = newTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => active ? setNewTags(newTags.filter(t => t !== tag)) : setNewTags([...newTags, tag])}
                      style={{
                        fontSize: 10.5, padding: '4px 10px', borderRadius: 20,
                        border: active ? '1.5px solid #dc2626' : '1px dashed rgba(220,38,38,0.25)',
                        background: active ? '#fef2f2' : 'transparent',
                        color: active ? '#dc2626' : '#6b7280',
                        fontWeight: active ? 600 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, border: '1px solid rgba(220,38,38,0.2)', borderRadius: 9, background: '#fff', color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdd} style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', boxShadow: '0 3px 8px rgba(220,38,38,0.25)' }}>Save Contact</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk CSV Contact Importer */}
      {showCSV && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { if(!isImporting) setShowCSV(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', width: 580, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 750, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Upload size={18} color="#dc2626" /> Bulk CSV Contact Importer
              </h3>
              {!isImporting && (
                <button onClick={() => setShowCSV(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  <X size={18} color="#9ca3af" />
                </button>
              )}
            </div>

            {/* Importer Area */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
              {!csvFile ? (
                // Step 1: Upload CSV Dropzone
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2.5px dashed rgba(220,38,38,0.25)', borderRadius: 12,
                    padding: '36px 20px', textAlign: 'center', cursor: 'pointer',
                    background: '#fff5f5', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(220,38,38,0.25)'; e.currentTarget.style.background = '#fff5f5'; }}
                >
                  <input type="file" ref={fileInputRef} onChange={handleCSVUpload} accept=".csv" style={{ display: 'none' }} />
                  <FileText size={36} color="#dc2626" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Drag and drop your contact CSV file here</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>or click anywhere to browse local files</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 12 }}>CSV should contain: name, phone (numbers only), and optionally email / tags.</div>
                </div>
              ) : (
                // Step 2: Columns Mapping & Preview Panel
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fef2f2', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(220,38,38,0.12)', marginBottom: 16 }}>
                    <Check size={16} color="#10b981" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>File Uploaded: {csvFile.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>Size: {(csvFile.size / 1024).toFixed(1)} KB · Found {csvHeaders.length} headers</div>
                    </div>
                    <button 
                      onClick={() => { setCSVFile(null); setCSVPreview([]); }}
                      style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Reset
                    </button>
                  </div>

                  {importError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fee2e2', color: '#990000', padding: '10px 12px', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                      <AlertCircle size={14} /> {importError}
                    </div>
                  )}

                  {/* Mapping Fields */}
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', marginBottom: 10, marginTop: 0 }}>Map CSV Columns to CRM Fields:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                    {[
                      { field: 'name', label: 'Full Name Column *', required: true },
                      { field: 'phone', label: 'Phone Number Column *', required: true },
                      { field: 'email', label: 'Email Address (optional)', required: false },
                      { field: 'tags', label: 'Custom Tags Column (optional)', required: false }
                    ].map(m => (
                      <div key={m.field}>
                        <label style={{ fontSize: 11.5, fontWeight: 650, color: '#4b5563', display: 'block', marginBottom: 4 }}>{m.label}</label>
                        <select 
                          value={columnMap[m.field]} 
                          onChange={e => setColumnMap({ ...columnMap, [m.field]: e.target.value })}
                          style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid rgba(220,38,38,0.2)', borderRadius: 7, outline: 'none', background: '#fff' }}
                        >
                          <option value="">-- Choose Column --</option>
                          {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Row Preview Table */}
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>Preview (First 3 Rows):</h4>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflowX: 'auto', background: '#fafafa', marginBottom: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                          {csvHeaders.slice(0, 4).map(h => (
                            <th key={h} style={{ padding: '6px 8px', fontWeight: 600, color: '#374151', textAlign: 'left' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.slice(0, 3).map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            {csvHeaders.slice(0, 4).map(h => (
                              <td key={h} style={{ padding: '6px 8px', color: '#4b5563' }}>{row[h] || '—'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Importer Progress Bar */}
            {isImporting && (
              <div style={{ marginTop: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>
                  <span>Importing contacts to Supabase...</span>
                  <span>{importProgress}%</span>
                </div>
                <div style={{ width: '100%', height: 7, background: '#e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${importProgress}%`, height: '100%', background: 'linear-gradient(90deg, #dc2626, #ef4444)', borderRadius: 10, transition: 'width 0.1s ease-out' }} />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            {!isImporting && csvFile && (
              <div style={{ display: 'flex', gap: 8, marginTop: 16, borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
                <button 
                  onClick={() => { setCSVFile(null); setCSVPreview([]); }}
                  style={{ flex: 1, padding: '9px', fontSize: 12.5, fontWeight: 600, border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, background: '#fff', color: '#6b7280', cursor: 'pointer' }}
                >
                  Cancel File
                </button>
                <button 
                  onClick={executeCSVImport}
                  style={{ flex: 1, padding: '9px', fontSize: 12.5, fontWeight: 600, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 6px rgba(220,38,38,0.25)' }}
                >
                  Execute Bulk Import
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
