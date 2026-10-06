'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, Clock, User, Phone, CheckCircle2, 
  XCircle, AlertCircle, Plus, ChevronLeft, ChevronRight, 
  Search, Filter, ExternalLink, RefreshCw, Stethoscope, 
  Check, X, Sparkles, MessageSquare, ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useNiche } from '@/context/NicheContext';

interface Appointment {
  id: string;
  tenant_id: string;
  conversation_id?: string;
  patient_name: string;
  patient_phone: string;
  doctor_name: string;
  treatment_type: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'no_show';
  is_new_patient?: boolean;
  estimated_revenue?: number;
  notes?: string;
  source?: string;
  google_event_id?: string;
  created_at?: string;
  provider_id?: string;
}

interface Provider {
  id: string;
  name: string;
  title: string;
  shift_start: string;
  shift_end: string;
  slot_duration_minutes: number;
  google_calendar_id?: string;
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
];

export default function AppointmentsPage() {
  const { nicheId } = useNiche();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Navigation
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'list'>('day');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Appointment Modal
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // New Booking Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({
    patient_name: '',
    patient_phone: '',
    doctor_name: '',
    treatment_type: 'General Consultation',
    appointment_date: selectedDate,
    appointment_time: '10:00:00',
    notes: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
      if (!profile?.tenant_id) return;

      const tid = profile.tenant_id;

      // 1. Fetch Providers
      const provRes = await fetch('/api/providers');
      if (provRes.ok) {
        const provData = await provRes.json();
        setProviders(provData.providers || []);
      }

      // 2. Fetch Appointments
      const { data: apptData, error: apptErr } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', tid)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: true });

      if (!apptErr && apptData) {
        setAppointments(apptData as Appointment[]);
      }
    } catch (e) {
      console.error('Error fetching appointments:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Date Navigation Helpers
  const changeDateBy = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = useMemo(() => {
    return selectedDate === new Date().toISOString().split('T')[0];
  }, [selectedDate]);

  const formattedDateTitle = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [selectedDate]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      // Date filter for day view
      if (viewMode === 'day' && a.appointment_date !== selectedDate) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'scheduled' && !['scheduled', 'confirmed'].includes(a.status)) return false;
        if (statusFilter === 'canceled' && a.status !== 'canceled') return false;
        if (statusFilter === 'completed' && a.status !== 'completed') return false;
        if (statusFilter === 'pending' && a.status !== 'pending') return false;
      }

      // Doctor filter
      if (selectedDoctorFilter !== 'all') {
        const docName = (a.doctor_name || '').toLowerCase();
        if (!docName.includes(selectedDoctorFilter.toLowerCase())) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pName = (a.patient_name || '').toLowerCase();
        const pPhone = (a.patient_phone || '').toLowerCase();
        const treat = (a.treatment_type || '').toLowerCase();
        if (!pName.includes(q) && !pPhone.includes(q) && !treat.includes(q)) return false;
      }

      return true;
    });
  }, [appointments, selectedDate, viewMode, statusFilter, selectedDoctorFilter, searchQuery]);

  // Group appointments by Doctor for Day View
  const doctorColumns = useMemo(() => {
    const docs = providers.map(p => p.name);
    // Add "Any Available / Unassigned" column if there are appointments with no specific doctor
    const hasUnassigned = filteredAppointments.some(a => !a.doctor_name || a.doctor_name === 'Any Available');
    const cols = [...docs];
    if (hasUnassigned || cols.length === 0) {
      cols.push('Any Available');
    }
    return cols;
  }, [providers, filteredAppointments]);

  // Update appointment status
  const handleUpdateStatus = async (apptId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', apptId);

      if (error) throw error;

      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: newStatus as any } : a));
      if (selectedAppt && selectedAppt.id === apptId) {
        setSelectedAppt(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Create manual appointment
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
      if (!profile?.tenant_id) return;

      const payload = {
        tenant_id: profile.tenant_id,
        patient_name: newForm.patient_name.trim(),
        patient_phone: newForm.patient_phone.trim(),
        doctor_name: newForm.doctor_name || 'Dr. Hassan Ahmed',
        treatment_type: newForm.treatment_type,
        appointment_date: newForm.appointment_date,
        appointment_time: newForm.appointment_time,
        status: 'scheduled',
        notes: newForm.notes,
        source: 'dashboard',
        timezone: 'Asia/Karachi'
      };

      const { data: created, error } = await supabase
        .from('appointments')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      if (created) {
        setAppointments(prev => [created as Appointment, ...prev]);
        setShowNewModal(false);
      }
    } catch (err: any) {
      alert(`Failed to create appointment: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'scheduled':
        return { label: 'Confirmed', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'completed':
        return { label: 'Completed', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
      case 'canceled':
        return { label: 'Canceled', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      case 'pending':
      default:
        return { label: 'Pending', bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        background: '#fff',
        padding: '20px 24px',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CalendarIcon size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>
              Appointments &amp; Clinic Schedule
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '3px 0 0 0' }}>
              Live patient bookings across WhatsApp AI, Google Calendar, and manual clinic walk-ins.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => { setRefreshing(true); fetchData(); }}
            title="Refresh Schedule"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: 'pointer',
              color: '#4b5563'
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => {
              setNewForm(prev => ({ ...prev, appointment_date: selectedDate }));
              setShowNewModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 10,
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
            }}
          >
            <Plus size={16} />
            New Appointment
          </button>
        </div>
      </div>

      {/* Control Bar: Date Navigator, Views & Filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        background: '#fff',
        padding: '14px 20px',
        borderRadius: 14,
        border: '1px solid #e5e7eb'
      }}>
        {/* Date Navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => changeDateBy(-1)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#374151'
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: `1px solid ${isToday ? '#dc2626' : '#e5e7eb'}`,
              background: isToday ? '#fef2f2' : '#fff',
              color: isToday ? '#dc2626' : '#374151',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Today
          </button>

          <button
            onClick={() => changeDateBy(1)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#374151'
            }}
          >
            <ChevronRight size={16} />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 13,
              fontWeight: 600,
              color: '#111827',
              outline: 'none',
              cursor: 'pointer'
            }}
          />

          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', marginLeft: 6 }}>
            {formattedDateTitle}
          </span>
        </div>

        {/* View Mode & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Doctor Filter */}
          <select
            value={selectedDoctorFilter}
            onChange={e => setSelectedDoctorFilter(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 12.5,
              background: '#fff',
              color: '#374151',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Doctors ({providers.length})</option>
            {providers.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 12.5,
              background: '#fff',
              color: '#374151',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled / Confirmed</option>
            <option value="pending">Pending Confirmation</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>

          {/* View Mode Toggles */}
          <div style={{
            display: 'flex',
            background: '#f3f4f6',
            borderRadius: 8,
            padding: 3,
            border: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => setViewMode('day')}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: viewMode === 'day' ? '#fff' : 'transparent',
                color: viewMode === 'day' ? '#111827' : '#6b7280',
                boxShadow: viewMode === 'day' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Day Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: viewMode === 'list' ? '#fff' : 'transparent',
                color: viewMode === 'list' ? '#111827' : '#6b7280',
                boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {/* ── DAY GRID VIEW (Columns by Doctor) ── */}
      {viewMode === 'day' && (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          overflowX: 'auto',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ minWidth: 800 }}>
            {/* Table Header: Doctors Columns */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `100px repeat(${doctorColumns.length}, minmax(180px, 1fr))`,
              borderBottom: '2px solid #f3f4f6',
              background: '#f9fafb',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div style={{
                padding: '14px 16px',
                fontSize: 12,
                fontWeight: 700,
                color: '#6b7280',
                borderRight: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center'
              }}>
                TIME
              </div>

              {doctorColumns.map(docName => {
                const docAppointments = filteredAppointments.filter(a => (a.doctor_name || 'Any Available') === docName);
                return (
                  <div
                    key={docName}
                    style={{
                      padding: '14px 18px',
                      borderRight: '1px solid #f3f4f6',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2
                    }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Stethoscope size={14} color="#dc2626" />
                      {docName}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#6b7280' }}>
                      {docAppointments.length} appointment{docAppointments.length === 1 ? '' : 's'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Slot Rows */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {TIME_SLOTS.map(slotTime => {
                return (
                  <div
                    key={slotTime}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `100px repeat(${doctorColumns.length}, minmax(180px, 1fr))`,
                      borderBottom: '1px solid #f3f4f6',
                      minHeight: 56
                    }}
                  >
                    {/* Time Label */}
                    <div style={{
                      padding: '10px 16px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: '#6b7280',
                      borderRight: '1px solid #f3f4f6',
                      background: '#fafafa',
                      display: 'flex',
                      alignItems: 'flex-start'
                    }}>
                      {slotTime}
                    </div>

                    {/* Columns for each doctor at this time slot */}
                    {doctorColumns.map(docName => {
                      // Find appointment starting at this slot (match HH:MM)
                      const matchedAppt = filteredAppointments.find(a => {
                        const apptDoc = a.doctor_name || 'Any Available';
                        if (apptDoc !== docName) return false;
                        const aTime = (a.appointment_time || '').slice(0, 5);
                        return aTime === slotTime;
                      });

                      if (matchedAppt) {
                        const badge = getStatusBadge(matchedAppt.status);
                        return (
                          <div
                            key={docName}
                            onClick={() => setSelectedAppt(matchedAppt)}
                            style={{
                              padding: 6,
                              borderRight: '1px solid #f3f4f6',
                              background: '#fff'
                            }}
                          >
                            <div style={{
                              background: badge.bg,
                              border: `1px solid ${badge.border}`,
                              borderRadius: 8,
                              padding: '8px 10px',
                              cursor: 'pointer',
                              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.06)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                            }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                                  {matchedAppt.patient_name}
                                </span>
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: badge.color,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: '#fff'
                                }}>
                                  {badge.label}
                                </span>
                              </div>
                              <div style={{ fontSize: 11.5, color: '#4b5563', fontWeight: 500 }}>
                                {matchedAppt.treatment_type || 'Consultation'}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 10.5, color: '#6b7280' }}>
                                <span>{(matchedAppt.appointment_time || '').slice(0, 5)}</span>
                                {matchedAppt.source === 'google' && (
                                  <span style={{ color: '#2563eb', fontWeight: 600 }}>● GCal</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Empty Slot Cell
                      return (
                        <div
                          key={docName}
                          onClick={() => {
                            setNewForm({
                              patient_name: '',
                              patient_phone: '',
                              doctor_name: docName === 'Any Available' ? (providers[0]?.name || '') : docName,
                              treatment_type: 'General Consultation',
                              appointment_date: selectedDate,
                              appointment_time: `${slotTime}:00`,
                              notes: ''
                            });
                            setShowNewModal(true);
                          }}
                          style={{
                            padding: 6,
                            borderRight: '1px solid #f3f4f6',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.12s'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ fontSize: 11, color: '#9ca3af', opacity: 0, transition: 'opacity 0.12s' }} className="slot-hint">
                            + Book
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === 'list' && (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          {filteredAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
              <CalendarIcon size={36} color="#d1d5db" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>No appointments match your filters</h3>
              <p style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 4 }}>Try clearing search or picking a different date.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: 12, fontWeight: 700 }}>
                  <th style={{ padding: '12px 18px' }}>PATIENT</th>
                  <th style={{ padding: '12px 18px' }}>TREATMENT</th>
                  <th style={{ padding: '12px 18px' }}>DOCTOR</th>
                  <th style={{ padding: '12px 18px' }}>DATE &amp; TIME</th>
                  <th style={{ padding: '12px 18px' }}>STATUS</th>
                  <th style={{ padding: '12px 18px' }}>SOURCE</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map(a => {
                  const badge = getStatusBadge(a.status);
                  return (
                    <tr
                      key={a.id}
                      onClick={() => setSelectedAppt(a)}
                      style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#111827' }}>{a.patient_name}</div>
                        <div style={{ fontSize: 11.5, color: '#6b7280' }}>{a.patient_phone || 'No phone'}</div>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#374151', fontWeight: 500 }}>
                        {a.treatment_type || 'General Consultation'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#111827', fontWeight: 600 }}>
                          <Stethoscope size={13} color="#dc2626" />
                          {a.doctor_name || 'Any Available'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{a.appointment_date}</div>
                        <div style={{ fontSize: 11.5, color: '#6b7280' }}>{(a.appointment_time || '').slice(0, 5)} PKT</div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 20,
                          fontSize: 11.5,
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {a.source === 'google' ? (
                          <span style={{ fontSize: 11.5, color: '#2563eb', fontWeight: 600 }}>Google Calendar</span>
                        ) : a.conversation_id ? (
                          <span style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 600 }}>WhatsApp AI</span>
                        ) : (
                          <span style={{ fontSize: 11.5, color: '#6b7280' }}>Manual Entry</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedAppt(a);
                          }}
                          style={{
                            background: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#374151',
                            cursor: 'pointer'
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
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
            maxWidth: 480,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                    Appointment Details
                  </h3>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0 0' }}>
                    ID: {selectedAppt.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppt(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {/* Patient Info */}
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>
                  Patient
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{selectedAppt.patient_name}</div>
                <div style={{ fontSize: 12.5, color: '#4b5563', marginTop: 2 }}>{selectedAppt.patient_phone || 'No phone'}</div>
              </div>

              {/* Doctor & Treatment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>
                    Doctor
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>
                    {selectedAppt.doctor_name || 'Any Available'}
                  </div>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>
                    Treatment
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>
                    {selectedAppt.treatment_type || 'General Consultation'}
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>
                    Date
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>
                    {selectedAppt.appointment_date}
                  </div>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>
                    Time
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>
                    {(selectedAppt.appointment_time || '').slice(0, 5)} (PKT)
                  </div>
                </div>
              </div>

              {/* Status & Sync info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#4b5563' }}>Current Status:</span>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: 20,
                    fontSize: 11.5,
                    fontWeight: 700,
                    background: getStatusBadge(selectedAppt.status).bg,
                    color: getStatusBadge(selectedAppt.status).color,
                    border: `1px solid ${getStatusBadge(selectedAppt.status).border}`
                  }}>
                    {getStatusBadge(selectedAppt.status).label}
                  </span>
                </div>

                {selectedAppt.google_event_id && (
                  <span style={{ fontSize: 11.5, color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={13} color="#2563eb" /> Synced to Google
                  </span>
                )}
              </div>
            </div>

            {/* Quick Status Change Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
              <button
                disabled={updatingStatus || selectedAppt.status === 'completed'}
                onClick={() => handleUpdateStatus(selectedAppt.id, 'completed')}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#2563eb',
                  color: '#fff',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: updatingStatus ? 'not-allowed' : 'pointer'
                }}
              >
                Mark Completed
              </button>

              <button
                disabled={updatingStatus || selectedAppt.status === 'canceled'}
                onClick={() => handleUpdateStatus(selectedAppt.id, 'canceled')}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: 8,
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: updatingStatus ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      {showNewModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
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
            maxWidth: 480,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                Book New Appointment
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Patient Full Name *
                </label>
                <input
                  required
                  placeholder="e.g. Usama Habib"
                  value={newForm.patient_name}
                  onChange={e => setNewForm({ ...newForm, patient_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Phone Number
                </label>
                <input
                  placeholder="+92 300 1234567"
                  value={newForm.patient_phone}
                  onChange={e => setNewForm({ ...newForm, patient_phone: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    Doctor
                  </label>
                  <select
                    value={newForm.doctor_name}
                    onChange={e => setNewForm({ ...newForm, doctor_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12.5, background: '#fff', outline: 'none' }}
                  >
                    <option value="">Any Available</option>
                    {providers.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    Treatment
                  </label>
                  <select
                    value={newForm.treatment_type}
                    onChange={e => setNewForm({ ...newForm, treatment_type: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12.5, background: '#fff', outline: 'none' }}
                  >
                    <option value="General Consultation">General Consultation</option>
                    <option value="Scaling & Polishing">Scaling &amp; Polishing</option>
                    <option value="Teeth Whitening">Teeth Whitening</option>
                    <option value="Root Canal">Root Canal</option>
                    <option value="Braces Consultation">Braces Consultation</option>
                    <option value="Dental Filling">Dental Filling</option>
                    <option value="Tooth Extraction">Tooth Extraction</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newForm.appointment_date}
                    onChange={e => setNewForm({ ...newForm, appointment_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12.5, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    Time Slot
                  </label>
                  <select
                    value={newForm.appointment_time}
                    onChange={e => setNewForm({ ...newForm, appointment_time: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12.5, background: '#fff', outline: 'none' }}
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={`${t}:00`}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#4b5563', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
