'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layers, Plus, Play, CheckCircle2, AlertCircle, Trash2, Send, 
  Clock, Users, FileText, Check, X, RefreshCw, Phone, Sparkles,
  Calendar, MapPin, Star, ExternalLink, ShieldCheck, Eye, Zap,
  ChevronRight, Copy
} from 'lucide-react';
import { ALL_FLOW_BLUEPRINTS, FlowBlueprint } from '@/lib/whatsapp/flows-templates';
import { useConfirm, useAlert } from '@/context/DialogContext';

interface WhatsAppFlow {
  id: string;
  flow_id: string;
  name: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';
  preview_url: string | null;
  flow_json: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface FlowSubmission {
  id: string;
  flow_id: string;
  customer_phone: string;
  response_payload: any;
  processed_status: string;
  created_at: string;
}

export default function FlowsPage() {
  const confirm = useConfirm();
  const showAlert = useAlert();

  const [flows, setFlows] = useState<WhatsAppFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deployingKey, setDeployingKey] = useState<string | null>(null);

  // Test Flow Modal State
  const [testModalFlow, setTestModalFlow] = useState<WhatsAppFlow | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // View JSON Schema Modal State
  const [jsonModalFlow, setJsonModalFlow] = useState<WhatsAppFlow | null>(null);

