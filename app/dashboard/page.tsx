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
import { usePlan } from '@/context/PlanContext';
import { useRouter } from 'next/navigation';

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
      background: 'white', borderRadius: 18, padding: '24px 26px',
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
      background: 'white', borderRadius: 20, padding: '22px 24px',
      border: '1px solid rgba(220,38,38,0.06)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3, fontWeight: 500 }}>{subtitle}</div>}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#111827', borderRadius: 12, padding: '10px 16px',
      color: '#fff', fontSize: 12, lineHeight: 1.6,
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

// ── Action Center Dashboard (Fallback when not set up) ──────────
function ActionCenterDashboard({ userName }: { userName: string }) {
  const { tenantInfo } = usePlan();
  const router = useRouter();
  
  const fbConnected = !!tenantInfo?.fb_page_id;
  const igConnected = !!tenantInfo?.ig_page_id;
  const qrLink = tenantInfo?.business_phone ? `https://wa.me/${tenantInfo.business_phone.replace(/[^0-9]/g, '')}` : null;

  return (
    <div style={{ padding: '32px 32px 50px', minHeight: '100%', background: '#faf9f9', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
          Hey {userName}, Welcome to Ittisalo!
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
          Connect your business to get your business phone number and unlock AI features.
        </p>
      </div>

      {/* Top 3 Action Blocks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        {/* WhatsApp Block */}
        <div style={{ background: '#10b981', borderRadius: 16, padding: '24px', color: '#fff', boxShadow: '0 4px 14px rgba(16,185,129,0.2)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Start WhatsApp Engagement for your Business</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 20, lineHeight: 1.5 }}>
            You'll need to Apply for WhatsApp Business API to use Ittisalo for your Business.
          </div>
          <button 
            onClick={() => router.push('/settings?tab=Channels+%26+APIs')}
            style={{ background: '#fff', color: '#10b981', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Apply for WhatsApp Business
          </button>
        </div>

        {/* Marketing API Block */}
        <div style={{ background: '#3b82f6', borderRadius: 16, padding: '24px', color: '#fff', boxShadow: '0 4px 14px rgba(59,130,246,0.2)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Unlock Marketing Messages API</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 20, lineHeight: 1.5 }}>
            Apply now to start sending marketing campaigns.
          </div>
          <button 
            onClick={() => router.push('/settings?tab=Channels+%26+APIs')}
            style={{ background: '#fff', color: '#3b82f6', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Apply for Marketing Messages API
          </button>
        </div>

        {/* Plan Block */}
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={14} color="#dc2626" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>
              {tenantInfo?.plan_status === 'active' ? `${tenantInfo.plan.toUpperCase()} Plan Active` : 'No Plan Active'}
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.5, flex: 1 }}>
            {tenantInfo?.plan_status === 'active' 
              ? 'You are currently subscribed to a premium plan.' 
              : 'You don\'t have an active plan. Subscribe to unlock messaging, leads, and more.'}
          </div>
          <button 
            onClick={() => router.push('/pricing')}
            style={{ background: '#111827', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Sparkles size={14} /> View Plans & Subscribe
          </button>
        </div>
      </div>

      {/* Middle Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Social Media Gradient Block */}
        <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #fdf2f8)', border: '1px solid #fbcfe8', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Connect Social Media for your Business</div>
          <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 20 }}>
            You'll need to Connect Facebook & Instagram Business accounts to use social features.
          </div>
          <button 
            onClick={() => router.push('/settings?tab=Channels+%26+APIs')}
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Sparkles size={14} /> Upgrade to setup Instagram & Facebook
          </button>
        </div>

        {/* QR Code Block */}
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', width: '100%', marginBottom: 16 }}>Download your QR code</div>
          <div style={{ width: 140, height: 140, background: '#fafafa', border: '1px dashed #d1d5db', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            {qrLink ? (
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrLink)}`} alt="QR" style={{ width: '100%', height: '100%', borderRadius: 12 }} />
            ) : (
              <span style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: 10 }}>Connect WhatsApp first</span>
            )}
          </div>
          <button style={{ background: '#111827', color: '#fff', border: 'none', padding: '10px 18px', width: '100%', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>
            Download QR Code
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
            <button 
              onClick={() => qrLink && window.open(qrLink, '_blank')}
              style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#374151', padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Open in WhatsApp
            </button>
            <button 
              onClick={() => qrLink && navigator.clipboard.writeText(qrLink)}
              style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#374151', padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>

      {/* Connected Accounts List */}
      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 16 }}>Connected Social Accounts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: '1px solid #f3f4f6', borderRadius: 12, background: fbConnected ? '#f0fdf4' : '#fafafa' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#3b82f6', fontWeight: 800 }}>f</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Facebook Page</div>
              <div style={{ fontSize: 11.5, color: fbConnected ? '#10b981' : '#ef4444', fontWeight: 500 }}>{fbConnected ? 'Connected' : 'Not Connected'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: '1px solid #f3f4f6', borderRadius: 12, background: igConnected ? '#f0fdf4' : '#fafafa' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>ig</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Instagram Business</div>
              <div style={{ fontSize: 11.5, color: igConnected ? '#10b981' : '#ef4444', fontWeight: 500 }}>{igConnected ? 'Connected' : 'Not Connected'}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { nicheId, niche } = useNiche();
  const { tenantInfo, planLoaded } = usePlan();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Database Aggregations ────────────────────────────────────
  const [stats, setStats] = useState({ conversations: 0, messages: 0, agentMessages: 0, customers: 0 });
  const [channels, setChannels] = useState<{ name: string; value: number; color: string }[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);

  // ── Interactive State (Live Data Only) ────────────────────────

  // Restaurant Niche
  const [restaurantOrders, setRestaurantOrders] = useState<any[]>([]);
  const [restaurantIssues, setRestaurantIssues] = useState<{ type: string; count: number }[]>([]);

  // eCommerce Niche
  const [ecoPipeline, setEcoPipeline] = useState<any[]>([]);

  // WooCommerce live orders state
  const [wcOrders, setWcOrders] = useState<any[]>([]);
  const [wcConnected, setWcConnected] = useState(false);
  const [wcLoading, setWcLoading] = useState(false);
  const [wcStoreName, setWcStoreName] = useState('');

  const fetchWooCommerceOrders = async () => {
    setWcLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
      if (!profile?.tenant_id) return;

      const { data: cred } = await supabase
        .from('integration_credentials')
        .select('credentials')
        .eq('tenant_id', profile.tenant_id)
        .eq('platform', 'woocommerce')
        .eq('is_active', true)
        .maybeSingle();

      if (!cred?.credentials) return;

      const { site_url, consumer_key, consumer_secret } = cred.credentials;
      if (!site_url || !consumer_key || !consumer_secret) return;

      const base = site_url.replace(/\/$/, '');
      setWcStoreName(base.replace(/https?:\/\//, '').split('/')[0]);

      const auth = btoa(`${consumer_key}:${consumer_secret}`);
      const res = await fetch(`${base}/wp-json/wc/v3/orders?per_page=10&orderby=date&order=desc`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });

      if (!res.ok) throw new Error('WooCommerce API error: ' + res.status);
      const orders = await res.json();
      setWcOrders(orders);
      setWcConnected(true);
    } catch (e) {
      console.error('[dashboard] WooCommerce fetch failed:', e);
      setWcConnected(false);
    } finally {
      setWcLoading(false);
    }
  };
  const [exchanges, setExchanges] = useState<any[]>([]);

  // Dental Niche
  const [dentalSchedule, setDentalSchedule] = useState<any[]>([]);
  const [dentalClinicalQueries, setDentalClinicalQueries] = useState<any[]>([]);

  // Real Estate Niche
  const [rePipeline, setRePipeline] = useState<any[]>([]);

  // Salon Niche
  const [salonSchedule, setSalonSchedule] = useState<Record<string, Record<string, { client: string; service: string }>>>({});
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);

  // Medical Clinic Niche
  const [medicalDoctors, setMedicalDoctors] = useState<Record<string, { time: string; patient: string; status: string }[]>>({});

  // ── Computed AI Stats (from real DB data) ─────────────────────
  const [aiStats, setAiStats] = useState({ resolvedPct: 0, escalatedPct: 0, avgResponseSec: 0, aiMsgsToday: 0 });
  const [userDisplayName, setUserDisplayName] = useState('');

  // ── Real-Time DB Subscriptions ───────────────────────────────
  const fetchAll = async () => {
    setRefreshing(true);
    try {
      // Fetch user display name
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('users').select('full_name, name').eq('id', user.id).maybeSingle();
        setUserDisplayName(profile?.full_name || profile?.name || user.email?.split('@')[0] || '');
      }

      const { data: convs } = await supabase.from('conversations').select('id, platform, customer_name, status, created_at');
      const { data: msgs } = await supabase.from('messages').select('id, sender_type, created_at, conversation_id');
      const { data: dbOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });

      if (dbOrders) {
        // Ecommerce Kanban Pipeline
        const ecoOrders = dbOrders.filter((o: any) => o.niche === 'ecommerce');
        setEcoPipeline(ecoOrders.map((o: any) => ({
          id: o.id,
          name: o.customer_name || o.customer_phone,
          item: Array.isArray(o.items) ? o.items.map((i:any) => i.name).join(', ') : 'Order items',
          status: o.status
        })));

        // Exchanges (where issue_type === 'exchange')
        const exchangeReqs = dbOrders.filter((o: any) => o.issue_type === 'exchange');
        setExchanges(exchangeReqs);

        // Restaurant
        const restOrders = dbOrders.filter((o: any) => o.niche === 'restaurant' && o.status !== 'delivered');
        setRestaurantOrders(restOrders.map((o: any) => ({
          id: o.id,
          name: o.customer_name || o.customer_phone,
          items: Array.isArray(o.items) ? o.items.map((i:any) => i.name).join(', ') : 'Items',
          status: o.status,
          area: o.delivery_address || 'Unknown Area',
          time: new Date(o.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        })));
        
        // Restaurant issues
        const restIssues = dbOrders.filter((o: any) => o.niche === 'restaurant' && o.issue_type);
        const issueCounts: Record<string, number> = {};
        restIssues.forEach((o: any) => { issueCounts[o.issue_type] = (issueCounts[o.issue_type] || 0) + 1; });
        setRestaurantIssues(Object.entries(issueCounts).map(([type, count]) => ({ type, count })));
      }

      if (convs && msgs) {
        const agentMsgs = msgs.filter((m: any) => m.sender_type === 'agent');
        const uniqueCustomers = new Set(convs.map((c: any) => c.customer_name)).size;

        setStats({
          conversations: convs.length,
          messages: msgs.length,
          agentMessages: agentMsgs.length,
          customers: uniqueCustomers || convs.length,
        });

        // Compute AI Agent Performance from real data
        const todayStr = new Date().toISOString().split('T')[0];
        const aiMsgsToday = agentMsgs.filter((m: any) => m.created_at?.startsWith(todayStr)).length;
        const resolvedConvs = convs.filter((c: any) => c.status === 'resolved').length;
        const escalatedConvs = convs.filter((c: any) => c.status === 'escalated').length;
        const handledConvs = resolvedConvs + escalatedConvs;
        const resolvedPct = handledConvs > 0 ? Math.round((resolvedConvs / handledConvs) * 100) : 0;
        const escalatedPct = handledConvs > 0 ? Math.round((escalatedConvs / handledConvs) * 100) : 0;
        setAiStats({ resolvedPct, escalatedPct, avgResponseSec: 0, aiMsgsToday });

        const channelCount: Record<string, number> = {};
        convs.forEach((c: any) => { channelCount[c.platform] = (channelCount[c.platform] || 0) + 1; });
        setChannels(Object.entries(channelCount).map(([name, value]: any) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: CHANNEL_COLORS[name] || '#9ca3af',
        })));

        // Generate weekly chat volume from real data
        const days: { time: string; inbound: number; outbound: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const label = d.toLocaleDateString('en', { weekday: 'short' });
          const dateStr = d.toISOString().split('T')[0];
          days.push({
            time: label,
            inbound: msgs.filter((m: any) => m.sender_type === 'customer' && m.created_at?.startsWith(dateStr)).length,
            outbound: msgs.filter((m: any) => m.sender_type === 'agent' && m.created_at?.startsWith(dateStr)).length,
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
    // Fetch WooCommerce live orders when in eCommerce niche
    if (nicheId === 'ecommerce') fetchWooCommerceOrders();

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
  const displayName = userDisplayName ? ` ${userDisplayName}` : '';

  // ── Show Action Center if missing Meta Connection or Plan ──
  if (planLoaded && tenantInfo && (!tenantInfo.meta_connected || tenantInfo.plan_status !== 'active')) {
    return <ActionCenterDashboard userName={userDisplayName || 'User'} />;
  }

  // Derived live stat values
  const todayWcRevenue = wcOrders.filter((o: any) => o.status === 'processing' || o.status === 'completed').reduce((sum: number, o: any) => sum + parseFloat(o.total || 0), 0);
  const todayWcOrdersConfirmed = wcOrders.filter((o: any) => o.status === 'processing' || o.status === 'completed').length;
  const todayWcOnHold = wcOrders.filter((o: any) => o.status === 'on-hold').length;
  const todayWcCodPending = wcOrders.filter((o: any) => o.status === 'pending').reduce((sum: number, o: any) => sum + parseFloat(o.total || 0), 0);
  const wcCurrency = wcOrders[0]?.currency || 'PKR';

  return (
    <div className="dashboard-page-wrap" style={{ padding: '32px 32px 50px', minHeight: '100%', background: '#faf9f9' }}>
      
      {/* ── Top Header ── */}
      <div className="page-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
        <div>
          <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{dateLabel}</div>
          <h1 className="dashboard-greeting" style={{ fontSize: 28, fontWeight: 900, color: DARK, letterSpacing: '-0.7px', lineHeight: 1.1 }}>
            {greeting}{displayName ? `,${displayName}` : ''} 👋
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
      <div className="stat-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {nicheId === 'restaurant' ? (
          <>
            <StatCard label="📦 Orders Today" value={restaurantOrders.length > 0 ? `${restaurantOrders.length} Orders` : '—'} sub="WhatsApp orders in queue" icon={ShoppingBag} color={RED} bg={RED_LIGHT} />
            <StatCard label="💰 Conversations" value={stats.conversations || '—'} sub="Total active chats" icon={DollarSign} color={GREEN} bg="#ecfdf5" />
            <StatCard label="🔄 Repeat Customers" value={stats.customers > 0 ? stats.customers : '—'} sub="Unique customers tracked" icon={Users} color={BLUE} bg={BLUE_LIGHT} />
            <StatCard label="⏱️ AI Messages" value={stats.agentMessages || '—'} sub="Sent by AI agent total" icon={Clock} color={AMBER} bg={AMBER_LIGHT} />
          </>
        ) : nicheId === 'ecommerce' ? (
          <>
            <StatCard label="💰 WC Revenue" value={wcConnected && todayWcRevenue > 0 ? `${wcCurrency} ${todayWcRevenue.toLocaleString()}` : wcLoading ? 'Loading…' : '—'} sub={wcConnected ? 'Processing + completed orders' : 'Connect WooCommerce in Settings'} icon={DollarSign} color={GREEN} bg="#ecfdf5" />
            <StatCard label="📦 Orders Today" value={wcConnected ? (todayWcOrdersConfirmed > 0 ? `${todayWcOrdersConfirmed} Confirmed` : 'No orders') : '—'} sub={wcConnected ? 'Processing & completed' : 'WooCommerce not connected'} icon={ShoppingBag} color={RED} bg={RED_LIGHT} />
            <StatCard label="🔄 Exchange Req" value={exchanges.length > 0 ? `${exchanges.length} Requests` : '—'} sub={exchanges.length > 0 ? `${exchanges.filter((e:any) => e.status === 'Resolved').length} resolved` : 'No exchanges logged'} icon={RefreshCw} color={BLUE} bg={BLUE_LIGHT} />
            <StatCard label="📍 COD Pending" value={wcConnected && todayWcOnHold > 0 ? `${wcCurrency} ${todayWcCodPending.toLocaleString()}` : '—'} sub={wcConnected ? `${todayWcOnHold} orders on-hold/COD` : 'Connect WooCommerce in Settings'} icon={Truck} color={AMBER} bg={AMBER_LIGHT} />
          </>
        ) : nicheId === 'dental' ? (
          <>
            <StatCard label="📅 Appts Today" value={dentalSchedule.filter((s:any) => s.status === 'confirmed' || s.status === 'pending').length > 0 ? `${dentalSchedule.filter((s:any) => s.status === 'confirmed' || s.status === 'pending').length} Booked` : '—'} sub="Confirmed dental slots" icon={Calendar} color={RED} bg={RED_LIGHT} />
            <StatCard label="👥 Conversations" value={stats.conversations || '—'} sub="Patient chats via WhatsApp" icon={UserPlus} color={BLUE} bg={BLUE_LIGHT} />
            <StatCard label="🔄 Available Slots" value={dentalSchedule.filter((s:any) => s.status === 'available').length > 0 ? `${dentalSchedule.filter((s:any) => s.status === 'available').length} Open` : '—'} sub="Book via AI agent" icon={RefreshCw} color={AMBER} bg={AMBER_LIGHT} />
            <StatCard label="🤖 AI Responses" value={stats.agentMessages || '—'} sub="Total AI messages sent" icon={DollarSign} color={GREEN} bg="#ecfdf5" />
          </>
        ) : nicheId === 'realestate' ? (
          <>
            <StatCard label="🎯 Active Leads" value={rePipeline.length > 0 ? rePipeline.length : '—'} sub="Leads in pipeline" icon={Target} color={RED} bg={RED_LIGHT} />
            <StatCard label="🔥 Hot Leads" value={rePipeline.filter((l:any) => l.temp === 'hot').length > 0 ? rePipeline.filter((l:any) => l.temp === 'hot').length : '—'} sub="Highest purchase intent" icon={Sparkles} color={GREEN} bg="#ecfdf5" />
            <StatCard label="📅 Visits Scheduled" value={rePipeline.filter((l:any) => l.stage === 'visit_scheduled').length > 0 ? rePipeline.filter((l:any) => l.stage === 'visit_scheduled').length : '—'} sub="Site visits confirmed" icon={Calendar} color={AMBER} bg={AMBER_LIGHT} />
            <StatCard label="💬 Conversations" value={stats.conversations || '—'} sub="Total WhatsApp chats" icon={Eye} color={BLUE} bg={BLUE_LIGHT} />
          </>
        ) : nicheId === 'salon' ? (
          <>
            <StatCard label="✂️ Bookings Today" value={Object.values(salonSchedule).reduce((sum, hours) => sum + Object.values(hours).filter(b => b.client).length, 0) > 0 ? `${Object.values(salonSchedule).reduce((sum, hours) => sum + Object.values(hours).filter(b => b.client).length, 0)} Booked` : '—'} sub="Confirmed stylist slots" icon={Scissors} color={RED} bg={RED_LIGHT} />
            <StatCard label="🌸 Bridal Inquiries" value={upcomingReminders.length > 0 ? upcomingReminders.length : '—'} sub="Pending bridal confirmations" icon={Sparkles} color={PURPLE} bg={PURPLE_LIGHT} />
            <StatCard label="💬 Conversations" value={stats.conversations || '—'} sub="Active WhatsApp chats" icon={DollarSign} color={GREEN} bg="#ecfdf5" />
            <StatCard label="🤖 AI Messages" value={stats.agentMessages || '—'} sub="Sent by AI agent total" icon={Clock} color={AMBER} bg={AMBER_LIGHT} />
          </>
        ) : (
          <>
            <StatCard label="📋 OPD Conversations" value={stats.conversations || '—'} sub="Patient chats today" icon={HeartPulse} color={RED} bg={RED_LIGHT} />
            <StatCard label="👥 Unique Patients" value={stats.customers || '—'} sub="Unique customer chats" icon={UserPlus} color={BLUE} bg={BLUE_LIGHT} />
            <StatCard label="⚕️ Clinical Queries" value={dentalClinicalQueries.length > 0 ? dentalClinicalQueries.length : '—'} sub="Awaiting doctor review" icon={FileText} color={AMBER} bg={AMBER_LIGHT} />
            <StatCard label="🤖 AI Messages" value={stats.agentMessages || '—'} sub="Total agent responses" icon={AlertCircle} color={GREEN} bg="#ecfdf5" />
          </>
        )}
      </div>

      {/* ── Core Niche Dashboard Layouts ── */}
      <div className="dashboard-layout-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        
        {/* Left Column: All Niche-Specific Workspace Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
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
                      background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
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
                            onClick={async () => {
                              await supabase.from('orders').update({ status: 'confirmed' }).eq('id', order.id);
                              // Realtime subscription will fetch changes
                            }}
                            style={{ padding: '6px 12px', background: GREEN, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Confirm
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={async () => {
                              await supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id);
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

              <div className="niche-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <SectionCard title="🔥 Top Ordered Products">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {restaurantOrders.length === 0 ? (
                      <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>No order data yet. Orders from WhatsApp will appear here.</div>
                    ) : Object.entries(
                        restaurantOrders.reduce((acc: Record<string, number>, o: any) => {
                          acc[o.items] = (acc[o.items] || 0) + 1; return acc;
                        }, {})
                      ).slice(0, 4).map(([name, count], idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#faf9f9' }}>
                          <span style={{ fontSize: 13, fontWeight: 650, color: '#374151' }}>{name}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: RED }}>{count}x</span>
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
              {/* ── WooCommerce Live Orders Banner ── */}
              {wcConnected && (
                <SectionCard
                  title="🛒 Live WooCommerce Orders"
                  subtitle={`Real-time orders pulled from ${wcStoreName}`}
                  action={
                    <button
                      onClick={fetchWooCommerceOrders}
                      style={{ padding: '5px 12px', fontSize: 11.5, fontWeight: 700, borderRadius: 8, border: '1px solid rgba(220,38,38,0.15)', background: wcLoading ? '#fef2f2' : '#fff', color: RED, cursor: 'pointer' }}
                    >
                      {wcLoading ? '⟳ Refreshing…' : '↻ Refresh'}
                    </button>
                  }
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {wcOrders.length === 0 && !wcLoading && (
                      <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>No recent WooCommerce orders found.</div>
                    )}
                    {wcOrders.slice(0, 8).map((order: any) => {
                      const statusColor: Record<string, string> = {
                        pending: AMBER, processing: BLUE, completed: GREEN,
                        cancelled: '#ef4444', refunded: '#8b5cf6', 'on-hold': '#6b7280'
                      };
                      const sc = statusColor[order.status] || '#6b7280';
                      const scBg = order.status === 'completed' ? '#ecfdf5' : order.status === 'processing' ? BLUE_LIGHT : order.status === 'pending' ? AMBER_LIGHT : '#f9fafb';
                      return (
                        <div key={order.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '11px 14px', borderRadius: 12,
                          background: 'white', border: '1px solid rgba(220,38,38,0.06)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: scBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                              🛍️
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                                #{order.number} — {order.billing?.first_name} {order.billing?.last_name}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>
                                {order.line_items?.slice(0, 2).map((i: any) => i.name).join(', ')}
                                {order.line_items?.length > 2 ? ` +${order.line_items.length - 2} more` : ''}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>
                              {order.currency} {parseFloat(order.total).toLocaleString()}
                            </div>
                            <div style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                              background: scBg, color: sc, textTransform: 'uppercase', marginTop: 3, display: 'inline-block'
                            }}>
                              {order.status}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>
              )}
              {!wcConnected && !wcLoading && (
                <div style={{ padding: '14px 18px', borderRadius: 14, background: AMBER_LIGHT, border: '1px solid rgba(245,158,11,0.2)', fontSize: 13, color: '#92400e', fontWeight: 500 }}>
                  ⚠️ <strong>WooCommerce not connected.</strong> Go to Settings → eCommerce Platform to link your WooCommerce store. Orders will appear here automatically.
                </div>
              )}
              <SectionCard title="Live Order Kanban Pipeline" subtitle="Order checkout status tracked dynamically via WhatsApp chat">
                <div className="niche-grid-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {/* Stage 1: PENDING ADDRESS */}
                  <div style={{ background: '#faf9f9', padding: 12, borderRadius: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 750, color: AMBER, textTransform: 'uppercase', marginBottom: 10 }}>Pending Address</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {ecoPipeline.filter(o => o.status === 'pending_address').map(order => (
                        <div key={order.id} style={{ background: '#fff', padding: 10, borderRadius: 8, border: '1px solid rgba(0,0,0,0.03)' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{order.name}</div>
                          <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 3 }}>{order.item}</div>
                          <button
                            onClick={async () => {
                              await supabase.from('orders').update({ status: 'confirmed' }).eq('id', order.id);
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
                            onClick={async () => {
                              await supabase.from('orders').update({ status: 'dispatched' }).eq('id', order.id);
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
                            onClick={async () => {
                              await supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id);
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
                      background: slot.status === 'confirmed' ? 'white' : slot.status === 'available' ? '#fefbfb' : '#fafafa',
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <SectionCard title="Weekly Treatment Breakdown">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Treatment breakdown data will populate as appointments are confirmed via WhatsApp.</div>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                  <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Specialty demand data will populate as patient consultations are confirmed via WhatsApp chats.</div>
                </div>
              </SectionCard>
            </>
          )}

        </div>

        {/* Right Column: AI Stats + Channel Overview + Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <SectionCard title="🤖 AI Agent Performance" subtitle="Calculated from your live conversation data">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Resolved by AI', val: aiStats.resolvedPct > 0 ? `${aiStats.resolvedPct}%` : stats.conversations > 0 ? 'In progress' : '—', color: RED, bg: RED_LIGHT },
                { label: 'Escalated to Human', val: aiStats.escalatedPct > 0 ? `${aiStats.escalatedPct}%` : '—', color: AMBER, bg: '#faf9f9' },
                { label: 'Total Conversations', val: stats.conversations > 0 ? `${stats.conversations} chats` : '—', color: GREEN, bg: '#faf9f9' },
                { label: 'AI Messages Today', val: aiStats.aiMsgsToday > 0 ? `${aiStats.aiMsgsToday} msgs` : '—', color: '#111827', bg: '#faf9f9' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: row.bg, borderRadius: 10 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 650, color: '#374151' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: row.color }}>{row.val}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="📊 Channel Breakdown">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {channels.length === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>No channels yet</div>
              ) : channels.map((c, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 9, height: 9, borderRadius: 3, background: c.color }} />
                      <span style={{ fontWeight: 700, color: '#374151' }}>{c.name}</span>
                    </div>
                    <strong style={{ color: '#111827' }}>{c.value}</strong>
                  </div>
                  <div style={{ width: '100%', height: 5, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((c.value / Math.max(channels.reduce((s, ch) => s + ch.value, 0), 1)) * 100)}%`, height: '100%', background: c.color }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Message Volume Chart — now in right column, no wasted row */}
          <SectionCard title="Message Volume" subtitle="Inbound vs outbound over 7 days">
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gInbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={RED} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={RED} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="inbound" name="Inbound" stroke={RED} strokeWidth={2} fill="url(#gInbound)" dot={false} />
                  <Area type="monotone" dataKey="outbound" name="Outbound" stroke={BLUE} strokeWidth={1.5} fill="none" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

        </div>

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
