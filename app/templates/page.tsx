'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Search, FileText, Check, Clock, AlertTriangle, 
  Trash2, Copy, Send, Eye, X, Edit, MessageSquare, Sparkles 
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: 'Marketing' | 'Utility' | 'Authentication';
  language: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  headerType: 'None' | 'Text' | 'Image' | 'Document';
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttons: Array<{ type: 'QUICK_REPLY' | 'URL' | 'PHONE'; text: string; urlOrPhone?: string }>;
}

const defaultTemplates: Template[] = [
  {
    id: '1',
    name: 'welcome_message',
    category: 'Marketing',
    language: 'English (US)',
    status: 'Approved',
    headerType: 'Text',
    headerText: 'Welcome to AutoFlow Studio!',
    bodyText: 'Hello {{1}}, thank you for joining AutoFlow. We are excited to help you automate your business communications! Click below to explore your dashboard.',
    footerText: 'AutoFlow Team',
    buttons: [
      { type: 'URL', text: 'Go to Dashboard', urlOrPhone: 'https://autoflow.ai/dashboard' },
      { type: 'QUICK_REPLY', text: 'Speak to Agent' }
    ]
  },
  {
    id: '2',
    name: 'order_receipt_confirmation',
    category: 'Utility',
    language: 'English (US)',
    status: 'Approved',
    headerType: 'None',
    bodyText: 'Hi {{1}}! Your order #{{2}} has been confirmed. We will dispatch it shortly. You can track your shipment status with the link below.',
    footerText: 'Order Department',
    buttons: [
      { type: 'URL', text: 'Track Order', urlOrPhone: 'https://autoflow.ai/orders/track' }
    ]
  },
  {
    id: '3',
    name: 'auth_otp_code',
    category: 'Authentication',
    language: 'English (US)',
    status: 'Approved',
    headerType: 'None',
    bodyText: 'Your AutoFlow AI secure verification code is {{1}}. This code is valid for 10 minutes. Do not share it with anyone.',
    buttons: []
  },
  {
    id: '4',
    name: 'cart_abandonment_offer',
    category: 'Marketing',
    language: 'English (US)',
    status: 'Pending',
    headerType: 'Image',
    bodyText: 'Hey {{1}}! We noticed you left some amazing workflows in your cart. Use code {{2}} at checkout to get a premium 15% discount today!',
    footerText: 'Special Promotions',
    buttons: [
      { type: 'URL', text: 'Complete Checkout', urlOrPhone: 'https://autoflow.ai/checkout' }
    ]
  }
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Create template modal state
  const [showCreate, setShowCreate] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplCategory, setTplCategory] = useState<'Marketing' | 'Utility' | 'Authentication'>('Marketing');
  const [tplHeaderType, setTplHeaderType] = useState<'None' | 'Text' | 'Image' | 'Document'>('None');
  const [tplHeaderText, setTplHeaderText] = useState('');
  const [tplBodyText, setTplBodyText] = useState('');
  const [tplFooterText, setTplFooterText] = useState('');
  const [buttonCount, setButtonCount] = useState<number>(0);
  const [button1Text, setButton1Text] = useState('');
  const [button1Type, setButton1Type] = useState<'QUICK_REPLY' | 'URL'>('QUICK_REPLY');
  const [button1Val, setButton1Val] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('autoflow_whatsapp_templates');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTemplates(parsed);
        if (parsed.length > 0) setSelectedTemplate(parsed[0]);
      } catch (e) {
        setTemplates(defaultTemplates);
        setSelectedTemplate(defaultTemplates[0]);
      }
    } else {
      setTemplates(defaultTemplates);
      setSelectedTemplate(defaultTemplates[0]);
      localStorage.setItem('autoflow_whatsapp_templates', JSON.stringify(defaultTemplates));
    }
  }, []);

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName || !tplBodyText) return;

    // Format buttons
    const buttonsArray: any[] = [];
    if (buttonCount > 0 && button1Text) {
      buttonsArray.push({
        type: button1Type,
        text: button1Text,
        urlOrPhone: button1Type === 'URL' ? button1Val : undefined
      });
    }

    const newTpl: Template = {
      id: Math.random().toString(36).substr(2, 9),
      name: tplName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      category: tplCategory,
      language: 'English (US)',
      status: 'Approved', // Auto-approved for simulation convenience!
      headerType: tplHeaderType,
      headerText: tplHeaderType === 'Text' ? tplHeaderText : undefined,
      bodyText: tplBodyText,
      footerText: tplFooterText || undefined,
      buttons: buttonsArray
    };

    const updated = [newTpl, ...templates];
    setTemplates(updated);
    localStorage.setItem('autoflow_whatsapp_templates', JSON.stringify(updated));
    setSelectedTemplate(newTpl);
    setShowCreate(false);
    
    // Reset Form
    setTplName('');
    setTplCategory('Marketing');
    setTplHeaderType('None');
    setTplHeaderText('');
    setTplBodyText('');
    setTplFooterText('');
    setButtonCount(0);
    setButton1Text('');
    setButton1Val('');
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('autoflow_whatsapp_templates', JSON.stringify(updated));
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(updated.length > 0 ? updated[0] : null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.bodyText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || t.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 98px)', background: '#faf9f9' }}>
      
      {/* ── LEFT TEMPLATES DIRECTORY LIST ── */}
      <div style={{ 
        width: 320, background: '#fff', 
        borderRight: '1px solid rgba(220,38,38,0.08)', 
        display: 'flex', flexDirection: 'column', flexShrink: 0 
      }}>
        {/* Header Search Section */}
        <div style={{ padding: '20px 18px', borderBottom: '1px solid rgba(220,38,38,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16.5, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>WhatsApp Templates</h2>
            <button 
              onClick={() => setShowCreate(true)}
              style={{
                padding: '7px 11px', fontSize: 12, fontWeight: 700,
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                boxShadow: '0 2px 8px rgba(220,38,38,0.2)',
              }}
            >
              <Plus size={14} /> New
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={15} color="#9ca3af" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search templates..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 34px', fontSize: 12.5,
                border: '1.5px solid rgba(220,38,38,0.08)', borderRadius: 9,
                outline: 'none', background: '#fafafa', fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Quick Segment Filter Pill Rows */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto', paddingBottom: 2 }}>
            {['All', 'Marketing', 'Utility', 'Authentication'].map(cat => {
              const act = selectedCategory === cat;
              return (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '4px 10px', fontSize: 11, fontWeight: 650, borderRadius: 20,
                    background: act ? '#dc2626' : '#f3f4f6',
                    color: act ? '#fff' : '#6b7280',
                    border: 'none', cursor: 'pointer', transition: 'all 0.12s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates Scroll area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map(tpl => {
              const isSel = selectedTemplate?.id === tpl.id;
              const isApproved = tpl.status === 'Approved';
              const isPending = tpl.status === 'Pending';
              
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  style={{
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                    background: isSel ? '#fef2f2' : '#fff',
                    border: isSel ? '1.5px solid rgba(220,38,38,0.18)' : '1.5px solid rgba(220,38,38,0.03)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.015)',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { if(!isSel) e.currentTarget.style.borderColor = 'rgba(220,38,38,0.1)'; }}
                  onMouseLeave={e => { if(!isSel) e.currentTarget.style.borderColor = 'rgba(220,38,38,0.03)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{tpl.name}</span>
                    
                    {/* Status Pill */}
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                      background: isApproved ? '#d1fae5' : isPending ? '#fef3c7' : '#fee2e2',
                      color: isApproved ? '#065f46' : isPending ? '#d97706' : '#991b1b',
                    }}>
                      {tpl.status}
                    </span>
                  </div>

                  <p style={{ 
                    fontSize: 11.5, color: '#6b7280', 
                    margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', 
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    lineHeight: 1.5
                  }}>
                    {tpl.bodyText}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, fontSize: 10, color: '#9ca3af', fontWeight: 550 }}>
                    <span>{tpl.category}</span>
                    <span>{tpl.language}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#9ca3af' }}>
              <FileText size={28} style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>No templates matched</div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT TEMPLATE VISUAL PREVIEW & MOCK SIMULATOR PANEL ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#faf9f9' }}>
        {selectedTemplate ? (
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            
            {/* Header Title Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span style={{ 
                  fontSize: 11, background: '#fef2f2', color: '#dc2626', 
                  padding: '3px 9px', borderRadius: 12, fontWeight: 700,
                  border: '1px solid rgba(220,38,38,0.1)'
                }}>
                  Meta Official API (WhatsApp Cloud)
                </span>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginTop: 8, letterSpacing: '-0.4px' }}>
                  {selectedTemplate.name}
                </h1>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Category: <strong style={{ color: '#dc2626' }}>{selectedTemplate.category}</strong> · Last Approved: Just Now
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => copyToClipboard(selectedTemplate.bodyText)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12.5, fontWeight: 650,
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fafafa'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                >
                  <Copy size={13} />
                  {isCopied ? 'Copied!' : 'Copy Body'}
                </button>
                <button 
                  onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12.5, fontWeight: 650,
                    background: '#fff', border: '1px solid #fee2e2', color: '#ef4444', borderRadius: 8, cursor: 'pointer'
                  }}
                >
                  <Trash2 size={13} />
                  Delete Template
                </button>
              </div>
            </div>

            {/* Content Layout Divider Split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 28, alignItems: 'start' }}>
              
              {/* Structural Details Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Meta details card */}
                <div style={{ background: '#fff', padding: '20px 24px', borderRadius: 14, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
                  <h3 style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={15} color="#dc2626" />
                    Template Structure & Payload
                  </h3>

                  {selectedTemplate.headerType !== 'None' && (
                    <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed #f3f4f6' }}>
                      <span style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 750, display: 'block', textTransform: 'uppercase' }}>HEADER ({selectedTemplate.headerType})</span>
                      <span style={{ fontSize: 13, color: '#1f2937', fontWeight: 600, display: 'block', marginTop: 4 }}>
                        {selectedTemplate.headerText || `[WhatsApp ${selectedTemplate.headerType} Asset]`}
                      </span>
                    </div>
                  )}

                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 750, display: 'block', textTransform: 'uppercase' }}>BODY COMPONENT</span>
                    <p style={{ fontSize: 13, color: '#1f2937', lineHeight: 1.6, marginTop: 4, whiteSpace: 'pre-wrap' }}>
                      {selectedTemplate.bodyText}
                    </p>
                  </div>

                  {selectedTemplate.footerText && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #f3f4f6' }}>
                      <span style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 750, display: 'block', textTransform: 'uppercase' }}>FOOTER</span>
                      <span style={{ fontSize: 12, color: '#6b7280', display: 'block', marginTop: 2 }}>{selectedTemplate.footerText}</span>
                    </div>
                  )}
                </div>

                {/* Buttons Config Card */}
                {selectedTemplate.buttons.length > 0 && (
                  <div style={{ background: '#fff', padding: '20px 24px', borderRadius: 14, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
                    <h3 style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Template Buttons</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedTemplate.buttons.map((btn, index) => (
                        <div 
                          key={index}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', borderRadius: 8, background: '#fdfcfc',
                            border: '1.5px solid rgba(220,38,38,0.05)', fontSize: 12.5
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 9.5, background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                              {btn.type}
                            </span>
                            <span style={{ fontWeight: 600, color: '#1f2937' }}>{btn.text}</span>
                          </div>
                          {btn.urlOrPhone && (
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{btn.urlOrPhone}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* GORGEOUS LIVE MOBILE MOCKUP */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live Phone Preview</span>
                
                {/* Visual Phone Shell */}
                <div style={{ 
                  background: '#efeae2', width: '100%', borderRadius: 24, 
                  border: '10px solid #1f2937', padding: '16px 12px 24px', 
                  boxShadow: '0 12px 36px rgba(0,0,0,0.12)', height: 420,
                  display: 'flex', flexDirection: 'column', position: 'relative'
                }}>
                  {/* Chat bubbles container */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
                    
                    {/* WhatsApp Bubble */}
                    <div style={{ 
                      background: '#fff', borderRadius: '0px 12px 12px 12px', 
                      padding: '10px 12px', maxWidth: '90%', 
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                      display: 'flex', flexDirection: 'column', gap: 3
                    }}>
                      
                      {/* Image header mock if headerType === Image */}
                      {selectedTemplate.headerType === 'Image' && (
                        <div style={{ 
                          width: '100%', height: 100, background: '#ddd', borderRadius: 8, 
                          marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 22, color: '#888'
                        }}>
                          🖼️
                        </div>
                      )}

                      {/* Header Text */}
                      {selectedTemplate.headerType === 'Text' && selectedTemplate.headerText && (
                        <span style={{ fontSize: 12, fontWeight: 750, color: '#111827', display: 'block', marginBottom: 2 }}>
                          {selectedTemplate.headerText}
                        </span>
                      )}

                      {/* Body */}
                      <p style={{ fontSize: 11.5, color: '#2b2b2b', margin: 0, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                        {selectedTemplate.bodyText.replace('{{1}}', 'Usama').replace('{{2}}', 'AUTOFEST15').replace('{{3}}', '1')}
                      </p>

                      {/* Footer Text */}
                      {selectedTemplate.footerText && (
                        <span style={{ fontSize: 9.5, color: '#8b8b8b', display: 'block', marginTop: 4 }}>
                          {selectedTemplate.footerText}
                        </span>
                      )}

                      {/* Time indicator */}
                      <span style={{ fontSize: 8.5, color: '#999', alignSelf: 'flex-end', marginTop: 2 }}>12:45 PM</span>
                    </div>
                  </div>

                  {/* Bubble Buttons render */}
                  {selectedTemplate.buttons.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                      {selectedTemplate.buttons.map((btn, idx) => (
                        <div 
                          key={idx}
                          style={{
                            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
                            padding: '8px 10px', borderRadius: 8, textAlign: 'center',
                            fontSize: 11.5, fontWeight: 650, color: '#dc2626',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                          }}
                        >
                          <MessageSquare size={12} />
                          {btn.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#9ca3af' }}>
            <FileText size={48} />
            <div style={{ fontSize: 14, marginTop: 12 }}>Select a template to view preview</div>
          </div>
        )}
      </div>

      {/* ── CREATE TEMPLATE SLIDE-OVER / MODAL ── */}
      {showCreate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff', width: 620, borderRadius: 16,
            padding: '24px 28px', border: '1px solid rgba(220,38,38,0.1)',
            boxShadow: '0 15px 45px rgba(0,0,0,0.2)',
            animation: 'fadeUp 0.15s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="#dc2626" />
                Submit New Meta Message Template
              </h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={18} color="#6b7280" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Template Name</label>
                  <input 
                    type="text" required placeholder="e.g. order_completed_otp"
                    value={tplName} onChange={e => setTplName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 12.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 8, outline: 'none' }}
                  />
                  <span style={{ fontSize: 9.5, color: '#9ca3af', marginTop: 3, display: 'block' }}>Use lowercase and underscores only</span>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Category</label>
                  <select 
                    value={tplCategory} onChange={e => setTplCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 12.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 8, outline: 'none', background: '#fff' }}
                  >
                    <option>Marketing</option>
                    <option>Utility</option>
                    <option>Authentication</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Header Type</label>
                  <select 
                    value={tplHeaderType} onChange={e => setTplHeaderType(e.target.value as any)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 12.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 8, outline: 'none', background: '#fff' }}
                  >
                    <option>None</option>
                    <option>Text</option>
                    <option>Image</option>
                    <option>Document</option>
                  </select>
                </div>
                
                {tplHeaderType === 'Text' && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Header Text</label>
                    <input 
                      type="text" required placeholder="e.g. Action Required"
                      value={tplHeaderText} onChange={e => setTplHeaderText(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', fontSize: 12.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 8, outline: 'none' }}
                    />
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Template Body Text</label>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>Use {"{{1}}"}, {"{{2}}"} for dynamic parameters</span>
                </div>
                <textarea 
                  required rows={4} 
                  placeholder="e.g. Hello {{1}}, your booking for {{2}} is confirmed!"
                  value={tplBodyText} onChange={e => setTplBodyText(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 12.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 8, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Footer Text (Optional)</label>
                  <input 
                    type="text" placeholder="e.g. Marketing Dept."
                    value={tplFooterText} onChange={e => setTplFooterText(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 12.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 8, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Call To Action Buttons</label>
                  <select 
                    value={buttonCount} onChange={e => setButtonCount(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 12.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 8, outline: 'none', background: '#fff' }}
                  >
                    <option value={0}>No Buttons</option>
                    <option value={1}>1 CTA / Quick Reply Button</option>
                  </select>
                </div>
              </div>

              {buttonCount > 0 && (
                <div style={{ 
                  background: '#fdfcfc', padding: '12px 14px', borderRadius: 8, 
                  border: '1px dashed rgba(220,38,38,0.15)', display: 'grid', 
                  gridTemplateColumns: '130px 140px 1fr', gap: 10 
                }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Button Type</label>
                    <select 
                      value={button1Type} onChange={e => setButton1Type(e.target.value as any)}
                      style={{ width: '100%', padding: '6px 8px', fontSize: 11.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 6, outline: 'none', background: '#fff' }}
                    >
                      <option value="QUICK_REPLY">Quick Reply</option>
                      <option value="URL">CTA (Link URL)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Button Text</label>
                    <input 
                      type="text" required placeholder="e.g. Chat with Us"
                      value={button1Text} onChange={e => setButton1Text(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', fontSize: 11.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 6, outline: 'none' }}
                    />
                  </div>
                  {button1Type === 'URL' && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Destination URL</label>
                      <input 
                        type="url" required placeholder="https://autoflow.ai/..."
                        value={button1Val} onChange={e => setButton1Val(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', fontSize: 11.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 6, outline: 'none' }}
                      />
                    </div>
                  )}
                </div>
              )}

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
                  Submit for Approval
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
