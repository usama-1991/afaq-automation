'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Info, Plus, X, Eye, EyeOff, Loader2, Check } from 'lucide-react';

type Category = 'Utility' | 'Marketing' | 'Authentication';
type Language = 'en_US' | 'en_GB' | 'ar' | 'ur' | 'es' | 'fr' | 'de' | 'hi';

interface Button {
  id: string;
  type: 'QUICK_REPLY' | 'URL' | 'PHONE';
  text: string;
  urlOrPhone: string;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en_US', label: 'English (US)' },
  { code: 'en_GB', label: 'English (UK)' },
  { code: 'ar',    label: 'Arabic' },
  { code: 'ur',    label: 'Urdu' },
  { code: 'es',    label: 'Spanish' },
  { code: 'fr',    label: 'French' },
  { code: 'de',    label: 'German' },
  { code: 'hi',    label: 'Hindi' },
];

const CATEGORY_INFO: Record<Category, string> = {
  Utility:        'Order/account updates tied to a transaction. Free inside the 24h customer window.',
  Marketing:      'Promotions, offers, and announcements. Charged per message sent.',
  Authentication: 'One-time passwords and verification codes. High-trust delivery.',
};

// ── Live WhatsApp Preview ────────────────────────────────────
function WhatsAppPreview({
  header, body, footer, buttons,
}: {
  header: string; body: string; footer: string; buttons: Button[];
}) {
  const fillVars = (text: string) =>
    text.replace(/\{\{1\}\}/g, 'John').replace(/\{\{2\}\}/g, '#ORD-2891').replace(/\{\{3\}\}/g, '$149');

  return (
    <div style={{
      background: '#e5ddd5',
      borderRadius: 16,
      padding: '20px 14px 14px',
      minHeight: 280,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      position: 'relative',
    }}>
      {/* Watermark pattern */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px', borderRadius: 16 }} />

      {/* Bubble */}
      <div style={{
        background: '#fff',
        borderRadius: '2px 12px 12px 12px',
        padding: '10px 12px',
        maxWidth: '88%',
        boxShadow: '0 1px 2px rgba(0,0,0,0.13)',
        position: 'relative', zIndex: 1,
      }}>
        {header && (
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 6px 0' }}>
            {fillVars(header)}
          </p>
        )}
        <p style={{ fontSize: 12.5, color: body ? '#2b2b2b' : '#aaa', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap', fontStyle: body ? 'normal' : 'italic' }}>
          {body ? fillVars(body) : 'Body text will appear here'}
        </p>
        {footer && (
          <p style={{ fontSize: 10.5, color: '#8b8b8b', margin: '6px 0 0 0' }}>{fillVars(footer)}</p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: '#8b8b8b' }}>12:45 PM ✓✓</span>
        </div>
      </div>

      {/* Buttons */}
      {buttons.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', zIndex: 1 }}>
          {buttons.map((btn) => (
            <div key={btn.id} style={{
              background: '#fff',
              borderRadius: 8,
              padding: '9px 12px',
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: '#0093ee',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              cursor: 'default',
            }}>
              {btn.text || 'Button text'}
            </div>
          ))}
        </div>
      )}

      {!body && !header && buttons.length === 0 && (
        <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 8, position: 'relative', zIndex: 1 }}>
          Powered by Ittisalo
        </p>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function CreateTemplatePage() {
  const router = useRouter();

  const [name,       setName]       = useState('');
  const [language,   setLanguage]   = useState<Language>('en_US');
  const [category,   setCategory]   = useState<Category>('Utility');
  const [header,     setHeader]     = useState('');
  const [body,       setBody]       = useState('');
  const [footer,     setFooter]     = useState('');
  const [buttons,    setButtons]    = useState<Button[]>([]);
  const [showPrev,   setShowPrev]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState('');

  // Name validation: lowercase, numbers, underscores only
  const nameValid = /^[a-z0-9_]*$/.test(name);

  const addButton = () => {
    if (buttons.length >= 3) return;
    setButtons(prev => [...prev, { id: crypto.randomUUID(), type: 'QUICK_REPLY', text: '', urlOrPhone: '' }]);
  };

  const removeButton = (id: string) => setButtons(prev => prev.filter(b => b.id !== id));

  const updateButton = (id: string, field: keyof Button, value: string) =>
    setButtons(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !body || !nameValid) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          language,
          header_type: header ? 'Text' : 'None',
          header_text: header || undefined,
          body_text: body,
          footer_text: footer || undefined,
          buttons: buttons.filter(b => b.text).map(b => ({
            type: b.type,
            text: b.text,
            urlOrPhone: b.urlOrPhone || undefined,
          })),
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/templates'), 1200);
      } else {
        const data = await res.json();
        setError(data.error || 'Submission failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', fontSize: 13.5,
    border: '1.5px solid #e5e7eb', borderRadius: 9,
    outline: 'none', fontFamily: 'inherit', color: '#111827',
    background: '#fff', transition: 'border-color 0.15s',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6,
  };

  return (
    <div style={{ padding: '0', background: '#f9fafb', minHeight: '100vh' }}>

      {/* ── Sticky Top Bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => router.push('/templates')}
            style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#374151', fontWeight: 600 }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
              Create New Template
            </h1>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
              Templates go through Meta's review process (usually 24–48h)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setShowPrev(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 9, cursor: 'pointer', color: '#374151' }}
          >
            {showPrev ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPrev ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 0, maxWidth: 1200, margin: '0 auto', padding: '28px 28px' }}>

          {/* ── LEFT: Form ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, paddingRight: showPrev ? 32 : 0 }}>

            {/* Template Name + Language */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={labelStyle}>Template Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  placeholder="order_confirmation"
                  style={{ ...inputStyle, borderColor: name && !nameValid ? '#ef4444' : '#e5e7eb', fontFamily: 'monospace' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 5 }}>
                  Lowercase, numbers, underscores only. Cannot be changed after creation.
                </p>
              </div>
              <div>
                <label style={labelStyle}>Language <span style={{ color: '#dc2626' }}>*</span></label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as Language)}
                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center #fff` }}
                >
                  {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={labelStyle}>Category <span style={{ color: '#dc2626' }}>*</span></label>
              <div style={{ display: 'flex', gap: 0, border: '1.5px solid #e5e7eb', borderRadius: 9, overflow: 'hidden' }}>
                {(['Utility', 'Marketing', 'Authentication'] as Category[]).map((cat, i) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={{
                      flex: 1, padding: '10px 6px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      background: category === cat ? '#dc2626' : '#fff',
                      color: category === cat ? '#fff' : '#6b7280',
                      border: 'none',
                      borderLeft: i > 0 ? '1px solid #e5e7eb' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >{cat}</button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 8, padding: '9px 12px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                <Info size={13} color="#0284c7" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: '#0369a1', margin: 0, lineHeight: 1.5 }}>{CATEGORY_INFO[category]}</p>
              </div>
            </div>

            {/* Header */}
            <div>
              <label style={labelStyle}>Header <span style={{ color: '#9ca3af', fontWeight: 500 }}>(optional)</span></label>
              <input
                value={header}
                onChange={e => setHeader(e.target.value)}
                placeholder="e.g. New Order Received 🎉"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.08)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Body */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ ...labelStyle, margin: 0 }}>Body <span style={{ color: '#dc2626' }}>*</span></label>
                <span style={{ fontSize: 11.5, color: '#9ca3af' }}>
                  Use <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>{'{{1}}'}</code> for customer name,{' '}
                  <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>{'{{2}}'}</code> for order ID
                </span>
              </div>
              <textarea
                required
                rows={5}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={'Hi {{1}}, your order {{2}} for {{3}} is ready for confirmation.\nWould you like to confirm or cancel?'}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, minHeight: 110 }}
                onFocus={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.08)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              {body && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 8, padding: '9px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                  <Info size={13} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 11.5, color: '#15803d', margin: 0 }}>
                    Variables:{' '}
                    {['{{1}}', '{{2}}', '{{3}}'].filter(v => body.includes(v)).map(v => (
                      <code key={v} style={{ background: '#dcfce7', padding: '1px 5px', borderRadius: 4, marginRight: 4, fontSize: 11 }}>{v}</code>
                    ))}
                    {body.includes('{{1}}') ? 'for customer name, ' : ''}{body.includes('{{2}}') ? '{{2}} for order ID, ' : ''}{body.includes('{{3}}') ? '{{3}} for order total' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div>
              <label style={labelStyle}>Footer <span style={{ color: '#9ca3af', fontWeight: 500 }}>(optional)</span></label>
              <input
                value={footer}
                onChange={e => setFooter(e.target.value)}
                placeholder="e.g. Powered by Ittisalo"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.08)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Buttons */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ ...labelStyle, margin: 0 }}>
                  Buttons <span style={{ color: '#9ca3af', fontWeight: 500 }}>(up to 3)</span>
                </label>
                {buttons.length < 3 && (
                  <button
                    type="button"
                    onClick={addButton}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, background: '#fef2f2', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', borderRadius: 8, cursor: 'pointer' }}
                  >
                    <Plus size={13} /> Add Button
                  </button>
                )}
              </div>

              {buttons.length === 0 && (
                <div style={{ padding: '16px', background: '#fafafa', border: '1.5px dashed #e5e7eb', borderRadius: 9, textAlign: 'center', color: '#9ca3af', fontSize: 12.5 }}>
                  No buttons added. Click "Add Button" to include Quick Reply or CTA buttons.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {buttons.map((btn, i) => (
                  <div key={btn.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 10, padding: '12px 14px', background: '#fafafa', border: '1.5px solid #e5e7eb', borderRadius: 9, alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Type</label>
                      <select
                        value={btn.type}
                        onChange={e => updateButton(btn.id, 'type', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', fontSize: 12.5, border: '1.5px solid #e5e7eb', borderRadius: 7, outline: 'none', background: '#fff' }}
                      >
                        <option value="QUICK_REPLY">Quick Reply</option>
                        <option value="URL">URL Link</option>
                        <option value="PHONE">Phone Number</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                        {btn.type === 'QUICK_REPLY' ? 'Button Text' : btn.type === 'URL' ? 'Button Text' : 'Button Text'}
                      </label>
                      <input
                        required={true}
                        value={btn.text}
                        onChange={e => updateButton(btn.id, 'text', e.target.value)}
                        placeholder={btn.type === 'QUICK_REPLY' ? 'e.g. Confirm Order' : btn.type === 'URL' ? 'e.g. Visit Website' : 'e.g. Call Us'}
                        style={{ width: '100%', padding: '7px 10px', fontSize: 12.5, border: '1.5px solid #e5e7eb', borderRadius: 7, outline: 'none', fontFamily: 'inherit' }}
                      />
                      {btn.type !== 'QUICK_REPLY' && (
                        <input
                          required={true}
                          value={btn.urlOrPhone}
                          onChange={e => updateButton(btn.id, 'urlOrPhone', e.target.value)}
                          placeholder={btn.type === 'URL' ? 'https://example.com' : '+1234567890'}
                          style={{ width: '100%', padding: '7px 10px', fontSize: 12.5, border: '1.5px solid #e5e7eb', borderRadius: 7, outline: 'none', fontFamily: 'inherit', marginTop: 6 }}
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeButton(btn.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#9ca3af', borderRadius: 6, alignSelf: 'flex-start' }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: '11px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, fontSize: 13, color: '#dc2626', fontWeight: 500 }}>
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
              <button
                type="button"
                onClick={() => router.push('/templates')}
                style={{ padding: '11px 24px', fontSize: 14, fontWeight: 600, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', color: '#374151' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || success || !name || !body || !nameValid}
                style={{
                  padding: '11px 28px', fontSize: 14, fontWeight: 700,
                  background: success ? '#10b981' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: '#fff', border: 'none', borderRadius: 10, cursor: submitting ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 14px rgba(220,38,38,0.25)',
                  opacity: (!name || !body || !nameValid) ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {success ? <><Check size={15} /> Submitted!</> : submitting ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting…</> : <><Sparkles size={15} /> Submit for Approval</>}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Live Preview ── */}
          {showPrev && (
            <div style={{ width: 300, flexShrink: 0 }}>
              <div style={{ position: 'sticky', top: 88 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  WhatsApp Preview
                </p>
                <WhatsAppPreview header={header} body={body} footer={footer} buttons={buttons} />
                <div style={{ marginTop: 12, padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
                  <p style={{ fontSize: 11.5, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                    <strong>Preview uses sample data:</strong> John for {'{{1}}'}, #ORD-2891 for {'{{2}}'}, $149 for {'{{3}}'}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus, textarea:focus, select:focus {
          border-color: #dc2626 !important;
          box-shadow: 0 0 0 3px rgba(220,38,38,0.08) !important;
        }
      `}</style>
    </div>
  );
}
