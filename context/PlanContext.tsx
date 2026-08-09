'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';

// ── Plan limits shape ──────────────────────────────────────
export interface PlanLimits {
  id: string;
  label: string;
  price_monthly: number;
  price_yearly: number;
  max_conversations: number; // -1 = unlimited
  max_agents: number;
  max_team_members: number;
  max_templates: number;
  max_campaigns: number;
  max_kb_entries: number;
  ai_model: string;
  whatsapp_enabled: boolean;
  instagram_enabled: boolean;
  messenger_enabled: boolean;
  analytics_enabled: boolean;
  priority_support: boolean;
  custom_branding: boolean;
}

export interface UsageMetrics {
  conversations_count: number;
  messages_sent: number;
  campaigns_sent: number;
  templates_submitted: number;
  kb_entries_count: number;
}

export interface TenantInfo {
  id: string;
  plan: string;
  plan_status: string;
  trial_ends_at: string | null;
  meta_connected: boolean;
  wa_phone_number_id: string | null;
  wa_access_token: string | null;
  wa_account_id: string | null;
  ig_page_id: string | null;
  fb_page_id: string | null;
  business_name: string | null;
  business_phone: string | null;
  website: string | null;
  location: string | null;
  logo_url: string | null;
}

interface PlanCtx {
  tenantInfo: TenantInfo | null;
  limits: PlanLimits | null;
  usage: UsageMetrics | null;
  planLoaded: boolean;
  /** Check if a feature is allowed under current plan */
  isFeatureEnabled: (feature: keyof Pick<PlanLimits, 'instagram_enabled' | 'messenger_enabled' | 'analytics_enabled' | 'priority_support' | 'custom_branding'>) => boolean;
  /** 0–100 usage percentage for a countable limit */
  usagePercent: (metric: 'conversations' | 'campaigns' | 'templates' | 'kb_entries' | 'team_members', currentCount?: number) => number;
  /** True if within the limit */
  isWithinLimit: (metric: 'conversations' | 'campaigns' | 'templates' | 'kb_entries' | 'team_members', currentCount?: number) => boolean;
  /** Days remaining on trial, or null if not on trial */
  trialDaysLeft: number | null;
  /** Refresh plan data */
  refreshPlan: () => Promise<void>;
}

const PlanCtx = createContext<PlanCtx | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [planLoaded, setPlanLoaded] = useState(false);

  const loadPlan = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile?.tenant_id) return;

      // Fetch tenant info
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id,plan,plan_status,trial_ends_at,meta_connected,wa_phone_number_id,wa_access_token,wa_account_id,ig_page_id,fb_page_id,business_name,business_phone,website,location,logo_url')
        .eq('id', profile.tenant_id)
        .single();

      if (tenant) setTenantInfo(tenant as TenantInfo);

      // Fetch plan limits
      const planId = tenant?.plan || 'starter';
      const { data: planData } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planData) setLimits(planData as PlanLimits);

      // Fetch current month usage
      const month = new Date().toISOString().slice(0, 7);
      const { data: usageData } = await supabase
        .from('usage_metrics')
        .select('conversations_count,messages_sent,campaigns_sent,templates_submitted,kb_entries_count')
        .eq('tenant_id', profile.tenant_id)
        .eq('month', month)
        .maybeSingle();

      setUsage(usageData || {
        conversations_count: 0,
        messages_sent: 0,
        campaigns_sent: 0,
        templates_submitted: 0,
        kb_entries_count: 0,
      });
    } catch (err) {
      console.error('PlanContext: error loading plan', err);
    } finally {
      setPlanLoaded(true);
    }
  }, []);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  const isFeatureEnabled = useCallback((feature: keyof Pick<PlanLimits, 'instagram_enabled' | 'messenger_enabled' | 'analytics_enabled' | 'priority_support' | 'custom_branding'>): boolean => {
    return limits?.[feature] === true;
  }, [limits]);

  const getLimit = useCallback((metric: 'conversations' | 'campaigns' | 'templates' | 'kb_entries' | 'team_members'): number => {
    if (!limits) return 0;
    const map: Record<string, number> = {
      conversations: limits.max_conversations,
      campaigns:     limits.max_campaigns,
      templates:     limits.max_templates,
      kb_entries:    limits.max_kb_entries,
      team_members:  limits.max_team_members,
    };
    return map[metric] ?? 0;
  }, [limits]);

  const getUsageCount = useCallback((metric: 'conversations' | 'campaigns' | 'templates' | 'kb_entries' | 'team_members', currentCount?: number): number => {
    if (currentCount !== undefined) return currentCount;
    if (!usage) return 0;
    const map: Record<string, number> = {
      conversations: usage.conversations_count,
      campaigns:     usage.campaigns_sent,
      templates:     usage.templates_submitted,
      kb_entries:    usage.kb_entries_count,
      team_members:  0,
    };
    return map[metric] ?? 0;
  }, [usage]);

  const usagePercent = useCallback((metric: 'conversations' | 'campaigns' | 'templates' | 'kb_entries' | 'team_members', currentCount?: number): number => {
    const limit = getLimit(metric);
    if (limit === -1) return 0;
    if (limit === 0) return 100;
    const count = getUsageCount(metric, currentCount);
    return Math.min(100, Math.round((count / limit) * 100));
  }, [getLimit, getUsageCount]);

  const isWithinLimit = useCallback((metric: 'conversations' | 'campaigns' | 'templates' | 'kb_entries' | 'team_members', currentCount?: number): boolean => {
    const limit = getLimit(metric);
    if (limit === -1) return true;
    const count = getUsageCount(metric, currentCount);
    return count < limit;
  }, [getLimit, getUsageCount]);

  const trialDaysLeft: number | null = useMemo(() => {
    if (tenantInfo?.plan !== 'trial' || !tenantInfo?.trial_ends_at) return null;
    const diff = new Date(tenantInfo.trial_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [tenantInfo?.plan, tenantInfo?.trial_ends_at]);

  const value = useMemo(() => ({
    tenantInfo,
    limits,
    usage,
    planLoaded,
    isFeatureEnabled,
    usagePercent,
    isWithinLimit,
    trialDaysLeft,
    refreshPlan: loadPlan
  }), [tenantInfo, limits, usage, planLoaded, isFeatureEnabled, usagePercent, isWithinLimit, trialDaysLeft, loadPlan]);

  return (
    <PlanCtx.Provider value={value}>
      {children}
    </PlanCtx.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanCtx);
  if (!ctx) throw new Error('usePlan must be inside PlanProvider');
  return ctx;
}
