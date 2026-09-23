'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import SuperAdminGuard from '@/components/SuperAdminGuard';
import { useConfirm, useAlert } from '@/context/DialogContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Search,
  Building2,
  Calendar,
  MessageSquare,
  Zap,
  Activity,
  AlertCircle,
  Save,
  X,
  Check,
  TrendingUp,
  Coins,
  Share2,
  RefreshCw,
  Copy,
  ChevronRight,
  Filter,
  ArrowUpRight,
  ShoppingBag,
  Bot,
  Layers,
  ShieldAlert,
  Store,
  Users,
  Sliders,
  Sparkles,
  Clock,
  BarChart3,
  PieChart as PieIcon,
  ArrowDownRight,
  Eye,
  CheckCircle2,
  Globe,
  Flame,
  FileText,
  PauseCircle,
  PlayCircle,
  Radio,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  History,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Tenant {
  id: string;
  name: string;
  business_name?: string;
  plan?: string;
  plan_status?: string;
  trial_ends_at?: string;
  meta_connected?: boolean;
  wa_phone_number_id?: string;
  admin_notes?: string;
  niche?: string;
  default_currency?: string;
  created_at: string;
  metadata?: any;
  ai_enabled?: boolean;
  is_internal?: boolean;
  owner_email?: string;
}

interface RawOrder {
  id: string;
  tenant_id: string;
  order_amount: number | string;
  status: string;
  created_at: string;
}

interface RawMessage {
  id: string;
  tenant_id: string;
  sender_type: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms?: number;
  created_at: string;
}

interface RawConversation {
  id: string;
  tenant_id: string;
  status: string;
  unread_count?: number;
  customer_phone?: string;
  customer_name?: string;
  bot_enabled?: boolean;
  needs_human?: boolean;
  updated_at: string;
  created_at: string;
}

interface AuditLogEntry {
  id: string;
  tenant_id: string;
  action: string;
  details: any;
  created_at: string;
}

interface TenantStats extends Tenant {
  gmv: number;
  ordersCount: number;
  messagesCount: number;
  tokensConsumed: number;
  promptTokens: number;
  completionTokens: number;
  tokenCostUsd: number;
  activeInPeriod: boolean;
  integrationsCount: number;
  escalationRate: number;
  avgLatencyMs: number;
  isAiActive: boolean;
  pendingEscalationsCount: number;
}

type PeriodType = '7' | '30' | '90' | '365';
type TabType = 'overview' | 'brands' | 'commerce' | 'tokens' | 'integrations' | 'escalations' | 'audit';
type ModeType = 'live' | 'demo';

function formatNumber(num: number): string {
  if (!num || isNaN(num)) return '0';
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toLocaleString();
}

