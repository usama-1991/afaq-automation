'use client';

import { useState } from 'react';
import { Search, Plus, MessageSquare, Phone, Mail, Tag, X, ChevronRight } from 'lucide-react';
import { useNiche } from '@/context/NicheContext';
import { Contact } from '@/lib/niches';

const tagColors: Record<string, { bg: string; color: string }> = {
  VIP:        { bg: '#fef3c7', color: '#92400e' },
  Regular:    { bg: '#dbeafe', color: '#1e40af' },
  New:        { bg: '#d1fae5', color: '#065f46' },
  'Hot Lead': { bg: '#fce7f3', color: '#9d174d' },
  Buyer:      { bg: '#ede9fe', color: '#5b21b6' },
  Renter:     { bg: '#f0fdf4', color: '#166534' },
};

export default function ContactsPage() {
  const { niche } = useNiche();
  const [contacts, setContacts] = useState<Contact[]>(niche.contacts);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Contact | null>(contacts[0] ?? null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const filtered = contacts.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const handleAdd = () => {
    if (!newName || !newPhone) return;
    const c: Contact = {
      id: Date.now(), name: newName, phone: newPhone, email: newEmail,
      visits: 0, lastVisit: 'Just now', totalSpent: '—', tags: ['New'],
    };
    setContacts(prev => [c, ...prev]);
    setSelected(c);
    setShowAdd(false);
    setNewName(''); setNewPhone(''); setNewEmail('');
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 38px)' }}>
      {/* Left: contact list */}
      <div style={{ width: 300, background: '#fff', borderRight: '1px solid rgba(99,102,241,0.1)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Contacts</h2>
            <button onClick={() => setShowAdd(true)} style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #4f46e5, #2563eb)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={15} color="#fff" />
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..."
              style={{ width: '100%', padding: '8px 10px 8px 28px', fontSize: 12.5, border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, background: '#f8f9ff', fontFamily: 'inherit', color: '#111', outline: 'none' }} />
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(99,102,241,0.08)', borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
          {[
            { label: 'Total', value: contacts.length },
            { label: 'VIP', value: contacts.filter(c => c.tags.includes('VIP')).length },
            { label: 'New', value: contacts.filter(c => c.tags.includes('New')).length },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRight: '1px solid rgba(99,102,241,0.08)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: '#9ca3af' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No contacts yet</div>
          ) : filtered.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} style={{
              padding: '12px 16px', cursor: 'pointer',
              borderBottom: '1px solid rgba(99,102,241,0.06)',
              background: selected?.id === c.id ? '#f0f4ff' : 'transparent',
              borderLeft: selected?.id === c.id ? '3px solid #2563eb' : '3px solid transparent',
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => { if (selected?.id !== c.id) (e.currentTarget as HTMLElement).style.background = '#f8f9ff'; }}
            onMouseLeave={e => { if (selected?.id !== c.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {c.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 1 }}>{c.phone}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {c.tags.slice(0, 1).map(tag => (
                    <span key={tag} style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 10, ...(tagColors[tag] ?? { bg: '#f3f4f6', color: '#374151' }) }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(99,102,241,0.08)' }}>
          <button onClick={() => setShowAdd(true)} style={{
            width: '100%', padding: '9px', fontSize: 13, fontWeight: 600,
            background: 'linear-gradient(135deg, #4f46e5, #2563eb)', color: '#fff',
            border: 'none', borderRadius: 9, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: '0 3px 10px rgba(79,70,229,0.2)',
          }}>
            <Plus size={14} /> Add Contact
          </button>
        </div>
      </div>

      {/* Right: contact detail */}
      {selected ? (
        <div style={{ flex: 1, background: '#f8f9ff', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ background: '#fff', borderBottom: '1px solid rgba(99,102,241,0.1)', padding: '20px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {selected.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px', marginBottom: 4 }}>{selected.name}</h2>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selected.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 10, ...(tagColors[tag] ?? { bg: '#f3f4f6', color: '#374151' }) }}>{tag}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, background: 'linear-gradient(135deg, #4f46e5, #2563eb)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  <MessageSquare size={13} /> Message
                </button>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, background: '#fff', color: '#374151', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, cursor: 'pointer' }}>
                  <Phone size={13} /> Call
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Contact Info */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(99,102,241,0.1)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>👤</span> Contact Information
              </div>
              {[
                { icon: Phone, label: 'Phone', value: selected.phone },
                { icon: Mail, label: 'Email', value: selected.email || 'Not provided' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(99,102,241,0.07)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color="#4f46e5" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 13.5, color: '#111827', fontWeight: 500, marginTop: 1 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Activity Stats */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(99,102,241,0.1)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📊</span> Activity
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Total Visits', value: String(selected.visits), icon: '🔄' },
                  { label: 'Last Contact', value: selected.lastVisit, icon: '🕐' },
                  { label: 'Total Spent', value: selected.totalSpent, icon: '💰' },
                  { label: 'Channel', value: 'WhatsApp', icon: '💬' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#f8f9ff', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(99,102,241,0.08)' }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(99,102,241,0.1)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag size={14} /> Tags
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {selected.tags.map(tag => (
                  <span key={tag} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 12.5, fontWeight: 500, padding: '5px 10px', borderRadius: 20,
                    ...(tagColors[tag] ?? { bg: '#f3f4f6', color: '#374151' }),
                    cursor: 'pointer',
                  }}>
                    {tag}
                    <X size={10} onClick={() => setSelected({ ...selected, tags: selected.tags.filter(t => t !== tag) })} />
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['VIP', 'Regular', 'New', 'Hot Lead'].filter(t => !selected.tags.includes(t)).map(tag => (
                  <button key={tag} onClick={() => setSelected({ ...selected, tags: [...selected.tags, tag] })}
                    style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, border: '1px dashed rgba(99,102,241,0.3)', background: 'transparent', color: '#6b7280', cursor: 'pointer' }}>
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation history */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(99,102,241,0.1)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>💬</span> Recent Conversations
              </div>
              {[
                { preview: 'Asked about availability...', time: selected.lastVisit, channel: '💬', resolved: true },
                { preview: 'Requested pricing info', time: '1 week ago', channel: '💬', resolved: true },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(99,102,241,0.07)', cursor: 'pointer' }}>
                  <span style={{ fontSize: 18 }}>{c.channel}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{c.preview}</div>
                    <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 1 }}>{c.time}</div>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 500, padding: '2px 8px', borderRadius: 10, background: c.resolved ? '#d1fae5' : '#fef3c7', color: c.resolved ? '#065f46' : '#92400e' }}>
                    {c.resolved ? 'Resolved' : 'Pending'}
                  </span>
                  <ChevronRight size={13} color="#9ca3af" />
                </div>
              ))}
              <button style={{ marginTop: 10, width: '100%', padding: '8px', fontSize: 12.5, fontWeight: 500, border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, background: '#f8f9ff', color: '#4f46e5', cursor: 'pointer' }}>
                View all conversations →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👤</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Select a contact</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Choose a contact to view their profile</div>
        </div>
      )}

      {/* Add contact modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Add New Contact</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={18} color="#9ca3af" /></button>
            </div>
            {[
              { label: 'Full Name *', value: newName, setter: setNewName, placeholder: 'e.g. Sara Ahmed' },
              { label: 'Phone Number *', value: newPhone, setter: setNewPhone, placeholder: '+92 300 0000000' },
              { label: 'Email (optional)', value: newEmail, setter: setNewEmail, placeholder: 'email@example.com' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13.5, border: '1.5px solid rgba(99,102,241,0.2)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', outline: 'none' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, border: '1px solid rgba(99,102,241,0.2)', borderRadius: 9, background: '#fff', color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdd} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg, #4f46e5, #2563eb)', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', boxShadow: '0 3px 10px rgba(79,70,229,0.25)' }}>Add Contact</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
