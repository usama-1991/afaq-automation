'use client';

import React, { memo, useState, useEffect } from 'react';
import { 
  X, User, Phone, Mail, Globe, ShoppingBag, 
  Calendar, Tag, ShieldCheck, Clock, ExternalLink, 
  MapPin, Sparkles, Flame, CheckCircle2, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { LIFECYCLE_STAGES } from './InboxSidebarNav';

export interface Customer360DrawerProps {
  conversation: any;
  onClose: () => void;
  teamMembers: any[];
  teams: any[];
}

export const Customer360Drawer = memo(function Customer360Drawer({
  conversation,
  onClose,
  teamMembers,
  teams,
}: Customer360DrawerProps) {
  const c = conversation;
  const [orders, setOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  const stage = LIFECYCLE_STAGES.find(s => s.id === c.lifecycle_stage) || LIFECYCLE_STAGES[0];
  const assignedMember = teamMembers.find(m => m.id === c.assigned_to);
  const assignedTeam = teams.find(t => t.id === c.team_id);

  useEffect(() => {
    const fetchAssociatedData = async () => {
      if (!c.id) return;
      setLoadingExtras(true);
      try {
        // Fetch orders by phone or customer name or tenant
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('tenant_id', c.tenant_id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (orderData) setOrders(orderData);

        // Fetch appointments
        const { data: apptData } = await supabase
          .from('appointments')
          .select('*')
          .eq('tenant_id', c.tenant_id)
          .order('start_time', { ascending: false })
          .limit(3);

        if (apptData) setAppointments(apptData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingExtras(false);
      }
    };

    fetchAssociatedData();
  }, [c.id, c.tenant_id]);

  const initials = (c.customer_name || 'Visitor')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div style={{
      width: 320,
      flexShrink: 0,
      borderLeft: '1px solid rgba(0,0,0,0.08)',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
      zIndex: 20,
    }}>
      {/* ── Drawer Header ─────────────────────────────── */}
      <div style={{
        padding: '16px 18px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
          Customer 360° Profile
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ── Customer Identity Card ────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700,
          }}>
            {initials}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.customer_name || 'Website Visitor'}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 12, marginTop: 4,
              background: stage.bg, color: stage.color, fontSize: 11, fontWeight: 700
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: stage.color }} />
              <span>{stage.label}</span>
            </div>
          </div>
        </div>

        {/* ── Contact Details ───────────────────────────── */}
        <div style={{
          background: '#f9fafb', borderRadius: 10, padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4b5563' }}>
            <Phone size={14} color="#6b7280" />
            <span style={{ fontWeight: 600, color: '#111827' }}>
              {c.customer_phone || c.external_conversation_id || 'Not provided'}
            </span>
          </div>

          {c.customer_email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4b5563' }}>
              <Mail size={14} color="#6b7280" />
              <span style={{ color: '#111827' }}>{c.customer_email}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4b5563' }}>
            <Globe size={14} color="#6b7280" />
            <span style={{ color: '#111827', textTransform: 'capitalize' }}>
              {c.platform === 'web_widget' ? 'Website Live Chat' : c.platform}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4b5563' }}>
            <Clock size={14} color="#6b7280" />
            <span style={{ color: '#6b7280' }}>
              First Contact: {new Date(c.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* ── Assigned Team & Agent ─────────────────────── */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Assignment & Routing
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280' }}>Assigned Agent</span>
              <span style={{ fontWeight: 600, color: '#111827' }}>
                {assignedMember ? assignedMember.full_name : 'AI Bot'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280' }}>Department Queue</span>
              <span style={{ fontWeight: 600, color: '#111827' }}>
                {assignedTeam ? assignedTeam.name : 'General'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Recent Orders ─────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Recent Orders
            </div>
            <ShoppingBag size={14} color="#9ca3af" />
          </div>

          {orders.length === 0 ? (
            <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', padding: '4px 0' }}>
              No previous orders found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {orders.map(order => (
                <div
                  key={order.id}
                  style={{
                    padding: '8px 10px', borderRadius: 8, background: '#f9fafb',
                    border: '1px solid #e5e7eb', fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#111827' }}>
                    <span>Order #{order.id?.slice(0, 6)}</span>
                    <span style={{ color: '#16a34a' }}>PKR {order.total_amount || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', marginTop: 2, fontSize: 11 }}>
                    <span style={{ textTransform: 'capitalize' }}>{order.status || 'Pending'}</span>
                    <span>{new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recent Appointments ───────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Appointments & Bookings
            </div>
            <Calendar size={14} color="#9ca3af" />
          </div>

          {appointments.length === 0 ? (
            <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', padding: '4px 0' }}>
              No scheduled appointments
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {appointments.map(appt => (
                <div
                  key={appt.id}
                  style={{
                    padding: '8px 10px', borderRadius: 8, background: '#f9fafb',
                    border: '1px solid #e5e7eb', fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#111827' }}>
                    {appt.service_name || appt.doctor_name || 'Consultation'}
                  </div>
                  <div style={{ color: '#6b7280', marginTop: 2, fontSize: 11 }}>
                    {appt.start_time ? new Date(appt.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
