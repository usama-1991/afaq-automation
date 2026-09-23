'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Sparkles, Info, Plus, X, Eye, EyeOff, Loader2, Check, 
  AlertCircle, Link as LinkIcon, Phone, MessageSquare, Image, Video, FileText, Type
} from 'lucide-react';

type Category = 'Utility' | 'Marketing' | 'Authentication';
type Language = 'en_US' | 'en_GB' | 'ar' | 'ur' | 'es' | 'fr' | 'de' | 'hi';
type HeaderType = 'None' | 'Text' | 'Image' | 'Video' | 'Document';

interface ButtonConfig {
  id: string;
  type: 'QUICK_REPLY' | 'URL' | 'PHONE';
  text: string;
  urlOrPhone: string;
  urlSample?: string;
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
  headerType,
  headerText,
  headerSample,
  bodyText,
  bodySamples,
  footerText,
  buttons,
}: {
  headerType: HeaderType;
  headerText: string;
  headerSample: string;
  bodyText: string;
  bodySamples: Record<number, string>;
  footerText: string;
  buttons: ButtonConfig[];
}) {
  // Dynamically replace body variables with user-provided samples
  const renderBody = (text: string) => {
    if (!text) return 'Body text will appear here';
    return text.replace(/\{\{(\d+)\}\}/g, (match, numStr) => {
      const num = parseInt(numStr, 10);
      const sample = bodySamples[num];
      return sample && sample.trim().length > 0 ? sample : match;
    });
  };

  const renderHeader = (text: string) => {
    if (!text) return '';
    return text.replace(/\{\{1\}\}/g, headerSample && headerSample.trim().length > 0 ? headerSample : '{{1}}');
  };

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
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        opacity: 0.04, 
        backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', 
        backgroundSize: '8px 8px', 
        borderRadius: 16 
      }} />

      {/* Bubble */}
      <div style={{
        background: '#fff',
        borderRadius: '2px 12px 12px 12px',
        padding: '10px 12px',
        maxWidth: '92%',
        boxShadow: '0 1px 2px rgba(0,0,0,0.13)',
        position: 'relative', 
        zIndex: 1,
      }}>
        {/* Media Header Preview */}
        {headerType === 'Image' && (
          <div style={{
            width: '100%',
            height: 120,
            background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
            borderRadius: 8,
            marginBottom: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            fontSize: 12,
            gap: 4
          }}>
            <Image size={24} color="#9ca3af" />
            <span style={{ fontWeight: 600 }}>Image Header</span>
          </div>
        )}

        {headerType === 'Video' && (
          <div style={{
            width: '100%',
            height: 120,
            background: 'linear-gradient(135deg, #1f2937, #111827)',
            borderRadius: 8,
            marginBottom: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 12,
            gap: 4
          }}>
            <Video size={24} color="#dc2626" />
            <span style={{ fontWeight: 600 }}>Video Header</span>
          </div>
        )}

        {headerType === 'Document' && (
          <div style={{
            width: '100%',
            padding: '12px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#374151',
            fontSize: 12,
          }}>
            <FileText size={20} color="#dc2626" />
            <span style={{ fontWeight: 600 }}>Attached Document (.PDF)</span>
          </div>
        )}

        {/* Text Header */}
        {headerType === 'Text' && headerText && (
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 6px 0' }}>
            {renderHeader(headerText)}
          </p>
        )}

        {/* Body Text */}
        <p style={{ 
          fontSize: 12.5, 
          color: bodyText ? '#2b2b2b' : '#aaa', 
          margin: 0, 
          lineHeight: 1.5, 
          whiteSpace: 'pre-wrap', 
          fontStyle: bodyText ? 'normal' : 'italic' 
        }}>
          {renderBody(bodyText)}
        </p>

        {/* Footer */}
        {footerText && (
          <p style={{ fontSize: 10.5, color: '#8b8b8b', margin: '6px 0 0 0' }}>
            {footerText}
          </p>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}>
              {btn.type === 'PHONE' && <Phone size={13} />}
              {btn.type === 'URL' && <LinkIcon size={13} />}
              {btn.type === 'QUICK_REPLY' && <MessageSquare size={13} />}
              {btn.text || (btn.type === 'QUICK_REPLY' ? 'Quick Reply' : btn.type === 'URL' ? 'Visit Website' : 'Call Number')}
            </div>
          ))}
        </div>
      )}

      {!bodyText && headerType === 'None' && buttons.length === 0 && (
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

  // Basic Details
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<Language>('en_US');
  const [category, setCategory] = useState<Category>('Utility');

  // Header State
  const [headerType, setHeaderType] = useState<HeaderType>('None');
  const [headerText, setHeaderText] = useState('');
  const [headerSample, setHeaderSample] = useState('');
  const [headerLabel, setHeaderLabel] = useState('');

  // Body State
  const [bodyText, setBodyText] = useState('');
  const [bodySamples, setBodySamples] = useState<Record<number, string>>({});
  const [bodyLabels, setBodyLabels] = useState<Record<number, string>>({});

  // Footer & Buttons
  const [footerText, setFooterText] = useState('');
  const [buttons, setButtons] = useState<ButtonConfig[]>([]);

  // UI State
  const [showPrev, setShowPrev] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  // Name validation: lowercase, numbers, underscores only
  const nameValid = /^[a-z0-9_]*$/.test(name) && name.length > 0;

  // ── Variable Detection & Sequential Validation ──────────────
  const { 
    detectedBodyVars, 
    bodyVarError,
    detectedHeaderVars,
    headerVarError 
  } = useMemo(() => {
    // 1. Parse Body Variables
    const bodyMatches = bodyText.match(/\{\{\d+\}\}/g) || [];
    const bodyNums = bodyMatches.map(m => parseInt(m.replace(/\D/g, ''), 10));
    const uniqueBodyNums = Array.from(new Set(bodyNums)).sort((a, b) => a - b);

    let bError = '';
    if (uniqueBodyNums.length > 0) {
      if (uniqueBodyNums[0] !== 1) {
        bError = `Variables must start at {{1}}. Found {{${uniqueBodyNums[0]}}}.`;
      } else {
        for (let i = 0; i < uniqueBodyNums.length; i++) {
          if (uniqueBodyNums[i] !== i + 1) {
            bError = `Variables must be sequential with no gaps. Missing {{${i + 1}}} before {{${uniqueBodyNums[i]}}}.`;
            break;
          }
        }
      }
    }

    // 2. Parse Header Variables
    const headerMatches = headerText.match(/\{\{\d+\}\}/g) || [];
    let hError = '';
    if (headerType === 'Text') {
      if (headerMatches.length > 1) {
        hError = 'Meta allows at most 1 variable in the Header (use {{1}}).';
      } else if (headerMatches.length === 1 && headerMatches[0] !== '{{1}}') {
        hError = 'Header variable must be {{1}}.';
      }
    }

    return {
      detectedBodyVars: uniqueBodyNums,
      bodyVarError: bError,
      detectedHeaderVars: headerType === 'Text' && headerMatches.length === 1 ? [1] : [],
      headerVarError: hError
    };
  }, [bodyText, headerText, headerType]);

  // Handle dynamic sample change
  const handleBodySampleChange = (varNum: number, value: string) => {
    setBodySamples(prev => ({ ...prev, [varNum]: value }));
  };

  // Handle dynamic label change
  const handleBodyLabelChange = (varNum: number, value: string) => {
    setBodyLabels(prev => ({ ...prev, [varNum]: value }));
  };

  // ── Buttons Management ─────────────────────────────────────
  const phoneButtonCount = buttons.filter(b => b.type === 'PHONE').length;

  const addButton = (type: 'QUICK_REPLY' | 'URL' | 'PHONE') => {
    if (buttons.length >= 3) return;
    if (type === 'PHONE' && phoneButtonCount >= 1) return;
    setButtons(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        text: '',
        urlOrPhone: '',
        urlSample: ''
      }
    ]);
  };

  const removeButton = (id: string) => setButtons(prev => prev.filter(b => b.id !== id));

  const updateButton = (id: string, field: keyof ButtonConfig, value: string) => {
    setButtons(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  // ── Validation Check for Submit ────────────────────────────
  const areBodySamplesComplete = detectedBodyVars.every(
    num => bodySamples[num] && bodySamples[num].trim().length > 0
  );

  const isHeaderSampleComplete = 
    detectedHeaderVars.length === 0 || 
    (headerSample && headerSample.trim().length > 0);

  const areButtonsValid = buttons.every(b => {
    if (!b.text.trim()) return false;
    if (b.type === 'URL') {
      const validUrl = b.urlOrPhone.startsWith('http://') || b.urlOrPhone.startsWith('https://');
      if (!validUrl) return false;
      if (b.urlOrPhone.includes('{{1}}') && (!b.urlSample || !b.urlSample.trim())) return false;
    }
    if (b.type === 'PHONE' && !b.urlOrPhone.trim()) return false;
    return true;
  });

  const isFormValid = 
    nameValid && 
    bodyText.trim().length > 0 && 
    !bodyVarError && 
    !headerVarError && 
    areBodySamplesComplete && 
    isHeaderSampleComplete && 
    areButtonsValid;

  // ── Submit Handler ──────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    setServerError('');

    try {
      // Build arrays matching variable indices
      const bodySamplesArray = detectedBodyVars.map(num => bodySamples[num] || '');
      const bodyLabelsArray = detectedBodyVars.map(num => bodyLabels[num] || '');

      const variableLabelsObj: Record<string, string> = {};
      const sampleValuesObj: Record<string, string> = {};

      if (detectedHeaderVars.length > 0) {
        if (headerLabel) variableLabelsObj['header_1'] = headerLabel.trim();
        if (headerSample) sampleValuesObj['header_1'] = headerSample.trim();
      }

      detectedBodyVars.forEach((num, i) => {
        if (bodyLabels[num]) variableLabelsObj[`body_${num}`] = bodyLabels[num].trim();
        if (bodySamples[num]) sampleValuesObj[`body_${num}`] = bodySamples[num].trim();
      });

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          language,
          header_type: headerType,
          header_text: headerType === 'Text' ? headerText.trim() : undefined,
          header_sample: headerType === 'Text' && detectedHeaderVars.length > 0 ? headerSample.trim() : undefined,
          header_label: headerType === 'Text' && detectedHeaderVars.length > 0 ? headerLabel.trim() : undefined,
          body_text: bodyText.trim(),
          body_samples: bodySamplesArray,
          body_labels: bodyLabelsArray,
          footer_text: footerText.trim() || undefined,
          buttons: buttons.map(b => ({
            type: b.type,
            text: b.text.trim(),
            urlOrPhone: b.urlOrPhone.trim(),
            url: b.type === 'URL' ? b.urlOrPhone.trim() : undefined,
            phone_number: b.type === 'PHONE' ? b.urlOrPhone.trim() : undefined,
            url_sample: b.type === 'URL' && b.urlOrPhone.includes('{{1}}') ? b.urlSample?.trim() : undefined
          })),
          variable_labels: variableLabelsObj,
          sample_values: sampleValuesObj
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/templates'), 1200);
      } else {
        const data = await res.json();
        setServerError(data.error || 'Submission failed. Please verify your fields.');
      }
    } catch {
      setServerError('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', 
    padding: '10px 13px', 
    fontSize: 13.5,
    border: '1.5px solid #e5e7eb', 
    borderRadius: 9,
    outline: 'none', 
    fontFamily: 'inherit', 
    color: '#111827',
    background: '#fff', 
    transition: 'all 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13, 
    fontWeight: 700, 
    color: '#374151', 
    display: 'block', 
    marginBottom: 6,
  };

  return (
    <div style={{ padding: '0', background: '#f9fafb', minHeight: '100vh' }}>

      {/* ── Sticky Top Bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '12px clamp(14px, 3vw, 28px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => router.push('/templates')}
            style={{ 
              background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, 
              padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', 
              gap: 5, fontSize: 13, color: '#374151', fontWeight: 600, minHeight: 38 
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: 'clamp(15px, 3vw, 17px)', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
              Create Dynamic Template
            </h1>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
              Build and submit Meta-compliant message templates for any niche
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setShowPrev(p => !p)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', 
              fontSize: 13, fontWeight: 600, background: '#f3f4f6', border: '1px solid #e5e7eb', 
              borderRadius: 9, cursor: 'pointer', color: '#374151', minHeight: 38 
            }}
          >
            {showPrev ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPrev ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
      </div>

      {/* ── Main Form Layout ── */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, maxWidth: 1200, margin: '0 auto', padding: 'clamp(14px, 3vw, 28px)' }}>

          {/* ── LEFT: Form ── */}
          <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* Template Name + Language */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <label style={labelStyle}>Template Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  placeholder="appointment_reminder"
                  style={{ 
                    ...inputStyle, 
                    borderColor: name && !nameValid ? '#ef4444' : '#e5e7eb', 
                    fontFamily: 'monospace' 
                  }}
                />
                <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 5 }}>
                  Lowercase, numbers, underscores only.
                </p>
              </div>

              <div>
                <label style={labelStyle}>Language <span style={{ color: '#dc2626' }}>*</span></label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as Language)}
                  style={{ 
                    ...inputStyle, 
                    appearance: 'none', 
                    cursor: 'pointer', 
                    background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center #fff` 
                  }}
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

            {/* Header Section */}
            <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '16px 18px' }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>Header (Optional)</label>
              
              {/* Header Type Selector */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {(['None', 'Text', 'Image', 'Video', 'Document'] as HeaderType[]).map(type => {
                  const active = headerType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setHeaderType(type)}
                      style={{
                        padding: '7px 14px',
                        fontSize: 12.5,
                        fontWeight: 650,
                        borderRadius: 8,
                        background: active ? '#fef2f2' : '#f9fafb',
                        color: active ? '#dc2626' : '#4b5563',
                        border: active ? '1.5px solid #dc2626' : '1.5px solid #e5e7eb',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      {type === 'None' && <span>None</span>}
                      {type === 'Text' && <><Type size={13} /> Text</>}
                      {type === 'Image' && <><Image size={13} /> Image</>}
                      {type === 'Video' && <><Video size={13} /> Video</>}
                      {type === 'Document' && <><FileText size={13} /> Document</>}
                    </button>
                  );
                })}
              </div>

              {/* Text Header Inputs */}
              {headerType === 'Text' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <input
                      value={headerText}
                      onChange={e => setHeaderText(e.target.value)}
                      placeholder="e.g. Appointment Reminder for {{1}}"
                      style={inputStyle}
                    />
                    <p style={{ fontSize: 11.5, color: '#6b7280', marginTop: 4 }}>
                      Text headers allow up to 60 characters and at most one dynamic variable <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 4 }}>{'{{1}}'}</code>.
                    </p>
                  </div>

                  {headerVarError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 12, color: '#dc2626' }}>
                      <AlertCircle size={14} /> {headerVarError}
                    </div>
                  )}

                  {detectedHeaderVars.length > 0 && !headerVarError && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '10px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
                          Sample value for Header {'{{1}}'} <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                          required
                          value={headerSample}
                          onChange={e => setHeaderSample(e.target.value)}
                          placeholder="e.g. SmileCare Dental"
                          style={{ ...inputStyle, padding: '7px 10px', fontSize: 12.5 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: 4 }}>
                          Variable label (optional)
                        </label>
                        <input
                          value={headerLabel}
                          onChange={e => setHeaderLabel(e.target.value)}
                          placeholder="e.g. business_name"
                          style={{ ...inputStyle, padding: '7px 10px', fontSize: 12.5 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {['Image', 'Video', 'Document'].includes(headerType) && (
                <div style={{ padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, color: '#15803d' }}>
                  Meta requires a media handle for {headerType.toLowerCase()} headers. A standard placeholder will be submitted and you can attach your live media during campaign broadcast.
                </div>
              )}
            </div>

            {/* Body Section */}
            <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ ...labelStyle, margin: 0 }}>
                  Body Text <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <span style={{ fontSize: 11.5, color: '#6b7280' }}>
                  Use <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>{'{{1}}'}</code>, <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>{'{{2}}'}</code> for dynamic values
                </span>
              </div>

              <textarea
                required
                rows={5}
                value={bodyText}
                onChange={e => setBodyText(e.target.value)}
                placeholder={'Hi {{1}}, your booking for {{2}} at {{3}} is confirmed!\nLet us know if you need to reschedule.'}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, minHeight: 110 }}
              />

              {/* Sequential Variable Validation Alert */}
              {bodyVarError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '9px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12.5, color: '#dc2626', fontWeight: 600 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  {bodyVarError}
                </div>
              )}

              {/* Dynamic Variable Rows */}
              {detectedBodyVars.length > 0 && !bodyVarError && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 750, color: '#374151', margin: '0 0 2px 0' }}>
                    Dynamic Variables Detected ({detectedBodyVars.length})
                  </p>
                  
                  {detectedBodyVars.map(varNum => (
                    <div 
                      key={varNum} 
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: 10, 
                        padding: '12px 14px', 
                        background: '#f9fafb', 
                        border: '1.5px solid #e5e7eb', 
                        borderRadius: 9,
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
                            {`{{${varNum}}}`}
                          </span>
                          Sample Value <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                          required
                          value={bodySamples[varNum] || ''}
                          onChange={e => handleBodySampleChange(varNum, e.target.value)}
                          placeholder={varNum === 1 ? 'e.g. Usama' : varNum === 2 ? 'e.g. Dental Checkup' : 'e.g. 10:30 AM'}
                          style={{ ...inputStyle, padding: '8px 10px', fontSize: 12.5 }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 4 }}>
                          Variable Label <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional mapping)</span>
                        </label>
                        <input
                          value={bodyLabels[varNum] || ''}
                          onChange={e => handleBodyLabelChange(varNum, e.target.value)}
                          placeholder={varNum === 1 ? 'e.g. customer_name' : varNum === 2 ? 'e.g. service_name' : 'e.g. appointment_time'}
                          style={{ ...inputStyle, padding: '8px 10px', fontSize: 12.5 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div>
              <label style={labelStyle}>Footer <span style={{ color: '#9ca3af', fontWeight: 500 }}>(optional)</span></label>
              <input
                value={footerText}
                onChange={e => setFooterText(e.target.value)}
                placeholder="e.g. Reply STOP to opt out"
                style={inputStyle}
              />
            </div>

            {/* Buttons Section */}
            <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <label style={{ ...labelStyle, margin: 0 }}>
                    Buttons <span style={{ color: '#9ca3af', fontWeight: 500 }}>(up to 3)</span>
                  </label>
                  <p style={{ fontSize: 11.5, color: '#9ca3af', margin: 0 }}>
                    Add quick replies or call to action links
                  </p>
                </div>

                {buttons.length < 3 && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => addButton('QUICK_REPLY')}
                      style={{ padding: '6px 10px', fontSize: 12, fontWeight: 600, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 7, cursor: 'pointer', color: '#374151' }}
                    >
                      + Quick Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => addButton('URL')}
                      style={{ padding: '6px 10px', fontSize: 12, fontWeight: 600, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 7, cursor: 'pointer', color: '#374151' }}
                    >
                      + URL
                    </button>
                    {phoneButtonCount === 0 && (
                      <button
                        type="button"
                        onClick={() => addButton('PHONE')}
                        style={{ padding: '6px 10px', fontSize: 12, fontWeight: 600, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 7, cursor: 'pointer', color: '#374151' }}
                      >
                        + Phone
                      </button>
                    )}
                  </div>
                )}
              </div>

              {buttons.length === 0 && (
                <div style={{ padding: '16px', background: '#fafafa', border: '1.5px dashed #e5e7eb', borderRadius: 9, textAlign: 'center', color: '#9ca3af', fontSize: 12.5 }}>
                  No buttons added. Click a button type above to add up to 3 buttons.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {buttons.map((btn) => (
                  <div 
                    key={btn.id} 
                    style={{ 
                      padding: '12px 14px', 
                      background: '#fafafa', 
                      border: '1.5px solid #e5e7eb', 
                      borderRadius: 9, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 10 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {btn.type === 'QUICK_REPLY' && <><MessageSquare size={13} color="#dc2626" /> Quick Reply</>}
                        {btn.type === 'URL' && <><LinkIcon size={13} color="#2563eb" /> Call to Action (URL)</>}
                        {btn.type === 'PHONE' && <><Phone size={13} color="#16a34a" /> Call to Action (Phone Number)</>}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeButton(btn.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9ca3af' }}
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: btn.type === 'QUICK_REPLY' ? '1fr' : '1fr 1.5fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Button Text (max 25 chars)</label>
                        <input
                          required
                          maxLength={25}
                          value={btn.text}
                          onChange={e => updateButton(btn.id, 'text', e.target.value)}
                          placeholder={btn.type === 'QUICK_REPLY' ? 'e.g. Confirm Booking' : btn.type === 'URL' ? 'e.g. View Order' : 'e.g. Call Support'}
                          style={{ ...inputStyle, padding: '7px 10px', fontSize: 12.5 }}
                        />
                      </div>

                      {btn.type === 'URL' && (
                        <div>
                          <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                            Website URL (supports trailing {'{{1}}'})
                          </label>
                          <input
                            required
                            value={btn.urlOrPhone}
                            onChange={e => updateButton(btn.id, 'urlOrPhone', e.target.value)}
                            placeholder="https://ittisalo.com/order/{{1}}"
                            style={{ ...inputStyle, padding: '7px 10px', fontSize: 12.5 }}
                          />
                        </div>
                      )}

                      {btn.type === 'PHONE' && (
                        <div>
                          <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Phone Number with Country Code</label>
                          <input
                            required
                            value={btn.urlOrPhone}
                            onChange={e => updateButton(btn.id, 'urlOrPhone', e.target.value)}
                            placeholder="+923242059198"
                            style={{ ...inputStyle, padding: '7px 10px', fontSize: 12.5 }}
                          />
                        </div>
                      )}
                    </div>

                    {/* URL Dynamic Segment Sample Input */}
                    {btn.type === 'URL' && btn.urlOrPhone.includes('{{1}}') && (
                      <div style={{ padding: '8px 10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 7 }}>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>
                          Sample value for URL dynamic segment {'{{1}}'} <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                          required
                          value={btn.urlSample || ''}
                          onChange={e => updateButton(btn.id, 'urlSample', e.target.value)}
                          placeholder="e.g. order-10492"
                          style={{ ...inputStyle, padding: '6px 9px', fontSize: 12 }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Error Banner */}
            {serverError && (
              <div style={{ padding: '11px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, fontSize: 13, color: '#dc2626', fontWeight: 500 }}>
                {serverError}
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
                disabled={submitting || success || !isFormValid}
                style={{
                  padding: '11px 28px', 
                  fontSize: 14, 
                  fontWeight: 700,
                  background: success ? '#10b981' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 10, 
                  cursor: submitting ? 'wait' : !isFormValid ? 'not-allowed' : 'pointer',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(220,38,38,0.25)',
                  opacity: !isFormValid ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {success ? (
                  <><Check size={15} /> Submitted!</>
                ) : submitting ? (
                  <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting to Meta…</>
                ) : (
                  <><Sparkles size={15} /> Submit for Approval</>
                )}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Live WhatsApp Preview ── */}
          {showPrev && (
            <div style={{ width: 'min(330px, 100%)', flex: '1 1 290px' }}>
              <div style={{ position: 'sticky', top: 88 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Live WhatsApp Preview
                </p>

                <WhatsAppPreview
                  headerType={headerType}
                  headerText={headerText}
                  headerSample={headerSample}
                  bodyText={bodyText}
                  bodySamples={bodySamples}
                  footerText={footerText}
                  buttons={buttons}
                />

                <div style={{ marginTop: 12, padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
                  <p style={{ fontSize: 11.5, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                    <strong>Dynamic Preview:</strong> Variables update in real-time as you fill sample values.
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
