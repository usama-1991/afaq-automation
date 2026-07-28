'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, FileText, Trash2, Eye, X, MessageSquare, Sparkles 
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

const defaultTemplates: Template[] = [];

const mapDbToTemplate = (dbTpl: any): Template => {
  const metaStatus = dbTpl.status || 'PENDING';
  let uiStatus: Template['status'] = 'Pending';
  if (metaStatus === 'APPROVED') uiStatus = 'Approved';
  if (metaStatus === 'REJECTED') uiStatus = 'Rejected';
  
  return {
    id: dbTpl.id,
    name: dbTpl.name,
    category: dbTpl.category as Template['category'],
    language: dbTpl.language,
    status: uiStatus,
    headerType: dbTpl.header_type as Template['headerType'] || 'None',
    headerText: dbTpl.header_text || undefined,
    bodyText: dbTpl.body_text || '',
    footerText: dbTpl.footer_text || undefined,
    buttons: dbTpl.buttons || []
  };
};

import { createMemoryState } from '@/lib/useMemoryState';

const useMemoryState = createMemoryState();

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useMemoryState<Template[]>('templates', []);
  const [searchQuery, setSearchQuery] = useMemoryState('searchQuery', '');
  const [selectedCategory, setSelectedCategory] = useMemoryState<string>('selectedCategory', 'All');
  const [selectedStatus, setSelectedStatus] = useMemoryState<string>('selectedStatus', 'All');
  const [selectedTemplate, setSelectedTemplate] = useMemoryState<Template | null>('selectedTemplate', null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const data = await res.json();
          const mapped = data.templates.map(mapDbToTemplate);
          setTemplates(mapped);
          if (mapped.length > 0) setSelectedTemplate(mapped[0]);
        } else {
          setTemplates([]);
        }
      } catch (e) {
        console.error('Failed to load templates:', e);
        setTemplates([]);
      }
    };
    fetchTemplates();
  }, []);


  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = templates.filter(t => t.id !== id);
        setTemplates(updated);
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(updated.length > 0 ? updated[0] : null);
        }
      } else {
        alert('Failed to delete template');
      }
    } catch (e) {
      console.error(e);
      alert('Network error deleting template');
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
    <div className="templates-page-wrap" style={{ padding: '28px', background: '#faf9f9', minHeight: 'calc(100vh - 98px)' }}>
      
      <div className="templates-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.4px', margin: 0 }}>
            WhatsApp Templates
          </h1>
          <p style={{ fontSize: 12.5, color: '#6b7280', marginTop: 3 }}>
            Manage and submit Meta-approved message templates for campaigns.
          </p>
        </div>

        <button 
          onClick={() => router.push('/templates/new')}
          style={{
            padding: '10px 18px', fontSize: 13, fontWeight: 700,
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
            border: 'none', borderRadius: 9, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 14px rgba(220,38,38,0.2)',
          }}
        >
          <Plus size={15} /> Create New Template
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {['All', 'Approved', 'Pending', 'Rejected'].map(status => {
            const act = selectedStatus === status;
            return (
              <button 
                key={status} 
                onClick={() => setSelectedStatus(status)}
                style={{
                  padding: '6px 14px', fontSize: 12, fontWeight: 650, borderRadius: 20,
                  background: act ? '#dc2626' : '#fff',
                  color: act ? '#fff' : '#4b5563',
                  border: act ? '1px solid #dc2626' : '1px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.12s',
                  whiteSpace: 'nowrap', boxShadow: act ? '0 2px 6px rgba(220,38,38,0.15)' : 'none'
                }}
              >
                {status === 'Pending' ? 'Pending Review' : status}
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', width: 280 }}>
          <Search size={15} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search templates..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px', fontSize: 12.5,
              border: '1.5px solid rgba(220,38,38,0.08)', borderRadius: 9,
              outline: 'none', background: '#fff', fontFamily: 'inherit'
            }}
          />
        </div>
      </div>

      <div style={{ 
        background: '#fff', borderRadius: 14, 
        border: '1px solid rgba(220,38,38,0.06)', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.01)',
        overflow: 'hidden'
      }}>
        <div className="templates-table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#faf9f9', borderBottom: '1px solid rgba(220,38,38,0.04)' }}>
                <th style={{ padding: '14px 24px', fontSize: 11.5, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Template Name</th>
                <th style={{ padding: '14px 24px', fontSize: 11.5, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '14px 24px', fontSize: 11.5, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Language</th>
                <th style={{ padding: '14px 24px', fontSize: 11.5, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Content Snippet</th>
                <th style={{ padding: '14px 24px', fontSize: 11.5, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '14px 24px', fontSize: 11.5, fontWeight: 750, color: '#4b5563', textTransform: 'uppercase', width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map(tpl => {
                  const isApproved = tpl.status === 'Approved';
                  const isPending = tpl.status === 'Pending';
                  
                  return (
                    <tr key={tpl.id} style={{ borderBottom: '1px solid #f9f8f8', transition: 'background 0.15s' }}>
                      <td style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#111827' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={14} color="#dc2626" />
                          {tpl.name}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 12.5, color: '#6b7280' }}>{tpl.category}</td>
                      <td style={{ padding: '16px 24px', fontSize: 12.5, color: '#6b7280' }}>{tpl.language}</td>
                      <td style={{ padding: '16px 24px', fontSize: 12.5, color: '#4b5563' }}>
                        <div style={{ maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tpl.bodyText}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 750, padding: '3px 8px', borderRadius: 20,
                          background: isApproved ? '#d1fae5' : isPending ? '#fef3c7' : '#fee2e2',
                          color: isApproved ? '#065f46' : isPending ? '#d97706' : '#991b1b',
                        }}>
                          {tpl.status === 'Pending' ? 'Pending Review' : tpl.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <button 
                            onClick={() => { setSelectedTemplate(tpl); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                            title="View Template"
                          >
                            <Eye size={16} color="#6b7280" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                            title="Delete Template"
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 10px', color: '#9ca3af' }}>
                    <FileText size={28} style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>No templates found</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── VIEW PREVIEW MODAL ── */}
      {selectedTemplate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="template-modal-box" style={{
            background: '#fff', width: 440, borderRadius: 16,
            padding: '24px 28px', border: '1px solid rgba(220,38,38,0.1)',
            boxShadow: '0 15px 45px rgba(0,0,0,0.2)',
            animation: 'fadeUp 0.15s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} color="#dc2626" />
                Template Preview
              </h3>
              <button onClick={() => setSelectedTemplate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={18} color="#6b7280" />
              </button>
            </div>

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
            
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={() => setSelectedTemplate(null)}
                style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, border: '1px solid #e5e7eb', background: '#fff', color: '#4b5563', borderRadius: 9, cursor: 'pointer' }}
              >
                Close Preview
              </button>
            </div>
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
