'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNiche } from '@/context/NicheContext';
import { niches } from '@/lib/niches';
import { Check, ArrowRight, ArrowLeft, Loader2, Upload, MessageSquare, MapPin, Clock, FileText, Settings, Bot, CreditCard, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { encrypt } from '@/lib/crypto';

export default function OnboardingPage() {
  const { setNicheId, setOnboarded } = useNiche();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [tenantId, setTenantId] = useState('');

  useEffect(() => {
    const initTenant = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role, tenant_id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.role === 'super_admin') {
          router.replace('/admin');
          return;
        }

        if (profile?.tenant_id) {
          setTenantId(profile.tenant_id);
          const { data: t } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profile.tenant_id)
            .maybeSingle();

          if (t) {
            if (t.niche) setNiche(t.niche);
            if (t.business_name && t.business_name !== 'My Business') setBusinessName(t.business_name);
            if (t.website) setWebsite(t.website);
            if (t.business_phone) setWaPhone(t.business_phone);
            if (t.location) setLocation(t.location);
            if (t.niche_settings) {
              const ns = t.niche_settings;
              if (ns.timezone) setTimezone(ns.timezone);
              if (ns.legalName) setLegalName(ns.legalName);
              if (ns.description) setDescription(ns.description);
              if (ns.is247 !== undefined) setIs247(ns.is247);
              if (ns.autoReply) setAutoReply(ns.autoReply);
              if (ns.nicheSetting1) setNicheSetting1(ns.nicheSetting1);
              if (ns.nicheSetting2) setNicheSetting2(ns.nicheSetting2);
              if (ns.aiTone) setAiTone(ns.aiTone);
              if (ns.aiLanguage) setAiLanguage(ns.aiLanguage);
              if (ns.humanHandoffNumber) setHumanHandoffNumber(ns.humanHandoffNumber);
            }
          }

          // Also prefetch knowledge base if already saved
          const { data: kbEntries } = await supabase
            .from('knowledge_base')
            .select('title, content')
            .eq('tenant_id', profile.tenant_id);

          if (kbEntries && kbEntries.length > 0) {
            const faqEntry = kbEntries.find((k: any) => k.title === 'Onboarding FAQs');
            if (faqEntry?.content) setKbFaqs(faqEntry.content);
            const catEntry = kbEntries.find((k: any) => k.title === 'Onboarding Catalog/Menu');
            if (catEntry?.content) setKbCatalog(catEntry.content);
          }
        }
      }
    };
    initTenant();
  }, [router]);

  // Step 1: Business Identity
  const [niche, setNiche] = useState('general');
  const [businessName, setBusinessName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState('Asia/Karachi');

  // Step 2: WhatsApp Connection
  const [waPhone, setWaPhone] = useState('');
  const [waDisplayName, setWaDisplayName] = useState('');
  const [waToken, setWaToken] = useState('');
  
  // Step 3: Operating Hours
  const [is247, setIs247] = useState(true);
  const [autoReply, setAutoReply] = useState('');

  // Step 4: Knowledge Base Seeding
  const [kbFaqs, setKbFaqs] = useState('');
  const [kbCatalog, setKbCatalog] = useState('');
  const [website, setWebsite] = useState('');

  // Step 5: Niche Config
  const [nicheSetting1, setNicheSetting1] = useState(''); // E.g. slots, payment methods
  const [nicheSetting2, setNicheSetting2] = useState(''); 

  // Step 6: AI Personality
  const [aiTone, setAiTone] = useState('Friendly and professional');
  const [aiLanguage, setAiLanguage] = useState('English');
  const [humanHandoffNumber, setHumanHandoffNumber] = useState('');

  // Step 7: Plan
  const [plan, setPlan] = useState('trial');

  const totalSteps = 7;

  // Persist progress to tenant at each step
  const saveStepProgress = async (currentStep: number) => {
    try {
      let tId = tenantId;
      if (!tId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', user.id)
          .maybeSingle();
        if (!profile?.tenant_id) return;
        tId = profile.tenant_id;
        setTenantId(tId);
      }

      if (currentStep === 1) {
        await supabase.from('tenants').update({
          niche: niche || 'general',
          business_name: businessName || 'My Business',
          location: location || '',
          niche_settings: { timezone, legalName, description }
        }).eq('id', tId);
      } else if (currentStep === 2) {
        if (waPhone || waToken) {
          await supabase.from('tenants').update({
            business_phone: waPhone || '',
            wa_token_enc: waToken ? encrypt(waToken) : null,
            meta_connected: !!(waPhone || waToken)
          }).eq('id', tId);
        }
      } else if (currentStep === 3) {
        const { data: t } = await supabase.from('tenants').select('niche_settings').eq('id', tId).maybeSingle();
        const prevNs = t?.niche_settings || {};
        await supabase.from('tenants').update({
          niche_settings: { ...prevNs, is247, autoReply }
        }).eq('id', tId);
      } else if (currentStep === 4) {
        if (website) {
          await supabase.from('tenants').update({ website }).eq('id', tId);
        }
        if (kbFaqs) {
          const { data: existingFaq } = await supabase.from('knowledge_base')
            .select('id').eq('tenant_id', tId).eq('title', 'Onboarding FAQs').maybeSingle();
          if (existingFaq?.id) {
            await supabase.from('knowledge_base').update({ content: kbFaqs }).eq('id', existingFaq.id);
          } else {
            await supabase.from('knowledge_base').insert({
              tenant_id: tId, kb_type: 'text', title: 'Onboarding FAQs', content: kbFaqs, is_active: true
            });
          }
        }
        if (kbCatalog) {
          const { data: existingCat } = await supabase.from('knowledge_base')
            .select('id').eq('tenant_id', tId).eq('title', 'Onboarding Catalog/Menu').maybeSingle();
          if (existingCat?.id) {
            await supabase.from('knowledge_base').update({ content: kbCatalog }).eq('id', existingCat.id);
          } else {
            await supabase.from('knowledge_base').insert({
              tenant_id: tId, kb_type: 'text', title: 'Onboarding Catalog/Menu', content: kbCatalog, is_active: true
            });
          }
        }
      } else if (currentStep === 5) {
        const { data: t } = await supabase.from('tenants').select('niche_settings').eq('id', tId).maybeSingle();
        const prevNs = t?.niche_settings || {};
        await supabase.from('tenants').update({
          niche_settings: { ...prevNs, nicheSetting1, nicheSetting2 }
        }).eq('id', tId);
      } else if (currentStep === 6) {
        const { data: t } = await supabase.from('tenants').select('niche_settings').eq('id', tId).maybeSingle();
        const prevNs = t?.niche_settings || {};
        await supabase.from('tenants').update({
          niche_settings: { ...prevNs, aiTone, aiLanguage, humanHandoffNumber }
        }).eq('id', tId);
      }
    } catch (err: any) {
      console.warn('[Onboarding auto-save]:', err?.message);
    }
  };

  const nextStep = () => {
    saveStepProgress(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => Math.min(s + 1, totalSteps));
  };
  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => Math.max(s - 1, 1));
  };

  const handleFinish = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Authentication session not found.');

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      if (profileError || !profile?.tenant_id) throw new Error('Associated tenant profile not found.');

      const tenantId = profile.tenant_id;

      // Update tenant
      const updatePayload: any = {
        niche: niche || 'general',
        business_name: businessName || 'My Business',
        business_phone: waPhone || '',
        location: location || '',
        website: website || '',
        onboarding_completed: true,
        meta_connected: !!(waPhone || waToken),
        plan: plan || 'trial',
        plan_status: plan === 'trial' ? 'trial' : 'active',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        wa_token_enc: waToken ? encrypt(waToken) : null,
        niche_settings: {
          timezone,
          legalName,
          description,
          is247,
          autoReply,
          nicheSetting1,
          nicheSetting2,
          aiTone,
          aiLanguage,
          humanHandoffNumber
        }
      };

      const { error: tenantUpdateError } = await supabase
        .from('tenants')
        .update(updatePayload)
        .eq('id', tenantId);
      if (tenantUpdateError) throw tenantUpdateError;

      // Update Agent
      const activeNiche = niches.find(n => n.id === niche);
      if (activeNiche) {
        const customPrompt = `${activeNiche.systemRole}\n\nBusiness Description: ${description}\nTone: ${aiTone}\nLanguage: ${aiLanguage}`;
        
        const { data: existingAgent } = await supabase.from('agents').select('id').eq('tenant_id', tenantId).maybeSingle();
        if (existingAgent?.id) {
          await supabase.from('agents').update({ name: activeNiche.agentName, prompt: customPrompt, is_active: true }).eq('id', existingAgent.id);
        } else {
          await supabase.from('agents').insert({ tenant_id: tenantId, name: activeNiche.agentName, prompt: customPrompt, is_active: true });
        }
      }

      // Add basic KB if provided (upsert by title to prevent duplicates)
      if (kbFaqs) {
        const { data: existingFaq } = await supabase.from('knowledge_base')
          .select('id').eq('tenant_id', tenantId).eq('title', 'Onboarding FAQs').maybeSingle();
        if (existingFaq?.id) {
          await supabase.from('knowledge_base').update({ content: kbFaqs }).eq('id', existingFaq.id);
        } else {
          await supabase.from('knowledge_base').insert({
            tenant_id: tenantId, kb_type: 'text', title: 'Onboarding FAQs', content: kbFaqs, is_active: true
          });
        }
      }
      if (kbCatalog) {
        const { data: existingCat } = await supabase.from('knowledge_base')
          .select('id').eq('tenant_id', tenantId).eq('title', 'Onboarding Catalog/Menu').maybeSingle();
        if (existingCat?.id) {
          await supabase.from('knowledge_base').update({ content: kbCatalog }).eq('id', existingCat.id);
        } else {
          await supabase.from('knowledge_base').insert({
            tenant_id: tenantId, kb_type: 'text', title: 'Onboarding Catalog/Menu', content: kbCatalog, is_active: true
          });
        }
      }

      setNicheId(niche || 'general');
      setOnboarded(true);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderProgress = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32, width: '100%' }}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} style={{ 
          flex: 1, 
          height: 6, 
          borderRadius: 3, 
          background: i + 1 <= step ? '#dc2626' : '#fee2e2',
          transition: 'background 0.3s'
        }} />
      ))}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fff 50%, #fee2e2 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="Ittisalo Logo" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'contain' }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>Ittisalo Setup</span>
          </div>
          <button 
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            style={{ fontSize: 13, color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            Sign Out
          </button>
        </div>

        {renderProgress()}

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', borderRadius: 10, padding: '12px 16px', fontSize: 13.5, marginBottom: 20, textAlign: 'center', fontWeight: 500 }}>
            {errorMsg}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 16, padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          {/* STEP 1 */}
          {step === 1 && (
            <div className="step-content animate-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ background: '#fef2f2', padding: 8, borderRadius: 8 }}><Sparkles size={20} color="#dc2626" /></div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Business Identity</h2>
              </div>
              <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 24 }}>Let's customize your AI agent based on your industry and basic details.</p>

              <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 8 }}>Select your niche (Required)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
                {niches.map(n => (
                  <div key={n.id} onClick={() => setNiche(n.id)} style={{
                    background: '#fff', border: niche === n.id ? `2px solid #dc2626` : '1.5px solid rgba(220,38,38,0.12)',
                    borderRadius: 12, padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    boxShadow: niche === n.id ? '0 0 0 3px rgba(220,38,38,0.1)' : 'none',
                  }}>
                    <div style={{ fontSize: 24 }}>{n.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', textAlign: 'center' }}>{n.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Business Name (Required)</label>
                <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your Business Name" style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Legal Name <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional)</span></label>
                  <input value={legalName} onChange={e => setLegalName(e.target.value)} placeholder="For Meta verification" style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Timezone</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)} style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none', background: '#fff' }}>
                    <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Business Description <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional)</span></label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Briefly describe what you do. This helps the AI understand your business." rows={2} style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none', resize: 'none' }} />
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>City / Address <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional)</span></label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Clifton, Karachi" style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none' }} />
              </div>

              <button onClick={nextStep} disabled={!niche || !businessName} style={{ width: '100%', padding: '14px', fontSize: 14, fontWeight: 600, background: niche && businessName ? '#dc2626' : '#fca5a5', color: '#fff', border: 'none', borderRadius: 9, cursor: niche && businessName ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                Continue to WhatsApp Connection <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="step-content animate-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ background: '#fef2f2', padding: 8, borderRadius: 8 }}><MessageSquare size={20} color="#dc2626" /></div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>WhatsApp Business Connection</h2>
              </div>
              <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 24 }}>Connect your WhatsApp API to enable AI messaging.</p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>WhatsApp Number <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional - can add later)</span></label>
                <input value={waPhone} onChange={e => setWaPhone(e.target.value)} placeholder="+92 300 0000000" style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none' }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Display Name <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional)</span></label>
                <input value={waDisplayName} onChange={e => setWaDisplayName(e.target.value)} placeholder="Your Business Display Name" style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none' }} />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>API Access Token <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional if pending)</span></label>
                <input value={waToken} onChange={e => setWaToken(e.target.value)} placeholder="EAAG..." type="password" style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none' }} />
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>If your Meta verification is pending, you can skip this and add it later in Settings.</p>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={prevStep} style={{ flex: 1, padding: '14px', fontSize: 14, fontWeight: 600, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button 
                  onClick={nextStep} 
                  style={{ 
                    flex: 2, padding: '14px', fontSize: 14, fontWeight: 600, 
                    background: (waPhone.trim() || waDisplayName.trim() || waToken.trim()) ? '#dc2626' : '#111827', 
                    color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                    boxShadow: (waPhone.trim() || waDisplayName.trim() || waToken.trim()) ? '0 2px 8px rgba(220,38,38,0.25)' : 'none'
                  }}
                >
                  {(waPhone.trim() || waDisplayName.trim() || waToken.trim()) ? 'Continue' : 'Skip for now'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="step-content animate-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ background: '#fef2f2', padding: 8, borderRadius: 8 }}><Clock size={20} color="#dc2626" /></div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Operating Hours</h2>
              </div>
              <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 24 }}>Set your availability. You can easily skip and configure this later.</p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 10, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>24/7 Availability</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>AI will handle messages anytime</div>
                </div>
                <div onClick={() => setIs247(!is247)} style={{ width: 44, height: 24, background: is247 ? '#dc2626' : '#e5e7eb', borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: 2, left: is247 ? 22 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
                </div>
              </div>

              {!is247 && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Off-hours Auto-reply</label>
                  <textarea value={autoReply} onChange={e => setAutoReply(e.target.value)} placeholder="We are currently closed. We will reply when we are back..." rows={3} style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none', resize: 'none' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: is247 ? 24 : 0 }}>
                <button onClick={prevStep} style={{ flex: 1, padding: '14px', fontSize: 14, fontWeight: 600, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button 
                  onClick={nextStep} 
                  style={{ 
                    flex: 2, padding: '14px', fontSize: 14, fontWeight: 600, 
                    background: '#dc2626', 
                    color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(220,38,38,0.25)'
                  }}
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="step-content animate-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ background: '#fef2f2', padding: 8, borderRadius: 8 }}><FileText size={20} color="#dc2626" /></div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Knowledge Base Seeding</h2>
              </div>
              <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 16 }}>Give your AI the context it needs to answer customer queries.</p>
              
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: 8, marginBottom: 20 }}>
                <p style={{ fontSize: 12.5, color: '#92400e', margin: 0, fontWeight: 500 }}>
                  ⚠️ Your AI won't know your prices or specific details until you add this. You can skip and upload files later from the dashboard.
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Website Link</label>
                <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourbusiness.com" style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none' }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Common FAQs (Paste text)</label>
                <textarea value={kbFaqs} onChange={e => setKbFaqs(e.target.value)} placeholder="Q: Do you deliver? A: Yes, nationwide!&#10;Q: What is the refund policy? A: 7 days..." rows={3} style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none', resize: 'none' }} />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Product / Service Catalog Text</label>
                <textarea value={kbCatalog} onChange={e => setKbCatalog(e.target.value)} placeholder="e.g. Lawn Kurti - USD 25, Consultation Fee - USD 15..." rows={3} style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none', resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={prevStep} style={{ flex: 1, padding: '14px', fontSize: 14, fontWeight: 600, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button 
                  onClick={nextStep} 
                  style={{ 
                    flex: 2, padding: '14px', fontSize: 14, fontWeight: 600, 
                    background: (website.trim() || kbFaqs.trim() || kbCatalog.trim()) ? '#dc2626' : '#111827', 
                    color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                    boxShadow: (website.trim() || kbFaqs.trim() || kbCatalog.trim()) ? '0 2px 8px rgba(220,38,38,0.25)' : 'none'
                  }}
                >
                  {(website.trim() || kbFaqs.trim() || kbCatalog.trim()) ? 'Continue' : 'Skip for now'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="step-content animate-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ background: '#fef2f2', padding: 8, borderRadius: 8 }}><Settings size={20} color="#dc2626" /></div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Niche Settings ({niches.find(n => n.id === niche)?.label || 'General'})</h2>
              </div>
              <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 24 }}>Custom settings for your specific business type.</p>

              {niche === 'general' ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Primary Industry / Business Sector</label>
                    <input value={nicheSetting1} onChange={e => setNicheSetting1(e.target.value)} placeholder="e.g. SaaS, Consulting, Marketing Agency, Professional Services" style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none' }} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Target Customer Profile</label>
                    <input value={nicheSetting2} onChange={e => setNicheSetting2(e.target.value)} placeholder="e.g. High-intent B2B leads, Retail consumers, Inbound inquiries" style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none' }} />
                  </div>
                </>
              ) : niche === 'ecommerce' ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Accepted Payment Methods</label>
                    <input value={nicheSetting1} onChange={e => setNicheSetting1(e.target.value)} placeholder="COD, JazzCash, EasyPaisa, Bank Transfer" style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none' }} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Delivery Charges / Areas</label>
                    <input value={nicheSetting2} onChange={e => setNicheSetting2(e.target.value)} placeholder="USD 5 flat rate, Nationwide delivery" style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none' }} />
                  </div>
                </>
              ) : ['dental', 'clinic', 'salon', 'restaurant'].includes(niche) ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Appointment Slot Duration (Minutes)</label>
                    <input type="number" value={nicheSetting1} onChange={e => setNicheSetting1(e.target.value)} placeholder="30" style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none' }} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Booking/Reservation Policy</label>
                    <input value={nicheSetting2} onChange={e => setNicheSetting2(e.target.value)} placeholder="Requires 24h notice for cancellations" style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none' }} />
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 13.5, color: '#4b5563' }}>No specific settings required for your niche right now. You can configure more in the dashboard.</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={prevStep} style={{ flex: 1, padding: '14px', fontSize: 14, fontWeight: 600, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button 
                  onClick={nextStep} 
                  style={{ 
                    flex: 2, padding: '14px', fontSize: 14, fontWeight: 600, 
                    background: (nicheSetting1.trim() || nicheSetting2.trim()) ? '#dc2626' : '#111827', 
                    color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                    boxShadow: (nicheSetting1.trim() || nicheSetting2.trim()) ? '0 2px 8px rgba(220,38,38,0.25)' : 'none'
                  }}
                >
                  {(nicheSetting1.trim() || nicheSetting2.trim()) ? 'Continue' : 'Skip for now'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6 */}
          {step === 6 && (
            <div className="step-content animate-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ background: '#fef2f2', padding: 8, borderRadius: 8 }}><Bot size={20} color="#dc2626" /></div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>AI Personality & Escalation</h2>
              </div>
              <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 24 }}>Configure how your AI interacts with customers.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Bot Persona / Tone</label>
                  <select value={aiTone} onChange={e => setAiTone(e.target.value)} style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none', background: '#fff' }}>
                    <option value="Friendly and professional">Friendly & Professional</option>
                    <option value="Formal and polite">Formal & Polite</option>
                    <option value="Enthusiastic and energetic">Enthusiastic</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Language Preference</label>
                  <select value={aiLanguage} onChange={e => setAiLanguage(e.target.value)} style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none', background: '#fff' }}>
                    <option value="English">English</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Roman Urdu">Roman Urdu</option>
                    <option value="Bilingual (Auto-detect)">Bilingual (Auto-detect)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>Human Handoff Number <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Strongly Recommended)</span></label>
                <input value={humanHandoffNumber} onChange={e => setHumanHandoffNumber(e.target.value)} placeholder="Number to notify for escalation (e.g. +92...)" style={{ width: '100%', padding: '11px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 9, outline: 'none' }} />
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Without this, AI escalation has nowhere to route urgent queries.</p>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={prevStep} style={{ flex: 1, padding: '14px', fontSize: 14, fontWeight: 600, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button 
                  onClick={nextStep} 
                  style={{ 
                    flex: 2, padding: '14px', fontSize: 14, fontWeight: 600, 
                    background: '#dc2626', 
                    color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(220,38,38,0.25)'
                  }}
                >
                  Continue to Plan <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7 */}
          {step === 7 && (
            <div className="step-content animate-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ background: '#fef2f2', padding: 8, borderRadius: 8 }}><CreditCard size={20} color="#dc2626" /></div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Plan & Finalize</h2>
              </div>
              <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 24 }}>Select your plan to activate your workspace. You can invite your team later.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {['trial', 'starter', 'growth'].map(p => (
                  <div key={p} onClick={() => setPlan(p)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px',
                    border: plan === p ? '2px solid #dc2626' : '1.5px solid rgba(220,38,38,0.15)',
                    borderRadius: 12, cursor: 'pointer', background: plan === p ? '#fef2f2' : '#fff',
                    boxShadow: plan === p ? '0 0 0 3px rgba(220,38,38,0.05)' : 'none'
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', textTransform: 'capitalize' }}>{p === 'trial' ? '14-Day Free Trial' : `${p} Plan`}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{p === 'trial' ? 'Test all features for free' : p === 'starter' ? 'Perfect for small businesses' : 'For growing teams'}</div>
                    </div>
                    {plan === p && <Check size={20} color="#dc2626" />}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={prevStep} disabled={loading} style={{ flex: 1, padding: '14px', fontSize: 14, fontWeight: 600, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handleFinish} disabled={loading} style={{ flex: 2, padding: '14px', fontSize: 15, fontWeight: 600, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none', borderRadius: 9, cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(220,38,38,0.3)', opacity: loading ? 0.8 : 1 }}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Setting up Workspace...</> : <>Complete Setup 🚀</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .animate-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
