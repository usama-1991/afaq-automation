/**
 * Ittisalo — Unified Subscription Plans, Quotas & Usage Metering Library
 * 
 * Defines standard price books (PKR & USD), plan tiers, resource entitlements,
 * and server-side calculation of real-time usage meters.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface PlanDefinition {
  id: 'starter' | 'growth' | 'pro' | 'business';
  label: string;
  pricePKR: number;
  priceUSD: number;
  maxPhoneNumbers: number; // -1 = custom / unlimited
  maxTeamMembers: number;
  maxAIConversations: number;
  maxVoiceMinutes: number;
  channelsAllowed: string[];
  keyFeatures: string[];
}

export const STANDARD_PLANS: Record<string, PlanDefinition> = {
  starter: {
    id: 'starter',
    label: 'Starter Plan',
    pricePKR: 4999,
    priceUSD: 19,
    maxPhoneNumbers: 1,
    maxTeamMembers: 2,
    maxAIConversations: 1000,
    maxVoiceMinutes: 60,
    channelsAllowed: ['whatsapp'],
    keyFeatures: [
      '1 Phone Number',
      'WhatsApp Channel',
      '2 Team Seats',
      '1,000 AI Conversations/mo',
      '60 Voice Transcription Mins',
      'Knowledge Base & Team Inbox',
    ],
  },
  growth: {
    id: 'growth',
    label: 'Growth Plan',
    pricePKR: 12999,
    priceUSD: 49,
    maxPhoneNumbers: 2,
    maxTeamMembers: 3,
    maxAIConversations: 3000,
    maxVoiceMinutes: 300,
    channelsAllowed: ['whatsapp', 'instagram', 'messenger'],
    keyFeatures: [
      '2 Phone Numbers',
      'WhatsApp + IG + Messenger',
      '3 Team Seats',
      '3,000 AI Conversations/mo',
      '300 Voice Transcription Mins',
      'Shopify & WooCommerce 2-Way Sync',
      'COD Native Flow Forms',
      'Appointment Booking Engine',
    ],
  },
  pro: {
    id: 'pro',
    label: 'Pro Plan',
    pricePKR: 27999,
    priceUSD: 99,
    maxPhoneNumbers: 3,
    maxTeamMembers: 5,
    maxAIConversations: 8000,
    maxVoiceMinutes: 1000,
    channelsAllowed: ['whatsapp', 'instagram', 'messenger', 'web_widget'],
    keyFeatures: [
      '3 Phone Numbers',
      'All Channels + Web Chat',
      '5 Team Seats',
      '8,000 AI Conversations/mo',
      '1,000 Voice Transcription Mins',
      'COD Fraud Detection Network',
      'Sentiment-based Live Handoff',
      'Developer Webhooks & API',
    ],
  },
  business: {
    id: 'business',
    label: 'Business Enterprise',
    pricePKR: 59999,
    priceUSD: 199,
    maxPhoneNumbers: -1,
    maxTeamMembers: 15,
    maxAIConversations: 20000,
    maxVoiceMinutes: 3000,
    channelsAllowed: ['whatsapp', 'instagram', 'messenger', 'web_widget'],
    keyFeatures: [
      'Custom Dedicated Numbers',
      'All Omnichannel Inboxes',
      '15+ Team Seats',
      '20,000+ AI Conversations/mo',
      '3,000+ Voice Transcription Mins',
      'Enterprise SLA & Dedicated Support',
      'Custom Multi-Doctor Routing',
      'Dedicated Onboarding',
    ],
  },
};

export interface UsageMetricDetail {
  used: number;
  limit: number;
  percentage: number;
  isWarning: boolean; // >= 80%
  isExceeded: boolean; // >= 100%
  unit: string;
  label: string;
}

export interface TenantUsageSummary {
  subscription: {
    planTier: string;
    planLabel: string;
    currency: string;
    price: number;
    billingInterval: string;
    cycleStartDate: string;
    cycleEndDate: string;
    daysRemaining: number;
    walletBalance: number;
    status: string;
  };
  metrics: {
    aiConversations: UsageMetricDetail;
    voiceMinutes: UsageMetricDetail;
    teamSeats: UsageMetricDetail;
    connectedChannels: UsageMetricDetail;
    phoneNumbers: UsageMetricDetail;
  };
  metaWallet: {
    balancePKR: number;
    balanceUSD: number;
    marketingSpentPKR: number;
    utilitySpentPKR: number;
    serviceSpentPKR: number;
    totalConversationsThisCycle: number;
  };
  hasWarnings: boolean;
  hasExceeded: boolean;
  warningMessages: string[];
}

/**
 * Computes complete real-time usage metrics and entitlement status for a given tenant
 */