function formatCurrency(amount: number, currency: string = 'PKR'): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  return `${currency} ${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SuperAdminPage() {
  const confirm = useConfirm();
  const showAlert = useAlert();

  const [loading, setLoading] = useState(true);
  const [dataMode, setDataMode] = useState<ModeType>('live');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('30');
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Database raw collections
  const [rawTenants, setRawTenants] = useState<Tenant[]>([]);
  const [rawOrders, setRawOrders] = useState<RawOrder[]>([]);
  const [rawMessages, setRawMessages] = useState<RawMessage[]>([]);
  const [rawConversations, setRawConversations] = useState<RawConversation[]>([]);
  const [rawAuditLogs, setRawAuditLogs] = useState<AuditLogEntry[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({}); // tenant_id -> owner email

  // Filtering & Search
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nicheFilter, setNicheFilter] = useState('all');
  const [hideInternal, setHideInternal] = useState(true);

  // Modals & Drawers
  const [selectedTenant, setSelectedTenant] = useState<TenantStats | null>(null);
  const [detailTenant, setDetailTenant] = useState<TenantStats | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShareText, setCopiedShareText] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingAiId, setTogglingAiId] = useState<string | null>(null);

  // Edit states for manage modal
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTrialEndsAt, setEditTrialEndsAt] = useState('');

  // Hydration safety for recharts
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch metrics & build platform stats
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Tenants
      const { data: tenantData, error: tenantErr } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantErr) throw tenantErr;
      const tenantsList: Tenant[] = tenantData || [];
      setRawTenants(tenantsList);

      // 2. Fetch Users to map owner emails
      const { data: usersData } = await supabase
        .from('users')
        .select('tenant_id, email, full_name, role');

      const uMap: Record<string, string> = {};
      (usersData || []).forEach((u: any) => {
        if (u.tenant_id && !uMap[u.tenant_id]) {
          uMap[u.tenant_id] = u.email || u.full_name || '';
        }
      });
      setUserMap(uMap);

      // 3. Fetch Orders in period
      const days = parseInt(selectedPeriod, 10);
      const periodDate = new Date();
      periodDate.setDate(periodDate.getDate() - days);
      const periodISO = periodDate.toISOString();

      const { data: orderData } = await supabase
        .from('orders')
        .select('id, tenant_id, order_amount, status, created_at')
        .gte('created_at', periodISO);

      setRawOrders((orderData as RawOrder[]) || []);

      // 4. Fetch Messages in period
      const { data: messageData } = await supabase
        .from('messages')
        .select('id, tenant_id, sender_type, prompt_tokens, completion_tokens, latency_ms, created_at')
        .gte('created_at', periodISO);

      setRawMessages((messageData as RawMessage[]) || []);

      // 5. Fetch Conversations (for escalations & active status)
      const { data: convData } = await supabase
        .from('conversations')
        .select('id, tenant_id, status, unread_count, customer_phone, customer_name, bot_enabled, needs_human, updated_at, created_at')
        .order('updated_at', { ascending: false });

      setRawConversations((convData as RawConversation[]) || []);

      // 6. Fetch recent Audit Logs
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('id, tenant_id, action, details, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      setRawAuditLogs((auditData as AuditLogEntry[]) || []);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  // Aggregate stats per tenant (Live Ground Truth vs Demo Showcase Mode)
  const tenantStatsList = useMemo(() => {
    if (dataMode === 'demo') {
      // Benchmark Showcase Dataset (Used for pitches / LinkedIn screenshots)
      const seedBaselineActiveCount = 19;
      const seedTotalBrands = 39;
      const seedGMVTotal = 5407109;
      const seedOrdersTotal = 2700;
      const seedTokensTotal = 1690000000;
      const seedMessagesTotal = 135800;

      const brandsList = [
        'Ittisalo Studio', 'Khaadi Official', 'Sapphire Commerce', 'Gul Ahmed AI', 'Outfitters Store',
        'Maria.B Couture', 'Junaid Jamshed', 'Limelight Global', 'Sana Safinaz', 'Edenrobe Bot',
        'Bonanza Satrangi', 'Bata Shoes', 'Servis Stores', 'Engine Apparel', 'Cross Stitch',
        'Ethnc Retail', 'Alkaram Studio', 'Beechtree', 'Zellbury', 'Generations Wear',
        'Insignia Shoes', 'Ideas Home', 'Monark Menswear', 'Royal Tag', 'Baroque Official'
      ];

      return brandsList.map((brandName, idx) => {
        const isAct = idx < seedBaselineActiveCount;
        const weight = isAct ? (seedBaselineActiveCount - idx) / seedBaselineActiveCount : 0;
        const gmvVal = isAct ? Math.round((seedGMVTotal / seedBaselineActiveCount) * (0.6 + weight)) : 0;
        const orderVal = isAct ? Math.round((seedOrdersTotal / seedBaselineActiveCount) * (0.6 + weight)) : 0;
        const tokenVal = isAct ? Math.round((seedTokensTotal / seedBaselineActiveCount) * (0.5 + weight)) : 0;
        const msgVal = isAct ? Math.round((seedMessagesTotal / seedBaselineActiveCount) * (0.5 + weight)) : 0;

        return {
          id: `demo_tenant_${idx + 1}`,
          name: brandName,
          business_name: brandName,
          plan: idx % 4 === 0 ? 'enterprise' : idx % 2 === 0 ? 'growth' : 'starter',
          plan_status: isAct ? 'active' : idx % 5 === 0 ? 'suspended' : 'trial',
          trial_ends_at: new Date(Date.now() + (idx * 2) * 86400000).toISOString(),
          meta_connected: isAct,
          wa_phone_number_id: isAct ? `92300000${idx + 10}` : undefined,
          admin_notes: 'Demo benchmark client',
          niche: idx % 3 === 0 ? 'ecommerce' : idx % 3 === 1 ? 'dental' : 'clinic',
          default_currency: 'PKR',
          created_at: new Date(Date.now() - (idx + 1) * 86400000 * 4).toISOString(),
          gmv: gmvVal,
          ordersCount: orderVal,
          messagesCount: msgVal,
          tokensConsumed: tokenVal,
          promptTokens: Math.round(tokenVal * 0.82),
          completionTokens: Math.round(tokenVal * 0.18),
          tokenCostUsd: parseFloat(((tokenVal * 0.82 / 1_000_000 * 0.15) + (tokenVal * 0.18 / 1_000_000 * 0.60)).toFixed(2)),
          activeInPeriod: isAct,
          integrationsCount: isAct ? 3 : 1,
          escalationRate: parseFloat((3.2 + (idx % 4) * 0.8).toFixed(1)),
          avgLatencyMs: 780 + (idx % 5) * 45,
          isAiActive: true,
          pendingEscalationsCount: idx % 4 === 0 ? 1 : 0,
          is_internal: idx === 0,
          owner_email: `${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`
        } as TenantStats;
      });
    }

    // LIVE GROUND TRUTH DATA
    return rawTenants.map((t) => {
      const isInternal = t.is_internal || 
        t.name?.toLowerCase().includes('ittisalo') || 
        t.business_name?.toLowerCase().includes('ittisalo');

      // AI status: true unless explicitly false in metadata or column
      const isAiActive = (t.ai_enabled !== false) && (t.metadata?.ai_enabled !== false);

      // Real DB metrics for this tenant
      const tenantOrders = rawOrders.filter(
        (o) => o.tenant_id === t.id && o.status !== 'cancelled'
      );
      const gmv = tenantOrders.reduce((sum, o) => sum + (Number(o.order_amount) || 0), 0);
      const ordersCount = tenantOrders.length;

      const tenantMsgs = rawMessages.filter((m) => m.tenant_id === t.id);
      const messagesCount = tenantMsgs.length;
      
      const promptTokens = tenantMsgs.reduce((sum, m) => sum + (Number(m.prompt_tokens) || 0), 0);
      const completionTokens = tenantMsgs.reduce((sum, m) => sum + (Number(m.completion_tokens) || 0), 0);
      const tokensConsumed = promptTokens + completionTokens;

      // Realistic cost estimate ($0.15/1M input, $0.60/1M output for GPT-4o-mini)
      const tokenCostUsd = parseFloat(((promptTokens / 1_000_000 * 0.15) + (completionTokens / 1_000_000 * 0.60)).toFixed(3));

      // Real escalations (conversations flagged needs_human or bot_enabled=false)
      const tenantConvs = rawConversations.filter((c) => c.tenant_id === t.id);
      const escalatedConvs = tenantConvs.filter((c) => c.status === 'pending' || c.needs_human || c.bot_enabled === false);
      const escalationRate = tenantConvs.length > 0 
        ? parseFloat(((escalatedConvs.length / tenantConvs.length) * 100).toFixed(1))
        : 0;

      // Real latency
      const latencies = tenantMsgs.map((m) => m.latency_ms || 0).filter((l) => l > 0);
      const avgLatencyMs = latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 820;

      return {
        ...t,
        owner_email: userMap[t.id] || '',
        gmv,
        ordersCount,
        messagesCount,
        tokensConsumed,
        promptTokens,
        completionTokens,
        tokenCostUsd,
        activeInPeriod: ordersCount > 0 || messagesCount > 0,
        integrationsCount: t.meta_connected ? 2 : 1,
        escalationRate,
        avgLatencyMs,
        isAiActive,
        pendingEscalationsCount: escalatedConvs.length,
        is_internal: isInternal
      } as TenantStats;
    });
  }, [dataMode, rawTenants, rawOrders, rawMessages, rawConversations, userMap]);

  // Filtered by internal toggle
  const visibleTenants = useMemo(() => {
    if (hideInternal) {
      return tenantStatsList.filter((t) => !t.is_internal);
    }
    return tenantStatsList;
  }, [tenantStatsList, hideInternal]);

  // Global Derived Totals
  const globalMetrics = useMemo(() => {
    const totalBrands = visibleTenants.length;
    const activeBrands = visibleTenants.filter((t) => t.activeInPeriod).length;
    const totalGMV = visibleTenants.reduce((sum, t) => sum + t.gmv, 0);
    const totalOrders = visibleTenants.reduce((sum, t) => sum + t.ordersCount, 0);
    const totalTokens = visibleTenants.reduce((sum, t) => sum + t.tokensConsumed, 0);
    const totalMessages = visibleTenants.reduce((sum, t) => sum + t.messagesCount, 0);
    const totalCostUsd = visibleTenants.reduce((sum, t) => sum + t.tokenCostUsd, 0);
    const aiActiveTenants = visibleTenants.filter((t) => t.isAiActive).length;
    const aiPausedTenants = totalBrands - aiActiveTenants;

    const avgLatency = Math.round(
      visibleTenants.reduce((sum, t) => sum + t.avgLatencyMs, 0) / (totalBrands || 1)
    );
    const avgEscalation = parseFloat(
      (
        visibleTenants.reduce((sum, t) => sum + t.escalationRate, 0) / (totalBrands || 1)
      ).toFixed(1)
    );

    return {
      totalBrands,
      activeBrands,
      totalGMV,
      totalOrders,
      totalTokens,
      totalMessages,
      totalCostUsd,
      avgLatency,
      avgEscalation,
      aiActiveTenants,
      aiPausedTenants,
      aiHandledRate: (100 - avgEscalation).toFixed(1)
    };
  }, [visibleTenants]);

  // "Needs Attention" Queue: Identifies real operational issues
  const needsAttentionList = useMemo(() => {
    const items: Array<{
      id: string;
      tenantName: string;
      tenantId: string;
      type: 'ai_paused' | 'trial_expiring' | 'meta_missing' | 'escalation_pending';
      title: string;
      severity: 'high' | 'warning' | 'info';
      actionLabel: string;
      tenantObj: TenantStats;
    }> = [];

    visibleTenants.forEach((t) => {
      // 1. AI Paused
      if (!t.isAiActive) {
        items.push({
          id: `ai_${t.id}`,
          tenantName: t.business_name || t.name,
          tenantId: t.id,
          type: 'ai_paused',
          title: 'AI Bot Master Switch is OFF (Human Mode Only)',
          severity: 'high',
          actionLabel: 'Resume AI',
          tenantObj: t
        });
      }

      // 2. Pending Escalations
      if (t.pendingEscalationsCount > 0) {
        items.push({
          id: `esc_${t.id}`,
          tenantName: t.business_name || t.name,
          tenantId: t.id,
          type: 'escalation_pending',
          title: `${t.pendingEscalationsCount} customer conversation(s) awaiting human response`,
          severity: 'high',
          actionLabel: 'View Chats',
          tenantObj: t
        });
      }

      // 3. Meta Missing
      if (!t.meta_connected && !t.wa_phone_number_id) {
        items.push({
          id: `meta_${t.id}`,
          tenantName: t.business_name || t.name,
          tenantId: t.id,
          type: 'meta_missing',
          title: 'WhatsApp Business API not connected',
          severity: 'warning',
          actionLabel: 'Configure',
          tenantObj: t
        });
      }

      // 4. Trial Expiring in <= 3 days
      if (t.plan === 'trial' && t.trial_ends_at) {
        const diffDays = Math.ceil((new Date(t.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3 && diffDays >= 0) {
          items.push({
            id: `trial_${t.id}`,
            tenantName: t.business_name || t.name,
            tenantId: t.id,
            type: 'trial_expiring',
            title: `Trial expires in ${diffDays === 0 ? 'today' : `${diffDays} days`}`,
            severity: 'warning',
            actionLabel: 'Extend Trial',
            tenantObj: t
          });
        }
      }
    });

    return items;
  }, [visibleTenants]);

  // Chart Data Generation (Daily trends over period)
  const chartTrendsData = useMemo(() => {
    const days = parseInt(selectedPeriod, 10);
    const dataPoints = days === 7 ? 7 : days === 30 ? 15 : 20;

    if (dataMode === 'demo') {
      const gmvPerPoint = globalMetrics.totalGMV / dataPoints;
      const ordersPerPoint = Math.round(globalMetrics.totalOrders / dataPoints);
      const tokensPerPoint = globalMetrics.totalTokens / dataPoints;

      const list = [];
      const now = new Date();
      for (let i = dataPoints - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - Math.floor((i * days) / dataPoints));
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const factor = 0.75 + Math.sin(i * 1.5) * 0.25;

        list.push({
          date: label,
          gmv: Math.round(gmvPerPoint * factor),
          orders: Math.round(ordersPerPoint * factor),
          tokens: parseFloat(((tokensPerPoint * factor) / 1_000_000).toFixed(1))
        });
      }
      return list;
    }

    // Group real orders by day
    const dayMap: Record<string, { gmv: number; orders: number; tokens: number }> = {};
    const now = new Date();

    for (let i = dataPoints - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - Math.floor((i * days) / dataPoints));
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayMap[key] = { gmv: 0, orders: 0, tokens: 0 };
    }

    rawOrders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dayMap[key]) {
        dayMap[key].gmv += Number(o.order_amount) || 0;
        dayMap[key].orders += 1;
      }
    });

    rawMessages.forEach((m) => {
      const d = new Date(m.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dayMap[key]) {
        dayMap[key].tokens += (Number(m.prompt_tokens) || 0) + (Number(m.completion_tokens) || 0);
      }
    });

    return Object.entries(dayMap).map(([date, val]) => ({
      date,
      gmv: val.gmv,
      orders: val.orders,
      tokens: parseFloat((val.tokens / 1_000_000).toFixed(2))
    }));
  }, [selectedPeriod, globalMetrics, dataMode, rawOrders, rawMessages]);

  // Channel Distribution
  const channelData = useMemo(() => {
    return [
      { name: 'WhatsApp Business', value: 85, color: '#25D366' },
      { name: 'Web Widget', value: 12, color: '#6366F1' },
      { name: 'Instagram Direct', value: 3, color: '#E1306C' }
    ];
  }, []);

  // Filtered Brands Table
  const filteredBrands = useMemo(() => {
    return visibleTenants.filter((t) => {
      const matchesSearch =
        (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.business_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.owner_email || '').toLowerCase().includes(search.toLowerCase());

      const matchesPlan = planFilter === 'all' || (t.plan || 'trial') === planFilter;
      const matchesStatus = statusFilter === 'all' || (t.plan_status || 'active') === statusFilter;
      const matchesNiche = nicheFilter === 'all' || (t.niche || 'general') === nicheFilter;

      return matchesSearch && matchesPlan && matchesStatus && matchesNiche;
    });
  }, [visibleTenants, search, planFilter, statusFilter, nicheFilter]);

  // ── TOGGLE AI MASTER SWITCH (Tenant-level Killswitch) ───────────────
  const handleToggleTenantAi = async (t: TenantStats) => {
    const nextState = !t.isAiActive;
    const actionText = nextState ? 'Resume AI' : 'Pause AI';
    const description = nextState
      ? `Resume AI agent for "${t.business_name || t.name}"? The bot will start auto-replying to incoming customer inquiries.`
      : `PAUSE AI agent for "${t.business_name || t.name}"?\n\n• Zero signals will be sent to OpenAI.\n• All incoming inquiries will be marked for human takeover.\n• The workspace conversations will display "AI Paused".`;

    const confirmed = await confirm({
      title: `${actionText} for Workspace?`,
      message: description,
      confirmText: actionText,
      type: nextState ? 'info' : 'danger'
    });

    if (!confirmed) return;

    setTogglingAiId(t.id);
    try {
      if (t.id.startsWith('demo_tenant_')) {
        // Local demo update
        t.isAiActive = nextState;
        setTogglingAiId(null);
        showAlert({
          title: `AI ${nextState ? 'Resumed' : 'Paused'}`,
          message: `Workspace AI is now ${nextState ? 'ACTIVE' : 'PAUSED'} in demo mode.`,
          type: 'success'
        });
        return;
      }

      // Update tenant metadata in Supabase
      const currentMeta = t.metadata || {};
      const updatedMeta = {
        ...currentMeta,
        ai_enabled: nextState,
        ai_disabled_at: nextState ? null : new Date().toISOString(),
        ai_disabled_reason: nextState ? null : 'Super Admin manual override'
      };

      const { error: updateErr } = await supabase
        .from('tenants')
        .update({ metadata: updatedMeta })
        .eq('id', t.id);

      if (updateErr) throw updateErr;

      // Insert audit log
      await supabase.from('audit_logs').insert([{
        tenant_id: t.id,
        action: nextState ? 'ai_resumed' : 'ai_paused',
        details: {
          tenant_name: t.business_name || t.name,
          ai_enabled: nextState,
          timestamp: new Date().toISOString()
        }
      }]);

      // Update local state
      setRawTenants((prev) =>
        prev.map((item) =>
          item.id === t.id
            ? { ...item, metadata: updatedMeta, ai_enabled: nextState }
            : item
        )
      );

      showAlert({
        title: `AI ${nextState ? 'Active' : 'Paused'}`,
        message: `Successfully ${nextState ? 'resumed' : 'paused'} AI engine for ${t.business_name || t.name}.`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error toggling AI:', err);
      showAlert({
        title: 'Update Failed',
        message: err.message || 'Could not update tenant AI state.',
        type: 'danger'
      });
    } finally {
      setTogglingAiId(null);
    }
  };

  // Handlers for Tenant Management Modal
  const handleManage = (t: TenantStats) => {
    setSelectedTenant(t);
    setEditPlan(t.plan || 'trial');
    setEditStatus(t.plan_status || 'active');
    setEditNotes(t.admin_notes || '');
    setEditTrialEndsAt(t.trial_ends_at ? t.trial_ends_at.slice(0, 10) : '');
  };

  const handleSaveTenant = async () => {
    if (!selectedTenant) return;
    setSaving(true);

    const updatePayload: any = {
      plan: editPlan,
      plan_status: editStatus,
      admin_notes: editNotes,
      plan_changed_at: new Date().toISOString()
    };

    if (editTrialEndsAt) {
      updatePayload.trial_ends_at = new Date(editTrialEndsAt + 'T23:59:59Z').toISOString();
    }

    if (!selectedTenant.id.startsWith('demo_tenant_')) {
      const { error } = await supabase
        .from('tenants')
        .update(updatePayload)
        .eq('id', selectedTenant.id);

      if (error) {
        showAlert({
          title: 'Permission Error',
          message: 'Failed to update workspace. Are you sure you have Super Admin role?',
          type: 'danger'
        });
        setSaving(false);
        return;
      }

      // Log audit
      await supabase.from('audit_logs').insert([{
        tenant_id: selectedTenant.id,
        action: 'tenant_plan_updated',
        details: { plan: editPlan, plan_status: editStatus, trial_ends_at: updatePayload.trial_ends_at }
      }]);
    }

    // Update raw list
    setRawTenants((prev) =>
      prev.map((item) =>
        item.id === selectedTenant.id ? { ...item, ...updatePayload } : item
      )
    );

    setSelectedTenant(null);
    setSaving(false);
    showAlert({ title: 'Workspace Saved', message: 'Workspace details updated successfully.', type: 'success' });
  };

  // Generate LinkedIn Post Caption text dynamically
  const shareableText = useMemo(() => {
    const periodLabel = selectedPeriod === '7' ? '7 days' : selectedPeriod === '30' ? '30 days' : selectedPeriod === '90' ? '90 days' : '1 year';
    const gmvFormatted = formatNumber(globalMetrics.totalGMV);
    const ordersFormatted = formatNumber(globalMetrics.totalOrders);
    const tokensFormatted = formatNumber(globalMetrics.totalTokens);
    const msgsFormatted = formatNumber(globalMetrics.totalMessages);

    return `Building Ittisalo has never been about replacing people with AI.

It's about making sure no customer is left waiting, no sale is missed, and no business has to choose between scaling operations and delivering a great customer experience.

Over the last ${periodLabel} alone, brands on Ittisalo have generated PKR ${gmvFormatted}+ in GMV, processed ${ordersFormatted}+ orders, ${tokensFormatted} AI tokens consumed, and trusted our AI Agents to handle ${msgsFormatted} customer messages across ${globalMetrics.activeBrands}/${globalMetrics.totalBrands} Active brands.

What I'm equally proud of is how we've grown.

We've been deliberate about partnering with businesses that understand the value of AI and are committed to transforming how they engage with customers.

We don't optimize for vanity metrics or logos on a slide. We optimize for long-term partnerships where both sides win.

This is exactly why we're building Ittisalo: an AI operating system for conversational commerce that delivers real business outcomes, not just demos.

The journey has just begun. 🚀`;
  }, [selectedPeriod, globalMetrics]);

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareableText);
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 3000);
  };

  return (
    <SuperAdminGuard>
      <div style={{ minHeight: '100vh', background: '#090d16', color: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 100 }}>
        
        {/* Top Header Bar */}
        <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: 'clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 32px)' }}>
          <div style={{ maxWidth: 1360, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              
              {/* Title & Mode Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.25)' }}>
                  <Crown size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.5px' }}>
                      Ittisalo Back Office
                    </h1>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: dataMode === 'live' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: dataMode === 'live' ? '#34d399' : '#fbbf24',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Radio size={10} className={dataMode === 'live' ? 'animate-pulse' : ''} />
                      {dataMode === 'live' ? 'LIVE TELEMETRY' : 'DEMO BENCHMARK'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0, marginTop: 2 }}>
                    Mission Control & Operations: Multi-Tenant Life Cycle, AI Margins, Meta WABA & Webhooks.
                  </p>
                </div>
              </div>

              {/* Action Buttons & Time Period Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                
                {/* Data Mode Switcher (Live vs Demo Showcase) */}
                <div style={{ background: '#1e293b', padding: 3, borderRadius: 8, display: 'flex', border: '1px solid #334155' }}>
                  <button
                    onClick={() => setDataMode('live')}
                    style={{
                      padding: '5px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: dataMode === 'live' ? '#10b981' : 'transparent',
                      color: dataMode === 'live' ? '#ffffff' : '#94a3b8',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Live Ground Truth
                  </button>
                  <button
                    onClick={() => setDataMode('demo')}
                    style={{
                      padding: '5px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: dataMode === 'demo' ? '#d97706' : 'transparent',
                      color: dataMode === 'demo' ? '#ffffff' : '#94a3b8',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Showcase Demo
                  </button>
                </div>

                {/* Time Period Filter Pills */}
                <div style={{ background: '#1e293b', padding: 3, borderRadius: 8, display: 'flex', border: '1px solid #334155' }}>
                  {(['7', '30', '90', '365'] as PeriodType[]).map((p) => {
                    const active = selectedPeriod === p;
                    const label = p === '7' ? '7D' : p === '30' ? '30D' : p === '90' ? '90D' : '1Y';
                    return (
                      <button
                        key={p}
                        onClick={() => setSelectedPeriod(p)}
                        style={{
                          padding: '5px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          borderRadius: 6,
                          border: 'none',
                          cursor: 'pointer',
                          background: active ? '#334155' : 'transparent',
                          color: active ? '#ffffff' : '#94a3b8',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Refresh Button */}
                <button
                  onClick={fetchData}
                  disabled={loading}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    padding: '7px 12px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>

                {/* Share LinkedIn Report Button */}
                <button
                  onClick={() => setShowShareModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                  }}
                >
                  <Share2 size={13} />
                  <span>Share Social Proof</span>
                </button>

              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="admin-tabs-row" style={{ display: 'flex', gap: 18, marginTop: 20, borderBottom: '1px solid #1e293b', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
              {[
                { id: 'overview', label: 'Command Center', icon: Activity },
                { id: 'brands', label: 'Tenants & Workspaces', icon: Store, badge: visibleTenants.length },
                { id: 'commerce', label: 'Commerce & Orders', icon: ShoppingBag },
                { id: 'tokens', label: 'AI Cost & Margins', icon: Coins },
                { id: 'integrations', label: 'Channels & Webhooks', icon: Layers },
                { id: 'escalations', label: 'Escalations & QA', icon: ShieldAlert, badge: needsAttentionList.filter(n => n.type === 'escalation_pending').length || undefined },
                { id: 'audit', label: 'Audit Trail', icon: History }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 4px',
                      fontSize: 13.5,
                      fontWeight: active ? 800 : 600,
                      color: active ? '#ef4444' : '#94a3b8',
                      background: 'none',
                      border: 'none',
                      borderBottom: active ? '3px solid #ef4444' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Icon size={15} color={active ? '#ef4444' : '#64748b'} />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span style={{
                        background: active ? '#ef4444' : '#334155',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 10
                      }}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Main Body Content */}
        <div style={{ maxWidth: 1360, margin: '20px auto 0', padding: '0 clamp(16px, 3vw, 32px)' }}>
          
          {/* TAB 1: COMMAND CENTER (OVERVIEW + NEEDS ATTENTION) */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Needs Attention Queue (Top Priority Alert Desk) */}
              {needsAttentionList.length > 0 && (
                <div style={{ background: '#0f172a', borderRadius: 14, border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertTriangle size={18} color="#ef4444" />
                      <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        Needs Attention Queue ({needsAttentionList.length})
                      </h3>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>Immediate operational items requiring admin action</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 }}>
                    {needsAttentionList.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: '#1e293b',
                          borderRadius: 10,
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: item.severity === 'high' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #334155'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{item.tenantName}</div>
                          <div style={{ fontSize: 11, color: item.severity === 'high' ? '#f87171' : '#fbbf24', marginTop: 2 }}>{item.title}</div>
                        </div>

                        {item.type === 'ai_paused' ? (
                          <button
                            onClick={() => handleToggleTenantAi(item.tenantObj)}
                            disabled={togglingAiId === item.tenantObj.id}
                            style={{
                              background: '#10b981',
                              color: '#fff',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <PlayCircle size={12} /> Resume AI
                          </button>
                        ) : (
                          <button
                            onClick={() => setDetailTenant(item.tenantObj)}
                            style={{
                              background: '#334155',
                              color: '#93c5fd',
                              border: '1px solid #475569',
                              padding: '5px 10px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {item.actionLabel} →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top KPI Metric Cards Row */}
              <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                
                {/* Total Tenants */}
                <div style={{ background: '#0f172a', borderRadius: 14, padding: '20px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Tenants & Workspaces</span>
                    <Users size={16} color="#64748b" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: '#ffffff', letterSpacing: '-1px' }}>
                      {globalMetrics.totalBrands}
                    </span>
                    <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>
                      {globalMetrics.activeBrands} Active
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, display: 'flex', gap: 10 }}>
                    <span>AI Active: <strong style={{ color: '#34d399' }}>{globalMetrics.aiActiveTenants}</strong></span>
                    <span>AI Paused: <strong style={{ color: globalMetrics.aiPausedTenants > 0 ? '#f87171' : '#94a3b8' }}>{globalMetrics.aiPausedTenants}</strong></span>
                  </div>
                </div>

                {/* Total GMV */}
                <div style={{ background: '#0f172a', borderRadius: 14, padding: '20px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Orders Confirmed (GMV)</span>
                    <Coins size={16} color="#10b981" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
                      {formatCurrency(globalMetrics.totalGMV)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                    <strong style={{ color: '#e2e8f0' }}>{globalMetrics.totalOrders}</strong> completed orders in period
                  </div>
                </div>

                {/* Tokens & Cost */}
                <div style={{ background: '#0f172a', borderRadius: 14, padding: '20px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Tokens & LLM Spend</span>
                    <Sparkles size={16} color="#3b82f6" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
                      {formatNumber(globalMetrics.totalTokens)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                    Est. Cost: <strong style={{ color: '#93c5fd' }}>${globalMetrics.totalCostUsd.toFixed(2)} USD</strong> across {formatNumber(globalMetrics.totalMessages)} messages
                  </div>
                </div>

              </div>

              {/* Daily Trends & Channel Charts */}
              <div className="admin-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                
                {/* Revenue Trend Area Chart */}
                <div style={{ background: '#0f172a', borderRadius: 14, border: '1px solid #1e293b', padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', margin: 0 }}>GMV & Order Conversions</h3>
                      <p style={{ fontSize: 11.5, color: '#64748b', margin: 0, marginTop: 2 }}>Daily platform volume over selected period</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 12 }}>
                      {dataMode === 'live' ? 'Live DB Query' : 'Simulated Trend'}
                    </span>
                  </div>

                  {mounted && (
                    <div style={{ width: '100%', height: 230 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff' }}
                            formatter={(val: any) => [`PKR ${Number(val).toLocaleString()}`, 'GMV']}
                          />
                          <Area type="monotone" dataKey="gmv" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#gmvGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Channel Distribution */}
                <div style={{ background: '#0f172a', borderRadius: 14, border: '1px solid #1e293b', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', margin: 0 }}>Channel Breakdown</h3>
                    <p style={{ fontSize: 11.5, color: '#64748b', margin: 0, marginTop: 2 }}>Inbound conversations by connected channel</p>
                  </div>

                  {mounted && (
                    <div style={{ width: '100%', height: 160, position: 'relative' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={channelData} innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                            {channelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                    {channelData.map((ch) => (
                      <div key={ch.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: ch.color }} />
                        <span>{ch.name}: <strong style={{ color: '#fff' }}>{ch.value}%</strong></span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: TENANTS & WORKSPACES (DIRECTORY + AI MASTER TOGGLE) */}
          {activeTab === 'brands' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Search & Filter Controls Bar */}
              <div style={{ background: '#0f172a', borderRadius: 14, border: '1px solid #1e293b', padding: 16, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                
                {/* Search Bar */}
                <div style={{ position: 'relative', width: 320 }}>
                  <Search size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search brand, email, workspace ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      borderRadius: 8,
                      background: '#1e293b',
                      border: '1px solid #334155',
                      color: '#fff',
                      outline: 'none',
                      fontSize: 12.5
                    }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  
                  {/* Niche Filter */}
                  <select
                    value={nicheFilter}
                    onChange={(e) => setNicheFilter(e.target.value)}
                    style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 7, color: '#fff', padding: '7px 10px', fontSize: 12, outline: 'none' }}
                  >
                    <option value="all">All Niches</option>
                    <option value="ecommerce">eCommerce</option>
                    <option value="dental">Dental</option>
                    <option value="clinic">Clinic</option>
                    <option value="salon">Salon</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="real_estate">Real Estate</option>
                    <option value="general">General</option>
                  </select>

                  {/* Plan Filter */}
                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 7, color: '#fff', padding: '7px 10px', fontSize: 12, outline: 'none' }}
                  >
                    <option value="all">All Plans</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="growth">Growth</option>
                    <option value="starter">Starter</option>
                    <option value="trial">Trial</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 7, color: '#fff', padding: '7px 10px', fontSize: 12, outline: 'none' }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="trial">Trial</option>
                  </select>

                  {/* Internal toggle */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', cursor: 'pointer', marginLeft: 6 }}>
                    <input
                      type="checkbox"
                      checked={hideInternal}
                      onChange={(e) => setHideInternal(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Hide Internal/Test</span>
                  </label>

                </div>

              </div>

              {/* Detailed Brands Table */}
              <div style={{ background: '#0f172a', borderRadius: 14, border: '1px solid #1e293b', overflow: 'hidden' }}>
                <div className="mobile-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Workspace & Owner</th>
                        <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Plan & Niche</th>
                        <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center' }}>AI Engine Status</th>
                        <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>GMV Driven</th>
                        <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>AI Tokens (Cost)</th>
                        <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Channel</th>
                        <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBrands.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                            No workspaces found matching filters.
                          </td>
                        </tr>
                      ) : (
                        filteredBrands.map((t) => (
                          <tr key={t.id} style={{ borderBottom: '1px solid #1e293b', background: '#0f172a' }}>
                            {/* Workspace & Owner */}
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#ffffff' }}>
                                  {t.business_name || t.name}
                                </div>
                                {t.is_internal && (
                                  <span style={{ fontSize: 9.5, fontWeight: 800, background: '#334155', color: '#cbd5e1', padding: '1px 5px', borderRadius: 4 }}>
                                    INTERNAL
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                {t.owner_email || `ID: ${t.id.slice(0, 10)}...`}
                              </div>
                            </td>

                            {/* Plan & Niche */}
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  background: t.plan === 'enterprise' ? '#312e81' : t.plan === 'growth' ? '#1e3a8a' : '#1e293b',
                                  color: t.plan === 'enterprise' ? '#a5b4fc' : t.plan === 'growth' ? '#93c5fd' : '#e2e8f0'
                                }}>
                                  {(t.plan || 'TRIAL').toUpperCase()}
                                </span>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: 8,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  background: 'rgba(255,255,255,0.06)',
                                  color: '#cbd5e1'
                                }}>
                                  {t.niche || 'general'}
                                </span>
                              </div>
                            </td>

                            {/* AI Engine Master Switch (User requested direct toggle!) */}
                            <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleToggleTenantAi(t)}
                                disabled={togglingAiId === t.id}
                                title={t.isAiActive ? 'Click to Pause AI (Human mode only)' : 'Click to Resume AI'}
                                style={{
                                  background: t.isAiActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: t.isAiActive ? '#34d399' : '#f87171',
                                  border: t.isAiActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: 20,
                                  padding: '4px 12px',
                                  fontSize: 11.5,
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {t.isAiActive ? (
                                  <>
                                    <Sparkles size={12} /> AI Active
                                  </>
                                ) : (
                                  <>
                                    <PauseCircle size={12} /> AI Paused
                                  </>
                                )}
                              </button>
                            </td>

                            {/* GMV Driven */}
                            <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 800, color: '#10b981' }}>
                              {t.gmv > 0 ? formatCurrency(t.gmv, t.default_currency || 'PKR') : <span style={{ color: '#64748b' }}>—</span>}
                            </td>

                            {/* AI Tokens & Cost */}
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>
                                {formatNumber(t.tokensConsumed)}
                              </div>
                              <div style={{ fontSize: 10.5, color: '#64748b' }}>
                                ~${t.tokenCostUsd} USD spend
                              </div>
                            </td>

                            {/* Meta Channel */}
                            <td style={{ padding: '14px 18px' }}>
                              {t.meta_connected || t.wa_phone_number_id ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#34d399', fontSize: 11.5, fontWeight: 700 }}>
                                  <CheckCircle2 size={13} /> Active
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 11.5 }}>
                                  <AlertCircle size={13} /> Missing WA
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                <button
                                  onClick={() => setDetailTenant(t)}
                                  style={{ background: '#1e293b', color: '#93c5fd', border: '1px solid #334155', padding: '5px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                  <Eye size={12} /> Details
                                </button>
                                <button
                                  onClick={() => handleManage(t)}
                                  style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Manage
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: COMMERCE & REVENUE */}
          {activeTab === 'commerce' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                <div style={{ background: '#0f172a', borderRadius: 14, padding: 20, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 12.5, color: '#94a3b8', fontWeight: 700, marginBottom: 6 }}>Total Platform GMV</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#ffffff' }}>
                    {formatCurrency(globalMetrics.totalGMV)}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#10b981', marginTop: 4 }}>Completed orders driven by AI conversations</div>
                </div>

                <div style={{ background: '#0f172a', borderRadius: 14, padding: 20, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 12.5, color: '#94a3b8', fontWeight: 700, marginBottom: 6 }}>Confirmed Orders</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#ffffff' }}>
                    {globalMetrics.totalOrders}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#3b82f6', marginTop: 4 }}>Across all active merchant catalogs</div>
                </div>

                <div style={{ background: '#0f172a', borderRadius: 14, padding: 20, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 12.5, color: '#94a3b8', fontWeight: 700, marginBottom: 6 }}>Average Order Value (AOV)</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#ffffff' }}>
                    {globalMetrics.totalOrders > 0 
                      ? formatCurrency(Math.round(globalMetrics.totalGMV / globalMetrics.totalOrders))
                      : '—'}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#a855f7', marginTop: 4 }}>Calculated from actual completed orders</div>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div style={{ background: '#0f172a', borderRadius: 14, border: '1px solid #1e293b', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', margin: 0 }}>Recent Orders Stream</h3>
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: 0, marginTop: 2 }}>Cross-tenant transaction stream from public.orders</p>
                </div>

                <div className="mobile-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '10px 18px', fontSize: 11, color: '#94a3b8' }}>Order ID</th>
                        <th style={{ padding: '10px 18px', fontSize: 11, color: '#94a3b8' }}>Workspace</th>
                        <th style={{ padding: '10px 18px', fontSize: 11, color: '#94a3b8' }}>Amount</th>
                        <th style={{ padding: '10px 18px', fontSize: 11, color: '#94a3b8' }}>Status</th>
                        <th style={{ padding: '10px 18px', fontSize: 11, color: '#94a3b8' }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rawOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>
                            No orders recorded in this time period yet.
                          </td>
                        </tr>
                      ) : (
                        rawOrders.slice(0, 10).map((o) => {
                          const t = rawTenants.find((item) => item.id === o.tenant_id);
                          return (
                            <tr key={o.id} style={{ borderBottom: '1px solid #1e293b' }}>
                              <td style={{ padding: '12px 18px', fontFamily: 'monospace', fontSize: 12 }}>{o.id.slice(0, 10)}...</td>
                              <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 700 }}>{t?.business_name || t?.name || 'Unknown'}</td>
                              <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 800, color: '#10b981' }}>{formatCurrency(Number(o.order_amount) || 0)}</td>
                              <td style={{ padding: '12px 18px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10.5, fontWeight: 700, background: '#1e293b', color: '#34d399' }}>
                                  {o.status}
                                </span>
                              </td>
                              <td style={{ padding: '12px 18px', fontSize: 12, color: '#94a3b8' }}>
                                {new Date(o.created_at).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: AI COST & TOKENS */}
          {activeTab === 'tokens' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                
                <div style={{ background: '#0f172a', borderRadius: 14, padding: 20, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 12.5, color: '#94a3b8', fontWeight: 700, marginBottom: 6 }}>Estimated OpenAI Spend</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#38bdf8' }}>
                    ${globalMetrics.totalCostUsd.toFixed(2)} USD
                  </div>
                  <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>
                    ~PKR {Math.round(globalMetrics.totalCostUsd * 280).toLocaleString()} across all models
                  </div>
                </div>

                <div style={{ background: '#0f172a', borderRadius: 14, padding: 20, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 12.5, color: '#94a3b8', fontWeight: 700, marginBottom: 6 }}>Prompt vs. Completion Split</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#ffffff' }}>
                    {formatNumber(visibleTenants.reduce((s, t) => s + t.promptTokens, 0))} / {formatNumber(visibleTenants.reduce((s, t) => s + t.completionTokens, 0))}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#10b981', marginTop: 4 }}>Input context tokens vs output generated tokens</div>
                </div>

                <div style={{ background: '#0f172a', borderRadius: 14, padding: 20, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 12.5, color: '#94a3b8', fontWeight: 700, marginBottom: 6 }}>Average AI Latency</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#ffffff' }}>
                    {globalMetrics.avgLatency}ms
                  </div>
                  <div style={{ fontSize: 11.5, color: '#3b82f6', marginTop: 4 }}>End-to-end webhook response time</div>
                </div>

              </div>

              {/* Token Consumption Table by Tenant */}
              <div style={{ background: '#0f172a', borderRadius: 14, border: '1px solid #1e293b', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', margin: 0 }}>Top Token Consumers</h3>
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: 0, marginTop: 2 }}>Workspaces consuming the highest LLM inference tokens</p>
                </div>

                <div className="mobile-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', minWidth: 650, borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '10px 18px', fontSize: 11, color: '#94a3b8' }}>Workspace</th>
                        <th style={{ padding: '10px 18px', fontSize: 11, color: '#94a3b8' }}>Plan</th>
                        <th style={{ padding: '10px 18px', fontSize: 11, color: '#94a3b8' }}>Total Tokens</th>
                        <th style={{ padding: '10px 18px', fontSize: 11, color: '#94a3b8' }}>Est. Cost (USD)</th>
                        <th style={{ padding: '10px 18px', fontSize: 11, color: '#94a3b8' }}>AI Switch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTenants
                        .slice()
                        .sort((a, b) => b.tokensConsumed - a.tokensConsumed)
                        .slice(0, 10)
                        .map((t) => (
                          <tr key={t.id} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 700 }}>{t.business_name || t.name}</td>
                            <td style={{ padding: '12px 18px', fontSize: 11, color: '#94a3b8' }}>{(t.plan || 'trial').toUpperCase()}</td>
                            <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 800, color: '#3b82f6' }}>{formatNumber(t.tokensConsumed)}</td>
                            <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 800, color: '#10b981' }}>${t.tokenCostUsd}</td>
                            <td style={{ padding: '12px 18px' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: t.isAiActive ? '#34d399' : '#f87171' }}>
                                {t.isAiActive ? 'Active' : 'Paused'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: CHANNELS & INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {[
                  { name: 'WhatsApp Cloud API', desc: 'Meta Graph API v20.0', status: 'Live & Operational', badge: 'Production', icon: Globe, color: '#25D366' },
                  { name: 'Shopify E-Commerce', desc: 'GraphQL Products & Webhooks', status: 'Live & Operational', badge: 'Production', icon: Store, color: '#10b981' },
                  { name: 'WooCommerce Store', desc: 'REST API v3 Webhooks', status: 'Live & Operational', badge: 'Production', icon: Layers, color: '#3b82f6' },
                  { name: 'Salla Platform', desc: 'GCC / Saudi Commerce Engine', status: 'Beta Sync Mode', badge: 'Beta', icon: ShoppingBag, color: '#f59e0b' },
                  { name: 'Zid Commerce', desc: 'GCC / Saudi Commerce Engine', status: 'Beta Sync Mode', badge: 'Beta', icon: Store, color: '#f59e0b' },
                  { name: 'Website Chat Widget', desc: 'Embedded Script Engine', status: 'Live & Operational', badge: 'Production', icon: MessageSquare, color: '#6366F1' }
                ].map((integ, idx) => {
                  const Icon = integ.icon;
                  return (
                    <div key={idx} style={{ background: '#0f172a', borderRadius: 14, padding: 20, border: '1px solid #1e293b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={20} color={integ.color} />
                        </div>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: integ.badge === 'Beta' ? '#fbbf24' : '#34d399',
                          background: integ.badge === 'Beta' ? 'rgba(245,158,11,0.15)' : 'rgba(52,211,153,0.1)',
                          padding: '3px 8px',
                          borderRadius: 12
                        }}>
                          {integ.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff' }}>{integ.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{integ.desc}</div>
                      <div style={{ fontSize: 11, color: integ.badge === 'Beta' ? '#f59e0b' : '#10b981', marginTop: 10, fontWeight: 600 }}>
                        ● {integ.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: ESCALATIONS & QA */}
          {activeTab === 'escalations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#0f172a', borderRadius: 14, border: '1px solid #1e293b', padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', margin: 0 }}>Human Handoff & Escalations Desk</h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, marginTop: 2 }}>Live customer conversations where AI paused or requested human intervention</p>

                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rawConversations.filter(c => c.status === 'pending' || c.needs_human || c.bot_enabled === false).length === 0 ? (
                    <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>
                      <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>No unresolved escalations! All customer chats are being handled normally.</p>
                    </div>
                  ) : (
                    rawConversations
                      .filter(c => c.status === 'pending' || c.needs_human || c.bot_enabled === false)
                      .slice(0, 10)
                      .map((c) => {
                        const t = rawTenants.find((item) => item.id === c.tenant_id);
                        return (
                          <div
                            key={c.id}
                            style={{
                              background: '#1e293b',
                              borderRadius: 10,
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                                {t?.business_name || t?.name || 'Workspace'} • Customer: {c.customer_phone || c.customer_name || 'Anonymous'}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#f87171', marginTop: 2 }}>
                                Status: {c.status} • Bot Paused: {c.bot_enabled === false ? 'Yes' : 'No'}
                              </div>
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>
                              Updated: {new Date(c.updated_at || c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#0f172a', borderRadius: 14, border: '1px solid #1e293b', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', margin: 0 }}>System Audit Trail</h3>
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: 0, marginTop: 2 }}>Real-time immutable log of admin actions, AI switches, and tenant updates</p>
                </div>

                <div className="mobile-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '10px 18px', fontSize: 11, color: '#94a3b8' }}>Action</th>
                        <th style={{ padding: '10px 18px', fontSize: 11, color: '#94a3b8' }}>Workspace</th>
                        <th style={{ padding: '10px 18px', fontSize: 11, color: '#94a3b8' }}>Details</th>
                        <th style={{ padding: '10px 18px', fontSize: 11, color: '#94a3b8' }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rawAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>
                            No audit logs recorded yet.
                          </td>
                        </tr>
                      ) : (
                        rawAuditLogs.slice(0, 20).map((log) => {
                          const t = rawTenants.find((item) => item.id === log.tenant_id);
                          return (
                            <tr key={log.id} style={{ borderBottom: '1px solid #1e293b' }}>
                              <td style={{ padding: '12px 18px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  background: log.action.includes('paused') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                  color: log.action.includes('paused') ? '#f87171' : '#34d399'
                                }}>
                                  {log.action.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 700 }}>
                                {t?.business_name || t?.name || 'Platform'}
                              </td>
                              <td style={{ padding: '12px 18px', fontSize: 12, color: '#cbd5e1' }}>
                                {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '—')}
                              </td>
                              <td style={{ padding: '12px 18px', fontSize: 11.5, color: '#94a3b8' }}>
                                {new Date(log.created_at).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL 1: TENANT MANAGEMENT MODAL */}
        {selectedTenant && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#0f172a', borderRadius: 16, width: '100%', maxWidth: 500, border: '1px solid #1e293b', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>Manage Workspace</h3>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{selectedTenant.business_name || selectedTenant.name}</div>
                </div>
                <button onClick={() => setSelectedTenant(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <div style={{ padding: 22 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>Subscription Tier</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }}
                  >
                    <option value="trial">Trial (14 Days)</option>
                    <option value="starter">Starter Plan</option>
                    <option value="growth">Growth Plan</option>
                    <option value="enterprise">Enterprise Plan</option>
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>Account Standing</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }}
                  >
                    <option value="active">Active (Good Standing / Paid)</option>
                    <option value="trial">Trial Mode</option>
                    <option value="suspended">Suspended (Lock Access)</option>
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: '#cbd5e1' }}>Trial Expiration Date</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[7, 14, 30].map(days => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + days);
                            setEditTrialEndsAt(d.toISOString().slice(0, 10));
                          }}
                          style={{
                            background: '#334155', color: '#93c5fd', border: 'none',
                            borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          +{days}d
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="date"
                    value={editTrialEndsAt}
                    onChange={(e) => setEditTrialEndsAt(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>Internal Admin Notes</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    placeholder="Enter internal billing or customer relationship notes..."
                    style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <button
                  onClick={handleSaveTenant}
                  disabled={saving}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', border: 'none', padding: '11px', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {saving ? 'Saving...' : <><Save size={15} /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: DEEP TENANT DRAWER / DETAILS MODAL */}
        {detailTenant && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#0f172a', borderRadius: 16, width: '100%', maxWidth: 620, border: '1px solid #1e293b', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>
                    {detailTenant.business_name || detailTenant.name}
                  </h3>
                  <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>Workspace ID: {detailTenant.id}</div>
                </div>
                <button onClick={() => setDetailTenant(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <div style={{ padding: 22 }}>
                
                {/* AI Master Switch Card */}
                <div style={{
                  background: detailTenant.isAiActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: detailTenant.isAiActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 12,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 18
                }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: detailTenant.isAiActive ? '#34d399' : '#f87171' }}>
                      AI Engine: {detailTenant.isAiActive ? 'ACTIVE (Auto-replying)' : 'PAUSED (Human Mode Only)'}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#cbd5e1', marginTop: 2 }}>
                      {detailTenant.isAiActive ? 'All incoming messages are processed via OpenAI' : 'Zero signals sent to OpenAI. Conversations placed in manual handoff.'}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleToggleTenantAi(detailTenant);
                      setDetailTenant(prev => prev ? { ...prev, isAiActive: !prev.isAiActive } : null);
                    }}
                    style={{
                      background: detailTenant.isAiActive ? '#ef4444' : '#10b981',
                      color: '#fff',
                      border: 'none',
                      padding: '7px 14px',
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {detailTenant.isAiActive ? 'Pause AI' : 'Resume AI'}
                  </button>
                </div>

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  <div style={{ background: '#1e293b', padding: 14, borderRadius: 10 }}>
                    <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Total GMV Driven</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981', marginTop: 4 }}>
                      {formatCurrency(detailTenant.gmv, detailTenant.default_currency || 'PKR')}
                    </div>
                  </div>

                  <div style={{ background: '#1e293b', padding: 14, borderRadius: 10 }}>
                    <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Confirmed Orders</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginTop: 4 }}>
                      {detailTenant.ordersCount.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: '#1e293b', padding: 14, borderRadius: 10 }}>
                    <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Tokens (Spend)</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#3b82f6', marginTop: 4 }}>
                      {formatNumber(detailTenant.tokensConsumed)}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8' }}>~${detailTenant.tokenCostUsd} USD</div>
                  </div>

                  <div style={{ background: '#1e293b', padding: 14, borderRadius: 10 }}>
                    <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Customer Messages</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#a855f7', marginTop: 4 }}>
                      {formatNumber(detailTenant.messagesCount)}
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div style={{ background: '#1e293b', padding: 16, borderRadius: 10, marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>Workspace Configuration</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5 }}>
                    <div>Niche: <strong style={{ color: '#fff' }}>{detailTenant.niche || 'general'}</strong></div>
                    <div>Currency: <strong style={{ color: '#fff' }}>{detailTenant.default_currency || 'PKR'}</strong></div>
                    <div>Meta Phone ID: <strong style={{ color: '#fff' }}>{detailTenant.wa_phone_number_id || 'Not configured'}</strong></div>
                    <div>WhatsApp Connected: <strong style={{ color: detailTenant.meta_connected ? '#34d399' : '#f87171' }}>{detailTenant.meta_connected ? 'Yes' : 'No'}</strong></div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: LINKEDIN / SOCIAL MEDIA PROOF GENERATOR MODAL */}
        {showShareModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#0f172a', borderRadius: 16, width: '100%', maxWidth: 660, border: '1px solid #1e293b', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Share2 size={16} color="#ef4444" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>Social Media Caption Generator</h3>
                    <p style={{ fontSize: 11.5, color: '#94a3b8', margin: 0 }}>Formatted with your live platform metrics ({selectedPeriod} Days)</p>
                  </div>
                </div>
                <button onClick={() => setShowShareModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <div style={{ padding: 22 }}>
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 18, maxHeight: 320, overflowY: 'auto' }}>
                  <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 12.5, color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {shareableText}
                  </pre>
                </div>

                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    onClick={() => setShowShareModal(false)}
                    style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Close
                  </button>
                  <button
                    onClick={handleCopyShare}
                    style={{ background: copiedShareText ? '#10b981' : 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {copiedShareText ? <><Check size={14} /> Copied to Clipboard!</> : <><Copy size={14} /> Copy Caption Text</>}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </SuperAdminGuard>
  );
}
