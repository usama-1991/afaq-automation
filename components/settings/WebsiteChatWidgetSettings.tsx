'use client';

import { useState, useEffect } from 'react';
import { 
  Globe, Check, Copy, ExternalLink, Sparkles, MessageSquare, 
  Smartphone, Shield, Palette, Layout, Sliders, RefreshCw,
  Send, X, CheckCircle2, AlertCircle, Info, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const COLOR_PRESETS = [
  { name: 'Ittisalo Red', hex: '#dc2626' },
  { name: 'Royal Blue',   hex: '#2563eb' },
  { name: 'Emerald',      hex: '#059669' },
  { name: 'Violet',       hex: '#7c3aed' },
  { name: 'Midnight',     hex: '#0f172a' },
  { name: 'Sunset Amber', hex: '#ea580c' },
  { name: 'Teal',         hex: '#0d9488' },
  { name: 'Hot Pink',     hex: '#db2777' },
];

export function WebsiteChatWidgetSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Tenant identifiers
  const [tenantId, setTenantId] = useState<string>('');
  const [rawTenantPhone, setRawTenantPhone] = useState<string>('');
  const [rawTenantIg, setRawTenantIg] = useState<string>('');

  // Widget Configuration State
  const [enabled, setEnabled] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#dc2626');
  const [businessName, setBusinessName] = useState('Ittisalo Support');
  const [headerTitle, setHeaderTitle] = useState('Chat with us');
  const [subheading, setSubheading] = useState('Typically replies in minutes');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi there! How can we help you today?');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [showWhatsappButton, setShowWhatsappButton] = useState(true);
  const [showInstagramButton, setShowInstagramButton] = useState(true);
  const [requireLeadForm, setRequireLeadForm] = useState(true);
  const [allowedDomains, setAllowedDomains] = useState('');

  // Preview interactive state
  const [previewMode, setPreviewMode] = useState<'chat' | 'lead' | 'launcher'>('chat');

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', user.id)
          .single();

        if (!profile?.tenant_id) return;
        setTenantId(profile.tenant_id);

        const { data: tenant } = await supabase
          .from('tenants')
          .select('id, business_name, business_phone, ig_page_id, logo_url, widget_settings')
          .eq('id', profile.tenant_id)
          .single();

        if (tenant) {
          if (tenant.business_name) setBusinessName(tenant.business_name);
          if (tenant.business_phone) setRawTenantPhone(tenant.business_phone);
          if (tenant.ig_page_id) setRawTenantIg(tenant.ig_page_id);
          if (tenant.logo_url && !avatarUrl) setAvatarUrl(tenant.logo_url);

          const ws = tenant.widget_settings || {};
          if (ws.enabled !== undefined) setEnabled(ws.enabled);
          if (ws.primary_color) setPrimaryColor(ws.primary_color);
          if (ws.header_title) setHeaderTitle(ws.header_title);
          if (ws.subheading) setSubheading(ws.subheading);
          if (ws.welcome_message) setWelcomeMessage(ws.welcome_message);
          if (ws.avatar_url) setAvatarUrl(ws.avatar_url);
          if (ws.position) setPosition(ws.position);
          if (ws.show_whatsapp_button !== undefined) setShowWhatsappButton(ws.show_whatsapp_button);
          if (ws.show_instagram_button !== undefined) setShowInstagramButton(ws.show_instagram_button);
          if (ws.require_lead_form !== undefined) setRequireLeadForm(ws.require_lead_form);
          if (ws.allowed_domains) {
            setAllowedDomains(Array.isArray(ws.allowed_domains) ? ws.allowed_domains.join(', ') : ws.allowed_domains);
          }
        }
      } catch (err: any) {
        console.error('Error loading widget settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const parsedDomains = allowedDomains
        .split(',')
        .map(d => d.trim().toLowerCase())
        .filter(Boolean);

      const payload = {
        enabled,
        primary_color: primaryColor,
        business_name: businessName,
        header_title: headerTitle,
        subheading,
        welcome_message: welcomeMessage,
        avatar_url: avatarUrl,
        position,
        show_whatsapp_button: showWhatsappButton,
        show_instagram_button: showInstagramButton,
        require_lead_form: requireLeadForm,
        allowed_domains: parsedDomains,
        lead_fields: ['name', 'phone'],
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('tenants')
        .update({ widget_settings: payload })
        .eq('id', tenantId);

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMessage(err.message || 'Failed to save widget settings');
    } finally {
      setSaving(false);
    }
  };

  const scriptTagCode = `<!-- Ittisalo Omnichannel Live Chat Widget -->
<script 
  src="https://ittisalo.com/widget.js" 
  data-tenant-id="${tenantId || 'YOUR_TENANT_ID'}" 
  data-position="${position}" 
  defer>
</script>
<!-- End Ittisalo Chat Widget -->`;

  const copyScript = () => {
    navigator.clipboard.writeText(scriptTagCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
        <p style={{ fontSize: 13 }}>Loading Ittisalo Widget configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      {/* Overview Banner */}
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: '24px',
        border: '1px solid rgba(220,38,38,0.1)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ maxWidth: 580 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              background: '#fee2e2', color: '#dc2626', padding: '4px 10px',
              borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.3px'
            }}>
              LIVE WEB CHAT
            </span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Powered by ittisalo.com</span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>
            Website Live Chat Widget
          </h2>
          <p style={{ fontSize: 13, color: '#4b5563', marginTop: 4, lineHeight: 1.5 }}>
            Embed our lightweight live chat bubble on your website, Shopify store, or landing page. Capture leads and connect visitors with your AI agent or human staff in real-time.
          </p>
        </div>

        {/* Global Widget Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f9fafb', padding: '10px 18px', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>Widget Active</div>
            <div style={{ fontSize: 11, color: enabled ? '#16a34a' : '#9ca3af' }}>
              {enabled ? 'Visible on storefront' : 'Disabled'}
            </div>
          </div>
          <div 
            onClick={() => setEnabled(!enabled)}
            style={{
              width: 46, height: 26, background: enabled ? primaryColor : '#d1d5db',
              borderRadius: 13, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: enabled ? 23 : 3,
              width: 20, height: 20, background: '#fff', borderRadius: '50%',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
          </div>
        </div>
      </div>

      {/* Embed Code Snippet Card */}
      <div style={{
        background: '#0f172a',
        borderRadius: 14,
        padding: '20px 24px',
        color: '#f8fafc',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2px' }}>Your Embed Code Snippet</span>
          </div>
          <button
            onClick={copyScript}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: copied ? '#16a34a' : 'rgba(255,255,255,0.12)',
              color: '#ffffff', border: 'none', borderRadius: 8,
              padding: '6px 14px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            {copied ? <><Check size={14} /> Copied to Clipboard!</> : <><Copy size={14} /> Copy Script Tag</>}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, lineHeight: 1.4 }}>
          Paste this script inside the <code style={{ color: '#f87171' }}>&lt;head&gt;</code> or right before the closing <code style={{ color: '#f87171' }}>&lt;/body&gt;</code> tag on your website or Shopify <code style={{ color: '#94a3b8' }}>theme.liquid</code> file:
        </p>
        <pre style={{
          background: 'rgba(0,0,0,0.45)',
          padding: '14px 16px',
          borderRadius: 8,
          fontSize: 12,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          overflowX: 'auto',
          color: '#38bdf8',
          lineHeight: 1.5,
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {scriptTagCode}
        </pre>
      </div>

      {/* Main Split: Form Controls (Left) vs Interactive Live Preview (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 420px)',
        gap: 24,
        alignItems: 'start'
      }}>
        {/* ── Left Column: Configuration Controls ── */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '24px',
          border: '1px solid rgba(220,38,38,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}>
          {/* Section: Brand & Color */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Palette size={16} color={primaryColor} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Branding & Palette</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                Primary Theme Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <input 
                  type="color" 
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  style={{ width: 44, height: 38, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 0 }}
                />
                <input 
                  type="text"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  style={{
                    width: 120, padding: '8px 12px', fontSize: 13,
                    border: '1.5px solid #e5e7eb', borderRadius: 8, outline: 'none'
                  }}
                />
              </div>

              {/* Color swatches */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLOR_PRESETS.map(p => (
                  <button
                    key={p.hex}
                    type="button"
                    title={p.name}
                    onClick={() => setPrimaryColor(p.hex)}
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: p.hex, border: primaryColor === p.hex ? '2px solid #000' : '2px solid #ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)', cursor: 'pointer',
                      transform: primaryColor === p.hex ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.15s'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Position */}
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                Screen Placement
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setPosition('bottom-right')}
                  style={{
                    padding: '9px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                    border: position === 'bottom-right' ? `2px solid ${primaryColor}` : '1.5px solid #e5e7eb',
                    background: position === 'bottom-right' ? '#fef2f2' : '#ffffff',
                    color: position === 'bottom-right' ? primaryColor : '#4b5563',
                    cursor: 'pointer'
                  }}
                >
                  Bottom Right (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setPosition('bottom-left')}
                  style={{
                    padding: '9px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                    border: position === 'bottom-left' ? `2px solid ${primaryColor}` : '1.5px solid #e5e7eb',
                    background: position === 'bottom-left' ? '#fef2f2' : '#ffffff',
                    color: position === 'bottom-left' ? primaryColor : '#4b5563',
                    cursor: 'pointer'
                  }}
                >
                  Bottom Left
                </button>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f1f3f5' }} />

          {/* Section: Text & Messaging */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <MessageSquare size={16} color={primaryColor} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Header & Messaging</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Business Display Title
                </label>
                <input 
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Ittisalo Support"
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e5e7eb', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Header Subheading / Status
                </label>
                <input 
                  type="text"
                  value={subheading}
                  onChange={e => setSubheading(e.target.value)}
                  placeholder="e.g. Typically replies in minutes"
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e5e7eb', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Welcome Greeting Message
                </label>
                <textarea 
                  rows={2}
                  value={welcomeMessage}
                  onChange={e => setWelcomeMessage(e.target.value)}
                  placeholder="Hi there! How can we help you today?"
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e5e7eb', borderRadius: 8, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Avatar Image URL (Optional)
                </label>
                <input 
                  type="url"
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e5e7eb', borderRadius: 8, outline: 'none' }}
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f1f3f5' }} />

          {/* Section: Omnichannel & Lead Capture */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Smartphone size={16} color={primaryColor} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Omnichannel Channels & Lead Capture</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* WhatsApp button toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Show WhatsApp Quick Link</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    Allows visitors to continue chat directly on WhatsApp {rawTenantPhone ? `(${rawTenantPhone})` : ''}
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={showWhatsappButton} 
                  onChange={e => setShowWhatsappButton(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: primaryColor, cursor: 'pointer' }}
                />
              </div>

              {/* Instagram button toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Show Instagram Quick Link</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    Provides direct link to message on Instagram
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={showInstagramButton} 
                  onChange={e => setShowInstagramButton(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: primaryColor, cursor: 'pointer' }}
                />
              </div>

              {/* Require Lead form */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Require Pre-Chat Lead Form</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    Asks for visitor name & phone before opening live chat
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={requireLeadForm} 
                  onChange={e => setRequireLeadForm(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: primaryColor, cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f1f3f5' }} />

          {/* Section: Security & Whitelist */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Shield size={16} color={primaryColor} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Allowed Storefront Domains (CORS)</div>
            </div>
            <p style={{ fontSize: 11.5, color: '#6b7280', marginBottom: 8 }}>
              Comma-separated list of domains allowed to load your widget. Leave blank to allow any domain.
            </p>
            <input 
              type="text"
              value={allowedDomains}
              onChange={e => setAllowedDomains(e.target.value)}
              placeholder="e.g. mybrand.pk, store.example.com"
              style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e5e7eb', borderRadius: 8, outline: 'none' }}
            />
          </div>

          {/* Save Button */}
          <div style={{ marginTop: 10 }}>
            {saveSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                <CheckCircle2 size={16} /> Settings saved successfully!
              </div>
            )}
            {errorMessage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                <AlertCircle size={16} /> {errorMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: primaryColor,
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {saving ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
              {saving ? 'Saving Changes...' : 'Save Widget Settings'}
            </button>
          </div>
        </div>

        {/* ── Right Column: Interactive Live Preview ── */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '20px',
          border: '1px solid rgba(220,38,38,0.08)',
          position: 'sticky',
          top: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Live Widget Preview</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Changes update in real-time</div>
            </div>

            {/* Mode selector */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 2 }}>
              <button
                type="button"
                onClick={() => setPreviewMode('chat')}
                style={{
                  padding: '4px 10px', fontSize: 11.5, fontWeight: 600, border: 'none', borderRadius: 6,
                  background: previewMode === 'chat' ? '#fff' : 'transparent',
                  color: previewMode === 'chat' ? '#0f172a' : '#64748b',
                  boxShadow: previewMode === 'chat' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer'
                }}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('lead')}
                style={{
                  padding: '4px 10px', fontSize: 11.5, fontWeight: 600, border: 'none', borderRadius: 6,
                  background: previewMode === 'lead' ? '#fff' : 'transparent',
                  color: previewMode === 'lead' ? '#0f172a' : '#64748b',
                  boxShadow: previewMode === 'lead' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer'
                }}
              >
                Lead Form
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('launcher')}
                style={{
                  padding: '4px 10px', fontSize: 11.5, fontWeight: 600, border: 'none', borderRadius: 6,
                  background: previewMode === 'launcher' ? '#fff' : 'transparent',
                  color: previewMode === 'launcher' ? '#0f172a' : '#64748b',
                  boxShadow: previewMode === 'launcher' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer'
                }}
              >
                Bubble
              </button>
            </div>
          </div>

          {/* Device Mockup Frame */}
          <div style={{
            width: '100%',
            height: 520,
            background: '#f8fafc',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Fake browser bar */}
            <div style={{
              background: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              <div style={{
                marginLeft: 10, flex: 1, background: '#f1f5f9', borderRadius: 6,
                padding: '3px 10px', fontSize: 10.5, color: '#64748b'
              }}>
                https://yourstore.com
              </div>
            </div>

            {/* Fake Store Content */}
            <div style={{ padding: 18, flex: 1, opacity: 0.4 }}>
              <div style={{ width: '45%', height: 14, background: '#cbd5e1', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: '80%', height: 10, background: '#e2e8f0', borderRadius: 4, marginBottom: 14 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ height: 90, background: '#e2e8f0', borderRadius: 8 }} />
                <div style={{ height: 90, background: '#e2e8f0', borderRadius: 8 }} />
              </div>
            </div>

            {/* Live Rendered Widget Inside Frame */}
            {previewMode === 'launcher' ? (
              <div style={{
                position: 'absolute',
                bottom: 18,
                [position === 'bottom-left' ? 'left' : 'right']: 18,
                display: 'flex',
                flexDirection: 'column',
                alignItems: position === 'bottom-left' ? 'flex-start' : 'flex-end',
                gap: 10
              }}>
                {/* Greeting popup */}
                <div style={{
                  background: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: 12,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  fontSize: 12,
                  fontWeight: 500,
                  maxWidth: 240,
                  border: '1px solid #f1f3f5'
                }}>
                  {welcomeMessage}
                </div>

                {/* Floating button */}
                <div style={{
                  width: 54, height: 54, borderRadius: '50%',
                  background: primaryColor, color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                  cursor: 'pointer'
                }}>
                  <MessageSquare size={24} />
                </div>
              </div>
            ) : (
              <div style={{
                position: 'absolute',
                bottom: 12,
                [position === 'bottom-left' ? 'left' : 'right']: 12,
                width: 320,
                height: 440,
                background: '#ffffff',
                borderRadius: 14,
                boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.08)'
              }}>
                {/* Header */}
                <div style={{
                  background: primaryColor,
                  color: '#ffffff',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14, overflow: 'hidden'
                  }}>
                    {avatarUrl ? <img src={avatarUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : businessName.charAt(0)}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {businessName}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                      {subheading}
                    </div>
                  </div>
                  <X size={16} style={{ opacity: 0.8 }} />
                </div>

                {/* Omnichannel quick bar */}
                {(showWhatsappButton || showInstagramButton) && (
                  <div style={{
                    background: '#f9fafb', borderBottom: '1px solid #f1f3f5',
                    padding: '6px 10px', display: 'flex', gap: 6
                  }}>
                    {showWhatsappButton && (
                      <div style={{
                        flex: 1, padding: '5px 8px', borderRadius: 6,
                        background: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 600,
                        textAlign: 'center'
                      }}>
                        WhatsApp
                      </div>
                    )}
                    {showInstagramButton && (
                      <div style={{
                        flex: 1, padding: '5px 8px', borderRadius: 6,
                        background: '#fce7f3', color: '#be185d', fontSize: 11, fontWeight: 600,
                        textAlign: 'center'
                      }}>
                        Instagram
                      </div>
                    )}
                  </div>
                )}

                {/* Content body based on previewMode */}
                {previewMode === 'lead' ? (
                  <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 10, background: '#fff' }}>
                    <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.4 }}>
                      👋 Share your contact info to get connected instantly:
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Your Name</label>
                      <input readOnly placeholder="e.g. Ali Khan" style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 6 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>WhatsApp Number</label>
                      <input readOnly placeholder="+92 300 1234567" style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 6 }} />
                    </div>
                    <button style={{
                      marginTop: 6, padding: '9px', background: primaryColor, color: '#fff',
                      border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 600
                    }}>
                      Start Chat
                    </button>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
                    <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                      {/* Bot greeting */}
                      <div style={{
                        alignSelf: 'flex-start', background: '#fff', padding: '8px 12px',
                        borderRadius: '12px 12px 12px 2px', fontSize: 12, color: '#1f2937',
                        maxWidth: '85%', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                      }}>
                        {welcomeMessage}
                      </div>

                      {/* Visitor reply */}
                      <div style={{
                        alignSelf: 'flex-end', background: primaryColor, color: '#fff',
                        padding: '8px 12px', borderRadius: '12px 12px 2px 12px', fontSize: 12,
                        maxWidth: '80%'
                      }}>
                        Can you tell me about your pricing?
                      </div>

                      {/* Bot response */}
                      <div style={{
                        alignSelf: 'flex-start', background: '#fff', padding: '8px 12px',
                        borderRadius: '12px 12px 12px 2px', fontSize: 12, color: '#1f2937',
                        maxWidth: '85%', border: '1px solid #e5e7eb'
                      }}>
                        Certainly! We offer Starter, Growth, and Enterprise plans. Let me send the full catalog. 🚀
                      </div>
                    </div>

                    {/* Chat footer input */}
                    <div style={{
                      borderTop: '1px solid #f1f3f5', padding: '8px 10px',
                      background: '#fff', display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <input 
                        readOnly 
                        placeholder="Type a message..." 
                        style={{ flex: 1, border: 'none', fontSize: 12, outline: 'none' }} 
                      />
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', background: primaryColor,
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Send size={12} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer badge */}
                <div style={{
                  textAlign: 'center', padding: '4px 0', fontSize: 10,
                  color: '#94a3b8', background: '#fff', borderTop: '1px solid #f8fafc'
                }}>
                  Powered by <span style={{ fontWeight: 600, color: '#64748b' }}>Ittisalo</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
