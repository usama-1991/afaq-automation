'use client';

import React, { memo, useState, useEffect, useMemo } from 'react';
import { 
  X, User, Phone, Mail, Globe, ShoppingBag, 
  Calendar, Tag, ShieldCheck, Clock, ExternalLink, 
  MapPin, Sparkles, Flame, CheckCircle2, ChevronRight,
  Truck, CreditCard, RefreshCw, Box, AlertCircle, FileText,
  Utensils, Scissors, Building, Briefcase, FileCheck, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { LIFECYCLE_STAGES } from './InboxSidebarNav';
import { useNiche } from '@/context/NicheContext';

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
  const { nicheId } = useNiche();
  const currentNiche = (c.niche || nicheId || 'general').toLowerCase();

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

  // ── Niche Specific Data Configurations ──────────────────────
  const nicheConfig = useMemo(() => {
    switch (currentNiche) {
      case 'clinic':
      case 'dental':
        return {
          alertTitle: 'Clinical Alerts',
          alertIcon: <AlertCircle size={13} color="#dc2626" />,
          alertBg: '#fef2f2',
          alertBorder: '#fecaca',
          alertColor: '#991b1b',
          alertTags: [
            { label: 'Penicillin Allergy', bg: '#fee2e2', color: '#b91c1c' },
            { label: 'Gag Reflex Sensitive', bg: '#fee2e2', color: '#b91c1c' },
            { label: 'Recall Due (7 mos)', bg: '#fef3c7', color: '#92400e' }
          ],
          actions: [
            { label: 'Quick Book Operatory Slot', icon: <Calendar size={13} />, primary: true, bg: 'linear-gradient(135deg, #e11d48, #be123c)' },
            { label: 'Send Deposit / Payment Link', icon: <CreditCard size={13} /> },
            { label: 'Send Post-Op Care Guide', icon: <FileText size={13} /> }
          ],
          summaryTitle: 'Dental Chart Summary',
          summaryItems: [
            { label: 'Primary Dentist', value: 'Dr. Hassan Ahmed' },
            { label: 'Last Visit', value: 'Feb 14, 2026 (Cleaning)' },
            { label: 'Insurance', value: 'Jubilee Dental Care' },
            { label: 'Total Spend', value: 'PKR 48,000', highlight: true },
            { label: 'Copilot Status', value: 'Autonomous Mode', highlight: true }
          ],
          showAppointmentsTitle: 'Appointments & Bookings'
        };

      case 'ecommerce':
        return {
          alertTitle: 'Buyer Profile & Risk',
          alertIcon: <ShieldCheck size={13} color="#2563eb" />,
          alertBg: '#eff6ff',
          alertBorder: '#bfdbfe',
          alertColor: '#1e40af',
          alertTags: [
            { label: 'VIP Buyer', bg: '#dbeafe', color: '#1d4ed8' },
            { label: 'Low RTO Risk', bg: '#dcfce7', color: '#15803d' },
            { label: 'COD Verified', bg: '#fef3c7', color: '#92400e' }
          ],
          actions: [
            { label: 'Send Checkout Link', icon: <CreditCard size={13} />, primary: true, bg: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
            { label: 'Track COD Order', icon: <Truck size={13} /> },
            { label: 'Send Abandoned Cart Link', icon: <ShoppingBag size={13} /> }
          ],
          summaryTitle: 'Store Sync & LTV',
          summaryItems: [
            { label: 'Connected Store', value: 'Shopify / WooCommerce' },
            { label: 'Total Orders', value: `${orders.length} Synced Orders` },
            { label: 'COD Return Rate', value: '0% (Clean Record)', highlight: true },
            { label: 'Buyer Trust Score', value: '98 / 100', highlight: true },
            { label: 'Copilot Status', value: 'Auto Upsell Enabled', highlight: true }
          ],
          showAppointmentsTitle: 'Delivery Schedule / Bookings'
        };

      case 'realestate':
        return {
          alertTitle: 'Property Buyer Criteria',
          alertIcon: <MapPin size={13} color="#d97706" />,
          alertBg: '#fffbeb',
          alertBorder: '#fde68a',
          alertColor: '#92400e',
          alertTags: [
            { label: 'Budget: 2-3 Cr', bg: '#fef3c7', color: '#b45309' },
            { label: 'Prefers DHA / Clifton', bg: '#e0e7ff', color: '#3730a3' },
            { label: '3-Bed Apartment', bg: '#f3e8ff', color: '#6b21a8' }
          ],
          actions: [
            { label: 'Book Property Viewing', icon: <Calendar size={13} />, primary: true, bg: 'linear-gradient(135deg, #d97706, #b45309)' },
            { label: 'Share Brochure / Floorplan', icon: <FileText size={13} /> },
            { label: 'Assign Property Specialist', icon: <User size={13} /> }
          ],
          summaryTitle: 'Property Requirements',
          summaryItems: [
            { label: 'Property Type', value: '3-Bed Luxury Apartment' },
            { label: 'Target Location', value: 'DHA Phase 6 / 8, Karachi' },
            { label: 'Financing', value: 'Cash Ready' },
            { label: 'Purchase Timeline', value: 'Immediate (Within 30 Days)', highlight: true },
            { label: 'Copilot Status', value: 'Lead Auto-Qualified', highlight: true }
          ],
          showAppointmentsTitle: 'Scheduled Property Viewings'
        };

      case 'restaurant':
        return {
          alertTitle: 'Guest Preferences',
          alertIcon: <Utensils size={13} color="#ea580c" />,
          alertBg: '#fff7ed',
          alertBorder: '#fed7aa',
          alertColor: '#9a3412',
          alertTags: [
            { label: 'Table for 4', bg: '#ffedd5', color: '#c2410c' },
            { label: '100% Halal Only', bg: '#dcfce7', color: '#15803d' },
            { label: 'Outdoor Seating', bg: '#fef3c7', color: '#92400e' }
          ],
          actions: [
            { label: 'Reserve Table Slot', icon: <Calendar size={13} />, primary: true, bg: 'linear-gradient(135deg, #ea580c, #c2410c)' },
            { label: 'Send Digital Menu PDF', icon: <FileText size={13} /> },
            { label: 'Create Takeout Order', icon: <ShoppingBag size={13} /> }
          ],
          summaryTitle: 'Dining & Loyalty Summary',
          summaryItems: [
            { label: 'Visit Frequency', value: 'Regular (8 Visits)' },
            { label: 'Preferred Timeslot', value: 'Dinner (8:00 PM)' },
            { label: 'Favorite Dishes', value: 'Chicken Starters & BBQ' },
            { label: 'Loyalty Tier', value: 'Gold VIP Member', highlight: true },
            { label: 'Copilot Status', value: 'Table Booking Mode', highlight: true }
          ],
          showAppointmentsTitle: 'Table Reservations'
        };

      case 'salon':
        return {
          alertTitle: 'Client Profile & Notes',
          alertIcon: <Scissors size={13} color="#db2777" />,
          alertBg: '#fdf2f8',
          alertBorder: '#fbcfe8',
          alertColor: '#9d174d',
          alertTags: [
            { label: 'Preferred: Sarah', bg: '#fce7f3', color: '#be185d' },
            { label: 'Sensitive Scalp', bg: '#fee2e2', color: '#b91c1c' },
            { label: 'Platinum Member', bg: '#f3e8ff', color: '#6b21a8' }
          ],
          actions: [
            { label: 'Book Styling Slot', icon: <Calendar size={13} />, primary: true, bg: 'linear-gradient(135deg, #db2777, #be185d)' },
            { label: 'Send Service Menu & Rates', icon: <FileText size={13} /> },
            { label: 'Send Appointment Reminder', icon: <Clock size={13} /> }
          ],
          summaryTitle: 'Client Care Summary',
          summaryItems: [
            { label: 'Preferred Stylist', value: 'Sarah (Senior Stylist)' },
            { label: 'Last Service', value: 'Hair Highlights & Facial' },
            { label: 'Loyalty Points', value: '450 Points Available' },
            { label: 'Next Visit Due', value: 'In 2 Weeks', highlight: true },
            { label: 'Copilot Status', value: 'Active Reminder Flow', highlight: true }
          ],
          showAppointmentsTitle: 'Service Bookings'
        };

      case 'general':
      default:
        return {
          alertTitle: 'Lead Intelligence',
          alertIcon: <Sparkles size={13} color="#4f46e5" />,
          alertBg: '#eef2ff',
          alertBorder: '#c7d2fe',
          alertColor: '#3730a3',
          alertTags: [
            { label: 'High Intent Lead', bg: '#e0e7ff', color: '#4338ca' },
            { label: 'Decision Maker', bg: '#dcfce7', color: '#15803d' },
            { label: 'SLA: < 1 hr', bg: '#fef3c7', color: '#92400e' }
          ],
          actions: [
            { label: 'Schedule Consultation / Demo', icon: <Calendar size={13} />, primary: true, bg: 'linear-gradient(135deg, #4f46e5, #4338ca)' },
            { label: 'Send Business Proposal / Deck', icon: <FileText size={13} /> },
            { label: 'Send Invoice / Payment Link', icon: <CreditCard size={13} /> }
          ],
          summaryTitle: 'Account & Opportunity Summary',
          summaryItems: [
            { label: 'Account Tier', value: 'Corporate Client' },
            { label: 'Primary Interest', value: 'Omnichannel AI Automation' },
            { label: 'Est. Deal Value', value: 'USD $1,200 / mo', highlight: true },
            { label: 'SLA Status', value: 'On Track (100%)', highlight: true },
            { label: 'Copilot Status', value: 'Autonomous Support Mode', highlight: true }
          ],
          showAppointmentsTitle: 'Scheduled Consultations & Meetings'
        };
    }
  }, [currentNiche, orders.length]);

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

        {/* ── Dynamic Niche Alert / Insights Card ─────────── */}
        <div style={{
          background: nicheConfig.alertBg,
          border: `1px solid ${nicheConfig.alertBorder}`,
          borderRadius: 10,
          padding: '12px 14px',
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            color: nicheConfig.alertColor,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            {nicheConfig.alertIcon}
            <span>{nicheConfig.alertTitle}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {nicheConfig.alertTags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: tag.bg,
                  color: tag.color
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Dynamic Niche Quick Actions ────────────────── */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Quick Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {nicheConfig.actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => {}}
                style={{
                  width: '100%',
                  padding: action.primary ? '9px 12px' : '8px 12px',
                  borderRadius: 8,
                  border: action.primary ? 'none' : '1px solid #e2e8f0',
                  background: action.primary ? (action.bg || '#4f46e5') : '#fff',
                  color: action.primary ? '#fff' : '#334155',
                  fontSize: 12,
                  fontWeight: action.primary ? 700 : 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: action.primary ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
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

        {/* ── Recent Orders & Multi-Store Sync (Ecommerce) ─── */}
        {(currentNiche === 'ecommerce' || orders.length > 0) && (
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
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          background: isCod ? '#fef3c7' : '#e0f2fe',
                          color: isCod ? '#b45309' : '#0369a1'
                        }}>
                          {isCod ? 'Cash on Delivery' : 'Online Paid'}
                        </span>

                        {storeSynced && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                            background: '#f3e8ff', color: '#7e22ce'
                          }}>
                            {order.platform_source === 'woocommerce' ? 'WooCommerce' : order.platform_source === 'shopify' ? 'Shopify' : 'Store Synced'}
                          </span>
                        )}

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
        )}

        {/* ── Dynamic Niche Summary Card ──────────────────── */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            {nicheConfig.summaryTitle}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, background: '#f9fafb', borderRadius: 10, padding: '12px 14px', border: '1px solid #f3f4f6' }}>
            {nicheConfig.summaryItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  borderBottom: idx < nicheConfig.summaryItems.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}
              >
                <span style={{ color: '#6b7280' }}>{item.label}</span>
                <span style={{
                  fontWeight: item.highlight ? 700 : 600,
                  color: item.highlight ? '#10b981' : '#111827'
                }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Appointments / Bookings / Meetings ──────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={13} />
              {nicheConfig.showAppointmentsTitle}
            </div>
          </div>

          {loadingExtras ? (
            <div style={{ fontSize: 12, color: '#9ca3af', padding: '6px 0', textAlign: 'center' }}>
              Loading schedule...
            </div>
          ) : appointments.length === 0 ? (
            <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', padding: '4px 0' }}>
              No scheduled events
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
                    {appt.service_name || appt.doctor_name || appt.treatment_type || 'Consultation'}
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
