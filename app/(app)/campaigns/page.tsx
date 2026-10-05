'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Megaphone, Plus, Search, Calendar, ChevronRight, Play, CheckCircle2, 
  AlertCircle, Trash2, Send, Clock, Users, FileText, Check, X,
  Sliders, ArrowUpRight, BarChart3, Eye, Phone, RefreshCw, Filter,
  Sparkles, Download, ShieldCheck, Zap, Layers, MessageSquare
} from 'lucide-react';
import { LIFECYCLE_STAGES } from '@/components/conversations/InboxSidebarNav';
import { useConfirm, useAlert } from '@/context/DialogContext';

interface Campaign {
  id: string;
  name: string;
  template_name: string;
  template_id: string;
  segment_name: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  delivery_rate: number;
  read_rate: number;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Failed';
  scheduled_at: string | null;
  created_at: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  status: string;
  language: string;
  header_type?: string;
  header_text?: string;
  body_text?: string;
  footer_text?: string;
}

interface RecipientLog {
  id: string;
  contact_phone: string;
  contact_name: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
}

const PRESET_TAGS = ['VIP', 'Wholesale Buyer', 'High Value', 'Urgent', 'Instagram Lead', 'Website Inquiry', 'Follow-up'];

export default function CampaignsPage() {
  const confirm = useConfirm();
  const showAlert = useAlert();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tplList, setTplList] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Campaign Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [campName, setCampName] = useState('');
  const [selectedTplId, setSelectedTplId] = useState('');
  const [variableMappings, setVariableMappings] = useState<Record<string, string>>({});
  
  // Audience Filter State
  const [segmentMode, setSegmentMode] = useState<'all' | 'custom'>('all');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [estimatedReach, setEstimatedReach] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);

  // Dispatch & Pacing State
  const [ratePerSecond, setRatePerSecond] = useState(25);
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Recipient Logs Drawer State
  const [selectedCampaignForLogs, setSelectedCampaignForLogs] = useState<Campaign | null>(null);
  const [recipientLogs, setRecipientLogs] = useState<RecipientLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');

  // Load initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [campRes, tplRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/templates')
      ]);

      if (campRes.ok) {
        const cData = await campRes.json();
        setCampaigns(cData.campaigns || []);
      }

      if (tplRes.ok) {
        const tData = await tplRes.json();
        setTplList((tData.templates || []).filter((t: any) => t.status === 'APPROVED'));
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedTemplate = useMemo(() => {
    return tplList.find(t => t.id === selectedTplId) || null;
  }, [tplList, selectedTplId]);

  // Extract variables from selected template body
  const bodyVariables = useMemo(() => {
    if (!selectedTemplate?.body_text) return [];
    const matches = selectedTemplate.body_text.match(/\{\{\d+\}\}/g) || [];
    return Array.from(new Set(matches)).map(m => m.replace(/[{}]/g, ''));
  }, [selectedTemplate]);

  // Estimate audience size whenever segment criteria changes
  useEffect(() => {
    if (!showCreate) return;

    const fetchEstimate = async () => {
      try {
        setEstimating(true);
        const res = await fetch('/api/campaigns/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lifecycle_stages: segmentMode === 'custom' ? selectedStages : [],
            tags: segmentMode === 'custom' ? selectedTags : [],
            exclude_opted_out: true,
          })
        });

        if (res.ok) {
          const data = await res.json();
          setEstimatedReach(data.total_count);
        }
      } catch (e) {
        console.error('Error estimating audience:', e);
      } finally {
        setEstimating(false);
      }
    };

    const timer = setTimeout(fetchEstimate, 300);
    return () => clearTimeout(timer);
  }, [showCreate, segmentMode, selectedStages, selectedTags]);

  // Open Log Drawer
  const handleOpenLogs = async (campaign: Campaign) => {
    setSelectedCampaignForLogs(campaign);
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/recipients`);
      if (res.ok) {
        const data = await res.json();
        setRecipientLogs(data.recipients || []);
      }
    } catch (e) {
      console.error('Failed to load recipient logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Submit Campaign
  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName || !selectedTemplate) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campName,
          template_id: selectedTemplate.id,
          template_name: selectedTemplate.name,
          segment_name: segmentMode === 'all' ? 'All Contacts' : 'Custom Segment',
          segment_rules: {
            lifecycle_stages: segmentMode === 'custom' ? selectedStages : [],
            tags: segmentMode === 'custom' ? selectedTags : [],
          },
          variable_mappings: variableMappings,
          rate_per_second: ratePerSecond,
          schedule_type: scheduleType,
          scheduled_at: scheduleType === 'immediate' ? null : `${scheduleDate}T${scheduleTime}:00Z`
        })
      });

      if (res.ok) {
        showAlert({
          title: 'Broadcast Dispatched',
          message: scheduleType === 'immediate'
            ? 'Campaign is now sending with adaptive rate pacing!'
            : 'Campaign has been successfully scheduled.',
          type: 'success'
        });
        setShowCreate(false);
        setActiveStep(1);
        setCampName('');
        setSelectedTplId('');
        fetchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        showAlert({
          title: 'Launch Failed',
          message: errData.error || 'Failed to dispatch broadcast campaign.',
          type: 'danger'
        });
      }
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err.message || 'Network exception occurred.',
        type: 'danger'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.template_name.toLowerCase().includes(search.toLowerCase())
  );

  // Filtered recipient logs
  const filteredLogs = recipientLogs.filter(r =>
    r.contact_phone.includes(logSearch) ||
    (r.contact_name && r.contact_name.toLowerCase().includes(logSearch.toLowerCase()))
  );

  // Overall KPI aggregates
  const totalSent = campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.delivered_count || 0), 0);
  const totalRead = campaigns.reduce((acc, c) => acc + (c.read_count || 0), 0);
  const avgReadRate = totalDelivered > 0 ? ((totalRead / totalDelivered) * 100).toFixed(1) : '0.0';

  // Live WhatsApp Preview Text Generator
  const previewBody = useMemo(() => {
    if (!selectedTemplate?.body_text) return 'Select a template to view preview.';
    let text = selectedTemplate.body_text;
    bodyVariables.forEach(v => {
      const mapping = variableMappings[v];
      let replacement = `[Variable {{${v}}}]`;
      if (mapping === 'customer_name') replacement = 'Ayesha Khan';
      else if (mapping === 'first_name') replacement = 'Ayesha';
      else if (mapping === 'phone') replacement = '+92 300 1234567';
      else if (mapping?.startsWith('custom_text:')) replacement = mapping.replace('custom_text:', '');
      text = text.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), replacement);
    });
    return text;
  }, [selectedTemplate, bodyVariables, variableMappings]);

  return (
    <div style={{ padding: '28px 36px', minHeight: '100vh', background: '#f8fafc' }}>
      {/* ── Page Header ───────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
            }}>
              <Megaphone size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Broadcast Campaigns & Pacing Analytics
              </h1>
              <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0 0' }}>
                Meta Tier-Aware WhatsApp broadcasts with dynamic audience segmentation and live delivery funnel tracking.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={fetchData}
            style={{
              padding: '9px 14px', borderRadius: 9, border: '1px solid #e2e8f0',
              background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => { setShowCreate(true); setActiveStep(1); }}
            style={{
              padding: '9px 18px', borderRadius: 9, border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
            }}
          >
            <Plus size={16} />
            New Broadcast
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 26 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Total Campaigns
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
            {campaigns.length}
          </div>
          <div style={{ fontSize: 11.5, color: '#10b981', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={13} /> Official Meta Cloud API
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Messages Dispatched
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
            {totalSent.toLocaleString()}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>
            Pacing: ~25 msgs/sec
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Delivery Rate
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
            {totalSent > 0 ? `${((totalDelivered / totalSent) * 100).toFixed(1)}%` : '0.0%'}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>
            {totalDelivered.toLocaleString()} Delivered
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Avg. Read Rate
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>
            {avgReadRate}%
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>
            {totalRead.toLocaleString()} Opened
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ───────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
        padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 18
      }}>
        <div style={{ position: 'relative', width: 340 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search campaigns or templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 34px', fontSize: 13,
              borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none'
            }}
          />
        </div>

        <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 500 }}>
          Showing <b>{filteredCampaigns.length}</b> broadcast campaigns
        </div>
      </div>

      {/* ── Campaigns Table ───────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13.5 }}>
            Loading broadcast campaigns...
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>
            <Megaphone size={36} className="mx-auto mb-2 text-slate-300" />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>No broadcast campaigns yet</div>
            <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 2 }}>
              Launch your first Meta-approved broadcast to reach opted-in customers.
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Campaign Name</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Template</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Audience Segment</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Delivery Funnel</th>
                <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map(c => {
                const total = c.total_recipients || c.sent_count || 1;
                const delPct = Math.min(100, Math.round(((c.delivered_count || 0) / total) * 100));
                const readPct = Math.min(100, Math.round(((c.read_count || 0) / total) * 100));

                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 6, background: '#f1f5f9', color: '#334155', fontWeight: 600, fontSize: 11.5 }}>
                        <FileText size={12} className="text-emerald-600" />
                        {c.template_name}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ color: '#475569', fontWeight: 500 }}>{c.segment_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.total_recipients || c.sent_count || 0} Recipients</div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        padding: '3px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                        background: c.status === 'Completed' ? '#dcfce7' : c.status === 'In Progress' ? '#fef3c7' : c.status === 'Scheduled' ? '#e0f2fe' : '#fee2e2',
                        color: c.status === 'Completed' ? '#15803d' : c.status === 'In Progress' ? '#b45309' : c.status === 'Scheduled' ? '#0369a1' : '#b91c1c'
                      }}>
                        {c.status}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', width: 220 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                        <span>Sent: <b>{c.sent_count || 0}</b></span>
                        <span style={{ color: '#10b981' }}>Del: <b>{c.delivered_count || 0}</b></span>
                        <span style={{ color: '#3b82f6' }}>Read: <b>{c.read_count || 0}</b></span>
                      </div>
                      {/* Funnel Progress Bar */}
                      <div style={{ height: 6, width: '100%', background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${delPct}%`, background: '#10b981' }} />
                        <div style={{ width: `${readPct}%`, background: '#3b82f6' }} />
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenLogs(c)}
                        style={{
                          padding: '6px 12px', borderRadius: 7, border: '1px solid #cbd5e1',
                          background: '#fff', color: '#0f172a', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5
                        }}
                      >
                        <BarChart3 size={13} className="text-emerald-600" />
                        Audit Logs
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Multi-Step Campaign Creator Modal ─────────── */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 880,
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden'
          }}>
            {/* Modal Header & Stepper */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  Create WhatsApp Broadcast Campaign
                </div>
                <div style={{ fontSize: 12.5, color: '#64748b' }}>
                  Step {activeStep} of 4 — {activeStep === 1 ? 'Template Selection' : activeStep === 2 ? 'Variable Binding & Live Preview' : activeStep === 3 ? 'Audience Segmentation' : 'Pacing & Dispatch'}
                </div>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper Indicator */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {[
                { step: 1, label: '1. Template' },
                { step: 2, label: '2. Variable Mapper' },
                { step: 3, label: '3. Audience' },
                { step: 4, label: '4. Pacing' },
              ].map(s => (
                <div
                  key={s.step}
                  onClick={() => s.step <= activeStep && setActiveStep(s.step as any)}
                  style={{
                    flex: 1, padding: '10px 0', textAlign: 'center', fontSize: 12.5,
                    fontWeight: 600, cursor: s.step <= activeStep ? 'pointer' : 'default',
                    color: activeStep === s.step ? '#10b981' : activeStep > s.step ? '#0f172a' : '#94a3b8',
                    borderBottom: activeStep === s.step ? '2px solid #10b981' : 'none',
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>

            {/* Step Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {/* ── STEP 1: Campaign Details & Template ── */}
              {activeStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Summer VIP Clearance Sale 2026"
                      value={campName}
                      onChange={e => setCampName(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', fontSize: 13.5,
                        borderRadius: 8, border: '1.5px solid #cbd5e1', outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                      Select Approved Meta Template *
                    </label>
                    {tplList.length === 0 ? (
                      <div style={{ padding: 18, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
                        No APPROVED Meta templates found. Please create and approve a template in <b>Templates</b> first.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                        {tplList.map(tpl => (
                          <div
                            key={tpl.id}
                            onClick={() => setSelectedTplId(tpl.id)}
                            style={{
                              padding: '12px 14px', borderRadius: 9, cursor: 'pointer',
                              border: selectedTplId === tpl.id ? '2px solid #10b981' : '1px solid #e2e8f0',
                              background: selectedTplId === tpl.id ? '#f0fdf4' : '#fff'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{tpl.name}</span>
                              <span style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 4, background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                                APPROVED
                              </span>
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, display: 'flex', gap: 8 }}>
                              <span>Lang: {tpl.language}</span>
                              <span>Cat: {tpl.category}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 2: Variable Mapper & Live WhatsApp Preview ── */}
              {activeStep === 2 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
                  {/* Variable Bindings */}
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                      Dynamic Template Variables
                    </div>
                    <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 14 }}>
                      Map Meta template placeholders to contact CRM attributes or custom promo codes.
                    </p>

                    {bodyVariables.length === 0 ? (
                      <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, color: '#64748b', fontSize: 12.5 }}>
                        This template does not contain dynamic parameters like <code>{`{{1}}`}</code>.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {bodyVariables.map(vNum => (
                          <div key={vNum} style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: 4 }}>
                              Parameter {`{{${vNum}}}`}
                            </label>
                            <select
                              value={variableMappings[vNum] || 'customer_name'}
                              onChange={e => setVariableMappings({ ...variableMappings, [vNum]: e.target.value })}
                              style={{
                                width: '100%', padding: '8px 10px', fontSize: 13,
                                borderRadius: 7, border: '1px solid #cbd5e1', outline: 'none', background: '#fff'
                              }}
                            >
                              <option value="customer_name">👤 Full Customer Name</option>
                              <option value="first_name">👤 First Name Only</option>
                              <option value="phone">📞 Customer Phone</option>
                              <option value="custom_text:SUMMER50">🏷️ Custom Text: SUMMER50</option>
                              <option value="custom_text:VIP2026">🏷️ Custom Text: VIP2026</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Live Phone Mockup */}
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={14} className="text-emerald-600" />
                      Live WhatsApp Preview
                    </div>
                    <div style={{
                      background: '#e5ddd5', borderRadius: 14, padding: 16,
                      border: '2px solid #cbd5e1', minHeight: 220, position: 'relative'
                    }}>
                      <div style={{
                        background: '#ffffff', borderRadius: '0 12px 12px 12px', padding: '10px 14px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.15)', maxWidth: 280, fontSize: 12.5,
                        color: '#111827', lineHeight: 1.4, whiteSpace: 'pre-wrap'
                      }}>
                        {previewBody}
                        <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'right', marginTop: 4 }}>
                          12:45 PM ✓✓
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Audience Segmentation ── */}
              {activeStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: 8 }}>
                      Audience Selection Mode
                    </label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div
                        onClick={() => setSegmentMode('all')}
                        style={{
                          flex: 1, padding: '12px 14px', borderRadius: 9, cursor: 'pointer',
                          border: segmentMode === 'all' ? '2px solid #10b981' : '1px solid #e2e8f0',
                          background: segmentMode === 'all' ? '#f0fdf4' : '#fff'
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>All WhatsApp Contacts</div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Every active opted-in WhatsApp contact</div>
                      </div>

                      <div
                        onClick={() => setSegmentMode('custom')}
                        style={{
                          flex: 1, padding: '12px 14px', borderRadius: 9, cursor: 'pointer',
                          border: segmentMode === 'custom' ? '2px solid #10b981' : '1px solid #e2e8f0',
                          background: segmentMode === 'custom' ? '#f0fdf4' : '#fff'
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>Custom Compound Filters</div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Filter by Lifecycle Stage & Tags</div>
                      </div>
                    </div>
                  </div>

                  {segmentMode === 'custom' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      {/* Lifecycle Stages */}
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                          Filter by Lifecycle Stage
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {LIFECYCLE_STAGES.map(s => {
                            const isSelected = selectedStages.includes(s.id);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) setSelectedStages(selectedStages.filter(x => x !== s.id));
                                  else setSelectedStages([...selectedStages, s.id]);
                                }}
                                style={{
                                  padding: '5px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                                  cursor: 'pointer', border: isSelected ? `2px solid ${s.color}` : '1px solid #cbd5e1',
                                  background: isSelected ? `${s.color}15` : '#fff', color: isSelected ? s.color : '#64748b'
                                }}
                              >
                                {s.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tag Cloud */}
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                          Filter by Contact Tags
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {PRESET_TAGS.map(tag => {
                            const isSelected = selectedTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  if (isSelected) setSelectedTags(selectedTags.filter(x => x !== tag));
                                  else setSelectedTags([...selectedTags, tag]);
                                }}
                                style={{
                                  padding: '5px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                                  cursor: 'pointer', border: isSelected ? '2px solid #10b981' : '1px solid #cbd5e1',
                                  background: isSelected ? '#ecfdf5' : '#fff', color: isSelected ? '#059669' : '#64748b'
                                }}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Real-time Estimated Reach Badge */}
                  <div style={{
                    padding: '12px 16px', borderRadius: 9, background: '#f0fdf4',
                    border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', color: '#166534', fontSize: 13
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                      <Users size={16} /> Estimated Audience Reach:
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>
                      {estimating ? 'Calculating...' : `${estimatedReach ?? '...'} Opted-in Contacts`}
                    </span>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Pacing & Dispatch Mode ── */}
              {activeStep === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                      Adaptive Token Bucket Rate Pacing ({ratePerSecond} messages / sec)
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={80}
                      value={ratePerSecond}
                      onChange={e => setRatePerSecond(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: '#10b981' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                      <span>10 msgs/sec (Conservative)</span>
                      <span>25 msgs/sec (Recommended)</span>
                      <span>80 msgs/sec (High Tier)</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: 8 }}>
                      Schedule Dispatch
                    </label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="sched"
                          checked={scheduleType === 'immediate'}
                          onChange={() => setScheduleType('immediate')}
                        />
                        Send Immediately
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="sched"
                          checked={scheduleType === 'scheduled'}
                          onChange={() => setScheduleType('scheduled')}
                        />
                        Schedule for Later
                      </label>
                    </div>
                  </div>

                  {scheduleType === 'scheduled' && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={e => setScheduleDate(e.target.value)}
                        style={{ flex: 1, padding: '9px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #cbd5e1' }}
                      />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={e => setScheduleTime(e.target.value)}
                        style={{ flex: 1, padding: '9px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', background: '#f8fafc' }}>
              <button
                type="button"
                onClick={() => {
                  if (activeStep > 1) setActiveStep((activeStep - 1) as any);
                  else setShowCreate(false);
                }}
                style={{
                  padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1',
                  background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}
              >
                {activeStep === 1 ? 'Cancel' : 'Back'}
              </button>

              {activeStep < 4 ? (
                <button
                  type="button"
                  disabled={activeStep === 1 && (!campName || !selectedTemplate)}
                  onClick={() => setActiveStep((activeStep + 1) as any)}
                  style={{
                    padding: '9px 20px', borderRadius: 8, border: 'none',
                    background: (!campName || !selectedTemplate) && activeStep === 1 ? '#94a3b8' : '#10b981',
                    color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleLaunchCampaign}
                  style={{
                    padding: '9px 22px', borderRadius: 8, border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Send size={14} />
                  {submitting ? 'Launching...' : 'Launch Broadcast'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Recipient Audit Logs Drawer ────────────────── */}
      {selectedCampaignForLogs && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
          backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'flex-end', zIndex: 110
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: 640, height: '100%',
            display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 25px rgba(0,0,0,0.15)'
          }}>
            {/* Drawer Header */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Delivery Audit Logs
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {selectedCampaignForLogs.name} ({selectedCampaignForLogs.template_name})
                </div>
              </div>
              <button
                onClick={() => setSelectedCampaignForLogs(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Log Search */}
            <div style={{ padding: '12px 22px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <input
                type="text"
                placeholder="Search phone number or recipient..."
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', fontSize: 12.5,
                  borderRadius: 7, border: '1px solid #cbd5e1', outline: 'none'
                }}
              />
            </div>

            {/* Log List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 22px' }}>
              {loadingLogs ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  Loading recipient logs...
                </div>
              ) : filteredLogs.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  No recipient logs found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredLogs.map(log => (
                    <div
                      key={log.id}
                      style={{
                        padding: '10px 14px', borderRadius: 9, background: '#f8fafc',
                        border: '1px solid #e2e8f0', fontSize: 12.5
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>
                          +{log.contact_phone} {log.contact_name ? `(${log.contact_name})` : ''}
                        </span>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                          background: log.status === 'read' ? '#dbeafe' : log.status === 'delivered' ? '#dcfce7' : log.status === 'failed' ? '#fee2e2' : '#f1f5f9',
                          color: log.status === 'read' ? '#1d4ed8' : log.status === 'delivered' ? '#15803d' : log.status === 'failed' ? '#b91c1c' : '#475569',
                          textTransform: 'uppercase'
                        }}>
                          {log.status}
                        </span>
                      </div>

                      {log.error_message && (
                        <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>
                          Error: {log.error_message}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 12, color: '#94a3b8', fontSize: 10.5, marginTop: 4 }}>
                        {log.sent_at && <span>Sent: {new Date(log.sent_at).toLocaleTimeString()}</span>}
                        {log.delivered_at && <span>Delivered: {new Date(log.delivered_at).toLocaleTimeString()}</span>}
                        {log.read_at && <span>Read: {new Date(log.read_at).toLocaleTimeString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
