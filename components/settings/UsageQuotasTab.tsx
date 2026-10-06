'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Zap, Phone, Users, MessageSquare, Mic, Wallet,
  AlertTriangle, AlertCircle, CheckCircle2, ArrowUpRight, RefreshCw,
  Sparkles, ShieldCheck, Check, Plus, DollarSign, Layers
} from 'lucide-react';
import { useAlert, useConfirm } from '@/context/DialogContext';
import { TenantUsageSummary, STANDARD_PLANS, PlanDefinition } from '@/lib/plans';

export function UsageQuotasTab() {
  const showAlert = useAlert();
  const confirm = useConfirm();

  const [summary, setSummary] = useState<TenantUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currencyMode, setCurrencyMode] = useState<'PKR' | 'USD'>('PKR');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Topup Modal State
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('5000');
  const [processingTopup, setProcessingTopup] = useState(false);

  const fetchUsage = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setIsRefreshing(true);

      const res = await fetch('/api/billing/usage');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to load usage summary:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsage(true);
  }, []);

  const handleTopup = async () => {
    const amount = Number(topupAmount);
    if (isNaN(amount) || amount <= 0) return;

    setProcessingTopup(true);
    try {
      const res = await fetch('/api/billing/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_pkr: amount }),
      });

      const data = await res.json();
      if (res.ok) {
        showAlert({
          title: 'Wallet Recharged! 💳',
          message: data.message || `Added PKR ${amount.toLocaleString()} to your Meta Conversation Wallet.`,
          type: 'success',
        });
        setShowTopupModal(false);
        fetchUsage(false);
      } else {
        showAlert({ title: 'Top-up Failed', message: data.error || 'Failed to process top-up.', type: 'danger' });
      }
    } catch (e: any) {
      showAlert({ title: 'Error', message: e.message, type: 'danger' });
    } finally {
      setProcessingTopup(false);
    }
  };

  if (loading && !summary) {
    return (
      <div style={{ background: '#fff', borderRadius: 14, padding: 40, textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-red-500" />
        <div style={{ fontSize: 14, fontWeight: 600 }}>Loading Real-time Usage Metrics...</div>
      </div>
    );
  }

  const sub = summary?.subscription;
  const metrics = summary?.metrics;
  const wallet = summary?.metaWallet;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── 1. Quota Exceeded / Warning Banners ──────────── */}
      {summary?.hasExceeded && (
        <div style={{
          background: '#fef2f2', border: '1.5px solid #f87171', borderRadius: 12, padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#fee2e2', width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b' }}>
                Plan Quota Exceeded
              </div>
              <div style={{ fontSize: 12.5, color: '#b91c1c', marginTop: 2 }}>
                {summary.warningMessages.join(' ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            style={{
              padding: '8px 16px', background: '#dc2626', color: '#fff', fontSize: 12.5, fontWeight: 700,
              borderRadius: 8, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {summary?.hasWarnings && !summary?.hasExceeded && (
        <div style={{
          background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 12, padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#fef3c7', width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>
                Approaching Monthly Usage Limit (80% reached)
              </div>
              <div style={{ fontSize: 12.5, color: '#b45309', marginTop: 2 }}>
                {summary.warningMessages.join(' ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            style={{
              padding: '7px 14px', background: '#d97706', color: '#fff', fontSize: 12, fontWeight: 700,
              borderRadius: 7, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >
            View Plans
          </button>
        </div>
      )}

      {/* ── 2. Current Active Plan Header ───────────────── */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: '22px 24px',
        border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 800,
                padding: '3px 10px', borderRadius: 20, letterSpacing: '0.4px', textTransform: 'uppercase'
              }}>
                Current Active Plan
              </span>
              <span style={{
                background: '#ecfdf5', color: '#059669', fontSize: 11.5, fontWeight: 700,
                padding: '2px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                Active Subscription
              </span>
            </div>

            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
              {sub?.planLabel || 'Growth Plan'}
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
              Billing Cycle: {new Date(sub?.cycleStartDate || '').toLocaleDateString()} — {new Date(sub?.cycleEndDate || '').toLocaleDateString()} ({sub?.daysRemaining || 0} days remaining)
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => fetchUsage(false)}
              disabled={isRefreshing}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
                background: '#fff', color: '#475569', fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-red-600' : ''} />
              Live Sync
            </button>

            <button
              onClick={() => setShowUpgradeModal(true)}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 3px 10px rgba(220,38,38,0.2)'
              }}
            >
              <Sparkles size={14} />
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Feature Entitlements Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          {STANDARD_PLANS[sub?.planTier || 'growth']?.keyFeatures.map((feat, idx) => (
            <span key={idx} style={{
              fontSize: 11.5, fontWeight: 600, color: '#334155', background: '#f8fafc',
              border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: 6,
              display: 'flex', alignItems: 'center', gap: 5
            }}>
              <Check size={12} className="text-red-600" />
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* ── 3. Real-Time Resource Usage Meters ────────── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '22px 24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
              <BarChart3 size={16} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Real-Time Consumption Meters</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Live quota consumption tracked for current monthly cycle.</div>
            </div>
          </div>
          <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 600 }}>Auto-updates in real time</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* AI Conversations Meter */}
          {metrics?.aiConversations && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1e293b' }}>
                  <MessageSquare size={14} className="text-red-600" />
                  AI Conversations
                </span>
                <span style={{
                  color: metrics.aiConversations.isExceeded ? '#dc2626' : metrics.aiConversations.isWarning ? '#d97706' : '#059669'
                }}>
                  {metrics.aiConversations.used.toLocaleString()} / {metrics.aiConversations.limit.toLocaleString()} Convs ({metrics.aiConversations.percentage}%)
                </span>
              </div>
              <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{
                  width: `${metrics.aiConversations.percentage}%`, height: '100%', borderRadius: 10,
                  background: metrics.aiConversations.isExceeded ? '#dc2626' : metrics.aiConversations.isWarning ? '#f59e0b' : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          )}

          {/* Voice Note AI Transcriptions Meter */}
          {metrics?.voiceMinutes && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1e293b' }}>
                  <Mic size={14} className="text-red-600" />
                  Voice Note AI Transcriptions
                </span>
                <span style={{
                  color: metrics.voiceMinutes.isExceeded ? '#dc2626' : metrics.voiceMinutes.isWarning ? '#d97706' : '#059669'
                }}>
                  {metrics.voiceMinutes.used.toLocaleString()} / {metrics.voiceMinutes.limit.toLocaleString()} Minutes ({metrics.voiceMinutes.percentage}%)
                </span>
              </div>
              <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{
                  width: `${metrics.voiceMinutes.percentage}%`, height: '100%', borderRadius: 10,
                  background: metrics.voiceMinutes.isExceeded ? '#dc2626' : metrics.voiceMinutes.isWarning ? '#f59e0b' : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          )}

          {/* Grid for Seats, Channels & Phone Numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 4 }}>
            {/* Team Seats */}
            {metrics?.teamSeats && (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  <Users size={14} className="text-slate-500" />
                  Team Seats
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {metrics.teamSeats.used} / {metrics.teamSeats.limit}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  Active Agent Logins
                </div>
              </div>
            )}

            {/* Connected Channels */}
            {metrics?.connectedChannels && (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  <Layers size={14} className="text-slate-500" />
                  Channels Connected
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {metrics.connectedChannels.used} / {metrics.connectedChannels.limit}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  WhatsApp, Messenger, IG
                </div>
              </div>
            )}

            {/* Phone Numbers */}
            {metrics?.phoneNumbers && (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  <Phone size={14} className="text-slate-500" />
                  Phone Numbers
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {metrics.phoneNumbers.used} / {metrics.phoneNumbers.limit === -1 ? 'Custom' : metrics.phoneNumbers.limit}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  WABA Phone Lines
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Meta Conversation Wallet & Ledger ──────── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '22px 24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Wallet size={16} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Meta Conversation Wallet</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Prepaid ledger for Meta WABA marketing, utility & service conversation fees.</div>
            </div>
          </div>

          <button
            onClick={() => setShowTopupModal(true)}
            style={{
              padding: '7px 14px', borderRadius: 7, border: '1px solid #10b981',
              background: '#ecfdf5', color: '#059669', fontSize: 12.5, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
            }}
          >
            <Plus size={13} />
            Add Funds
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>Current Wallet Balance</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#059669' }}>
              PKR {(wallet?.balancePKR || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
              ≈ ${(wallet?.balanceUSD || 0).toFixed(2)} USD
            </div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>Marketing Spend</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
              PKR {(wallet?.marketingSpentPKR || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Broadcast campaigns</div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>Utility & Forms Spend</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
              PKR {(wallet?.utilitySpentPKR || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Flows & Confirmations</div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>Total Conversations</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
              {wallet?.totalConversationsThisCycle || 0}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>This billing cycle</div>
          </div>
        </div>
      </div>

      {/* ── Top-up Modal ─────────────────────────────── */}
      {showTopupModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
        }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
              Top Up Meta Conversation Wallet
            </div>
            <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 16 }}>
              Add prepaid balance for automated WhatsApp marketing broadcasts and utility notification dispatches.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {['2000', '5000', '10000'].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopupAmount(amt)}
                  style={{
                    padding: '9px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                    background: topupAmount === amt ? '#fee2e2' : '#f8fafc',
                    color: topupAmount === amt ? '#dc2626' : '#475569',
                    border: topupAmount === amt ? '1.5px solid #dc2626' : '1px solid #e2e8f0'
                  }}
                >
                  PKR {Number(amt).toLocaleString()}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Custom Amount (PKR)</label>
              <input
                type="number"
                value={topupAmount}
                onChange={e => setTopupAmount(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: 13.5, borderRadius: 8, border: '1.5px solid #cbd5e1', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowTopupModal(false)}
                style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingTopup}
                onClick={handleTopup}
                style={{
                  padding: '8px 18px', borderRadius: 7, border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer'
                }}
              >
                {processingTopup ? 'Processing...' : 'Confirm Top-Up'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upgrade Plan Modal (New Standardized Price Book) ── */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 960, maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Upgrade Ittisalo Subscription Plan</div>
                <div style={{ fontSize: 12.5, color: '#64748b' }}>Select the ideal tier for your business scale and omnichannel messaging volume.</div>
              </div>

              {/* Currency Toggle */}
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, border: '1px solid #e2e8f0' }}>
                <button
                  onClick={() => setCurrencyMode('PKR')}
                  style={{
                    padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: currencyMode === 'PKR' ? '#fff' : 'transparent',
                    color: currencyMode === 'PKR' ? '#0f172a' : '#64748b',
                    boxShadow: currencyMode === 'PKR' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  PKR (₨)
                </button>
                <button
                  onClick={() => setCurrencyMode('USD')}
                  style={{
                    padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: currencyMode === 'USD' ? '#fff' : 'transparent',
                    color: currencyMode === 'USD' ? '#0f172a' : '#64748b',
                    boxShadow: currencyMode === 'USD' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  USD ($)
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div style={{ padding: 24, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {Object.values(STANDARD_PLANS).map((p: PlanDefinition) => {
                const isCurrent = sub?.planTier === p.id;
                const priceFormatted = currencyMode === 'PKR' ? `PKR ${p.pricePKR.toLocaleString()}` : `$${p.priceUSD}`;

                return (
                  <div
                    key={p.id}
                    style={{
                      background: isCurrent ? '#fef2f2' : '#fff', borderRadius: 12, padding: 18,
                      border: isCurrent ? '2px solid #dc2626' : '1px solid #e2e8f0',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      boxShadow: isCurrent ? '0 4px 12px rgba(220,38,38,0.1)' : 'none'
                    }}
                  >
                    <div>
                      {isCurrent && (
                        <span style={{ fontSize: 10, fontWeight: 800, background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: 12, textTransform: 'uppercase' }}>
                          Current Plan
                        </span>
                      )}
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: isCurrent ? 6 : 0 }}>{p.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
                        {priceFormatted}<span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>/mo</span>
                      </div>

                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div><strong>{p.maxPhoneNumbers === -1 ? 'Custom' : p.maxPhoneNumbers}</strong> Phone Numbers</div>
                        <div><strong>{p.maxTeamMembers}</strong> Team Seats</div>
                        <div><strong>{p.maxAIConversations.toLocaleString()}</strong> AI Conversations</div>
                        <div><strong>{p.maxVoiceMinutes.toLocaleString()}</strong> Voice Mins</div>
                      </div>

                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {p.keyFeatures.map((f, i) => (
                          <div key={i} style={{ fontSize: 11, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={11} className="text-red-600 flex-shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      disabled={isCurrent}
                      onClick={() => {
                        showAlert({
                          title: 'Subscription Request Received',
                          message: `Thank you! Your account manager has been notified to upgrade your workspace to ${p.label}.`,
                          type: 'success',
                        });
                        setShowUpgradeModal(false);
                      }}
                      style={{
                        marginTop: 16, padding: '8px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                        background: isCurrent ? '#e2e8f0' : '#dc2626', color: isCurrent ? '#94a3b8' : '#fff',
                        border: 'none', cursor: isCurrent ? 'default' : 'pointer'
                      }}
                    >
                      {isCurrent ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
              <button
                onClick={() => setShowUpgradeModal(false)}
                style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
