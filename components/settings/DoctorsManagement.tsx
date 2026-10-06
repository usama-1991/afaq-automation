'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Calendar, Clock, Check, X, Edit3, Trash2, 
  Loader2, AlertCircle, Sparkles, CheckCircle2, Shield, Stethoscope
} from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  title: string;
  email?: string;
  phone?: string;
  google_calendar_id?: string;
  working_days: number[];
  shift_start: string;
  shift_end: string;
  slot_duration_minutes: number;
  is_active: boolean;
}

interface GoogleCalendarOption {
  id: string;
  summary: string;
  primary: boolean;
  timeZone?: string;
}

const DAYS_OF_WEEK = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

export function DoctorsManagement() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendarOption[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    google_calendar_id: 'primary',
    working_days: [1, 2, 3, 4, 5, 6],
    shift_start: '09:00',
    shift_end: '18:00',
    slot_duration_minutes: 30,
    is_active: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Providers
      const provRes = await fetch('/api/providers');
      if (provRes.ok) {
        const provData = await provRes.json();
        setProviders(provData.providers || []);
      }

      // 2. Fetch Google Calendars
      const calRes = await fetch('/api/integrations/google/calendars');
      if (calRes.ok) {
        const calData = await calRes.json();
        setGoogleConnected(calData.connected);
        setGoogleCalendars(calData.calendars || []);
      }
    } catch (e) {
      console.error('Failed to load doctors or calendars:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingProvider(null);
    setFormData({
      name: '',
      title: 'General Dentistry',
      email: '',
      phone: '',
      google_calendar_id: 'primary',
      working_days: [1, 2, 3, 4, 5, 6],
      shift_start: '09:00',
      shift_end: '18:00',
      slot_duration_minutes: 30,
      is_active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (p: Provider) => {
    setEditingProvider(p);
    setFormData({
      name: p.name,
      title: p.title || '',
      email: p.email || '',
      phone: p.phone || '',
      google_calendar_id: p.google_calendar_id || 'primary',
      working_days: p.working_days || [1, 2, 3, 4, 5],
      shift_start: (p.shift_start || '09:00:00').slice(0, 5),
      shift_end: (p.shift_end || '18:00:00').slice(0, 5),
      slot_duration_minutes: p.slot_duration_minutes || 30,
      is_active: p.is_active !== undefined ? p.is_active : true,
    });
    setShowModal(true);
  };

  const toggleDay = (d: number) => {
    setFormData(prev => {
      const exists = prev.working_days.includes(d);
      const nextDays = exists 
        ? prev.working_days.filter(x => x !== d) 
        : [...prev.working_days, d].sort();
      return { ...prev, working_days: nextDays };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (editingProvider) {
        // Update
        const res = await fetch('/api/providers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProvider.id, ...formData }),
        });
        if (!res.ok) throw new Error('Failed to update doctor');
      } else {
        // Create
        const res = await fetch('/api/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to create doctor');
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert(`Error saving doctor: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your clinic providers?`)) return;
    try {
      const res = await fetch(`/api/providers?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete doctor');
      setProviders(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getCalendarName = (calId?: string) => {
    if (!calId || calId === 'primary') return 'Primary Google Calendar';
    const found = googleCalendars.find(c => c.id === calId);
    return found ? found.summary : 'Google Sub-Calendar';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 960 }}>
      {/* Top Banner & Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        padding: '24px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Stethoscope size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
              Doctors & Providers Directory
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0 0' }}>
              Configure doctor shifts and map each doctor to their own Google Calendar for automated WhatsApp bookings.
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#b91c1c')}
          onMouseLeave={e => (e.currentTarget.style.background = '#dc2626')}
        >
          <UserPlus size={16} />
          Add Doctor / Specialist
        </button>
      </div>

      {/* Google Calendar Connection Status Notice */}
      {!googleConnected && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          background: '#fffbeb',
          border: '1px solid #fef3c7',
          borderRadius: 12,
          fontSize: 13,
          color: '#92400e'
        }}>
          <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong>Google Calendar not connected:</strong> Connect your clinic Google account in{' '}
            <span style={{ textDecoration: 'underline', fontWeight: 600 }}>Settings &gt; Integrations</span> to sync doctor sub-calendars directly with WhatsApp AI bookings.
          </div>
        </div>
      )}

      {/* Doctor Cards Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: '#9ca3af' }}>
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : providers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#fff',
          border: '1.5px dashed #e5e7eb',
          borderRadius: 16
        }}>
          <Stethoscope size={40} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 4 }}>No doctors added yet</h3>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>
            Add your clinic doctors so patients can select them and have bookings routed to their calendar.
          </p>
          <button
            onClick={openAddModal}
            style={{
              padding: '8px 16px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Add Your First Doctor
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {providers.map(p => (
            <div
              key={p.id}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                position: 'relative'
              }}
            >
              <div>
                {/* Status Badge & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '3px 8px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: p.is_active ? '#ecfdf5' : '#f3f4f6',
                    color: p.is_active ? '#059669' : '#6b7280',
                    border: `1px solid ${p.is_active ? '#a7f3d0' : '#e5e7eb'}`
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.is_active ? '#10b981' : '#9ca3af' }} />
                    {p.is_active ? 'Accepting Appointments' : 'Inactive'}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => openEditModal(p)}
                      title="Edit Doctor"
                      style={{
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        padding: 6,
                        cursor: 'pointer',
                        color: '#4b5563'
                      }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      title="Remove Doctor"
                      style={{
                        background: '#fff1f2',
                        border: '1px solid #ffe4e6',
                        borderRadius: 6,
                        padding: 6,
                        cursor: 'pointer',
                        color: '#dc2626'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Doctor Identity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontSize: 16,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #fee2e2'
                  }}>
                    {p.name.replace(/^Dr\.\s*/i, '').charAt(0) || 'D'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
                      {p.name}
                    </h3>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0 0' }}>
                      {p.title || 'General Specialist'}
                    </p>
                  </div>
                </div>

                {/* Shift Hours & Slot */}
                <div style={{
                  background: '#f9fafb',
                  borderRadius: 10,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 12,
                  fontSize: 12,
                  color: '#374151'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={14} color="#6b7280" />
                    <span>{(p.shift_start || '09:00').slice(0, 5)} – {(p.shift_end || '18:00').slice(0, 5)}</span>
                  </div>
                  <span style={{ color: '#d1d5db' }}>|</span>
                  <div style={{ color: '#6b7280' }}>
                    {p.slot_duration_minutes || 30}m slots
                  </div>
                </div>

                {/* Working Days Chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
                  {DAYS_OF_WEEK.map(d => {
                    const isWorking = (p.working_days || []).includes(d.day);
                    return (
                      <span
                        key={d.day}
                        style={{
                          fontSize: 10.5,
                          fontWeight: isWorking ? 700 : 500,
                          padding: '2px 7px',
                          borderRadius: 6,
                          background: isWorking ? '#eff6ff' : '#f3f4f6',
                          color: isWorking ? '#2563eb' : '#9ca3af',
                          border: `1px solid ${isWorking ? '#bfdbfe' : '#e5e7eb'}`
                        }}
                      >
                        {d.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Connected Google Calendar Footer */}
              <div style={{
                paddingTop: 12,
                borderTop: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: '#4b5563'
              }}>
                <Calendar size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                <span style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1,
                  fontWeight: 500
                }}>
                  {getCalendarName(p.google_calendar_id)}
                </span>
                {googleConnected && (
                  <span title="Connected to Google Calendar" style={{ display: 'inline-flex' }}>
                    <CheckCircle2 size={13} color="#10b981" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Stethoscope size={18} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                  {editingProvider ? 'Edit Doctor & Schedule' : 'Add New Doctor'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Doctor Name */}
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Doctor Full Name *
                </label>
                <input
                  required
                  placeholder="e.g. Dr. Hassan Ahmed"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Specialty / Title */}
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Specialty / Treatment Focus
                </label>
                <input
                  placeholder="e.g. Orthodontics & Braces, General Dentistry"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Email & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="doctor@clinic.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Phone (Optional)
                  </label>
                  <input
                    placeholder="+92 300 0000000"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Google Sub-Calendar Selector */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>
                    Google Calendar Destination
                  </label>
                  <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>
                    {googleConnected ? '● Google Sync Active' : '○ Google Not Connected'}
                  </span>
                </div>
                <select
                  value={formData.google_calendar_id}
                  onChange={e => setFormData({ ...formData, google_calendar_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 13,
                    background: '#fff',
                    outline: 'none'
                  }}
                >
                  <option value="primary">Primary Calendar (Default)</option>
                  {googleCalendars
                    .filter(c => !c.primary)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.summary} (Sub-calendar)
                      </option>
                    ))}
                </select>
                <p style={{ fontSize: 11.5, color: '#6b7280', margin: '4px 0 0 0' }}>
                  Appointments booked with this doctor will be scheduled directly on this Google Calendar.
                </p>
              </div>

              {/* Working Days */}
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Working Days
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {DAYS_OF_WEEK.map(d => {
                    const active = formData.working_days.includes(d.day);
                    return (
                      <button
                        type="button"
                        key={d.day}
                        onClick={() => toggleDay(d.day)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: active ? '#dc2626' : '#f3f4f6',
                          color: active ? '#fff' : '#4b5563',
                          border: `1px solid ${active ? '#dc2626' : '#e5e7eb'}`,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shift Hours & Slot Length */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    Shift Start
                  </label>
                  <input
                    type="time"
                    value={formData.shift_start}
                    onChange={e => setFormData({ ...formData, shift_start: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      fontSize: 12.5,
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    Shift End
                  </label>
                  <input
                    type="time"
                    value={formData.shift_end}
                    onChange={e => setFormData({ ...formData, shift_end: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      fontSize: 12.5,
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    Slot Length
                  </label>
                  <select
                    value={formData.slot_duration_minutes}
                    onChange={e => setFormData({ ...formData, slot_duration_minutes: parseInt(e.target.value, 10) })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      fontSize: 12.5,
                      background: '#fff',
                      outline: 'none'
                    }}
                  >
                    <option value={15}>15 mins</option>
                    <option value={20}>20 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                  </select>
                </div>
              </div>

              {/* Status Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="doc-active"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: '#dc2626', cursor: 'pointer' }}
                />
                <label htmlFor="doc-active" style={{ fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
                  Active (Accepting new appointments via WhatsApp &amp; Ittisalo)
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 12, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    color: '#4b5563',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#dc2626',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editingProvider ? 'Update Doctor' : 'Save Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