export async function getTenantUsageSummary(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TenantUsageSummary> {
  const currentCycleId = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  // 1. Fetch Subscription & Active Plan
  const { data: sub } = await supabase
    .from('tenant_subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  const planKey = (sub?.plan_tier || 'growth') as keyof typeof STANDARD_PLANS;
  const plan = STANDARD_PLANS[planKey] || STANDARD_PLANS.growth;
  const currency = sub?.currency || 'PKR';
  const price = currency === 'PKR' ? plan.pricePKR : plan.priceUSD;

  // Calculate cycle dates and countdown
  const now = new Date();
  const cycleEnd = sub?.cycle_end_date ? new Date(sub.cycle_end_date) : new Date(now.getTime() + 25 * 86400000);
  const diffTime = cycleEnd.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // 2. Fetch Live Usage Meters for current billing cycle
  const { data: meter } = await supabase
    .from('tenant_usage_meters')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('billing_cycle_id', currentCycleId)
    .maybeSingle();

  const aiUsed = meter?.ai_conversations_count || 0;
  const voiceSecondsUsed = meter?.voice_transcription_seconds || 0;
  const voiceMinutesUsed = Math.round(voiceSecondsUsed / 60);

  // 3. Fetch Real-Time Seats (Users Count)
  const { count: usersCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const teamSeatsUsed = usersCount || 1;

  // 4. Fetch Real-Time Connected Channels
  const { data: integrations } = await supabase
    .from('integrations')
    .select('platform, external_account_id')
    .eq('tenant_id', tenantId);

  const connectedChannelsUsed = integrations?.length || 1;

  // 5. Fetch Phone Numbers Assigned
  const distinctPhones = new Set(
    (integrations || [])
      .map(i => i.external_account_id)
      .filter(Boolean)
  );
  const phoneNumbersUsed = Math.max(1, distinctPhones.size);

  // 6. Compute Meta Wallet usage from ledger
  const { data: ledgerEntries } = await supabase
    .from('meta_usage_ledger')
    .select('category, estimated_cost_pkr, estimated_cost_usd')
    .eq('tenant_id', tenantId)
    .gte('timestamp', sub?.cycle_start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString());

  let marketingSpentPKR = 0;
  let utilitySpentPKR = 0;
  let serviceSpentPKR = 0;
  let totalMetaConvs = ledgerEntries?.length || 0;

  for (const entry of (ledgerEntries || [])) {
    const cost = Number(entry.estimated_cost_pkr) || 0;
    if (entry.category === 'marketing') marketingSpentPKR += cost;
    else if (entry.category === 'utility') utilitySpentPKR += cost;
    else serviceSpentPKR += cost;
  }

  // 7. Build Metric Detail Objects
  function buildMetricDetail(used: number, limit: number, unit: string, label: string): UsageMetricDetail {
    const isUnlimited = limit === -1;
    const effectiveLimit = isUnlimited ? Math.max(used * 2, 100) : limit;
    const percentage = isUnlimited ? Math.min(100, Math.round((used / effectiveLimit) * 100)) : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
    const isWarning = !isUnlimited && percentage >= 80 && percentage < 100;
    const isExceeded = !isUnlimited && used >= limit;

    return {
      used,
      limit: isUnlimited ? -1 : limit,
      percentage,
      isWarning,
      isExceeded,
      unit,
      label,
    };
  }

  const aiMetric = buildMetricDetail(aiUsed, plan.maxAIConversations, 'Convs', 'AI Conversations');
  const voiceMetric = buildMetricDetail(voiceMinutesUsed, plan.maxVoiceMinutes, 'Mins', 'Voice Transcription');
  const seatsMetric = buildMetricDetail(teamSeatsUsed, plan.maxTeamMembers, 'Seats', 'Team Members');
  const channelsMetric = buildMetricDetail(connectedChannelsUsed, plan.channelsAllowed.length, 'Channels', 'Connected Channels');
  const numbersMetric = buildMetricDetail(phoneNumbersUsed, plan.maxPhoneNumbers, 'Numbers', 'Phone Numbers');

  // Collect Warnings & Exceeded Alerts
  const warningMessages: string[] = [];
  if (aiMetric.isExceeded) warningMessages.push(`Monthly AI conversation limit (${plan.maxAIConversations}) exceeded. Upgrade your plan to continue automated AI responses.`);
  else if (aiMetric.isWarning) warningMessages.push(`You have reached ${aiMetric.percentage}% of your monthly AI conversations.`);

  if (voiceMetric.isExceeded) warningMessages.push(`Voice note transcription limit (${plan.maxVoiceMinutes} mins) reached.`);
  else if (voiceMetric.isWarning) warningMessages.push(`Voice note transcription is at ${voiceMetric.percentage}% of quota.`);

  if (seatsMetric.isExceeded) warningMessages.push(`All ${plan.maxTeamMembers} team seats are occupied. Upgrade to add more agents.`);

  const walletBalance = Number(sub?.wallet_balance) || 15000.00;

  return {
    subscription: {
      planTier: plan.id,
      planLabel: plan.label,
      currency,
      price,
      billingInterval: sub?.billing_interval || 'monthly',
      cycleStartDate: sub?.cycle_start_date || new Date().toISOString(),
      cycleEndDate: cycleEnd.toISOString(),
      daysRemaining,
      walletBalance,
      status: sub?.status || 'active',
    },
    metrics: {
      aiConversations: aiMetric,
      voiceMinutes: voiceMetric,
      teamSeats: seatsMetric,
      connectedChannels: channelsMetric,
      phoneNumbers: numbersMetric,
    },
    metaWallet: {
      balancePKR: walletBalance,
      balanceUSD: Math.round((walletBalance / 278) * 100) / 100,
      marketingSpentPKR: Math.round(marketingSpentPKR),
      utilitySpentPKR: Math.round(utilitySpentPKR),
      serviceSpentPKR: Math.round(serviceSpentPKR),
      totalConversationsThisCycle: totalMetaConvs,
    },
    hasWarnings: warningMessages.length > 0 && !aiMetric.isExceeded && !voiceMetric.isExceeded,
    hasExceeded: aiMetric.isExceeded || voiceMetric.isExceeded || seatsMetric.isExceeded,
    warningMessages,
  };
}
