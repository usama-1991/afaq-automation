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
  Search, ShieldCheck, Smile
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useNiche } from '@/context/NicheContext';

// ── Palette ──────────────────────────────────────────────────
const RED   = '#dc2626';
const RED_L = '#fef2f2';
const RED_D = '#b91c1c';
const GREEN = '#10b981';
const BLUE  = '#3b82f6';
const AMB   = '#f59e0b';
const PURP  = '#8b5cf6';
const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: '#25D366',
  messenger: '#0084ff',
  instagram: '#e1306c',
};

// ── Helpers ───────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

// ── Sub-components ────────────────────────────────────────────
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
      background: '#fff', borderRadius: 16, padding: '20px 22px',
      border: '1px solid rgba(220,38,38,0.07)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column', gap: 14,
      transition: 'box-shadow 0.2s, transform 0.2s',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(220,38,38,0.08)';
      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11, background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={19} color={color} strokeWidth={2.5} />
        </div>
        {trend && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11.5, fontWeight: 600,
            color: trendUp ? GREEN : '#ef4444',
            background: trendUp ? '#ecfdf5' : '#fef2f2',
            padding: '3px 8px', borderRadius: 20,
          }}>
            {trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
          {label}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-1px', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 5 }}>{sub}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children, action }: {
  title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 22px',
      border: '1px solid rgba(220,38,38,0.07)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#111827', borderRadius: 10, padding: '8px 14px',
      color: '#fff', fontSize: 12, lineHeight: 1.6,
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

// ── Mock Timeline Data for Appointment Niches ─────────────────
interface Slot {
  time: string;
  client: string;
  service: string;
  status: 'Booked' | 'Available' | 'Break';
  provider: string;
}

const mockWeeklyCalendarsByNiche: Record<string, Record<string, Slot[]>> = {
  restaurant: {
    Mon: [
      { time: '12:00 PM', client: 'Sara Ahmed', service: 'Table 4 (4 Pax)', status: 'Booked', provider: 'Clifton Branch' },
      { time: '01:30 PM', client: 'Bilal Khan', service: 'Table 2 (2 Pax)', status: 'Booked', provider: 'Clifton Branch' },
      { time: '07:00 PM', client: '', service: 'Table 5 (2 Pax) Available', status: 'Available', provider: 'Clifton Branch' },
    ],
    Tue: [
      { time: '06:00 PM', client: 'Fatima Noor', service: 'Table 6 (8 Pax)', status: 'Booked', provider: 'Clifton Branch' },
      { time: '08:30 PM', client: 'Omar Sheikh', service: 'Table 3 (4 Pax)', status: 'Booked', provider: 'Clifton Branch' },
    ],
    Wed: [
      { time: '01:00 PM', client: 'Hina Malik', service: 'Table 1 (6 Pax)', status: 'Booked', provider: 'Clifton Branch' },
      { time: '07:30 PM', client: '', service: 'Table 4 (4 Pax) Available', status: 'Available', provider: 'Clifton Branch' },
    ],
    Thu: [
      { time: '12:00 PM', client: 'Sara Ahmed', service: 'Table 4 (4 Pax)', status: 'Booked', provider: 'Clifton Branch' },
      { time: '01:30 PM', client: 'Bilal Khan', service: 'Table 2 (2 Pax)', status: 'Booked', provider: 'Clifton Branch' },
      { time: '03:00 PM', client: '', service: 'Table 1 (6 Pax) Available', status: 'Available', provider: 'Clifton Branch' },
      { time: '06:00 PM', client: 'Fatima Noor', service: 'Table 6 (8 Pax)', status: 'Booked', provider: 'Clifton Branch' },
      { time: '08:00 PM', client: 'Aisha Butt', service: 'Table for 4 Guests', status: 'Booked', provider: 'Clifton Branch' },
      { time: '09:30 PM', client: '', service: 'Available Booking Slot', status: 'Available', provider: 'Clifton Branch' },
    ],
    Fri: [
      { time: '06:30 PM', client: 'Bilal Khan', service: 'Table 3 (2 Pax)', status: 'Booked', provider: 'Clifton Branch' },
      { time: '08:00 PM', client: 'Maryam Ali', service: 'Table 2 (4 Pax)', status: 'Booked', provider: 'Clifton Branch' },
    ],
    Sat: [
      { time: '07:00 PM', client: 'Aisha Butt', service: 'Table 1 (6 Pax)', status: 'Booked', provider: 'Clifton Branch' },
      { time: '09:00 PM', client: '', service: 'Table 4 (4 Pax) Available', status: 'Available', provider: 'Clifton Branch' },
    ],
    Sun: [
      { time: '01:00 PM', client: '', service: 'Available Booking Slot', status: 'Available', provider: 'Clifton Branch' },
    ],
  },
  salon: {
    Mon: [
      { time: '09:00 AM', client: 'Sara Ahmed', service: 'Hair Highlights', status: 'Booked', provider: 'Stylist Sarah' },
      { time: '11:00 AM', client: 'Bilal Khan', service: 'Manicure', status: 'Booked', provider: 'Stylist Sarah' },
      { time: '02:30 PM', client: '', service: 'Available Appointment', status: 'Available', provider: 'Stylist Sarah' },
    ],
    Tue: [
      { time: '10:00 AM', client: 'Fatima Noor', service: 'Glow Facial', status: 'Booked', provider: 'Stylist Maria' },
      { time: '03:00 PM', client: 'Aisha Butt', service: 'Hair Blowdry', status: 'Booked', provider: 'Stylist Alex' },
    ],
    Wed: [
      { time: '09:30 AM', client: 'Omar Sheikh', service: 'Beard Grooming', status: 'Booked', provider: 'Stylist Alex' },
      { time: '11:30 AM', client: 'Hina Malik', service: 'Pedicure', status: 'Booked', provider: 'Stylist Maria' },
      { time: '03:00 PM', client: '', service: 'Available Appointment', status: 'Available', provider: 'Stylist Sarah' },
    ],
    Thu: [
      { time: '09:00 AM', client: 'Aisha Butt', service: 'Hair Highlights', status: 'Booked', provider: 'Stylist Sarah' },
      { time: '10:30 AM', client: 'Zaid Hassan', service: 'Beard Grooming', status: 'Booked', provider: 'Stylist Alex' },
      { time: '12:00 PM', client: 'Sara Ahmed', service: 'Glow Facial', status: 'Booked', provider: 'Stylist Maria' },
      { time: '01:30 PM', client: '', service: 'Salon Lunch Break ☕', status: 'Break', provider: '' },
      { time: '02:30 PM', client: 'Bilal Khan', service: 'Manicure & Pedicure', status: 'Booked', provider: 'Stylist Sarah' },
      { time: '04:00 PM', client: '', service: 'Available Stylist Slot', status: 'Available', provider: 'Stylist Sarah' },
    ],
    Fri: [
      { time: '10:00 AM', client: 'Bilal Khan', service: 'Hair Cut & Styling', status: 'Booked', provider: 'Stylist Sarah' },
      { time: '01:00 PM', client: 'Fatima Noor', service: 'Glow Facial', status: 'Booked', provider: 'Stylist Maria' },
      { time: '03:30 PM', client: '', service: 'Available Appointment', status: 'Available', provider: 'Stylist Sarah' },
    ],
    Sat: [
      { time: '11:00 AM', client: 'Aisha Butt', service: 'Bridal Makeup', status: 'Booked', provider: 'Stylist Maria' },
      { time: '01:00 PM', client: '', service: 'Available Appointment', status: 'Available', provider: 'Stylist Sarah' },
    ],
    Sun: [
      { time: '10:00 AM', client: '', service: 'Available Appointment', status: 'Available', provider: 'Stylist Sarah' },
    ],
  },
  dental: {
    Mon: [
      { time: '09:00 AM', client: 'Sara Ahmed', service: 'Dental Consultation', status: 'Booked', provider: 'Dr. Hassan' },
      { time: '11:00 AM', client: 'Bilal Khan', service: 'Scaling & Polishing', status: 'Booked', provider: 'Dr. Hassan' },
      { time: '02:30 PM', client: '', service: 'Available Appointment', status: 'Available', provider: 'Dr. Hassan' },
    ],
    Tue: [
      { time: '10:00 AM', client: 'Fatima Noor', service: 'Emergency Root Canal', status: 'Booked', provider: 'Dr. Hassan' },
      { time: '03:00 PM', client: 'Aisha Butt', service: 'Orthodontic Checkup', status: 'Booked', provider: 'Dr. Hassan' },
    ],
    Wed: [
      { time: '09:30 AM', client: 'Omar Sheikh', service: 'General Dental Checkup', status: 'Booked', provider: 'Dr. Hassan' },
      { time: '11:30 AM', client: 'Hina Malik', service: 'Composite Filling', status: 'Booked', provider: 'Dr. Hassan' },
      { time: '03:00 PM', client: '', service: 'Available Appointment', status: 'Available', provider: 'Dr. Hassan' },
    ],
    Thu: [
      { time: '09:00 AM', client: 'Aisha Butt', service: 'Scaling & Polishing', status: 'Booked', provider: 'Dr. Hassan' },
      { time: '10:00 AM', client: 'Zaid Hassan', service: 'Teeth Whitening Consultation', status: 'Booked', provider: 'Dr. Hassan' },
      { time: '11:00 AM', client: 'Sara Ahmed', service: 'Root Canal Therapy', status: 'Booked', provider: 'Dr. Hassan' },
      { time: '12:00 PM', client: '', service: 'Available OPD Slot', status: 'Available', provider: 'Dr. Hassan' },
      { time: '01:00 PM', client: '', service: 'OPD Lunch Break ☕', status: 'Break', provider: '' },
      { time: '02:00 PM', client: 'Bilal Khan', service: 'Composite Filling', status: 'Booked', provider: 'Dr. Hassan' },
      { time: '03:00 PM', client: '', service: 'Available OPD Slot', status: 'Available', provider: 'Dr. Hassan' },
    ],
    Fri: [
      { time: '10:00 AM', client: 'Bilal Khan', service: 'Dental Consultation', status: 'Booked', provider: 'Dr. Hassan' },
      { time: '01:00 PM', client: 'Fatima Noor', service: 'Full Checkup', status: 'Booked', provider: 'Dr. Hassan' },
      { time: '03:30 PM', client: '', service: 'Available Appointment', status: 'Available', provider: 'Dr. Hassan' },
    ],
    Sat: [
      { time: '11:00 AM', client: 'Aisha Butt', service: 'Urgent Care scaling', status: 'Booked', provider: 'Dr. Hassan' },
      { time: '01:00 PM', client: '', service: 'Available Appointment', status: 'Available', provider: 'Dr. Hassan' },
    ],
    Sun: [
      { time: '10:00 AM', client: '', service: 'Emergency Only Slot', status: 'Available', provider: 'On-Call Doc' },
    ],
  },
  clinic: {
    Mon: [
      { time: '09:00 AM', client: 'Sara Ahmed', service: 'General OPD', status: 'Booked', provider: 'Dr. Irfan' },
      { time: '11:00 AM', client: 'Bilal Khan', service: 'Cardiology Visit', status: 'Booked', provider: 'Dr. Irfan' },
      { time: '02:30 PM', client: '', service: 'Available OPD Slot', status: 'Available', provider: 'Dr. Irfan' },
    ],
    Tue: [
      { time: '10:00 AM', client: 'Fatima Noor', service: 'Pediatric Checkup', status: 'Booked', provider: 'Dr. Sarah' },
      { time: '03:00 PM', client: 'Aisha Butt', service: 'Flu Consultation', status: 'Booked', provider: 'Dr. Irfan' },
    ],
    Wed: [
      { time: '09:30 AM', client: 'Omar Sheikh', service: 'General Checkup', status: 'Booked', provider: 'Dr. Irfan' },
      { time: '11:30 AM', client: 'Hina Malik', service: 'Blood Pressure Check', status: 'Booked', provider: 'Dr. Irfan' },
      { time: '03:00 PM', client: '', service: 'Available OPD Slot', status: 'Available', provider: 'Dr. Irfan' },
    ],
    Thu: [
      { time: '09:00 AM', client: 'Aisha Butt', service: 'General OPD Checkup', status: 'Booked', provider: 'Dr. Irfan' },
      { time: '10:00 AM', client: 'Zaid Hassan', service: 'Cardiology Consultation', status: 'Booked', provider: 'Dr. Irfan' },
      { time: '11:00 AM', client: 'Sara Ahmed', service: 'Prescription Renewal', status: 'Booked', provider: 'Dr. Irfan' },
      { time: '12:00 PM', client: '', service: 'Available OPD Slot', status: 'Available', provider: 'Dr. Irfan' },
      { time: '01:00 PM', client: '', service: 'OPD Lunch Break ☕', status: 'Break', provider: '' },
      { time: '02:00 PM', client: 'Bilal Khan', service: 'Dermatology Consultation', status: 'Booked', provider: 'Dr. Sarah' },
      { time: '03:00 PM', client: '', service: 'Available OPD Slot', status: 'Available', provider: 'Dr. Irfan' },
    ],
    Fri: [
      { time: '10:00 AM', client: 'Bilal Khan', service: 'OPD Consultation', status: 'Booked', provider: 'Dr. Irfan' },
      { time: '01:00 PM', client: 'Fatima Noor', service: 'Skin Checkup', status: 'Booked', provider: 'Dr. Sarah' },
      { time: '03:30 PM', client: '', service: 'Available OPD Slot', status: 'Available', provider: 'Dr. Irfan' },
    ],
    Sat: [
      { time: '11:00 AM', client: 'Aisha Butt', service: 'Vaccination Slot', status: 'Booked', provider: 'Dr. Sarah' },
      { time: '01:00 PM', client: '', service: 'Available OPD Slot', status: 'Available', provider: 'Dr. Irfan' },
    ],
    Sun: [
      { time: '10:00 AM', client: '', service: 'On-Call Emergencies', status: 'Available', provider: 'On-Call Dr' },
    ],
  }
};

// ── Main Component ────────────────────────────────────────────
export default function DashboardPage() {
  const { nicheId, niche } = useNiche();
  const [stats, setStats] = useState({ conversations: 0, messages: 0, agentMessages: 0, customers: 0 });
  const [channels, setChannels] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Appointment based niche state
  const [activeDay, setActiveDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'>('Thu');
  const [highlightedSlot, setHighlightedSlot] = useState<number | null>(null);

  // Real estate prospect active state
  const [prospectFilter, setProspectFilter] = useState<'all' | 'buy' | 'rent'>('all');

  const fetchAll = async () => {
    setRefreshing(true);
    try {
      // Fetch Live Database Metrics
      const { data: convs } = await supabase.from('conversations').select('id, platform, customer_name, created_at');
      const { data: msgs } = await supabase.from('messages').select('id, sender_type, created_at, conversation_id');

      if (convs && msgs) {
        const agentMsgs = msgs.filter((m: any) => m.sender_type === 'agent');
        const uniqueCustomers = new Set(convs.map((c: any) => c.id)).size;

        setStats({
          conversations: convs.length,
          messages: msgs.length,
          agentMessages: agentMsgs.length,
          customers: uniqueCustomers,
        });

        // Channel breakdown
        const channelCount: Record<string, number> = {};
        convs.forEach((c: any) => { channelCount[c.platform] = (channelCount[c.platform] || 0) + 1; });
        setChannels(Object.entries(channelCount).map(([name, value]: any) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: CHANNEL_COLORS[name] || '#9ca3af',
        })));

        // Recent conversations (last 5)
        const sorted = [...convs].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
        const withMsgCount = sorted.map((c: any) => ({
          ...c,
          msgCount: msgs.filter((m: any) => m.conversation_id === c.id).length,
        }));
        setRecent(withMsgCount);

        // Volume — last 7 days
        const days: { time: string; inbound: number; outbound: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const label = d.toLocaleDateString('en', { weekday: 'short' });
          const dateStr = d.toISOString().split('T')[0];
          days.push({
            time: label,
            inbound: msgs.filter((m: any) => m.sender_type === 'customer' && m.created_at.startsWith(dateStr)).length,
            outbound: msgs.filter((m: any) => m.sender_type === 'agent' && m.created_at.startsWith(dateStr)).length,
          });
        }
        setVolumeData(days);
      }
    } catch (err) {
      console.error('Error fetching dashboard database metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [nicheId]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Get dynamic slot details based on Niche
  const appointmentConfig = (() => {
    if (nicheId === 'salon') {
      return {
        title: 'Stylist Slots & Daily Capacity',
        capacityText: '88% Stylist Capacity Booked',
        slots: [
          { time: '09:00 AM', client: 'Aisha Butt', service: 'Hair Highlights', status: 'Booked', provider: 'Stylist Sarah' },
          { time: '10:30 AM', client: 'Zaid Hassan', service: 'Beard Grooming', status: 'Booked', provider: 'Stylist Alex' },
          { time: '12:00 PM', client: 'Sara Ahmed', service: 'Glow Facial', status: 'Booked', provider: 'Stylist Maria' },
          { time: '01:30 PM', client: '', service: 'Salon Lunch Break ☕', status: 'Break', provider: '' },
          { time: '02:30 PM', client: 'Bilal Khan', service: 'Manicure & Pedicure', status: 'Booked', provider: 'Stylist Sarah' },
          { time: '04:00 PM', client: '', service: 'Available Stylist Slot', status: 'Available', provider: 'Stylist Sarah' },
        ] as Slot[],
      };
    } else if (nicheId === 'restaurant') {
      return {
        title: 'Table Bookings & Table Capacity',
        capacityText: '82% Table Reservations Full',
        slots: [
          { time: '12:00 PM', client: 'Sara Ahmed', service: 'Table 4 (4 Pax)', status: 'Booked', provider: 'Clifton Branch' },
          { time: '01:30 PM', client: 'Bilal Khan', service: 'Table 2 (2 Pax)', status: 'Booked', provider: 'Clifton Branch' },
          { time: '03:00 PM', client: '', service: 'Table 1 (6 Pax) Available', status: 'Available', provider: 'Clifton Branch' },
          { time: '06:00 PM', client: 'Fatima Noor', service: 'Table 6 (8 Pax)', status: 'Booked', provider: 'Clifton Branch' },
          { time: '08:00 PM', client: 'Aisha Butt', service: 'Table for 4 Guest', status: 'Booked', provider: 'Clifton Branch' },
          { time: '09:30 PM', client: '', service: 'Available Booking Slot', status: 'Available', provider: 'Clifton Branch' },
        ] as Slot[],
      };
    } else {
      // dentist / clinic
      return {
        title: 'OPD Dental Slots & Daily Capacity',
        capacityText: '85% Clinic Capacity Booked',
        slots: [
          { time: '09:00 AM', client: 'Aisha Butt', service: 'Scaling & Polishing', status: 'Booked', provider: 'Dr. Hassan' },
          { time: '10:00 AM', client: 'Zaid Hassan', service: 'Teeth Whitening Consultation', status: 'Booked', provider: 'Dr. Hassan' },
          { time: '11:00 AM', client: 'Sara Ahmed', service: 'Root Canal Therapy', status: 'Booked', provider: 'Dr. Hassan' },
          { time: '12:00 PM', client: '', service: 'Available OPD Slot', status: 'Available', provider: 'Dr. Hassan' },
          { time: '01:00 PM', client: '', service: 'OPD Lunch Break ☕', status: 'Break', provider: '' },
          { time: '02:00 PM', client: 'Bilal Khan', service: 'Composite Filling', status: 'Booked', provider: 'Dr. Hassan' },
          { time: '03:00 PM', client: '', service: 'Available OPD Slot', status: 'Available', provider: 'Dr. Hassan' },
        ] as Slot[],
      };
    }
  })();

  const activeTimelineSlots = (mockWeeklyCalendarsByNiche[nicheId] || mockWeeklyCalendarsByNiche['dental'])[activeDay] || [];

  return (
    <div style={{ padding: '28px 28px 40px', minHeight: '100%', background: '#faf9f9' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 12.5, color: '#9ca3af', fontWeight: 500, marginBottom: 4 }}>{dateLabel}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.7px', lineHeight: 1.1 }}>
            {greeting}, Usama! 👋
          </h1>
          <p style={{ fontSize: 13.5, color: '#6b7280', marginTop: 5 }}>
            Here is your live industry metrics panel for <strong>{niche.label}</strong> today.
          </p>
        </div>
        <button
          onClick={fetchAll}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 10,
            border: '1px solid rgba(220,38,38,0.15)',
            background: '#fff', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, color: '#6b7280',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.15s',
          }}
        >
          <RefreshCw size={13} style={refreshing ? { animation: 'spin 0.8s linear infinite' } : {}} />
          Refresh Stats
        </button>
      </div>

      {/* ── Industry-Specific High-Fidelity Statistics Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {nicheId === 'ecommerce' ? (
          <>
            <StatCard
              label="Gross Revenue" value="PKR 30,140.00"
              sub="Direct sales closed via chat"
              icon={DollarSign} color={RED} bg={RED_L}
              trend="+18.2% vs yesterday" trendUp={true}
            />
            <StatCard
              label="AI Assisted Orders" value="7"
              sub="Completed orders by ShopBot"
              icon={ShoppingBag} color={BLUE} bg="#eff6ff"
              trend="+40% this week" trendUp={true}
            />
            <StatCard
              label="Conversion Rate" value="63.6%"
              sub="Purchase Intent to Order"
              icon={Percent} color={AMB} bg="#fffbeb"
              trend="+3.1% this week" trendUp={true}
            />
            <StatCard
              label="Average Order Value" value="PKR 4,305.71"
              sub="Basket size across orders"
              icon={BarChart3} color={PURP} bg="#f5f3ff"
            />
          </>
        ) : nicheId === 'restaurant' ? (
          <>
            <StatCard
              label="Table Reservations Booked" value="42 Bookings"
              sub="Scheduled reservations today"
              icon={Calendar} color={RED} bg={RED_L}
              trend="+14% vs yesterday" trendUp={true}
            />
            <StatCard
              label="Table Reservation Capacity" value="82% Full"
              sub="Table and dining capacity"
              icon={Clock} color={BLUE} bg="#eff6ff"
              trend="+5% vs last week" trendUp={true}
            />
            <StatCard
              label="Loyal Repeat Diner Rate" value="76%"
              sub="Return guest / diner index"
              icon={Smile} color={AMB} bg="#fffbeb"
              trend="+2% vs last month" trendUp={true}
            />
            <StatCard
              label="Avg Dining Ticket Value" value="PKR 4,300"
              sub="Average spending per dining table"
              icon={BarChart3} color={PURP} bg="#f5f3ff"
              trend="+12% from last month" trendUp={true}
            />
          </>
        ) : nicheId === 'salon' ? (
          <>
            <StatCard
              label="Salon Services Booked" value="34 Bookings"
              sub="Beauty appointments scheduled today"
              icon={Calendar} color={RED} bg={RED_L}
              trend="+18% vs yesterday" trendUp={true}
            />
            <StatCard
              label="Stylist / Seat Capacity" value="88% Full"
              sub="Stylist seats booked today"
              icon={Clock} color={BLUE} bg="#eff6ff"
              trend="+5% resource limit" trendUp={true}
            />
            <StatCard
              label="Loyal Repeat Client Rate" value="76%"
              sub="Return salon client index"
              icon={Smile} color={AMB} bg="#fffbeb"
              trend="+4% vs last month" trendUp={true}
            />
            <StatCard
              label="Avg Service Spend" value="PKR 3,500"
              sub="Average billing value per ticket"
              icon={BarChart3} color={PURP} bg="#f5f3ff"
              trend="+8% from last month" trendUp={true}
            />
          </>
        ) : nicheId === 'clinic' ? (
          <>
            <StatCard
              label="OPD Patient Appointments" value="45 Patients"
              sub="Scheduled patient checkups today"
              icon={Calendar} color={RED} bg={RED_L}
              trend="+8 patients" trendUp={true}
            />
            <StatCard
              label="OPD Clinic Capacity" value="92% Booked"
              sub="Doctor shift resource capacity"
              icon={Clock} color={BLUE} bg="#eff6ff"
              trend="+6% vs last week" trendUp={true}
            />
            <StatCard
              label="Patient Satisfaction Rate" value="96.4%"
              sub="Care rating and return index"
              icon={Smile} color={AMB} bg="#fffbeb"
              trend="+1.2% from last month" trendUp={true}
            />
            <StatCard
              label="Avg Ticket Spend" value="PKR 2,800"
              sub="Average consultation & lab fee spend"
              icon={BarChart3} color={PURP} bg="#f5f3ff"
            />
          </>
        ) : nicheId === 'dental' ? (
          <>
            <StatCard
              label="OPD Dental Appointments" value="28 Patients"
              sub="Patients booked today"
              icon={Calendar} color={RED} bg={RED_L}
              trend="+5 patients" trendUp={true}
            />
            <StatCard
              label="Dental Clinic Capacity" value="85% Booked"
              sub="Dentist seat and room capacity"
              icon={Clock} color={BLUE} bg="#eff6ff"
              trend="+5% vs last week" trendUp={true}
            />
            <StatCard
              label="Patient Retention Rate" value="94.2%"
              sub="Return patient index"
              icon={Smile} color={AMB} bg="#fffbeb"
              trend="+2% vs last month" trendUp={true}
            />
            <StatCard
              label="Avg Treatment Cost" value="PKR 7,500"
              sub="Average dental service spend"
              icon={BarChart3} color={PURP} bg="#f5f3ff"
              trend="+12% from last month" trendUp={true}
            />
          </>
        ) : niche.appointmentBased ? (
          <>
            <StatCard
              label="OPD / Booking Appointments" value={nicheId === 'restaurant' ? '42 Bookings' : '28 Patients'}
              sub="Scheduled reservations today"
              icon={Calendar} color={RED} bg={RED_L}
              trend={nicheId === 'restaurant' ? '+14% vs yesterday' : '+5 patients'} trendUp={true}
            />
            <StatCard
              label="Active Stylist / Clinic Capacity" value={nicheId === 'restaurant' ? '82% Full' : '88% Booked'}
              sub="Resource and staff capacity"
              icon={Clock} color={BLUE} bg="#eff6ff"
              trend="+5% resource limit" trendUp={true}
            />
            <StatCard
              label="Loyal Repeat Rate" value="76%"
              sub="Return patient / customer index"
              icon={Smile} color={AMB} bg="#fffbeb"
              trend="+2% vs last month" trendUp={true}
            />
            <StatCard
              label="Avg Service Value" value={nicheId === 'restaurant' ? 'PKR 4,300' : 'PKR 7,500'}
              sub="Average billing value per ticket"
              icon={BarChart3} color={PURP} bg="#f5f3ff"
              trend="+12% from last month" trendUp={true}
            />
          </>
        ) : nicheId === 'realestate' ? (
          <>
            <StatCard
              label="Hot Prospects" value="18 Leads"
              sub="Actively seeking site viewings"
              icon={Target} color={RED} bg={RED_L}
              trend="+20% this week" trendUp={true}
            />
            <StatCard
              label="Active Property Listings" value="154 Listed"
              sub="Properties in live catalog"
              icon={Building} color={BLUE} bg="#eff6ff"
              trend="+14 new props" trendUp={true}
            />
            <StatCard
              label="Scheduled Property Viewings" value="12 Site Visits"
              sub="Confirmed site view visits"
              icon={Eye} color={AMB} bg="#fffbeb"
              trend="+3 viewings" trendUp={true}
            />
            <StatCard
              label="Avg Closing Time" value="14 Days"
              sub="From first chat to handshake"
              icon={Clock} color={PURP} bg="#f5f3ff"
            />
          </>
        ) : (
          // Fallback / General Niche Cards
          <>
            <StatCard
              label="Total Conversations" value={fmt(stats.conversations)}
              sub="Across synced channels"
              icon={MessageSquare} color={RED} bg={RED_L}
              trend="+12%" trendUp={true}
            />
            <StatCard
              label="Total Messages" value={fmt(stats.messages)}
              sub="Inbound and outbound messages"
              icon={Activity} color={BLUE} bg="#eff6ff"
              trend="+8%" trendUp={true}
            />
            <StatCard
              label="Agent Response Rate" value="94%"
              sub="AI answers & resolution"
              icon={Zap} color={AMB} bg="#fffbeb"
              trend="+24%" trendUp={true}
            />
            <StatCard
              label="Active Contacts" value={fmt(stats.customers)}
              sub="Customers registered in CRM"
              icon={Users} color={PURP} bg="#f5f3ff"
            />
          </>
        )}
      </div>

      {/* ── Industry Specific Workspace Suites ── */}
      {nicheId === 'ecommerce' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 14, marginBottom: 20 }}>
          
          {/* Funnel chart */}
          <SectionCard 
            title="Conversational Commerce Funnel" 
            subtitle="Dropoff tracking from initial customer contact to successful sale checkout"
          >
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[
                    { name: 'Conversations', count: 521, pct: 100, fill: '#dc2626' },
                    { name: 'Product Intent', count: 332, pct: 63.7, fill: '#ef4444' },
                    { name: 'Catalog Views', count: 215, pct: 41.2, fill: '#f87171' },
                    { name: 'Checkout Initialized', count: 88, pct: 16.8, fill: '#fca5a5' },
                    { name: 'Successful Orders', count: 7, pct: 1.34, fill: '#fee2e2' },
                  ]}
                  margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11.5, fontWeight: 550, fill: '#374151' }} />
                  <Tooltip cursor={{ fill: 'rgba(220,38,38,0.02)' }} content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: '#111827', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
                        <strong>{d.name}</strong>: {d.count} ({d.pct}%)
                      </div>
                    );
                  }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {[
                      '#dc2626',
                      '#ef4444',
                      '#f87171',
                      '#fca5a5',
                      '#fee2e2'
                    ].map((col, idx) => (
                      <Cell key={idx} fill={col} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend showing progressive dropoff */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(220,38,38,0.05)', paddingTop: 12, marginTop: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' }}>Inbound Leads</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginTop: 2 }}>521</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' }}>Shop Intent</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginTop: 2 }}>63.7%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' }}>Cart Conversion</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: GREEN, marginTop: 2 }}>3.26%</div>
              </div>
            </div>
          </SectionCard>

          {/* Refund Intents Handled panel */}
          <SectionCard
            title="Refund Intents Handled"
            subtitle="AI self-resolution status of refund requests"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15, height: '100%', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', background: '#ecfdf5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <ShieldCheck size={26} color={GREEN} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>14 Requests</div>
                  <div style={{ fontSize: 12.5, color: '#6b7280' }}>Refund intents recognized & resolved by AI</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#fcfbfb', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(220,38,38,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, color: '#4b5563', fontWeight: 550 }}>Satisfied Resolution (Exchanges/Credit)</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>11 (78.5%)</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '78.5%', height: '100%', background: GREEN }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#fcfbfb', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(220,38,38,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, color: '#4b5563', fontWeight: 550 }}>Escalations to Human Agent</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>3 (21.5%)</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '21.5%', height: '100%', background: '#f59e0b' }} />
                </div>
              </div>
            </div>
          </SectionCard>

        </div>
      )}

      {nicheId === 'ecommerce' && (
        <div style={{ marginBottom: 20 }}>
          {/* Product Insights Card */}
          <SectionCard
            title="ShopBot Product Catalog Insights"
            subtitle="Customer search and shopping habits tracked directly from conversations"
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              
              {/* Top Searches */}
              <div style={{ background: '#faf9f9', padding: 16, borderRadius: 12, border: '1px solid rgba(220,38,38,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 750, color: '#111827', textTransform: 'uppercase', marginBottom: 12 }}>
                  <Search size={14} color={RED} /> Top Queries & Searches
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { term: 'Lawn 2026 Collection', count: 142 },
                    { term: 'Printed Kurtis Size M', count: 98 },
                    { term: 'Cotton Chiffon Dupatta', count: 64 },
                    { term: 'Summer Linen Maxis', count: 32 },
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                      <span style={{ color: '#4b5563' }}>{item.term}</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{item.count} queries</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Ordered */}
              <div style={{ background: '#faf9f9', padding: 16, borderRadius: 12, border: '1px solid rgba(220,38,38,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 750, color: '#111827', textTransform: 'uppercase', marginBottom: 12 }}>
                  <ShoppingBag size={14} color={BLUE} /> Most Ordered via AI
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { term: 'Floral Lawn Kurti', count: 12 },
                    { term: 'Solid Linen Co-ord Set', count: 8 },
                    { term: 'Jacquard 3-Piece Suite', count: 5 },
                    { term: 'Cotton Summer Kurti', count: 4 },
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                      <span style={{ color: '#4b5563' }}>{item.term}</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{item.count} closed</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Abandoned */}
              <div style={{ background: '#faf9f9', padding: 16, borderRadius: 12, border: '1px solid rgba(220,38,38,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 750, color: '#111827', textTransform: 'uppercase', marginBottom: 12 }}>
                  <AlertTriangle size={14} color={AMB} /> Cart Abandoned Items
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { term: 'Embroidered Organza Maxi', count: 18 },
                    { term: 'Casual Linen Tunic', count: 12 },
                    { term: 'Luxury Lawn Trouser', count: 8 },
                    { term: 'Silk Hand-embroidered Dupatta', count: 5 },
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                      <span style={{ color: '#4b5563' }}>{item.term}</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{item.count} items left</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </SectionCard>
        </div>
      )}

      {/* Appointment Based Suite Section */}
      {niche.appointmentBased && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          
          {/* Left Column: Active Slots Grid */}
          <SectionCard 
            title={appointmentConfig.title} 
            subtitle="Click or tap any slot to inspect patient appointment cards or availability"
            action={<span style={{ fontSize: 12, fontWeight: 650, background: '#ecfdf5', color: GREEN, padding: '4px 10px', borderRadius: 20 }}>{appointmentConfig.capacityText}</span>}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              {appointmentConfig.slots.map((slot, index) => {
                const isBooked = slot.status === 'Booked';
                const isBreak = slot.status === 'Break';
                const isHighlighted = highlightedSlot === index;

                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (!isBreak) setHighlightedSlot(isHighlighted ? null : index);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      cursor: isBreak ? 'default' : 'pointer',
                      border: isHighlighted
                        ? '1.5px solid #dc2626'
                        : isBooked
                          ? '1px solid rgba(220,38,38,0.06)'
                          : '1.5px dashed rgba(220,38,38,0.18)',
                      background: isHighlighted
                        ? '#fef2f2'
                        : isBreak
                          ? '#f9fafb'
                          : isBooked
                            ? '#fff'
                            : '#fefbfb',
                      transition: 'all 0.15s',
                      boxShadow: isBooked && !isHighlighted ? '0 1px 2px rgba(0,0,0,0.02)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isBreak && !isHighlighted) {
                        e.currentTarget.style.borderColor = '#dc2626';
                        e.currentTarget.style.background = '#fff5f5';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isBreak && !isHighlighted) {
                        e.currentTarget.style.borderColor = isBooked ? 'rgba(220,38,38,0.06)' : 'rgba(220,38,38,0.18)';
                        e.currentTarget.style.background = isBooked ? '#fff' : '#fefbfb';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#4b5563' }}>{slot.time}</span>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 10,
                        textTransform: 'uppercase',
                        background: isBreak ? '#e5e7eb' : isBooked ? '#fef2f2' : '#ecfdf5',
                        color: isBreak ? '#4b5563' : isBooked ? '#dc2626' : GREEN,
                      }}>
                        {slot.status}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 750, color: '#111827', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {slot.client || slot.service}
                    </div>

                    {isBooked && (
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{slot.service}</span>
                        <span style={{ fontWeight: 550 }}>{slot.provider}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {highlightedSlot !== null && (
              <div style={{
                marginTop: 14,
                padding: '12px 14px',
                borderRadius: 12,
                background: '#fff8f8',
                border: '1px solid rgba(220,38,38,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                animation: 'fadeUp 0.15s ease-out'
              }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#dc2626' }}>
                    Active Booking: {appointmentConfig.slots[highlightedSlot]?.client}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>
                    Assigned: {appointmentConfig.slots[highlightedSlot]?.provider} • service: {appointmentConfig.slots[highlightedSlot]?.service}
                  </div>
                </div>
                <a
                  href="/conversations"
                  style={{
                    fontSize: 11.5, fontWeight: 650, color: '#fff', background: '#dc2626',
                    textDecoration: 'none', padding: '6px 12px', borderRadius: 8,
                    boxShadow: '0 2px 6px rgba(220,38,38,0.2)',
                  }}
                >
                  Open Thread
                </a>
              </div>
            )}
          </SectionCard>

          {/* Right Column: Weekly Timeline Calendar Preview */}
          <SectionCard 
            title="Weekly Reservation Timeline" 
            subtitle="Click on any day of the week to inspect scheduled booking lists"
          >
            {/* Days Tabs Row */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map(day => {
                const isActive = activeDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => {
                      setActiveDay(day);
                      setHighlightedSlot(null);
                    }}
                    style={{
                      flex: 1, padding: '7px 0', border: 'none', borderRadius: 8,
                      fontWeight: 650, fontSize: 11.5, cursor: 'pointer',
                      background: isActive ? '#dc2626' : 'transparent',
                      color: isActive ? '#fff' : '#6b7280',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = '#fef2f2';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Timelines List for the active day */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 250, overflowY: 'auto' }}>
              {activeTimelineSlots.length === 0 ? (
                <div style={{ padding: '30px 0', textAlign: 'center', fontSize: 12.5, color: '#9ca3af' }}>
                  {nicheId === 'restaurant'
                    ? 'No reservations scheduled for Sunday. Closed today.'
                    : nicheId === 'salon'
                      ? 'No beauty appointments scheduled for Sunday. Closed today.'
                      : 'No bookings scheduled for Sunday. Emergency only.'}
                </div>
              ) : (
                activeTimelineSlots.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 10,
                      background: item.status === 'Booked' ? '#fff' : '#fafafa',
                      borderLeft: `4px solid ${item.status === 'Booked' ? '#dc2626' : '#e5e7eb'}`,
                      border: '1px solid rgba(220,38,38,0.04)',
                    }}
                  >
                    <div style={{ width: 68, fontSize: 11.5, fontWeight: 700, color: '#4b5563' }}>
                      {item.time}
                    </div>

                    <div style={{ flex: 1 }}>
                      {item.status === 'Booked' ? (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{item.client}</div>
                          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                            {item.service} • <span style={{ fontWeight: 550 }}>{item.provider}</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 12.5, fontStyle: 'italic', color: '#9ca3af' }}>{item.service}</div>
                      )}
                    </div>

                    <div>
                      {item.status === 'Booked' ? (
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#fef2f2', color: '#dc2626', padding: '2px 7px', borderRadius: 10 }}>CONFIRMED</span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#ecfdf5', color: GREEN, padding: '2px 7px', borderRadius: 10 }}>VACANT</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

        </div>
      )}

      {/* Real Estate Vertical Suite Section */}
      {nicheId === 'realestate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 14, marginBottom: 20 }}>
          
          {/* Left Column: Hot Prospects Directory */}
          <SectionCard
            title="Hot Real Estate Prospects"
            subtitle="Customer leads seeking properties on WhatsApp"
            action={
              <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', padding: 2, borderRadius: 8 }}>
                {(['all', 'buy', 'rent'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setProspectFilter(type)}
                    style={{
                      padding: '4px 10px', fontSize: 11, fontWeight: 600, border: 'none', borderRadius: 6,
                      background: prospectFilter === type ? '#fff' : 'transparent',
                      color: prospectFilter === type ? '#111827' : '#6b7280',
                      boxShadow: prospectFilter === type ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                      cursor: 'pointer', textTransform: 'capitalize'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {[
                { name: 'Omar Sheikh', goal: 'buy', label: 'Buy 3-Bed Apartment', budget: 'PKR 2.5–3.0 Crore', area: 'Clifton / DHA', channel: 'WhatsApp', status: 'Hot Lead' },
                { name: 'Hina Malik', goal: 'rent', label: 'Rent 2-Bed Flat', budget: 'PKR 80,000–100,000 / mo', area: 'DHA Phase 5', channel: 'WhatsApp', status: 'Active Prospect' },
                { name: 'Zainab Fatima', goal: 'buy', label: 'Buy Luxury House', budget: 'PKR 5.0 Crore', area: 'KDA Scheme 1', channel: 'Instagram', status: 'Active Prospect' },
              ]
                .filter(p => prospectFilter === 'all' || p.goal === prospectFilter)
                .map((lead, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(220,38,38,0.06)',
                      background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 750, color: '#111827' }}>{lead.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: 10 }}>{lead.status}</span>
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#4b5563', marginTop: 6 }}>
                        {lead.label}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                        Budget: <strong style={{ color: '#111827' }}>{lead.budget}</strong> • Area: {lead.area}
                      </div>
                    </div>

                    <a
                      href="/conversations"
                      style={{
                        padding: '6px 12px', background: '#dc2626', color: '#fff',
                        borderRadius: 8, fontSize: 11.5, fontWeight: 650, textDecoration: 'none',
                        boxShadow: '0 2px 6px rgba(220,38,38,0.15)'
                      }}
                    >
                      Open Lead
                    </a>
                  </div>
                ))}
            </div>
          </SectionCard>

          {/* Right Column: Listing Portfolio Category view counts */}
          <SectionCard
            title="Shared Listings View Activity"
            subtitle="Visual traffic analysis of property listing links shared on WhatsApp"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
              {[
                { name: 'DHA Phase 6 Apartments', listings: 42, views: 312, color: '#dc2626' },
                { name: 'Clifton Seafront Penthouses', listings: 18, views: 247, color: '#ef4444' },
                { name: 'DHA Phase 8 Luxury Villas', listings: 24, views: 189, color: '#f87171' },
                { name: 'Commercial Spaces Clifton', listings: 35, views: 98, color: '#fee2e2' },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>{item.name}</span>
                    <span style={{ fontSize: 11.5, color: '#9ca3af' }}>{item.listings} props • <strong>{item.views} views</strong></span>
                  </div>
                  <div style={{ width: '100%', height: 7, background: '#f3f4f6', borderRadius: 3.5, overflow: 'hidden' }}>
                    <div style={{ width: `${(item.views / 350) * 100}%`, height: '100%', background: item.color }} />
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 12, borderTop: '1px solid rgba(220,38,38,0.06)', paddingTop: 12, marginTop: 4 }}>
                <div style={{ flex: 1, background: '#faf9f9', padding: '8px 12px', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase' }}>Shared Links</div>
                  <div style={{ fontSize: 15, fontWeight: 750, color: '#111827', marginTop: 2 }}>154</div>
                </div>
                <div style={{ flex: 1, background: '#faf9f9', padding: '8px 12px', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase' }}>Total Views</div>
                  <div style={{ fontSize: 15, fontWeight: 750, color: '#dc2626', marginTop: 2 }}>846 views</div>
                </div>
              </div>
            </div>
          </SectionCard>

        </div>
      )}

      {/* ── Standard Live CRM Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 20 }}>

        {/* Message Volume */}
        <SectionCard
          title="CRM Message Traffic"
          subtitle="Last 7 days volume — inbound vs outbound messages"
        >
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={RED} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={RED} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE} stopOpacity={0.14} />
                    <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="inbound" name="Inbound" stroke={RED} strokeWidth={2.5} fill="url(#gin)" dot={false} />
                <Area type="monotone" dataKey="outbound" name="Outbound" stroke={BLUE} strokeWidth={2} fill="url(#gout)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
            {[{ color: RED, label: 'Inbound Customer' }, { color: BLUE, label: 'Outbound Agent' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 3, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 11.5, color: '#9ca3af', fontWeight: 500 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Channel Pie */}
        <SectionCard title="Live Channel Breakdown" subtitle="Conversations by platform">
          {channels.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
              No chat logs recorded yet
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 4 }}>
                {channels.map((c: any) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                      <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{c.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>{c.value}</span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>convs</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* ── Recent Conversations ── */}
      <SectionCard
        title="Recent Client Conversations"
        subtitle="Latest active message threads across your channels"
        action={
          <a href="/conversations" style={{ fontSize: 12.5, color: RED, fontWeight: 650, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View Inbox <ArrowUpRight size={13} />
          </a>
        }
      >
        {loading ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading CRM logs…</div>
        ) : recent.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No active client threads yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 90px', gap: 12, padding: '0 12px 10px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span>Customer</span>
              <span>Channel</span>
              <span style={{ textAlign: 'center' }}>Messages</span>
              <span style={{ textAlign: 'right' }}>Date</span>
            </div>
            {recent.map((c: any, i: number) => {
              const channelColor = CHANNEL_COLORS[c.platform] || '#9ca3af';
              const initials = (c.customer_name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
              const date = new Date(c.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' });
              return (
                <a key={c.id} href="/conversations" style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 120px 80px 90px',
                    gap: 12, padding: '11px 12px', borderRadius: 10,
                    alignItems: 'center',
                    borderTop: i > 0 ? '1px solid rgba(220,38,38,0.05)' : 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fef8f8'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    {/* Customer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, ${RED}, #f87171)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff',
                      }}>{initials}</div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>
                          {c.customer_name || c.external_conversation_id}
                        </div>
                      </div>
                    </div>
                    {/* Channel */}
                    <div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 20,
                        background: channelColor + '18',
                        color: channelColor,
                        fontSize: 11.5, fontWeight: 600,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: channelColor, display: 'inline-block' }} />
                        {c.platform.charAt(0).toUpperCase() + c.platform.slice(1)}
                      </span>
                    </div>
                    {/* Message count */}
                    <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111827' }}>
                      {c.msgCount}
                    </div>
                    {/* Date */}
                    <div style={{ textAlign: 'right', fontSize: 12, color: '#9ca3af' }}>
                      {date}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </SectionCard>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
