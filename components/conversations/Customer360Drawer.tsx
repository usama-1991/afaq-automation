'use client';

import React, { memo, useState, useEffect } from 'react';
import { 
  X, User, Phone, Mail, Globe, ShoppingBag, 
  Calendar, Tag, ShieldCheck, Clock, ExternalLink, 
  MapPin, Sparkles, Flame, CheckCircle2, ChevronRight,
  Truck, CreditCard, RefreshCw, Box
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

  const phone = c.customer_phone || c.external_conversation_id;

  useEffect(() => {
    const fetchAssociatedData = async () => {
      if (!c.id) return;
      setLoadingExtras(true);
      try {
        // Fetch orders by conversation_id or customer_phone
        let query = supabase
          .from('orders')
          .select('*')
          .eq('tenant_id', c.tenant_id);

        if (phone) {
          query = query.or(`conversation_id.eq.${c.id},customer_phone.eq.${phone}`);
        } else {
          query = query.eq('conversation_id', c.id);
        }

        const { data: orderData } = await query
          .order('created_at', { ascending: false })
          .limit(5);

        if (orderData) setOrders(orderData);

        // Fetch appointments
        const { data: apptData } = await supabase
          .from('appointments')
          .select('*')
          .eq('tenant_id', c.tenant_id)
          .or(`conversation_id.eq.${c.id},customer_phone.eq.${phone || 'none'}`)
          .order('start_time', { ascending: false })
          .limit(5);

        if (apptData) setAppointments(apptData);
      } catch (e) {
        console.error('Error fetching customer 360 data:', e);
      } finally {
        setLoadingExtras(false);
      }
    };

    fetchAssociatedData();
  }, [c.id, c.tenant_id, phone]);

  const initials = (c.customer_name || 'Visitor')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div style={{
      width: 330,
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
        position: 'sticky',
        top: 0,
        background: '#ffffff',
        zIndex: 2,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
          <User size={16} className="text-emerald-600" />
          Customer 360° Profile
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ── Avatar & Basic Info ────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: 58, height: 58, borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, marginBottom: 10,
            boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
          }}>
            {initials}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
            {c.customer_name || 'Anonymous Visitor'}
          </div>
          <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>
            {phone || 'No phone attached'}
          </div>

          {/* Lifecycle Stage Badge */}
          <div style={{
            marginTop: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 11.5,
            fontWeight: 600,
            background: `${stage.color}15`,
            color: stage.color,
            border: `1px solid ${stage.color}30`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: stage.color }} />
            {stage.label}
          </div>
        </div>

        {/* ── Contact Metadata ──────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          background: '#f9fafb', borderRadius: 10, padding: '12px 14px',
          border: '1px solid #f3f4f6', fontSize: 12.5
        }}>
          {c.customer_email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4b5563' }}>
              <Mail size={14} color="#6b7280" />
              <span style={{ color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.customer_email}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4b5563' }}>
            <Globe size={14} color="#6b7280" />
            <span style={{ color: '#111827', textTransform: 'capitalize' }}>
              {c.platform === 'web_widget' ? 'Website Live Chat' : c.platform || 'WhatsApp'}
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

        {/* ── Recent Orders & Multi-Store Sync ──────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
              <ShoppingBag size={13} />
              Recent Orders & COD
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981' }}>{orders.length} Total</span>
          </div>

          {loadingExtras ? (
            <div style={{ fontSize: 12, color: '#9ca3af', padding: '8px 0', textAlign: 'center' }}>
              Loading order history...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', padding: '6px 0' }}>
              No previous orders found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {orders.map(order => {
                const isCod = (order.payment_method || '').toLowerCase().includes('cod');
                const storeSynced = order.platform_source || (order.platform_order_number ? 'synced' : null);

                return (
                  <div
                    key={order.id}
                    style={{
                      padding: '10px 12px', borderRadius: 9, background: '#f9fafb',
                      border: '1px solid #e5e7eb', fontSize: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: '#111827' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Box size={13} className="text-gray-500" />
                        {order.platform_order_number || `Order #${order.id?.slice(0, 6)}`}
                      </span>
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>
                        {order.currency || 'PKR'} {order.order_amount || order.total_amount || 0}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {/* COD Badge */}
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        background: isCod ? '#fef3c7' : '#e0f2fe',
                        color: isCod ? '#b45309' : '#0369a1'
                      }}>
                        {isCod ? 'Cash on Delivery' : 'Online Paid'}
                      </span>

                      {/* Store Sync Badge */}
                      {storeSynced && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          background: '#f3e8ff', color: '#7e22ce'
                        }}>
                          {order.platform_source === 'woocommerce' ? 'WooCommerce' : order.platform_source === 'shopify' ? 'Shopify' : 'Store Synced'}
                        </span>
                      )}

                      {/* Status */}
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                        background: order.status === 'confirmed' ? '#dcfce7' : '#f3f4f6',
                        color: order.status === 'confirmed' ? '#15803d' : '#4b5563',
                        textTransform: 'capitalize'
                      }}>
                        {order.status || 'Pending'}
                      </span>
                    </div>

                    {order.delivery_city && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280', marginTop: 5 }}>
                        <MapPin size={11} />
                        <span>{order.delivery_city}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Recent Appointments ───────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={13} />
              Appointments & Bookings
            </div>
          </div>

          {loadingExtras ? (
            <div style={{ fontSize: 12, color: '#9ca3af', padding: '6px 0', textAlign: 'center' }}>
              Loading bookings...
            </div>
          ) : appointments.length === 0 ? (
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