  // Submissions State
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [submissions, setSubmissions] = useState<FlowSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const fetchFlows = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/flows');
      if (res.ok) {
        const data = await res.json();
        setFlows(data.flows || []);
      }
    } catch (e) {
      console.error('Failed to fetch flows:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  // Deploy a Blueprint to Meta Cloud API
  const handleDeployBlueprint = async (blueprint: FlowBlueprint) => {
    const isConfirmed = await confirm({
      title: `Deploy ${blueprint.name}?`,
      message: `This will register the flow container on Meta Business API and upload the flow.json asset.`,
      confirmText: 'Deploy to Meta',
    });

    if (!isConfirmed) return;

    setDeployingKey(blueprint.key);
    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprint_key: blueprint.key,
          custom_name: blueprint.name,
          custom_flow_json: blueprint.flowJson,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showAlert({
          title: 'Flow Deployed',
          message: `Flow "${blueprint.name}" created successfully on Meta (ID: ${data.flow?.flow_id})!`,
          type: 'success',
        });
        fetchFlows();
      } else {
        const errData = await res.json().catch(() => ({}));
        showAlert({
          title: 'Deployment Failed',
          message: errData.error || 'Failed to deploy Flow to Meta.',
          type: 'danger',
        });
      }
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err.message || 'Network error occurred.',
        type: 'danger',
      });
    } finally {
      setDeployingKey(null);
    }
  };

  // Publish Flow
  const handlePublishFlow = async (flow: WhatsAppFlow) => {
    const isConfirmed = await confirm({
      title: `Publish Flow "${flow.name}"?`,
      message: `Once published on Meta, the Flow can be sent to any customer in live WhatsApp chats.`,
      confirmText: 'Publish on Meta',
    });

    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/flows/${flow.flow_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      });

      if (res.ok) {
        showAlert({
          title: 'Flow Published',
          message: `Flow is now active and ready for live customers!`,
          type: 'success',
        });
        fetchFlows();
      }
    } catch (e: any) {
      showAlert({ title: 'Error', message: e.message, type: 'danger' });
    }
  };

  // Send Test Flow Message
  const handleSendTestFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testModalFlow || !testPhone) return;

    setSendingTest(true);
    try {
      const res = await fetch('/api/flows/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow_id: testModalFlow.flow_id,
          recipient_phone: testPhone,
          cta_text: testModalFlow.metadata?.cta_text || 'Open Form',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showAlert({
          title: 'Test Flow Sent! 🚀',
          message: `Flow message sent to +${testPhone.replace(/\D/g, '')}. Open WhatsApp on your device to interact with the native form!`,
          type: 'success',
        });
        setTestModalFlow(null);
        setTestPhone('');
      } else {
        showAlert({
          title: 'Test Dispatch Failed',
          message: data.error || 'Meta API rejected the flow dispatch.',
          type: 'danger',
        });
      }
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message, type: 'danger' });
    } finally {
      setSendingTest(false);
    }
  };

  // Delete Flow
  const handleDeleteFlow = async (flow: WhatsAppFlow) => {
    const isConfirmed = await confirm({
      title: `Delete Flow "${flow.name}"?`,
      message: 'Are you sure you want to delete this flow record?',
      confirmText: 'Delete',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/flows/${flow.flow_id}`, { method: 'DELETE' });
      if (res.ok) {
        showAlert({ title: 'Flow Deleted', message: 'Flow removed.', type: 'success' });
        fetchFlows();
      }
    } catch (e: any) {
      showAlert({ title: 'Error', message: e.message, type: 'danger' });
    }
  };

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
              <Layers size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Meta WhatsApp Flows Hub
              </h1>
              <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0 0' }}>
                Deploy native, multi-screen forms & booking engines directly inside WhatsApp with zero web redirects.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={fetchFlows}
            style={{
              padding: '9px 14px', borderRadius: 9, border: '1px solid #e2e8f0',
              background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Production Flow Blueprints (Ready to Deploy) ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} className="text-amber-500" />
          Ready-to-Deploy WhatsApp Flow Blueprints
        </div>
        <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 14 }}>
          1-Click deploy official Meta JSON schemas customized for Pakistani SMBs, clinics, and e-commerce stores.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {ALL_FLOW_BLUEPRINTS.map(bp => {
            const isClinic = bp.key === 'APPOINTMENT_BOOKING';
            const isCod = bp.key === 'COD_ADDRESS';
            const Icon = isClinic ? Calendar : isCod ? MapPin : Star;
            const iconBg = isClinic ? '#ecfdf5' : isCod ? '#fef3c7' : '#f0fdf4';
            const iconColor = isClinic ? '#059669' : isCod ? '#d97706' : '#16a34a';

            return (
              <div
                key={bp.key}
                style={{
                  background: '#fff', borderRadius: 12, padding: '18px 20px',
                  border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, background: iconBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor
                    }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{bp.name}</div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#f1f5f9', color: '#64748b' }}>
                        {bp.category}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                    {bp.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 11.5, color: '#10b981', fontWeight: 600 }}>
                    CTA: {bp.ctaText}
                  </span>
                  <button
                    disabled={deployingKey === bp.key}
                    onClick={() => handleDeployBlueprint(bp)}
                    style={{
                      padding: '7px 14px', borderRadius: 7, border: 'none',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5
                    }}
                  >
                    <Plus size={13} />
                    {deployingKey === bp.key ? 'Deploying...' : 'Deploy to Meta'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Registered Flows Table ────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              Active WhatsApp Flows
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Flows registered with your WhatsApp Business Account (WABA).
            </div>
          </div>

          <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>
            {flows.length} Registered Flows
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '50px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13.5 }}>
            Loading WhatsApp Flows...
          </div>
        ) : flows.length === 0 ? (
          <div style={{ padding: '50px 0', textAlign: 'center', color: '#94a3b8' }}>
            <Layers size={36} className="mx-auto mb-2 text-slate-300" />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>No WhatsApp Flows Deployed Yet</div>
            <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 2 }}>
              Deploy one of the ready-to-use blueprints above to start receiving in-chat form submissions.
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Flow Name</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Meta Flow ID</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flows.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      Created: {new Date(f.created_at).toLocaleDateString()}
                    </div>
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <code style={{ fontSize: 11.5, background: '#f1f5f9', padding: '3px 6px', borderRadius: 4, color: '#334155' }}>
                      {f.flow_id}
                    </code>
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#475569' }}>
                      {f.category}
                    </span>
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: f.status === 'PUBLISHED' ? '#dcfce7' : f.status === 'DRAFT' ? '#fef3c7' : '#f1f5f9',
                      color: f.status === 'PUBLISHED' ? '#15803d' : f.status === 'DRAFT' ? '#b45309' : '#64748b',
                    }}>
                      {f.status}
                    </span>
                  </td>

                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <button
                        onClick={() => { setTestModalFlow(f); setTestPhone(''); }}
                        style={{
                          padding: '6px 12px', borderRadius: 7, border: '1px solid #10b981',
                          background: '#ecfdf5', color: '#059669', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5
                        }}
                      >
                        <Phone size={12} />
                        Test on WhatsApp
                      </button>

                      {f.status === 'DRAFT' && (
                        <button
                          onClick={() => handlePublishFlow(f)}
                          style={{
                            padding: '6px 10px', borderRadius: 7, border: '1px solid #cbd5e1',
                            background: '#fff', color: '#0f172a', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Publish
                        </button>
                      )}

                      <button
                        onClick={() => setJsonModalFlow(f)}
                        style={{
                          padding: '6px 10px', borderRadius: 7, border: '1px solid #cbd5e1',
                          background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer'
                        }}
                        title="View JSON Schema"
                      >
                        <Eye size={13} />
                      </button>

                      <button
                        onClick={() => handleDeleteFlow(f)}
                        style={{
                          padding: '6px 10px', borderRadius: 7, border: '1px solid #fee2e2',
                          background: '#fff', color: '#dc2626', fontSize: 12, cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Test Flow on WhatsApp Modal ───────────────── */}
      {testModalFlow && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, width: '100%', maxWidth: 440,
            padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={16} className="text-emerald-600" />
                Test Flow on WhatsApp
              </div>
              <button
                onClick={() => setTestModalFlow(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 16 }}>
              Enter your WhatsApp mobile number to receive a live interactive Flow message and test the in-app sheet.
            </p>

            <form onSubmit={handleSendTestFlow}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                  Recipient WhatsApp Number (with country code) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 923001234567"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', fontSize: 13.5,
                    borderRadius: 8, border: '1.5px solid #cbd5e1', outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setTestModalFlow(null)}
                  style={{
                    padding: '8px 14px', borderRadius: 7, border: '1px solid #cbd5e1',
                    background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  style={{
                    padding: '8px 18px', borderRadius: 7, border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Send size={13} />
                  {sendingTest ? 'Sending...' : 'Send Live Flow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View JSON Schema Modal ────────────────────── */}
      {jsonModalFlow && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, width: '100%', maxWidth: 640,
            maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                Meta Flow JSON: {jsonModalFlow.name}
              </div>
              <button
                onClick={() => setJsonModalFlow(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: 18, overflowY: 'auto', flex: 1, background: '#0f172a', color: '#38bdf8' }}>
              <pre style={{ margin: 0, fontSize: 11.5, fontFamily: 'monospace' }}>
                {JSON.stringify(jsonModalFlow.flow_json, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
