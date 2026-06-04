'use client';

import { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Search, Calendar, ChevronRight, Play, CheckCircle2, 
  AlertCircle, Trash2, Send, Clock, Users, FileText, Check, X 
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  templateName: string;
  segmentName: string;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Failed';
  scheduledTime: string;
}

const defaultCampaigns: Campaign[] = [];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [tplList, setTplList] = useState<any[]>([]);
  
  // Create Campaign Form state
  const [campName, setCampName] = useState('');
  const [selectedTpl, setSelectedTpl] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('All Contacts');
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [campSaved, setCampSaved] = useState(false);

  // Load data dynamically
  useEffect(() => {
    // Load Campaigns
    const stored = localStorage.getItem('autoflow_campaigns');
    if (stored) {
      try {
        setCampaigns(JSON.parse(stored));
      } catch (e) {
        setCampaigns([]);
      }
    } else {
      setCampaigns([]);
      localStorage.setItem('autoflow_campaigns', JSON.stringify([]));
    }

    // Load templates for selector
    const storedTpl = localStorage.getItem('autoflow_whatsapp_templates');
    if (storedTpl) {
      try {
        setTplList(JSON.parse(storedTpl));
      } catch (e) {
        setTplList([]);
      }
    }
  }, []);

  const handleLaunchCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName || !selectedTpl) return;

    // Simulate contact count based on segment
    let count = 35;
    if (selectedSegment === 'All Contacts') count = 280;
    else if (selectedSegment === 'VIP Customers') count = 45;
    else if (selectedSegment === 'Hot Leads') count = 82;
    else if (selectedSegment === 'New Leads') count = 110;

    const timeStr = scheduleType === 'immediate' 
      ? 'Sent Immediately' 
      : `${scheduleDate} ${scheduleTime}`;

    const newCampaign: Campaign = {
      id: Math.random().toString(36).substr(2, 9),
      name: campName,
      templateName: selectedTpl,
      segmentName: selectedSegment,
      sentCount: scheduleType === 'immediate' ? count : 0,
      deliveredCount: scheduleType === 'immediate' ? Math.round(count * 0.98) : 0,
      readCount: scheduleType === 'immediate' ? Math.round(count * 0.82) : 0,
      failedCount: scheduleType === 'immediate' ? Math.round(count * 0.02) : 0,
      status: scheduleType === 'immediate' ? 'Completed' : 'Scheduled',
      scheduledTime: timeStr
    };

    const updated = [newCampaign, ...campaigns];
    setCampaigns(updated);
    localStorage.setItem('autoflow_campaigns', JSON.stringify(updated));
    setShowCreate(false);
    
    // Reset Form
    setCampName('');
    setSelectedTpl('');
    setSelectedSegment('All Contacts');
    setScheduleType('immediate');
    setScheduleDate('');
    setScheduleTime('');
  };

  const handleDeleteCampaign = (id: string) => {
    const updated = campaigns.filter(c => c.id !== id);
    setCampaigns(updated);
    localStorage.setItem('autoflow_campaigns', JSON.stringify(updated));
  };

  // Compute overall stats
  const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + c.deliveredCount, 0);
  const totalRead = campaigns.reduce((acc, c) => acc + c.readCount, 0);
  const totalFailed = campaigns.reduce((acc, c) => acc + c.failedCount, 0);

  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const readRate = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0;

  return (
    <div className="campaigns-page-wrap" style={{ padding: '28px', background: '#faf9f9', minHeight: 'calc(100vh - 98px)' }}>
      
      <div className="campaigns-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.4px', margin: 0 }}>
            Campaign Broadcasting
          </h1>
          <p style={{ fontSize: 12.5, color: '#6b7280', marginTop: 3 }}>
            Send bulk official WhatsApp templates to segmented contact lists.
          </p>
        </div>

        <button 
          onClick={() => setShowCreate(true)}
          style={{
            padding: '10px 18px', fontSize: 13, fontWeight: 700,
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
            border: 'none', borderRadius: 9, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 14px rgba(220,38,38,0.2)',
          }}
        >
          <Plus size={15} /> Create Broadcast Campaign
        </button>
      </div>

      <div className="campaigns-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        
        {/* Total Sent */}
        <div style={{ background: '#fff', border: '1px solid rgba(220,38,38,0.06)', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 750, color: '#6b7280', textTransform: 'uppercase' }}>Total Dispatched</span>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={13} color="#dc2626" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginTop: 8 }}>{totalSent}</div>
          <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
            ● Broadcaster Live
          </div>
        </div>

        {/* Delivery Rate */}
        <div style={{ background: '#fff', border: '1px solid rgba(220,38,38,0.06)', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 750, color: '#6b7280', textTransform: 'uppercase' }}>Delivery Rate</span>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={13} color="#dc2626" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginTop: 8 }}>{deliveryRate}%</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
            {totalDelivered} Successful deliveries
          </div>
        </div>

        {/* Read Rate */}
        <div style={{ background: '#fff', border: '1px solid rgba(220,38,38,0.06)', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 750, color: '#6b7280', textTransform: 'uppercase' }}>Read Rate (Open)</span>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Megaphone size={13} color="#dc2626" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginTop: 8 }}>{readRate}%</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
            {totalRead} Messages read
          </div>
        </div>

        {/* Failed Delivery */}
        <div style={{ background: '#fff', border: '1px solid rgba(220,38,38,0.06)', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 750, color: '#6b7280', textTransform: 'uppercase' }}>Bounced / Failed</span>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={13} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', marginTop: 8 }}>{totalFailed}</div>
          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
            {totalSent > 0 ? Math.round((totalFailed / totalSent) * 100) : 0}% bounce rating
          </div>
        </div>

      </div>

      {/* ── CAMPAIGN HISTORY & DETAILS TABLE ── */}
      <div style={{ 
        background: '#fff', borderRadius: 14, 
        border: '1px solid rgba(220,38,38,0.06)', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.01)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(220,38,38,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#111827', margin: 0 }}>Campaign Broadcast History</h3>
          <span style={{ fontSize: 11, background: '#fafafa', border: '1px solid #e5e7eb', padding: '3px 8px', borderRadius: 20, color: '#6b7280', fontWeight: 600 }}>
            {campaigns.length} total campaigns
          </span>
        </div>

        <div className="campaigns-table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#faf9f9', borderBottom: '1px solid rgba(220,38,38,0.04)' }}>
                <th style={{ padding: '14px 24px', fontSize: 11.5, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Campaign Name</th>
                <th style={{ padding: '14px 24px', fontSize: 11.5, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Approved Template</th>
                <th style={{ padding: '14px 24px', fontSize: 11.5, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Target Segment</th>
                <th style={{ padding: '14px 24px', fontSize: 11.5, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Progress / Sent</th>
                <th style={{ padding: '14px 24px', fontSize: 11.5, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Delivered</th>
                <th style={{ padding: '14px 24px', fontSize: 11.5, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Read Rate</th>
                <th style={{ padding: '14px 24px', fontSize: 11.5, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '14px 24px', fontSize: 11.5, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Scheduled / Completed Date</th>
                <th style={{ padding: '14px 24px', fontSize: 11.5, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase', width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(camp => {
                const completed = camp.status === 'Completed';
                const scheduled = camp.status === 'Scheduled';
                const tplReadRate = camp.deliveredCount > 0 ? Math.round((camp.readCount / camp.deliveredCount) * 100) : 0;
                
                return (
                  <tr key={camp.id} style={{ borderBottom: '1px solid #f9f8f8', transition: 'background 0.15s' }}>
                    <td style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#111827' }}>{camp.name}</td>
                    <td style={{ padding: '16px 24px', fontSize: 12.5, color: '#4b5563' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={13} color="#9ca3af" />
                        <code>{camp.templateName}</code>
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 12.5, color: '#6b7280' }}>
                      <span style={{ fontSize: 11.5, background: '#fef2f2', color: '#dc2626', padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                        {camp.segmentName}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#111827' }}>
                      {camp.sentCount} recipients
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 12.5, color: '#6b7280' }}>
                      {completed ? `${camp.deliveredCount} chats` : '—'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 12.5, color: '#6b7280' }}>
                      {completed ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{tplReadRate}%</span>
                          <div style={{ width: 50, height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${tplReadRate}%`, height: '100%', background: '#dc2626' }} />
                          </div>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 750, padding: '3px 8px', borderRadius: 20,
                        background: completed ? '#d1fae5' : scheduled ? '#eff6ff' : '#fee2e2',
                        color: completed ? '#065f46' : scheduled ? '#1e40af' : '#991b1b',
                      }}>
                        {camp.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 12.5, color: '#6b7280' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} color="#9ca3af" />
                        {camp.scheduledTime}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDeleteCampaign(camp.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={14} color="#9ca3af" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE CAMPAIGN MODAL DIALOG ── */}
      {showCreate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="campaign-modal-box" style={{
            background: '#fff', width: 560, borderRadius: 16,
            padding: '24px 28px', border: '1px solid rgba(220,38,38,0.1)',
            boxShadow: '0 15px 45px rgba(0,0,0,0.2)',
            animation: 'fadeUp 0.15s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Megaphone size={18} color="#dc2626" />
                Launch New Bulk Broadcast Campaign
              </h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={18} color="#6b7280" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLaunchCampaign} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Broadcast Campaign Name</label>
                <input 
                  type="text" required placeholder="e.g. End of Season Flash Sale Blast"
                  value={campName} onChange={e => setCampName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none' }}
                />
              </div>

              <div className="campaign-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Select Approved Template</label>
                  <select 
                    required
                    value={selectedTpl} onChange={e => setSelectedTpl(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none', background: '#fff' }}
                  >
                    <option value="">-- Choose Template --</option>
                    {tplList.map(tpl => (
                      <option key={tpl.id} value={tpl.name}>{tpl.name} ({tpl.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Target Customer Segment</label>
                  <select 
                    required
                    value={selectedSegment} onChange={e => setSelectedSegment(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none', background: '#fff' }}
                  >
                    <option>All Contacts</option>
                    <option>VIP Customers</option>
                    <option>Hot Leads</option>
                    <option>New Leads</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Broadcasting Delivery Schedule</label>
                
                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="schedule" 
                      checked={scheduleType === 'immediate'}
                      onChange={() => setScheduleType('immediate')}
                      style={{ accentColor: '#dc2626' }}
                    />
                    Send immediately
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="schedule" 
                      checked={scheduleType === 'scheduled'}
                      onChange={() => setScheduleType('scheduled')}
                      style={{ accentColor: '#dc2626' }}
                    />
                    Schedule for later
                  </label>
                </div>

                {scheduleType === 'scheduled' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 14px', background: '#fafafa', borderRadius: 9, border: '1px dashed #e5e7eb' }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>Date</label>
                      <input 
                        type="date" required
                        value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 6 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>Time</label>
                      <input 
                        type="time" required
                        value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 6 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreate(false)}
                  style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, border: '1px solid #e5e7eb', background: '#fff', color: '#4b5563', borderRadius: 9, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ 
                    padding: '10px 24px', fontSize: 13, fontWeight: 700, 
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', 
                    border: 'none', borderRadius: 9, cursor: 'pointer', 
                    boxShadow: '0 3px 10px rgba(220,38,38,0.2)' 
                  }}
                >
                  {scheduleType === 'immediate' ? 'Launch Broadcast' : 'Schedule Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
