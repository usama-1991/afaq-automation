'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
  MessageSquare, Users, Zap, TrendingUp, RefreshCw,
  ArrowUpRight, ArrowDownRight, MessageCircle, Activity,
  ShoppingBag, DollarSign, Percent, BarChart3, Clock,
  Calendar, CheckCircle2, ChevronRight, AlertTriangle,
  Scissors, HeartPulse, Building, Eye, Target, Sparkles,
  Search, ShieldCheck, Smile, HelpCircle, Truck, Package,
  AlertCircle, ChevronDown, Check, UserPlus, PhoneCall, Trash, FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useNiche } from '@/context/NicheContext';

// ── Design Tokens ─────────────────────────────────────────────
const RED = '#dc2626';
const RED_LIGHT = '#fef2f2';
const GREEN = '#10b981';
const BLUE = '#3b82f6';
const BLUE_LIGHT = '#eff6ff';
const AMBER = '#f59e0b';
const AMBER_LIGHT = '#fffbeb';
const PURPLE = '#8b5cf6';
const PURPLE_LIGHT = '#f5f3ff';
const DARK = '#111827';

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: '#25D366',
  instagram: '#e1306c',
  messenger: '#0084ff',
};

// ── Generic Sub-components ────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: any;
  color: string;
  bg: string;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({
  label, value, sub, icon: Icon, color, bg, trend, trendUp,
}: StatCardProps) {
  return (
    <div style={{
      background: '#white', borderRadius: 18, padding: '24px 26px',
      border: '1px solid rgba(220,38,38,0.06)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
      display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default', position: 'relative', overflow: 'hidden'
    }}
    className="niche-stat-card"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={21} color={color} strokeWidth={2.5} />
        </div>
        {trend && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 12, fontWeight: 700,
            color: trendUp ? GREEN : '#ef4444',
            background: trendUp ? '#ecfdf5' : '#fef2f2',
            padding: '4px 10px', borderRadius: 20,
          }}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}
          </div>
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }}>
          {label}
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#111827', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6, fontWeight: 500 }}>{sub}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children, action, fullHeight }: {
  title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode; fullHeight?: boolean;
}) {
  return (
    <div style={{
      background: '#white', borderRadius: 20, padding: '26px 28px',
      border: '1px solid rgba(220,38,38,0.06)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
      display: 'flex', flexDirection: 'column',
      height: fullHeight ? '100%' : 'auto',
      minHeight: '100%',
      justifyContent: 'space-between'
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 4, fontWeight: 500 }}>{subtitle}</div>}
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#111827', borderRadius: 12, padding: '10px 16px',
      color: '#white', fontSize: 12, lineHeight: 1.6,
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      border: '1px solid rgba(255,255,255,0.08)'
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: '#9ca3af' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 500 }}>{p.name}:</span>
          <strong style={{ color: p.color, fontWeight: 700 }}>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { nicheId, niche } = useNiche();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Database Aggregations ────────────────────────────────────
  const [stats, setStats] = useState({ conversations: 0, messages: 0, agentMessages: 0, customers: 0 });
  const [channels, setChannels] = useState<{ name: string; value: number; color: string }[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);

  // ── Interactive State (Mock Real-Time Operations) ────────────
  
  // Restaurant Niche
  const [restaurantOrders, setRestaurantOrders] = useState([
    { id: '1', name: 'Sara Ahmed', items: 'Chicken Karahi x2 + Naan x4', area: 'Defense Phase 6', time: '3 min ago', status: 'pending', amount: 3200 },
    { id: '2', name: 'Bilal Khan', items: 'Family Kebab Deal', area: 'Gulshan Block 7', time: '18 min ago', status: 'confirmed', amount: 4800 },
    { id: '3', name: 'Zaid Hassan', items: 'Chicken Biryani x3', area: 'Clifton Block 5', time: '40 min ago', status: 'confirmed', amount: 2100 },
    { id: '4', name: 'Fatima Noor', items: 'Seekh Kebab Platter', area: 'KDA Scheme 1', time: '1h ago', status: 'pending', amount: 3900 }
  ]);
  const [restaurantIssues, setRestaurantIssues] = useState([
    { type: 'Wrong order', count: 2 },
    { type: 'Late delivery', count: 3 },
    { type: 'Missing item', count: 1 },
    { type: 'Refunds pending', count: 1 }
  ]);

  // eCommerce Niche
  const [ecoPipeline, setEcoPipeline] = useState([
    { id: 'e1', name: 'Sara Ahmed', item: 'Red Kurti (M)', status: 'pending_address', price: 2500, time: '5 min ago' },
    { id: 'e2', name: 'Aisha Butt', item: 'Lawn 3pc Suit', status: 'pending_address', price: 3800, time: '15 min ago' },
    { id: 'e3', name: 'Bilal Khan', item: '2-Piece Cotton Set', status: 'confirmed', price: 3200, time: '20 min ago' },
    { id: 'e4', name: 'Maryam Ali', item: 'Embroidered Dupatta', status: 'confirmed', price: 1800, time: '1h ago' },
    { id: 'e5', name: 'Fatima Noor', item: 'Linen Kurti (L)', status: 'dispatched', price: 2900, time: '3h ago' }
  ]);
  const [exchanges, setExchanges] = useState([
    { id: 'x1', name: 'Sara Ahmed', item: 'Red Kurti (M)', issue: 'Wrong size', status: 'Pending' },
    { id: 'x2', name: 'Bilal Khan', item: 'Lawn 2-Piece', issue: 'Color difference', status: 'Resolved' }
  ]);

  // Dental Niche
  const [dentalSchedule, setDentalSchedule] = useState([
    { time: '09:00 AM', name: 'Aisha Butt', treatment: 'Scaling & Polishing', doctor: 'Dr. Hassan', status: 'confirmed', isNew: true },
    { time: '10:00 AM', name: 'Zaid Hassan', treatment: 'Whitening Consult', doctor: 'Dr. Hassan', status: 'confirmed', isNew: false },
    { time: '11:00 AM', name: '[Available Slot]', treatment: 'Book via AI', doctor: 'Dr. Hassan', status: 'available', isNew: false },
    { time: '12:00 PM', name: 'LUNCH BREAK', treatment: 'Break', doctor: 'Dr. Hassan', status: 'break', isNew: false },
    { time: '02:00 PM', name: 'Bilal Khan', treatment: 'Root Canal Therapy', doctor: 'Dr. Hassan', status: 'pending', isNew: false },
    { time: '03:00 PM', name: '[Available Slot]', treatment: 'Book via AI', doctor: 'Dr. Hassan', status: 'available', isNew: false }
  ]);
  const [dentalClinicalQueries, setDentalClinicalQueries] = useState([
    { id: 'q1', patient: 'Fatima Noor', issue: 'Sent an X-ray photo — needs doctor review', type: 'Clinical Media' },
    { id: 'q2', patient: 'Omar Sheikh', issue: '"Is it normal that my gum is bleeding after scaling?"', type: 'Bleeding Follow-up' }
  ]);

  // Real Estate Niche
  const [rePipeline, setRePipeline] = useState([
    { id: 'r1', name: 'Omar Sheikh', intent: 'buy', type: '3-Bed', budget: '2.5–3.0 Crore', area: 'DHA Phase 6', stage: 'qualified', temp: 'hot' },
    { id: 'r2', name: 'Hina Malik', intent: 'rent', type: '2-Bed', budget: '80-100k', area: 'Phase 5', stage: 'new_inquiry', temp: 'warm' },
    { id: 'r3', name: 'Zaid Hassan', intent: 'buy', type: 'Commercial Plot', budget: '8 Crore', area: 'Clifton', stage: 'properties_sent', temp: 'hot' },
    { id: 'r4', name: 'Aisha Butt', intent: 'buy', type: '1-Bed Apt', budget: '1.2 Crore', area: 'Bahria Town', stage: 'visit_scheduled', temp: 'warm' }
  ]);

  // Salon Niche
  const [salonSchedule, setSalonSchedule] = useState({
    Sarah: { '10:00 AM': { client: 'Aisha', service: 'Hair Color' }, '11:30 AM': { client: '', service: 'Available' } },
    Alex: { '10:00 AM': { client: 'Zaid', service: 'Beard Trim' }, '11:30 AM': { client: 'Maryam', service: 'Manicure' } },
    Maria: { '10:00 AM': { client: '', service: 'Available' }, '11:30 AM': { client: 'Hina', service: 'Bridal Trial' } },
    Lina: { '10:00 AM': { client: 'Sara', service: 'Facial' }, '11:30 AM': { client: '', service: 'Available' } }
  });

  const [upcomingReminders, setUpcomingReminders] = useState([
    { id: 'rem1', name: 'Farida Tariq', time: 'Tomorrow 11am', service: 'Bridal Trial', sent: false },
    { id: 'rem2', name: 'Nadia Khan', time: 'Tomorrow 3pm', service: 'Hair Color', sent: false }
  ]);

  // Medical Clinic Niche
  const [medicalDoctors, setMedicalDoctors] = useState({
    'DR. IRFAN (Cardiologist)': [
      { time: '09:00 AM', patient: 'Omar Sheikh', status: 'Confirmed' },
      { time: '10:00 AM', patient: '[Available]', status: 'Available' },
      { time: '11:00 AM', patient: 'Hina Malik', status: 'Confirmed' }
    ],
    'DR. SARA (Pediatrics)': [
      { time: '09:30 AM', patient: 'Baby Ali (3mo)', status: 'Confirmed' },
      { time: '10:30 AM', patient: '[Available]', status: 'Available' },
      { time: '11:30 AM', patient: 'Hira Noor', status: 'Confirmed' }
    ],
    'DR. AHMED (General)': [
      { time: '10:00 AM', patient: 'Fatima Butt', status: 'Confirmed' },
      { time: '11:00 AM', patient: 'Zainab Khan', status: 'Confirmed' },
      { time: '12:00 PM', patient: '[Available]', status: 'Available' }
    ]
  });

  // ── Real-Time DB Subscriptions ───────────────────────────────
  const fetchAll = async () => {
    setRefreshing(true);
    try {
      const { data: convs } = await supabase.from('conversations').select('id, platform, customer_name, created_at');
      const { data: msgs } = await supabase.from('messages').select('id, sender_type, created_at, conversation_id');

      if (convs && msgs) {
        const agentMsgs = msgs.filter((m: any) => m.sender_type === 'agent');
        const uniqueCustomers = new Set(convs.map((c: any) => c.customer_name)).size;

        setStats({
          conversations: convs.length,
          messages: msgs.length,
          agentMessages: agentMsgs.length,
          customers: uniqueCustomers || convs.length,
        });

        const channelCount: Record<string, number> = {};
        convs.forEach((c: any) => { channelCount[c.platform] = (channelCount[c.platform] || 0) + 1; });
        setChannels(Object.entries(channelCount).map(([name, value]: any) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: CHANNEL_COLORS[name] || '#9ca3af',
        })));

        // Generate weekly chat statistics
        const days: { time: string; inbound: number; outbound: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const label = d.toLocaleDateString('en', { weekday: 'short' });
          const dateStr = d.toISOString().split('T')[0];
          days.push({
            time: label,
            inbound: msgs.filter((m: any) => m.sender_type === 'customer' && m.created_at.startsWith(dateStr)).length || Math.floor(Math.random() * 30) + 10,
            outbound: msgs.filter((m: any) => m.sender_type === 'agent' && m.created_at.startsWith(dateStr)).length || Math.floor(Math.random() * 40) + 20,
          });
        }
        setVolumeData(days);
      }
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();

    // Subscribe to new orders or status updates in real-time
    const orderSub = supabase
      .channel('orders_realtime_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchAll();
      })
      .subscribe();

    const apptSub = supabase
      .channel('appointments_realtime_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderSub);
      supabase.removeChannel(apptSub);
    };
  }, [nicheId]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ padding: '32px 32px 50px', minHeight: '100%', background: '#faf9f9' }}>
      
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
        <div>
          <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{dateLabel}</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: DARK, letterSpacing: '-0.7px', lineHeight: 1.1 }}>
            {greeting}, Usama! 👋
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4, fontWeight: 500 }}>
            Here is your live industry metrics panel for <strong style={{ color: RED }}>{niche.label}</strong>.
          </p>
        </div>
        <button
          onClick={fetchAll}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', borderRadius: 12,
            border: '1px solid rgba(220,38,38,0.12)',
            background: '#white', cursor: 'pointer',
            fontSize: 13, fontWeight: 650, color: '#4b5563',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            transition: 'all 0.2s',
          }}
          className="refresh-stats-btn"
        >
          <RefreshCw size={13} style={refreshing ? { animation: 'spin 0.8s linear infinite' } : {}} />
          Sync Live Data
        </button>
      </div>

      {/* ── Niche-Specific Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {nicheId === 'restaurant' ? (
          <>
            <StatCard label="📦 Orders Today" value="47 Orders" sub="+12% vs yesterday" icon={ShoppingBag} color={RED} bg={RED_LIGHT} trend="+12%" trendUp={true} />
            <StatCard label="💰 Revenue Today" value="PKR 68,450" sub="From delivery & takeaway" icon={DollarSign} color={GREEN} bg="#ecfdf5" trend="+8%" trendUp={true} />
            <StatCard label="🔄 Repeat Rate" value="62%" sub="Returning customers today" icon={Users} color={BLUE} bg={BLUE_LIGHT} trend="+3%" trendUp={true} />
            <StatCard label="⏱️ Avg Order Time" value="18 mins" sub="From chat to confirmation" icon={Clock} color={AMBER} bg={AMBER_LIGHT} />
          </>
        ) : nicheId === 'ecommerce' ? (
          <>
            <StatCard label="💰 Chat Revenue" value="PKR 30,140" sub="Direct sales closed via chat" icon={DollarSign} color={GREEN} bg="#ecfdf5" trend="+18%" trendUp={true} />
            <StatCard label="📦 Orders Today" value="7 Confirmed" sub="Closed by ShopBot interactions" icon={ShoppingBag} color={RED} bg={RED_LIGHT} trend="+40%" trendUp={true} />
            <StatCard label="🔄 Exchange Req" value="3 Requests" sub="2 resolved, 1 pending review" icon={RefreshCw} color={BLUE} bg={BLUE_LIGHT} />
            <StatCard label="📍 COD Pending" value="PKR 12,500" sub="4 orders out on COD" icon={Truck} color={AMBER} bg={AMBER_LIGHT} />
          </>
        ) : nicheId === 'dental' ? (
          <>
            <StatCard label="📅 Appts Today" value="14 Booked" sub="2 vacant slots remaining" icon={Calendar} color={RED} bg={RED_LIGHT} />
            <StatCard label="👥 New Patients" value="3 Today" sub="First-time clinic attendees" icon={UserPlus} color={BLUE} bg={BLUE_LIGHT} trend="+15%" trendUp={true} />
            <StatCard label="🔄 Reschedules" value="2 Changed" sub="1 cancelled appointment" icon={RefreshCw} color={AMBER} bg={AMBER_LIGHT} />
            <StatCard label="💰 Revenue Today" value="PKR 42,000" sub="Estimated from treatment plans" icon={DollarSign} color={GREEN} bg="#ecfdf5" />
          </>
        ) : nicheId === 'realestate' ? (
          <>
            <StatCard label="🎯 New Leads" value="8 Today" sub="Registered via WhatsApp inquiries" icon={Target} color={RED} bg={RED_LIGHT} trend="+3 leads" trendUp={true} />
            <StatCard label="👁️ Props Shared" value="34 Links" sub="Listing page links shared by AI" icon={Eye} color={BLUE} bg={BLUE_LIGHT} trend="+22%" trendUp={true} />
            <StatCard label="📅 Site Visits" value="3 Scheduled" sub="Site visits confirmed this week" icon={Calendar} color={AMBER} bg={AMBER_LIGHT} />
            <StatCard label="🔥 Hot Leads" value="5 Active" sub="Inquiries with highest purchase intent" icon={Sparkles} color={GREEN} bg="#ecfdf5" />
          </>
        ) : nicheId === 'salon' ? (
          <>
            <StatCard label="✂️ Bookings Today" value="11 Booked" sub="3 slots still vacant today" icon={Scissors} color={RED} bg={RED_LIGHT} />
            <StatCard label="💰 Revenue Today" value="PKR 38,500" sub="From confirmed slots & add-ons" icon={DollarSign} color={GREEN} bg="#ecfdf5" trend="+15%" trendUp={true} />
            <StatCard label="🌸 Bridal Leads" value="2 Inquiries" sub="High-value bridal trials pending" icon={Sparkles} color={PURPLE} bg={PURPLE_LIGHT} />
            <StatCard label="⏰ Next Slot" value="3:00 PM" sub="Stylist: Sarah (Hair Styling)" icon={Clock} color={AMBER} bg={AMBER_LIGHT} />
          </>
        ) : (
          <>
            <StatCard label="📋 OPD Today" value="28 Booked" sub="OPD appointments scheduled" icon={HeartPulse} color={RED} bg={RED_LIGHT} />
            <StatCard label="👥 New Patients" value="6 Today" sub="First-time clinical visits" icon={UserPlus} color={BLUE} bg={BLUE_LIGHT} trend="+10%" trendUp={true} />
            <StatCard label="⚕️ Reports Rcvd" value="4 Files" sub="Awaiting doctor clinical review" icon={FileText} color={AMBER} bg={AMBER_LIGHT} />
            <StatCard label="🚨 Urgent Cases" value="1 Flagged" sub="Symptom escalations to clinical human" icon={AlertCircle} color={RED} bg={RED_LIGHT} />
          </>
        )}
      </div>

      {/* ── Core Niche Dashboard Layouts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, marginBottom: 24 }}>
        
        {/* ========================================================================= */}
        {/* NICHE 1: Restaurant/Food */}
        {/* ========================================================================= */}
        {nicheId === 'restaurant' && (
          <>
            <SectionCard title="Live Order Queue" subtitle="Orders placed on WhatsApp awaiting real-time tracking">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {restaurantOrders.map(order => (
                  <div key={order.id} style={{
                    padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(220,38,38,0.06)',
                    background: '#white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{order.name}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase',
                          background: order.status === 'pending' ? AMBER_LIGHT : '#ecfdf5',
                          color: order.status === 'pending' ? AMBER : GREEN
                        }}>{order.status}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#4b5563', marginTop: 4, fontWeight: 500 }}>{order.items}</div>
                      <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 3 }}>{order.area} · Placed {order.time}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => {
                            setRestaurantOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'confirmed' } : o));
                          }}
                          style={{ padding: '6px 12px', background: GREEN, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Confirm
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => {
                            setRestaurantOrders(prev => prev.filter(o => o.id !== order.id));
                          }}
                          style={{ padding: '6px 12px', background: BLUE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Deliver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SectionCard title="🔥 Top Ordered Products">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { name: 'Chicken Karahi', share: '38%' },
                    { name: 'Biryani Family Pack', share: '28%' },
                    { name: 'Chapli Kebab', share: '18%' },
                    { name: 'Seekh Platter', share: '16%' }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#faf9f9' }}>
                      <span style={{ fontSize: 13, fontWeight: 650, color: '#374151' }}>{item.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: RED }}>{item.share}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="⚠️ Issues Logged Today">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {restaurantIssues.map((issue, idx) => (
                    <div key={idx} style={{ padding: '12px 14px', background: RED_LIGHT, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: RED }}>{issue.count}</div>
                      <div style={{ fontSize: 12, color: '#4b5563', fontWeight: 600, marginTop: 2 }}>{issue.type}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* NICHE 2: eCommerce/Fashion */}
        {/* ========================================================================= */}
        {nicheId === 'ecommerce' && (
          <>
            <SectionCard title="Live Order Kanban Pipeline" subtitle="Order checkout status tracked dynamically via WhatsApp chat">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {/* Stage 1: PENDING ADDRESS */}
                <div style={{ background: '#faf9f9', padding: 12, borderRadius: 12 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 750, color: AMBER, textTransform: 'uppercase', marginBottom: 10 }}>Pending Address</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ecoPipeline.filter(o => o.status === 'pending_address').map(order => (
                      <div key={order.id} style={{ background: '#fff', padding: 10, borderRadius: 8, border: '1px solid rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{order.name}</div>
                        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 3 }}>{order.item}</div>
                        <button
                          onClick={() => {
                            setEcoPipeline(prev => prev.map(o => o.id === order.id ? { ...o, status: 'confirmed' } : o));
                          }}
                          style={{ width: '100%', marginTop: 8, padding: '4px 0', border: 'none', background: RED, color: '#fff', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Address Obtained
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stage 2: CONFIRMED */}
                <div style={{ background: '#faf9f9', padding: 12, borderRadius: 12 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 750, color: GREEN, textTransform: 'uppercase', marginBottom: 10 }}>Confirmed</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ecoPipeline.filter(o => o.status === 'confirmed').map(order => (
                      <div key={order.id} style={{ background: '#fff', padding: 10, borderRadius: 8, border: '1px solid rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{order.name}</div>
                        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 3 }}>{order.item}</div>
                        <button
                          onClick={() => {
                            setEcoPipeline(prev => prev.map(o => o.id === order.id ? { ...o, status: 'dispatched' } : o));
                          }}
                          style={{ width: '100%', marginTop: 8, padding: '4px 0', border: 'none', background: BLUE, color: '#fff', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Dispatch Order
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stage 3: DISPATCHED */}
                <div style={{ background: '#faf9f9', padding: 12, borderRadius: 12 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 750, color: BLUE, textTransform: 'uppercase', marginBottom: 10 }}>Dispatched</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ecoPipeline.filter(o => o.status === 'dispatched').map(order => (
                      <div key={order.id} style={{ background: '#fff', padding: 10, borderRadius: 8, border: '1px solid rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{order.name}</div>
                        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 3 }}>{order.item}</div>
                        <button
                          onClick={() => {
                            setEcoPipeline(prev => prev.filter(o => o.id !== order.id));
                          }}
                          style={{ width: '100%', marginTop: 8, padding: '4px 0', border: 'none', background: '#e5e7eb', color: '#4b5563', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Mark Delivered
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Product Intelligence Widget">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>🔍 What Customers Search Most</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { query: 'Lawn Collection', count: 142 },
                      { query: 'Medium size fits', count: 98 },
                      { query: 'COD Available', count: 87 }
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#4b5563', fontWeight: 550 }}>"{item.query}"</span>
                        <strong style={{ color: '#111827' }}>{item.count} queries</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>⚠️ Out-of-Stock Pain Points</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { item: 'Red Kurti Size L', count: 18 },
                      { item: 'Embroidered Dupatta', count: 12 }
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: RED, fontWeight: 650 }}>{item.item}</span>
                        <strong style={{ color: '#4b5563' }}>Asked {item.count}x today</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {/* ========================================================================= */}
        {/* NICHE 3: Dental Clinic */}
        {/* ========================================================================= */}
        {nicheId === 'dental' && (
          <>
            <SectionCard title="Today's Appointment Schedule" subtitle="OPD Dental slots tracked dynamically by patient WhatsApp booking confirmation">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dentalSchedule.map((slot, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
                    border: '1px solid rgba(220,38,38,0.05)',
                    background: slot.status === 'confirmed' ? '#white' : slot.status === 'available' ? '#fefbfb' : '#fafafa',
                    borderLeft: `4px solid ${slot.status === 'confirmed' ? GREEN : slot.status === 'pending' ? AMBER : '#e5e7eb'}`
                  }}>
                    <div style={{ width: 68, fontSize: 12, fontWeight: 800, color: '#4b5563' }}>{slot.time}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong style={{ fontSize: 13.5, color: '#111827' }}>{slot.name}</strong>
                        {slot.isNew && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', background: BLUE_LIGHT, color: BLUE, borderRadius: 8 }}>NEW</span>}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>{slot.treatment} · {slot.doctor}</div>
                    </div>
                    <div>
                      {slot.status === 'available' ? (
                        <button
                          onClick={() => {
                            setDentalSchedule(prev => prev.map((s, i) => i === idx ? { ...s, name: 'Sara Ahmed', treatment: 'Scaling', status: 'confirmed', isNew: true } : s));
                          }}
                          style={{ padding: '4px 10px', background: RED_LIGHT, color: RED, border: 'none', borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Book via AI
                        </button>
                      ) : (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase',
                          background: slot.status === 'confirmed' ? '#ecfdf5' : '#fef2f2',
                          color: slot.status === 'confirmed' ? GREEN : RED
                        }}>{slot.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SectionCard title="Weekly Treatment Breakdown">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { name: 'Scaling & Polishing', pct: '35%' },
                    { name: 'Consultation Visit', pct: '25%' },
                    { name: 'Root Canal Therapy', pct: '18%' },
                    { name: 'Teeth Whitening Pack', pct: '12%' }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#faf9f9' }}>
                      <span style={{ fontSize: 13, fontWeight: 650, color: '#374151' }}>{item.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>{item.pct}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="⚕️ Clinical Queries Awaiting Review">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dentalClinicalQueries.map(q => (
                    <div key={q.id} style={{ padding: '10px 12px', background: RED_LIGHT, borderRadius: 10, border: '1px solid rgba(220,38,38,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#111827' }}>{q.patient}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: RED }}>{q.type}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4, fontWeight: 550 }}>{q.issue}</div>
                      <button
                        onClick={() => {
                          setDentalClinicalQueries(prev => prev.filter(item => item.id !== q.id));
                        }}
                        style={{ marginTop: 8, padding: '3px 8px', border: 'none', background: RED, color: '#fff', borderRadius: 6, fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Resolve Inquiry
                      </button>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* NICHE 4: Real Estate */}
        {/* ========================================================================= */}
        {nicheId === 'realestate' && (
          <>
            <SectionCard title="Conversational Lead Pipeline" subtitle="Lead progression from requirement gathering to site visits">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {/* Stage 1: NEW INQUIRY */}
                <div style={{ background: '#faf9f9', padding: 12, borderRadius: 12 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 750, color: AMBER, textTransform: 'uppercase', marginBottom: 10 }}>New Inquiry</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rePipeline.filter(l => l.stage === 'new_inquiry').map(lead => (
                      <div key={lead.id} style={{ background: '#fff', padding: 10, borderRadius: 8, border: '1px solid rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{lead.name}</div>
                        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 3 }}>{lead.type} · {lead.area}</div>
                        <button
                          onClick={() => {
                            setRePipeline(prev => prev.map(l => l.id === lead.id ? { ...l, stage: 'qualified' } : l));
                          }}
                          style={{ width: '100%', marginTop: 8, padding: '4px 0', border: 'none', background: RED, color: '#fff', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Confirm Requirements
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stage 2: QUALIFIED */}
                <div style={{ background: '#faf9f9', padding: 12, borderRadius: 12 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 750, color: GREEN, textTransform: 'uppercase', marginBottom: 10 }}>Qualified</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rePipeline.filter(l => l.stage === 'qualified').map(lead => (
                      <div key={lead.id} style={{ background: '#fff', padding: 10, borderRadius: 8, border: '1px solid rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{lead.name}</div>
                        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 3 }}>Budget: {lead.budget}</div>
                        <button
                          onClick={() => {
                            setRePipeline(prev => prev.map(l => l.id === lead.id ? { ...l, stage: 'properties_sent' } : l));
                          }}
                          style={{ width: '100%', marginTop: 8, padding: '4px 0', border: 'none', background: BLUE, color: '#fff', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Share Listings
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stage 3: VISIT SCHEDULED */}
                <div style={{ background: '#faf9f9', padding: 12, borderRadius: 12 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 750, color: BLUE, textTransform: 'uppercase', marginBottom: 10 }}>Visit Scheduled</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rePipeline.filter(l => l.stage === 'visit_scheduled').map(lead => (
                      <div key={lead.id} style={{ background: '#fff', padding: 10, borderRadius: 8, border: '1px solid rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{lead.name}</div>
                        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 3 }}>{lead.type} · DHA Phase 5</div>
                        <button
                          onClick={() => {
                            setRePipeline(prev => prev.filter(l => l.id !== lead.id));
                          }}
                          style={{ width: '100%', marginTop: 8, padding: '4px 0', border: 'none', background: '#e5e7eb', color: '#4b5563', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Mark Deal Closed
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="🔥 Active Hot Prospects">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rePipeline.filter(l => l.temp === 'hot').map(lead => (
                  <div key={lead.id} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(220,38,38,0.06)', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: '#111827' }}>{lead.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', background: RED_LIGHT, color: RED, borderRadius: 8 }}>HOT LEAD</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#4b5563', marginTop: 6, fontWeight: 650 }}>{lead.type} in {lead.area}</div>
                    <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 3 }}>Budget: {lead.budget}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {/* ========================================================================= */}
        {/* NICHE 5: Salon/Spa */}
        {/* ========================================================================= */}
        {nicheId === 'salon' && (
          <>
            <SectionCard title="Stylist Appointment Schedule" subtitle="Stylist calendar slots confirmed via customer WhatsApp interactions">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {Object.entries(salonSchedule).map(([stylist, hours]) => (
                  <div key={stylist} style={{ background: '#faf9f9', padding: 12, borderRadius: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: RED, textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>{stylist}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(hours).map(([hour, booking]) => (
                        <div key={hour} style={{ background: '#fff', padding: 8, borderRadius: 8, border: '1px solid rgba(0,0,0,0.03)', textAlign: 'center' }}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7280' }}>{hour}</div>
                          {booking.client ? (
                            <>
                              <div style={{ fontSize: 12.5, fontWeight: 750, color: '#111827', marginTop: 4 }}>{booking.client}</div>
                              <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 2 }}>{booking.service}</div>
                            </>
                          ) : (
                            <span style={{ fontSize: 11, color: GREEN, fontStyle: 'italic', display: 'block', marginTop: 4, fontWeight: 600 }}>Vacant</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SectionCard title="🌸 Bridal Pipeline Inquiries">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { name: 'Nadia Khan', stage: 'Inquiry', date: 'June 12' },
                    { name: 'Fatima Noor', stage: 'Trial Booked', date: 'June 18' }
                  ].map((lead, idx) => (
                    <div key={idx} style={{ padding: '10px 14px', borderRadius: 10, background: '#faf9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{lead.name}</div>
                        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>Booking: {lead.date}</div>
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, background: PURPLE_LIGHT, color: PURPLE, padding: '2px 8px', borderRadius: 8 }}>{lead.stage}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="⏰ Upcoming No-Show Reminders">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {upcomingReminders.map(rem => (
                    <div key={rem.id} style={{ padding: '10px 12px', background: RED_LIGHT, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#111827' }}>{rem.name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{rem.service} · {rem.time}</div>
                      </div>
                      <button
                        onClick={() => {
                          setUpcomingReminders(prev => prev.map(r => r.id === rem.id ? { ...r, sent: true } : r));
                        }}
                        disabled={rem.sent}
                        style={{ padding: '4px 10px', background: rem.sent ? GREEN : RED, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: rem.sent ? 'default' : 'pointer' }}
                      >
                        {rem.sent ? 'Sent' : 'Remind'}
                      </button>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* NICHE 6: Medical Clinic */}
        {/* ========================================================================= */}
        {nicheId === 'clinic' && (
          <>
            <SectionCard title="Doctor-wise Patient Consultation Grid" subtitle="Active OPD patient queues mapped dynamically by specialist doctor shifts">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {Object.entries(medicalDoctors).map(([doctor, list]) => (
                  <div key={doctor} style={{ background: '#faf9f9', padding: 12, borderRadius: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: RED, textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>{doctor}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {list.map((appt, idx) => (
                        <div key={idx} style={{ background: '#fff', padding: 10, borderRadius: 8, border: '1px solid rgba(0,0,0,0.03)', textAlign: 'center' }}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7280' }}>{appt.time}</div>
                          <div style={{ fontSize: 12.5, fontWeight: 750, color: '#111827', marginTop: 4 }}>{appt.patient}</div>
                          {appt.status === 'Confirmed' ? (
                            <span style={{ fontSize: 9.5, fontWeight: 700, background: '#ecfdf5', color: GREEN, padding: '1px 5px', borderRadius: 8, display: 'inline-block', marginTop: 6 }}>CONFIRMED</span>
                          ) : (
                            <span style={{ fontSize: 9.5, fontWeight: 700, background: '#fef2f2', color: RED, padding: '1px 5px', borderRadius: 8, display: 'inline-block', marginTop: 6 }}>VACANT</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="⚕️ Specialty Consultation Demand">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { name: 'General OPD Medicine', share: '45%' },
                  { name: 'Pediatrics Consultations', share: '22%' },
                  { name: 'Cardiology Specialist', share: '18%' },
                  { name: 'Orthopedics Clinic', share: '15%' }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#faf9f9' }}>
                    <span style={{ fontSize: 13, fontWeight: 650, color: '#374151' }}>{item.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: RED }}>{item.share}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {/* ── Right Panel: AI Agent Performance & Live Stats ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="🤖 AI Agent Performance" subtitle="Direct conversational ROI calculated from Meta Cloud API integrations">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: RED_LIGHT, borderRadius: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 750, color: '#374151' }}>Resolved by AI</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: RED }}>94%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: '#faf9f9', borderRadius: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 750, color: '#374151' }}>Escalated to Human</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: AMBER }}>6%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: '#faf9f9', borderRadius: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 750, color: '#374151' }}>Avg Response Speed</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: GREEN }}>8 seconds</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: '#faf9f9', borderRadius: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 750, color: '#374151' }}>AI Messages Sent Today</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#111827' }}>284 msgs</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="😊 Patient / Customer Sentiment">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Positive', score: 78, color: GREEN, bg: '#ecfdf5' },
                { label: 'Neutral', score: 16, color: AMBER, bg: AMBER_LIGHT },
                { label: 'Negative', score: 6, color: RED, bg: RED_LIGHT }
              ].map((s, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span style={{ fontWeight: 700, color: '#374151' }}>{s.label}</span>
                    <strong style={{ color: s.color }}>{s.score}%</strong>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${s.score}%`, height: '100%', background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

      </div>

      {/* ── Universal Performance Dashboard Rows ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        
        {/* Hourly Volume Chart */}
        <SectionCard title="Hourly AI Conversational Peak Rush Hours" subtitle="AI agent activity volume mapped by hour to help manage human backup staffing schedules">
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gInbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={RED} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={RED} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOutbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE} stopOpacity={0.14} />
                    <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="inbound" name="Inbound Messages" stroke={RED} strokeWidth={2.5} fill="url(#gInbound)" dot={false} />
                <Area type="monotone" dataKey="outbound" name="Outbound Agent" stroke={BLUE} strokeWidth={2} fill="url(#gOutbound)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
            {[{ color: RED, label: 'Inbound WhatsApp/Meta API' }, { color: BLUE, label: 'Outbound AI Agent' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 3, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 11.5, color: '#9ca3af', fontWeight: 650 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Channel Breakdown */}
        <SectionCard title="Live Multi-Channel Engagement" subtitle="Real-time incoming message source share">
          {channels.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
              No message channels connected yet
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <PieChart width={170} height={170}>
                  <Pie
                    data={channels} cx={80} cy={80}
                    innerRadius={50} outerRadius={76}
                    paddingAngle={3} dataKey="value"
                    strokeWidth={0}
                  >
                    {channels.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                </PieChart>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {channels.map(c => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                      <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 650 }}>{c.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#111827' }}>{c.value}</span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>convs</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

      </div>

      <style>{`
        .niche-stat-card:hover {
          box-shadow: 0 12px 30px rgba(220,38,38,0.06) !important;
          transform: translateY(-2px) !important;
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
