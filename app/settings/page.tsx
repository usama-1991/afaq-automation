'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Check, RefreshCw, Bot, Plug, Settings, Sparkles, 
  Volume2, UserX, BarChart3, Upload, Key, ShieldCheck, 
  User, CreditCard, LayoutGrid, Sliders, MessageSquare, 
  AlertCircle, Globe, BookOpen, Trash2, Loader2, ShoppingCart,
  ExternalLink, Link2, Home
} from 'lucide-react';
import { useNiche } from '@/context/NicheContext';
import { niches } from '@/lib/niches';
import { supabase } from '@/lib/supabase/client';

const tabs = ['Business Profile', 'Channels & APIs', 'AI Knowledge', 'eCommerce Platform', 'Property Listings', 'Voice & Opt-Outs', 'Usage Quotas'] as const;
type Tab = typeof tabs[number];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{
      width: 44, height: 24, background: checked ? '#dc2626' : '#e5e7eb',
      borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        width: 20, height: 20, background: '#fff', borderRadius: '50%',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', hint }: { label: string; value: string; onChange: (v: string) => void; type?: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>
      <input 
        value={value} 
        onChange={e => onChange(e.target.value)}
        type={type} 
        style={{
          width: '100%', maxWidth: 480, padding: '10px 12px', fontSize: 13,
          border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, background: '#fff',
          fontFamily: 'inherit', color: '#1f2937', outline: 'none',
          transition: 'all 0.15s',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = '#dc2626';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.08)';
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'rgba(220,38,38,0.12)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      {hint && <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function SettingsInner() {
  const { niche, setNicheId, setOnboarded } = useNiche();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>('Business Profile');
  const [saved, setSaved] = useState(false);

  // Business settings — start empty, loaded from DB per tenant
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [legalName, setLegalName] = useState('');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('Asia/Karachi');
  const [is247, setIs247] = useState(true);
  const [autoReply, setAutoReply] = useState('');
  const [aiTone, setAiTone] = useState('Friendly and professional');
  const [aiLanguage, setAiLanguage] = useState('English');
  const [humanHandoffNumber, setHumanHandoffNumber] = useState('');

  // Dynamic niche fields — start empty
  const [menuLink, setMenuLink] = useState('');
  const [slotCapacity, setSlotCapacity] = useState('8');
  const [isHalal, setIsHalal] = useState(true);

  const [dentalEmergency, setDentalEmergency] = useState('');
  const [slotLength, setSlotLength] = useState('30');
  const [insurances, setInsurances] = useState('');

  const [catalogLink, setCatalogLink] = useState('');
  const [codEnabled, setCodEnabled] = useState(true);
  const [deliveryDays, setDeliveryDays] = useState('');
  const [minOrder, setMinOrder] = useState('');

  const [agencyLicense, setAgencyLicense] = useState('');
  const [operatingCities, setOperatingCities] = useState('');
  const [propertyTypes, setPropertyTypes] = useState('');

  const [stylistsCount, setStylistsCount] = useState('5');
  const [bridalPackages, setBridalPackages] = useState(false);

  const [opdHours, setOpdHours] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [specialties, setSpecialties] = useState('');

  // APIs state — start empty, loaded from DB per tenant
  const [waToken, setWaToken] = useState('');
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waAccountId, setWaAccountId] = useState('');

  // AI Knowledge Base state
  interface KBEntry { id: string; kb_type: string; title: string; content: string; source_url?: string; is_active: boolean; created_at: string; }
  const [kbEntries, setKbEntries] = useState<KBEntry[]>([]);
  const [kbExpandedId, setKbExpandedId] = useState<string | null>(null);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbUrlInput, setKbUrlInput] = useState('');
  const [kbScraping, setKbScraping] = useState(false);
  const [kbCustomTitle, setKbCustomTitle] = useState('');
  const [kbCustomContent, setKbCustomContent] = useState('');
  const [editingKbId, setEditingKbId] = useState<string | null>(null);
  const [editKbTitle, setEditKbTitle] = useState('');
  const [editKbContent, setEditKbContent] = useState('');
  const [tenantIdState, setTenantIdState] = useState<string | null>(null);

  // eCommerce Platform state
  const [ecomPlatform, setEcomPlatform] = useState<'Shopify' | 'WooCommerce' | 'None'>('None');
  const [shopifyUrl, setShopifyUrl] = useState('');
  const [shopifyToken, setShopifyToken] = useState('');
  const [wcUrl, setWcUrl] = useState('');
  const [wcKey, setWcKey] = useState('');
  const [wcSecret, setWcSecret] = useState('');
  const [ecomSaving, setEcomSaving] = useState(false);
  const [ecomConnected, setEcomConnected] = useState(false);

  // Automation & Opt-Out settings
  const [voiceAutoTranscribe, setVoiceAutoTranscribe] = useState(true);
  const [voiceAccuracy, setVoiceAccuracy] = useState<'Standard' | 'Premium Whisper-4o'>('Premium Whisper-4o');
  const [optOutKeywords, setOptOutKeywords] = useState('STOP, UNSUBSCRIBE, CANCEL, MUT, EXIT');
  const [optOutAutoReply, setOptOutAutoReply] = useState('You have been successfully opted out of messages from our channel. You will not receive any further automated outreach.');

  // Opt-out lead count from localStorage (simulated)
  const [optOutCount, setOptOutCount] = useState(0);

  // Property Listings State
  interface Listing { id: string; title: string; area: string; type: string; bedrooms: number; price: number; description: string; status: string; photos_urls: string[]; created_at: string; }
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingForm, setListingForm] = useState({ id: '', title: '', area: '', type: 'flat', bedrooms: '2', price: '', description: '', status: 'available', photos_urls: [] as string[] });
  const [isEditingListing, setIsEditingListing] = useState(false);
  const [pendingNicheChange, setPendingNicheChange] = useState<string | null>(null);
  const [isChangingNiche, setIsChangingNiche] = useState(false);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && tabs.includes(t as any)) {
      setTab(t as Tab);
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ittisalo_contact_meta');
      if (stored) {
        const parsed = JSON.parse(stored);
        const count = Object.values(parsed).filter((c: any) => c.optedOut === true).length;
        setOptOutCount(count);
      }
    } catch (_) {}
  }, []);

  // Fetch Supabase Tenant info
  useEffect(() => {
    const fetchTenantSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

          if (profile?.tenant_id) {
            setTenantIdState(profile.tenant_id);
            const { data: tenant } = await supabase
              .from('tenants')
              .select('*')
              .eq('id', profile.tenant_id)
              .single();

            if (tenant) {
              if (tenant.business_name) setBusinessName(tenant.business_name);
              if (tenant.business_phone) setWaNumber(tenant.business_phone);
              if (tenant.website) setWebsite(tenant.website);
              if (tenant.location) setLocation(tenant.location);
              if (tenant.owner_name) setOwnerName(tenant.owner_name);
              if (tenant.catalog_link) setCatalogLink(tenant.catalog_link);
              if (tenant.menu_link) setMenuLink(tenant.menu_link);
              if (tenant.delivery_days) setDeliveryDays(String(tenant.delivery_days));
              if (tenant.min_order) setMinOrder(String(tenant.min_order));
              if (tenant.cod_enabled !== undefined) setCodEnabled(tenant.cod_enabled);
              // Load per-tenant Meta API tokens
              if (tenant.wa_token_enc) setWaToken('••••••••••••••••');
              if (tenant.wa_phone_number_id) setWaPhoneId(tenant.wa_phone_number_id);
              if (tenant.wa_account_id) setWaAccountId(tenant.wa_account_id);
              // Load niche_settings JSONB
              const ns = tenant.niche_settings || {};
              if (ns.dentalEmergency) setDentalEmergency(ns.dentalEmergency);
              if (ns.slotLength) setSlotLength(ns.slotLength);
              if (ns.insurances) setInsurances(ns.insurances);
              if (ns.agencyLicense) setAgencyLicense(ns.agencyLicense);
              if (ns.operatingCities) setOperatingCities(ns.operatingCities);
              if (ns.propertyTypes) setPropertyTypes(ns.propertyTypes);
              if (ns.stylistsCount) setStylistsCount(ns.stylistsCount);
              if (ns.bridalPackages !== undefined) setBridalPackages(ns.bridalPackages);
              if (ns.opdHours) setOpdHours(ns.opdHours);
              if (ns.emergencyPhone) setEmergencyPhone(ns.emergencyPhone);
              if (ns.specialties) setSpecialties(ns.specialties);
              if (ns.slotCapacity) setSlotCapacity(ns.slotCapacity);
              if (ns.isHalal !== undefined) setIsHalal(ns.isHalal);
              if (ns.timezone) setTimezone(ns.timezone);
              if (ns.legalName) setLegalName(ns.legalName);
              if (ns.description) setDescription(ns.description);
              if (ns.is247 !== undefined) setIs247(ns.is247);
              if (ns.autoReply) setAutoReply(ns.autoReply);
              if (ns.aiTone) setAiTone(ns.aiTone);
              if (ns.aiLanguage) setAiLanguage(ns.aiLanguage);
              if (ns.humanHandoffNumber) setHumanHandoffNumber(ns.humanHandoffNumber);
            }

            // Load knowledge base entries
            fetchKnowledgeBase(profile.tenant_id);
            // Load ecommerce credentials
            fetchEcomCredentials(profile.tenant_id);
            // Load property listings if realestate
            if (tenant?.niche === 'realestate' || niche.id === 'realestate') {
              fetchListings(profile.tenant_id);
            }
          }
        }
      } catch (err) {
        console.error('Error loading tenant profile settings:', err);
      }
    };
    fetchTenantSettings();
  }, []);

  // KB Fetcher
  const fetchKnowledgeBase = async (tid: string) => {
    setKbLoading(true);
    try {
      const { data } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('tenant_id', tid)
        .order('created_at', { ascending: false });
      if (data) setKbEntries(data);
    } catch (e) { console.error(e); }
    setKbLoading(false);
  };

  // KB: Scrape URL via Jina Reader
  const handleScrapeUrl = async () => {
    if (!kbUrlInput || !tenantIdState) return;
    setKbScraping(true);
    try {
      const res = await fetch(`https://r.jina.ai/${kbUrlInput}`);
      const text = await res.text();
      const title = kbUrlInput.replace(/https?:\/\//, '').split('/')[0];
      await supabase.from('knowledge_base').insert({
        tenant_id: tenantIdState,
        kb_type: 'url',
        title: title,
        content: text.slice(0, 8000),
        source_url: kbUrlInput,
        is_active: true,
      });
      setKbUrlInput('');
      fetchKnowledgeBase(tenantIdState);
    } catch (e: any) {
      alert('Scrape failed: ' + e.message);
    }
    setKbScraping(false);
  };

  // KB: Add custom text instruction
  const handleAddCustomKB = async () => {
    if (!kbCustomTitle || !kbCustomContent || !tenantIdState) return;
    await supabase.from('knowledge_base').insert({
      tenant_id: tenantIdState,
      kb_type: 'text',
      title: kbCustomTitle,
      content: kbCustomContent,
      is_active: true,
    });
    setKbCustomTitle('');
    setKbCustomContent('');
    fetchKnowledgeBase(tenantIdState);
  };

  // KB: Save Edit
  const handleSaveEditedKB = async (id: string) => {
    if (!tenantIdState) return;
    await supabase.from('knowledge_base').update({
      title: editKbTitle,
      content: editKbContent
    }).eq('id', id);
    setEditingKbId(null);
    fetchKnowledgeBase(tenantIdState);
  };

  // KB: Delete entry
  const handleDeleteKB = async (id: string) => {
    await supabase.from('knowledge_base').delete().eq('id', id);
    if (tenantIdState) fetchKnowledgeBase(tenantIdState);
  };

  // KB: Toggle active
  const handleToggleKB = async (id: string, active: boolean) => {
    await supabase.from('knowledge_base').update({ is_active: !active }).eq('id', id);
    if (tenantIdState) fetchKnowledgeBase(tenantIdState);
  };

  // Listings operations
  const fetchListings = async (tid: string) => {
    setListingsLoading(true);
    try {
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('tenant_id', tid)
        .order('created_at', { ascending: false });
      if (data) setListings(data);
    } catch (e) { console.error(e); }
    setListingsLoading(false);
  };

  useEffect(() => {
    if (tenantIdState && niche.id === 'realestate') {
      fetchListings(tenantIdState);
    }
  }, [niche.id, tenantIdState]);

  const handleSaveListing = async () => {
    if (!tenantIdState) return;
    try {
      const payload = {
        tenant_id: tenantIdState,
        title: listingForm.title,
        area: listingForm.area,
        type: listingForm.type,
        bedrooms: listingForm.type === 'commercial' ? null : (parseInt(listingForm.bedrooms) || 0),
        price: parseFloat(listingForm.price) || 0,
        description: listingForm.description,
        status: listingForm.status,
        photos_urls: listingForm.photos_urls
      };

      if (isEditingListing && listingForm.id) {
        await supabase.from('listings').update(payload).eq('id', listingForm.id);
      } else {
        await supabase.from('listings').insert(payload);
      }
      
      setListingForm({ id: '', title: '', area: '', type: 'flat', bedrooms: '2', price: '', description: '', status: 'available', photos_urls: [] });
      setIsEditingListing(false);
      fetchListings(tenantIdState);
    } catch (e: any) {
      alert('Failed to save listing: ' + e.message);
    }
  };

  const handleEditListing = (listing: Listing) => {
    setListingForm({
      id: listing.id,
      title: listing.title,
      area: listing.area || '',
      type: listing.type || 'flat',
      bedrooms: listing.bedrooms?.toString() || '0',
      price: listing.price?.toString() || '0',
      description: listing.description || '',
      status: listing.status || 'available',
      photos_urls: listing.photos_urls || []
    });
    setIsEditingListing(true);
    // Scroll to top of tab
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteListing = async (id: string) => {
    if (!tenantIdState || !confirm('Are you sure you want to delete this listing?')) return;
    await supabase.from('listings').delete().eq('id', id);
    fetchListings(tenantIdState);
  };

  const handleToggleListingStatus = async (id: string, currentStatus: string) => {
    if (!tenantIdState) return;
    const newStatus = currentStatus === 'available' ? 'sold' : 'available';
    await supabase.from('listings').update({ status: newStatus }).eq('id', id);
    fetchListings(tenantIdState);
  };

  // eCommerce credentials fetcher
  const fetchEcomCredentials = async (tid: string) => {
    try {
      const { data } = await supabase
        .from('integration_credentials')
        .select('*')
        .eq('tenant_id', tid)
        .in('platform', ['shopify', 'woocommerce'])
        .limit(1)
        .maybeSingle();
      if (data) {
        setEcomConnected(true);
        if (data.platform === 'shopify') {
          setEcomPlatform('Shopify');
          setShopifyUrl(data.credentials?.store_url || '');
          setShopifyToken(data.credentials?.access_token ? '••••••••••••' : '');
        } else if (data.platform === 'woocommerce') {
          setEcomPlatform('WooCommerce');
          setWcUrl(data.credentials?.site_url || '');
          setWcKey(data.credentials?.consumer_key ? '••••••••••••' : '');
          setWcSecret(data.credentials?.consumer_secret ? '••••••••••••' : '');
        }
      }
    } catch (e) { console.error(e); }
  };

  // eCommerce save
  const handleSaveEcom = async () => {
    if (!tenantIdState) return;
    setEcomSaving(true);
    try {
      const platform = ecomPlatform.toLowerCase();
      const credentials = ecomPlatform === 'Shopify'
        ? { store_url: shopifyUrl, access_token: shopifyToken }
        : { site_url: wcUrl, consumer_key: wcKey, consumer_secret: wcSecret };

      await supabase.from('integration_credentials').upsert({
        tenant_id: tenantIdState,
        platform,
        credentials,
        is_active: true,
      }, { onConflict: 'tenant_id,platform' });

      setEcomConnected(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      alert('Save failed: ' + e.message);
    }
    setEcomSaving(false);
  };



  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', user.id)
          .single();

        if (profile?.tenant_id) {
          // Update tenants table with all per-tenant settings
          const nicheSettings = {
            dentalEmergency, slotLength, insurances, agencyLicense,
            operatingCities, propertyTypes, stylistsCount, bridalPackages,
            opdHours, emergencyPhone, specialties, slotCapacity, isHalal,
            timezone, legalName, description, is247, autoReply, aiTone, aiLanguage, humanHandoffNumber
          };
          const updatePayload: Record<string, any> = {
            business_name: businessName,
            business_phone: waNumber,
            website,
            location,
            owner_name: ownerName,
            catalog_link: catalogLink,
            menu_link: menuLink,
            delivery_days: parseInt(deliveryDays) || 3,
            min_order: parseInt(minOrder) || 0,
            cod_enabled: codEnabled,
            niche_settings: nicheSettings,
          };
          // Only update Meta tokens if user typed something new (not the masked placeholder)
          if (waPhoneId && !waPhoneId.includes('•')) updatePayload.wa_phone_number_id = waPhoneId;
          if (waAccountId && !waAccountId.includes('•')) updatePayload.wa_account_id = waAccountId;
          if (waToken && !waToken.includes('•')) updatePayload.wa_token_enc = waToken;
          await supabase
            .from('tenants')
            .update(updatePayload)
            .eq('id', profile.tenant_id);
        }
      }
    } catch (err) {
      console.error('Error saving settings to Supabase:', err);
    }
    


    setSaved(true); 
    setTimeout(() => setSaved(false), 2000); 
  };
  
  const handleNicheChange = (id: string) => {
    if (id === niche.id) return;
    setPendingNicheChange(id);
  };

  const confirmNicheChange = async () => {
    if (!pendingNicheChange || !tenantIdState) return;
    setIsChangingNiche(true);
    
    try {
      // 1. Delete old data to prevent mixing (Destructive reset)
      await Promise.all([
        supabase.from('orders').delete().eq('tenant_id', tenantIdState),
        supabase.from('appointments').delete().eq('tenant_id', tenantIdState),
        supabase.from('leads').delete().eq('tenant_id', tenantIdState),
        supabase.from('knowledge_base').delete().eq('tenant_id', tenantIdState),
        supabase.from('listings').delete().eq('tenant_id', tenantIdState)
      ]);

      // 2. Update niche in tenants table
      await supabase.from('tenants').update({ niche: pendingNicheChange }).eq('id', tenantIdState);

      // 3. Reset local context
      setNicheId(pendingNicheChange);
      setOnboarded(false);
      
      // 4. Redirect to onboarding
      window.location.href = '/onboarding';
    } catch (err) {
      console.error('Error changing niche:', err);
      alert('Failed to change business niche. Please try again.');
      setIsChangingNiche(false);
      setPendingNicheChange(null);
    }
  };

  const handleReset = () => { 
    setOnboarded(false); 
    window.location.href = '/onboarding'; 
  };

  return (
    <div className="settings-page-wrap" style={{ padding: '24px 28px', maxWidth: 1000 }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={24} color="#dc2626" /> System Settings
          </h1>
          <p style={{ fontSize: 13.5, color: '#6b7280', marginTop: 3 }}>Configure your Ittisalo channels, integrations, and preferences.</p>
        </div>

        {saved && (
          <div style={{
            background: '#ecfdf5', border: '1px solid #10b981', color: '#047857',
            fontSize: 12.5, fontWeight: 600, padding: '8px 16px', borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 6,
            animation: 'fadeUp 0.15s ease-out',
          }}>
            <Check size={14} strokeWidth={3} /> Settings saved successfully!
          </div>
        )}
      </div>

      {/* Modern Red-Themed Tabs */}
      <div className="settings-tab-bar" style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(220,38,38,0.08)', marginBottom: 28, flexWrap: 'wrap' }}>
        {tabs.map(t => {
          if (t === 'Property Listings' && niche.id !== 'realestate') return null;
          const active = tab === t;
          return (
            <button 
              key={t} 
              onClick={() => setTab(t)}
              className="settings-tab-btn"
              style={{
                padding: '10px 20px', fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? '#dc2626' : '#6b7280',
                background: 'none', border: 'none',
                borderBottom: active ? '2.5px solid #dc2626' : '2.5px solid transparent',
                marginBottom: -1.5, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if(!active) e.currentTarget.style.color = '#dc2626'; }}
              onMouseLeave={e => { if(!active) e.currentTarget.style.color = '#6b7280'; }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div style={{ maxWidth: 640 }}>

        {/* ── Business Profile Tab ── */}
        {tab === 'Business Profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Niche Selector panel */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <LayoutGrid size={16} color="#dc2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Business Niche Context</div>
              </div>
              <p style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 16 }}>
                Updating your niche recalibrates the AI model, matching tone, custom system instructions, and analytics counters.
              </p>
              
              <div className="settings-niche-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {niches.map(n => {
                  const selected = niche.id === n.id;
                  return (
                    <div 
                      key={n.id} 
                      onClick={() => handleNicheChange(n.id)} 
                      style={{
                        padding: '14px 10px', borderRadius: 10, cursor: 'pointer',
                        border: selected ? '2px solid #dc2626' : '1.5px solid rgba(220,38,38,0.08)',
                        background: selected ? '#fef2f2' : '#fafafa',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        transition: 'all 0.15s', position: 'relative',
                      }}
                      onMouseEnter={e => { if(!selected) e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)'; }}
                      onMouseLeave={e => { if(!selected) e.currentTarget.style.borderColor = 'rgba(220,38,38,0.08)'; }}
                    >
                      {selected && (
                        <div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={9} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                      <span style={{ fontSize: 24 }}>{n.icon}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: selected ? '#991b1b' : '#374151', textAlign: 'center', lineHeight: 1.3 }}>{n.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Profile fields */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <User size={16} color="#dc2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Profile Details</div>
              </div>
              <Field label="Business Name" value={businessName} onChange={setBusinessName} />
              <Field label="Owner Name" value={ownerName} onChange={setOwnerName} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Legal Name" value={legalName} onChange={setLegalName} hint="For Meta verification" />
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Timezone</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)} style={{ width: '100%', maxWidth: 480, padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, background: '#fff', outline: 'none' }}>
                    <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Business Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Briefly describe what you do..." rows={2} style={{ width: '100%', maxWidth: 480, padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, outline: 'none', resize: 'none' }} />
              </div>
              <Field label="WhatsApp Business Number" value={waNumber} onChange={setWaNumber} hint="Used to display in AI conversations" />
              <Field label="HQ Location" value={location} onChange={setLocation} />
              <Field label="Website Link" value={website} onChange={setWebsite} type="url" hint="Auto-scraped as primary knowledge base resource" />
            </div>

            {/* Operating Hours & Escalation */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <Volume2 size={16} color="#dc2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Operating Hours & Escalation</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', maxWidth: 480, marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block' }}>24/7 Availability</span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>AI will handle messages anytime</span>
                </div>
                <Toggle checked={is247} onChange={() => setIs247(!is247)} />
              </div>
              {!is247 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Off-hours Auto-reply</label>
                  <textarea value={autoReply} onChange={e => setAutoReply(e.target.value)} placeholder="We are currently closed..." rows={2} style={{ width: '100%', maxWidth: 480, padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, outline: 'none', resize: 'none' }} />
                </div>
              )}
              <Field label="Human Handoff Number" value={humanHandoffNumber} onChange={setHumanHandoffNumber} hint="Number to notify for escalation (e.g. +92...)" />
            </div>

            {/* Niche-Specific Context Settings Panel */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <Sparkles size={16} color="#dc2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Industry-Specific Attributes ({niche.label})</div>
              </div>

              {niche.id === 'restaurant' && (
                <>
                  <Field label="Online Menu URL" value={menuLink} onChange={setMenuLink} hint="AI shares this with guests seeking menus" />
                  <Field label="Max Table Slot Capacity" value={slotCapacity} onChange={setSlotCapacity} type="number" hint="Maximum number of guests allowed per reservation" />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', maxWidth: 480 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block' }}>100% Halal Certified</span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>Enable if your dining menu is certified Halal</span>
                    </div>
                    <Toggle checked={isHalal} onChange={() => setIsHalal(!isHalal)} />
                  </div>
                </>
              )}

              {niche.id === 'dental' && (
                <>
                  <Field label="Emergency Hotline Phone" value={dentalEmergency} onChange={setDentalEmergency} hint="Shared with patients in acute pain" />
                  <Field label="Default Slot Length (Minutes)" value={slotLength} onChange={setSlotLength} type="number" hint="Standard appointment slot duration" />
                  <Field label="Accepted Insurances" value={insurances} onChange={setInsurances} hint="List comma-separated insurance providers" />
                </>
              )}

              {niche.id === 'ecommerce' && (
                <>
                  <Field label="Product Catalog URL" value={catalogLink} onChange={setCatalogLink} hint="Sent to customers asking for catalogs or shop link" />
                  <Field label="Standard Delivery Days" value={deliveryDays} onChange={setDeliveryDays} type="number" hint="Expected transit time for shipments" />
                  <Field label="Minimum Order Value (PKR)" value={minOrder} onChange={setMinOrder} type="number" hint="Minimum cart subtotal to process checkouts" />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', maxWidth: 480 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block' }}>Cash On Delivery (COD)</span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>Accept Cash on Delivery during conversational checkouts</span>
                    </div>
                    <Toggle checked={codEnabled} onChange={() => setCodEnabled(!codEnabled)} />
                  </div>
                </>
              )}

              {niche.id === 'realestate' && (
                <>
                  <Field label="Agency License Number" value={agencyLicense} onChange={setAgencyLicense} hint="Regulatory registration credential code" />
                  <Field label="Operating Cities" value={operatingCities} onChange={setOperatingCities} hint="Primary regions of coverage" />
                  <Field label="Specialized Property Types" value={propertyTypes} onChange={setPropertyTypes} hint="Apartments, plots, commercial, etc." />
                </>
              )}

              {niche.id === 'salon' && (
                <>
                  <Field label="Total Active Stylists" value={stylistsCount} onChange={setStylistsCount} type="number" hint="Affects booking slot counts" />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', maxWidth: 480 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block' }}>Bridal Booking Packages</span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>Show wedding packages inside the conversation options</span>
                    </div>
                    <Toggle checked={bridalPackages} onChange={() => setBridalPackages(!bridalPackages)} />
                  </div>
                </>
              )}

              {niche.id === 'clinic' && (
                <>
                  <Field label="OPD Consultation Hours" value={opdHours} onChange={setOpdHours} hint="e.g. 9:00 AM - 5:00 PM" />
                  <Field label="Clinical Emergency Number" value={emergencyPhone} onChange={setEmergencyPhone} hint="Hotline for critical patient calls" />
                  <Field label="Medical Specialties" value={specialties} onChange={setSpecialties} hint="List comma-separated services/departments" />
                </>
              )}
            </div>



            {/* Danger Zone */}
            <div style={{ padding: '18px', background: '#fef2f2', borderRadius: 14, border: '1.5px solid rgba(220,38,38,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <AlertCircle size={16} color="#dc2626" />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>Danger Zone</div>
              </div>
              <p style={{ fontSize: 12.5, color: '#7f1d1d', marginBottom: 14, lineHeight: 1.4 }}>
                Resetting onboarding clears your saved business context parameters, requiring you to re-run the initial AI configuration wizard.
              </p>
              <button 
                onClick={handleReset} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12.5, fontWeight: 700, 
                  background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
                  transition: 'background 0.15s', boxShadow: '0 2px 6px rgba(220,38,38,0.15)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
                onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}
              >
                <RefreshCw size={13} /> Reset Setup & Restart Onboarding
              </button>
            </div>
          </div>
        )}

        {/* ── Channels & APIs Tab ── */}
        {tab === 'Channels & APIs' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Plug size={16} color="#dc2626" />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Connected Integrations</div>
            </div>
            <p style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 20 }}>Configure credentials for omni-channel messaging routing and automation triggers.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Meta WhatsApp Token */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <Key size={14} color="#dc2626" />
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>Meta WhatsApp Business Token</label>
                </div>
                <input 
                  type="password" 
                  value={waToken} 
                  onChange={e => setWaToken(e.target.value)} 
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, background: '#fafafa', outline: 'none' }} 
                />
              </div>

              {/* WhatsApp IDs grid */}
              <div className="settings-wa-ids-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Meta Phone Number ID</label>
                  <input 
                    type="text" 
                    value={waPhoneId} 
                    onChange={e => setWaPhoneId(e.target.value)} 
                    style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, background: '#fafafa', outline: 'none' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>WhatsApp Account ID</label>
                  <input 
                    type="text" 
                    value={waAccountId} 
                    onChange={e => setWaAccountId(e.target.value)} 
                    style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, background: '#fafafa', outline: 'none' }} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AI Knowledge Tab ── */}
        {tab === 'AI Knowledge' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* AI Personality Settings */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <Bot size={16} color="#dc2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>AI Personality & Behavior</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Bot Persona / Tone</label>
                  <select value={aiTone} onChange={e => setAiTone(e.target.value)} style={{ width: '100%', maxWidth: 480, padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, background: '#fff', outline: 'none' }}>
                    <option value="Friendly and professional">Friendly & Professional</option>
                    <option value="Formal and polite">Formal & Polite</option>
                    <option value="Enthusiastic and energetic">Enthusiastic</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Language Preference</label>
                  <select value={aiLanguage} onChange={e => setAiLanguage(e.target.value)} style={{ width: '100%', maxWidth: 480, padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, background: '#fff', outline: 'none' }}>
                    <option value="English">English</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Roman Urdu">Roman Urdu</option>
                    <option value="Bilingual (Auto-detect)">Bilingual (Auto-detect)</option>
                  </select>
                </div>
              </div>
            </div>
            {/* URL Scraper */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Globe size={16} color="#dc2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Website URL Scraper</div>
              </div>
              <p style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 16 }}>
                Paste your business website URL. Ittisalo will crawl the page and import all text content into the AI knowledge base.
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  value={kbUrlInput}
                  onChange={e => setKbUrlInput(e.target.value)}
                  placeholder="https://yourbusiness.com/about"
                  style={{
                    flex: 1, padding: '10px 12px', fontSize: 13,
                    border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9,
                    background: '#fafafa', fontFamily: 'inherit', outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#dc2626'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(220,38,38,0.12)'; }}
                />
                <button
                  onClick={handleScrapeUrl}
                  disabled={kbScraping || !kbUrlInput}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 18px', fontSize: 12.5, fontWeight: 700,
                    background: kbScraping ? '#9ca3af' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    color: '#fff', border: 'none', borderRadius: 9,
                    cursor: kbScraping ? 'default' : 'pointer',
                    boxShadow: '0 2px 6px rgba(220,38,38,0.2)',
                  }}
                >
                  {kbScraping ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Scraping...</> : <><Link2 size={13} /> Scrape & Import</>}
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#9ca3af' }}>Powered by Jina AI Reader. Content is truncated to 8,000 characters per page.</p>
            </div>

            {/* Custom Instructions */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <BookOpen size={16} color="#dc2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Custom Business Instructions</div>
              </div>
              <p style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 16 }}>
                Write specific context, policies, or rules your AI agent must follow. Example: &quot;Never offer more than 10% discount&quot;, &quot;Our Clifton branch has free valet parking.&quot;
              </p>
              <div style={{ marginBottom: 12 }}>
                <input
                  value={kbCustomTitle}
                  onChange={e => setKbCustomTitle(e.target.value)}
                  placeholder="Title (e.g. Discount Policy, Branch Info)"
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: 13,
                    border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9,
                    background: '#fafafa', fontFamily: 'inherit', outline: 'none', marginBottom: 8,
                  }}
                />
                <textarea
                  value={kbCustomContent}
                  onChange={e => setKbCustomContent(e.target.value)}
                  rows={4}
                  placeholder="Enter your business instruction or context here..."
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: 13,
                    border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9,
                    background: '#fafafa', fontFamily: 'inherit', outline: 'none',
                    resize: 'vertical', lineHeight: 1.5,
                  }}
                />
              </div>
              <button
                onClick={handleAddCustomKB}
                disabled={!kbCustomTitle || !kbCustomContent}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', fontSize: 12.5, fontWeight: 700,
                  background: (!kbCustomTitle || !kbCustomContent) ? '#e5e7eb' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: (!kbCustomTitle || !kbCustomContent) ? '#9ca3af' : '#fff',
                  border: 'none', borderRadius: 9,
                  cursor: (!kbCustomTitle || !kbCustomContent) ? 'default' : 'pointer',
                  boxShadow: '0 2px 6px rgba(220,38,38,0.15)',
                }}
              >
                <Sparkles size={13} /> Add to Knowledge Base
              </button>
            </div>

            {/* Knowledge Documents List */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={16} color="#dc2626" />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Active Knowledge Documents ({kbEntries.filter(e => e.is_active).length})</div>
                </div>
                {kbLoading && <Loader2 size={14} color="#dc2626" style={{ animation: 'spin 1s linear infinite' }} />}
              </div>
              {kbEntries.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af', fontSize: 12.5 }}>
                  No knowledge entries yet. Scrape a URL or add custom instructions above.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {kbEntries.map(entry => (
                    <div key={entry.id} style={{
                      borderRadius: 10,
                      border: entry.is_active ? '1px solid rgba(220,38,38,0.08)' : '1px solid #e5e7eb',
                      background: entry.is_active ? '#fafafa' : '#f9fafb',
                      opacity: entry.is_active ? 1 : 0.6,
                      overflow: 'hidden',
                    }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 8,
                          background: entry.kb_type === 'url' ? '#eff6ff' : entry.kb_type === 'pdf' ? '#fef3c7' : '#fef2f2',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, flexShrink: 0,
                        }}>
                          {entry.kb_type === 'url' ? '🌐' : entry.kb_type === 'pdf' ? '📄' : '✏️'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {editingKbId === entry.id ? (
                            <input
                              value={editKbTitle}
                              onChange={e => setEditKbTitle(e.target.value)}
                              style={{ width: '100%', fontSize: 13, fontWeight: 600, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, outline: 'none' }}
                            />
                          ) : (
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {entry.title}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                            {entry.kb_type.toUpperCase()} · {entry.content?.length || 0} chars · {new Date(entry.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                          {editingKbId === entry.id ? (
                            <>
                              <button
                                onClick={() => handleSaveEditedKB(entry.id)}
                                style={{
                                  padding: '4px 10px', fontSize: 10.5, fontWeight: 600, borderRadius: 6,
                                  border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer',
                                  background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', gap: 4,
                                }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingKbId(null)}
                                style={{
                                  padding: '4px 10px', fontSize: 10.5, fontWeight: 600, borderRadius: 6,
                                  border: '1px solid rgba(156,163,175,0.2)', cursor: 'pointer',
                                  background: '#f3f4f6', color: '#4b5563', display: 'flex', alignItems: 'center', gap: 4,
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditKbTitle(entry.title);
                                  setEditKbContent(entry.content);
                                  setEditingKbId(entry.id);
                                  setKbExpandedId(entry.id); // auto-expand
                                }}
                                style={{
                                  padding: '4px 10px', fontSize: 10.5, fontWeight: 600, borderRadius: 6,
                                  border: '1px solid rgba(245,158,11,0.2)', cursor: 'pointer',
                                  background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', gap: 4,
                                }}
                              >
                                ✏️ Edit
                              </button>
                              {entry.content && (
                                <button
                                  onClick={() => setKbExpandedId(kbExpandedId === entry.id ? null : entry.id)}
                                  style={{
                                    padding: '4px 10px', fontSize: 10.5, fontWeight: 600, borderRadius: 6,
                                    border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer',
                                    background: kbExpandedId === entry.id ? '#eff6ff' : '#fff',
                                    color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4,
                                  }}
                                >
                                  {kbExpandedId === entry.id ? '▲ Hide' : '▼ View'}
                                </button>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => handleToggleKB(entry.id, entry.is_active)}
                            style={{
                              padding: '4px 10px', fontSize: 10.5, fontWeight: 600, borderRadius: 6,
                              border: '1px solid rgba(220,38,38,0.15)', cursor: 'pointer',
                              background: entry.is_active ? '#ecfdf5' : '#fff',
                              color: entry.is_active ? '#065f46' : '#6b7280',
                            }}
                          >
                            {entry.is_active ? 'Active' : 'Disabled'}
                          </button>
                          <button
                            onClick={() => handleDeleteKB(entry.id)}
                            style={{
                              width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(220,38,38,0.15)',
                              background: '#fff', cursor: 'pointer', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={12} color="#ef4444" />
                          </button>
                        </div>
                      </div>
                      {/* Expandable content preview */}
                      {kbExpandedId === entry.id && entry.content && (
                        <div style={{
                          borderTop: '1px solid rgba(220,38,38,0.06)',
                          padding: '14px 16px',
                          background: '#fff',
                        }}>
                          {entry.source_url && (
                            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 10.5, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Source:</span>
                              <a href={entry.source_url} target="_blank" rel="noreferrer"
                                style={{ fontSize: 11, color: '#3b82f6', textDecoration: 'underline', wordBreak: 'break-all' }}>
                                {entry.source_url}
                              </a>
                            </div>
                          )}
                          {editingKbId === entry.id ? (
                            <textarea
                              value={editKbContent}
                              onChange={e => setEditKbContent(e.target.value)}
                              style={{
                                width: '100%', fontSize: 11.5, color: '#374151', lineHeight: 1.7,
                                background: '#fff', borderRadius: 8, padding: '12px 14px',
                                border: '1px solid #3b82f6', outline: 'none', fontFamily: 'monospace',
                                minHeight: 200, resize: 'vertical'
                              }}
                            />
                          ) : (
                            <div style={{
                              fontSize: 11.5, color: '#374151', lineHeight: 1.7,
                              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                              maxHeight: 320, overflowY: 'auto',
                              background: '#f9fafb', borderRadius: 8,
                              padding: '12px 14px',
                              border: '1px solid #e5e7eb',
                              fontFamily: 'monospace',
                            }}>
                              {entry.content}
                            </div>
                          )}
                          <div style={{ marginTop: 8, fontSize: 10.5, color: '#9ca3af' }}>
                            Showing all {entry.content.length.toLocaleString()} characters stored in Supabase knowledge_base table
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Property Listings Tab (Real Estate Only) ── */}
        {tab === 'Property Listings' && niche.id === 'realestate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Add/Edit Listing Form */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Home size={16} color="#dc2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                  {isEditingListing ? 'Edit Property Listing' : 'Add New Property'}
                </div>
              </div>
              <p style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 16 }}>
                Listings added here are instantly available to your AI agent when customers ask about available properties.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Property Title" value={listingForm.title} onChange={v => setListingForm({...listingForm, title: v})} hint="e.g. Luxury 2-Bed Apartment in DHA" />
                </div>
                <Field label="Area / Location" value={listingForm.area} onChange={v => setListingForm({...listingForm, area: v})} hint="e.g. DHA Phase 6" />
                <Field label="Price (PKR)" value={listingForm.price} onChange={v => setListingForm({...listingForm, price: v})} type="number" hint="e.g. 50000000" />
                
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Property Type</label>
                  <select 
                    value={listingForm.type}
                    onChange={e => setListingForm({...listingForm, type: e.target.value})}
                    style={{
                      width: '100%', padding: '10px 12px', fontSize: 13,
                      border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, background: '#fff',
                      fontFamily: 'inherit', color: '#1f2937', outline: 'none'
                    }}
                  >
                    <option value="flat">Apartment / Flat</option>
                    <option value="house">House / Villa</option>
                    <option value="plot">Plot / Land</option>
                    <option value="commercial">Commercial Space</option>
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  {listingForm.type !== 'commercial' && (
                    <>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Bedrooms</label>
                      <input 
                        type="number"
                        value={listingForm.bedrooms}
                        onChange={e => setListingForm({...listingForm, bedrooms: e.target.value})}
                        style={{
                          width: '100%', padding: '10px 12px', fontSize: 13,
                          border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, background: '#fff',
                          fontFamily: 'inherit', color: '#1f2937', outline: 'none'
                        }}
                      />
                    </>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Description</label>
                <textarea
                  value={listingForm.description}
                  onChange={e => setListingForm({...listingForm, description: e.target.value})}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: 13,
                    border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, background: '#fff',
                    fontFamily: 'inherit', color: '#1f2937', outline: 'none', resize: 'vertical'
                  }}
                  placeholder="Key features, amenities, nearby places..."
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Property Images</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {listingForm.photos_urls.map((url, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(220,38,38,0.15)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Property ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        onClick={() => setListingForm({...listingForm, photos_urls: listingForm.photos_urls.filter((_, i) => i !== idx)})}
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12 }}
                      >✕</button>
                    </div>
                  ))}
                  <label style={{ 
                    width: 80, height: 80, borderRadius: 8, border: '2px dashed rgba(220,38,38,0.2)', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', background: '#fff5f5', color: '#dc2626', transition: 'all 0.2s'
                  }}>
                    <Upload size={18} style={{ marginBottom: 4 }} />
                    <span style={{ fontSize: 10, fontWeight: 600 }}>Upload</span>
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setListingForm(prev => ({ ...prev, photos_urls: [...prev.photos_urls, reader.result as string] }));
                        };
                        reader.readAsDataURL(file);
                      });
                    }} />
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                {isEditingListing && (
                  <button 
                    onClick={() => {
                      setIsEditingListing(false);
                      setListingForm({ id: '', title: '', area: '', type: 'flat', bedrooms: '2', price: '', description: '', status: 'available', photos_urls: [] });
                    }}
                    style={{
                      padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#374151',
                      background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer'
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  onClick={handleSaveListing}
                  disabled={!listingForm.title || !listingForm.price}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 18px', fontSize: 13, fontWeight: 700,
                    background: (!listingForm.title || !listingForm.price) ? '#e5e7eb' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    color: (!listingForm.title || !listingForm.price) ? '#9ca3af' : '#fff',
                    border: 'none', borderRadius: 8, cursor: (!listingForm.title || !listingForm.price) ? 'default' : 'pointer'
                  }}
                >
                  <Check size={14} /> {isEditingListing ? 'Update Listing' : 'Save Property'}
                </button>
              </div>
            </div>

            {/* Listings Directory */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LayoutGrid size={16} color="#dc2626" />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Active Portfolio ({listings.length})</div>
                </div>
                {listingsLoading && <Loader2 size={14} color="#dc2626" style={{ animation: 'spin 1s linear infinite' }} />}
              </div>

              {listings.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af', fontSize: 12.5 }}>
                  No properties listed yet. Add your first listing above.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {listings.map(listing => (
                    <div key={listing.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', borderRadius: 10,
                      border: '1px solid', borderColor: listing.status === 'available' ? 'rgba(220,38,38,0.1)' : '#e5e7eb',
                      background: listing.status === 'available' ? '#fff' : '#f9fafb',
                      opacity: listing.status === 'available' ? 1 : 0.7
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{listing.title}</span>
                          <span style={{ 
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 6,
                            background: listing.status === 'available' ? '#ecfdf5' : '#f1f5f9',
                            color: listing.status === 'available' ? '#059669' : '#64748b'
                          }}>
                            {listing.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span>📍 {listing.area || 'N/A'}</span>
                          <span>🛏️ {listing.bedrooms} Beds</span>
                          <span>💰 PKR {listing.price?.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleToggleListingStatus(listing.id, listing.status)}
                          title={listing.status === 'available' ? 'Mark as Sold' : 'Mark as Available'}
                          style={{
                            padding: '6px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                            background: '#fff', border: '1px solid #e5e7eb', color: '#4b5563'
                          }}
                        >
                          {listing.status === 'available' ? 'Mark Sold' : 'Relist'}
                        </button>
                        <button
                          onClick={() => handleEditListing(listing)}
                          style={{
                            padding: '6px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                            background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          style={{
                            padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                            background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── eCommerce Platform Tab ── */}
        {tab === 'eCommerce Platform' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Platform Selector */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <ShoppingCart size={16} color="#dc2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Connect Your Store</div>
              </div>
              <p style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 16 }}>
                Connect your eCommerce platform so the AI agent can look up orders, check inventory, and create new orders from WhatsApp conversations.
              </p>

              {/* Connection status */}
              {ecomConnected && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#065f46',
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 16,
                }}>
                  <Check size={13} strokeWidth={3} /> {ecomPlatform} Connected
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {(['Shopify', 'WooCommerce', 'None'] as const).map(p => {
                  const active = ecomPlatform === p;
                  return (
                    <div
                      key={p}
                      onClick={() => setEcomPlatform(p)}
                      style={{
                        padding: '14px 10px', borderRadius: 10, cursor: 'pointer',
                        textAlign: 'center', position: 'relative',
                        border: active ? '2px solid #dc2626' : '1.5px solid rgba(220,38,38,0.08)',
                        background: active ? '#fef2f2' : '#fafafa',
                        transition: 'all 0.15s',
                      }}
                    >
                      {active && (
                        <div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={9} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                      <span style={{ fontSize: 22 }}>{p === 'Shopify' ? '🛍️' : p === 'WooCommerce' ? '🛒' : '⏸️'}</span>
                      <div style={{ fontSize: 12, fontWeight: 700, color: active ? '#991b1b' : '#374151', marginTop: 4 }}>{p === 'None' ? 'Not Connected' : p}</div>
                    </div>
                  );
                })}
              </div>

              {/* Shopify Fields */}
              {ecomPlatform === 'Shopify' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Shopify Store URL" value={shopifyUrl} onChange={setShopifyUrl} hint="e.g. mystorename.myshopify.com (no https://)" />
                  <Field label="Admin API Access Token" value={shopifyToken} onChange={setShopifyToken} type="password" hint="From Shopify Admin → Apps → Develop Apps → Install → Reveal token once" />
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
                    <strong>How to get your token:</strong> Shopify Admin → Settings → Apps → Develop apps → Create an app → Configure Admin API scopes (enable <code>read_orders</code>, <code>write_orders</code>, <code>read_products</code>, <code>read_inventory</code>, <code>read_customers</code>) → Install app → Reveal token.
                  </div>
                </div>
              )}

              {/* WooCommerce Fields */}
              {ecomPlatform === 'WooCommerce' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="WordPress Site URL" value={wcUrl} onChange={setWcUrl} hint="e.g. https://mystore.com" />
                  <Field label="Consumer Key" value={wcKey} onChange={setWcKey} type="password" hint="From WooCommerce → Settings → Advanced → REST API → Add Key" />
                  <Field label="Consumer Secret" value={wcSecret} onChange={setWcSecret} type="password" />
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
                    <strong>How to get your keys:</strong> WordPress Admin → WooCommerce → Settings → Advanced → REST API → Add Key → Description: &quot;Ittisalo&quot;, Permissions: Read/Write → Generate API Key.
                  </div>
                </div>
              )}

              {ecomPlatform !== 'None' && (
                <button
                  onClick={handleSaveEcom}
                  disabled={ecomSaving}
                  style={{
                    marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 22px', fontSize: 13, fontWeight: 700,
                    background: ecomSaving ? '#9ca3af' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    color: '#fff', border: 'none', borderRadius: 9,
                    cursor: ecomSaving ? 'default' : 'pointer',
                    boxShadow: '0 3px 10px rgba(220,38,38,0.2)',
                  }}
                >
                  {ecomSaving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><ShieldCheck size={14} /> Test & Save Connection</>}
                </button>
              )}
            </div>

            {/* n8n Integration Info */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Sparkles size={16} color="#dc2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>How It Works</div>
              </div>
              <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.7 }}>
                <p style={{ marginBottom: 8 }}>Once connected, your AI agent will automatically:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 8 }}>
                  {[
                    '🔍 Look up order status when a customer asks "where is my order?"',
                    '📦 Check live product inventory when asked about availability or sizes',
                    '🛒 Create new orders in your store when a customer confirms a purchase via chat',
                    '🏷️ Tag every WhatsApp-driven order as "source: ittisalo_whatsapp" in your store',
                  ].map((item, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: '#374151' }}>{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Voice & Opt-Outs Tab ── */}
        {tab === 'Voice & Opt-Outs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* AI Voice Transcriptions panel */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Volume2 size={16} color="#dc2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>AI Voice Note Auto-Transcription</div>
              </div>
              <p style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 16 }}>
                Automatically process incoming customer voice notes and display their full text transcript in active conversation flows.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#fafafa', borderRadius: 10, border: '1px solid rgba(220,38,38,0.06)', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>Enable Whisper Auto-Transcription</div>
                  <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>Transcribes OGG, MP3 voice memos instantly.</div>
                </div>
                <Toggle 
                  checked={voiceAutoTranscribe} 
                  onChange={() => setVoiceAutoTranscribe(!voiceAutoTranscribe)} 
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Transcription Engine Quality</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['Standard', 'Premium Whisper-4o'] as const).map(acc => {
                    const selected = voiceAccuracy === acc;
                    return (
                      <div 
                        key={acc} 
                        onClick={() => setVoiceAccuracy(acc)}
                        style={{
                          flex: 1, padding: '10px 12px', borderRadius: 9, cursor: 'pointer', textAlign: 'center',
                          border: selected ? '2px solid #dc2626' : '1px solid rgba(220,38,38,0.08)',
                          background: selected ? '#fef2f2' : '#fafafa',
                          fontSize: 12.5, fontWeight: 700, color: selected ? '#dc2626' : '#4b5563',
                          transition: 'all 0.15s',
                        }}
                      >
                        {acc}
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                  Premium quality model provides multi-lingual recognition accuracy for Urdu, Arabic, English, and Roman text.
                </p>
              </div>
            </div>

            {/* Opt-Out Lead Management panel */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <UserX size={16} color="#dc2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Opt-Out Lead Management</div>
              </div>
              <p style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 16 }}>
                Configure automated keyword triggers that immediately flag customer numbers as unsubscribed to maintain spam compliance.
              </p>

              {/* Counter status badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef2f2', border: '1px solid rgba(220,38,38,0.15)', color: '#dc2626', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
                <ShieldCheck size={14} /> Active Opt-Out List: {optOutCount} Contacts Flagged
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Unsubscribe Keywords</label>
                <input 
                  type="text" 
                  value={optOutKeywords} 
                  onChange={e => setOptOutKeywords(e.target.value)} 
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, background: '#fafafa', outline: 'none' }} 
                />
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Separated by commas. Matches are case-insensitive.</p>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Auto-Response Output Message</label>
                <textarea 
                  rows={3} 
                  value={optOutAutoReply} 
                  onChange={e => setOptOutAutoReply(e.target.value)} 
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, background: '#fafafa', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.4 }} 
                />
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>The final automated text dispatched immediately upon opt-out match detection.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Usage Quotas Tab ── */}
        {tab === 'Usage Quotas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Quota Indicators */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <BarChart3 size={16} color="#dc2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Messaging Volume Quotas (Current Cycle)</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* WA Quota */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                    <span>WhatsApp Business API Dispatches</span>
                    <span style={{ color: '#dc2626' }}>6,450 / 10,000 Messages (64.5%)</span>
                  </div>
                  <div style={{ width: '100%', height: 7, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ width: '64.5%', height: '100%', background: 'linear-gradient(90deg, #dc2626, #f59e0b)', borderRadius: 10 }} />
                  </div>
                </div>

                {/* TikTok Quota */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                    <span>TikTok Business Query Requests</span>
                    <span style={{ color: '#dc2626' }}>350 / 1,000 Calls (35%)</span>
                  </div>
                  <div style={{ width: '100%', height: 7, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ width: '35%', height: '100%', background: '#dc2626', borderRadius: 10 }} />
                  </div>
                </div>

                {/* Voice transcription Quota */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                    <span>Voice Note AI Transcriptions</span>
                    <span style={{ color: '#dc2626' }}>185 / 500 Minutes (37%)</span>
                  </div>
                  <div style={{ width: '100%', height: 7, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ width: '37%', height: '100%', background: '#dc2626', borderRadius: 10 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Packages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { name: 'Starter Plan', price: '$49', pricePKR: 'PKR 13,600', current: false, features: ['WhatsApp Single Channel', '1,000 monthly messages', 'Standard voice transcription', 'Basic email support'] },
                { name: 'Growth Plan', price: '$149', pricePKR: 'PKR 41,300', current: true, features: ['All Channels (WA + TikTok + IG)', '10,000 monthly messages', 'Premium Whisper transcribing', 'Instant human handoff controls', 'Priority WhatsApp support'] },
                { name: 'Enterprise Hub', price: '$399', pricePKR: 'PKR 110,700', current: false, features: ['Unlimited Omni-Channels', 'White-labeled studio portal', 'Full webhook and custom API key limits', '24/7 dedicated support staff'] },
              ].map(plan => (
                <div 
                  key={plan.name} 
                  style={{ 
                    background: '#fff', borderRadius: 14, padding: '20px', 
                    border: plan.current ? '2.5px solid #dc2626' : '1px solid rgba(220,38,38,0.08)', 
                    position: 'relative', boxShadow: '0 2px 10px rgba(0,0,0,0.01)'
                  }}
                >
                  {plan.current && (
                    <span style={{ position: 'absolute', top: -11, left: 20, background: '#dc2626', color: '#fff', fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20, boxShadow: '0 2px 6px rgba(220,38,38,0.2)' }}>
                      Current Active Plan
                    </span>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{plan.name}</div>
                      <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 1 }}>{plan.pricePKR}/month</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{plan.price}<span style={{ fontSize: 12, fontWeight: 550, color: '#9ca3af' }}>/mo</span></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginBottom: 16 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4b5563', fontWeight: 550 }}>
                        <Check size={12} color="#dc2626" strokeWidth={3} /> {f}
                      </div>
                    ))}
                  </div>

                  <button 
                    disabled={plan.current}
                    style={{ 
                      width: '100%', padding: '9px', fontSize: 12.5, fontWeight: 700, borderRadius: 9, cursor: plan.current ? 'default' : 'pointer',
                      background: plan.current ? '#f3f4f6' : 'linear-gradient(135deg, #dc2626, #b91c1c)', 
                      color: plan.current ? '#9ca3af' : '#fff', 
                      border: plan.current ? '1.5px solid #e5e7eb' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if(!plan.current) e.currentTarget.style.background = '#b91c1c'; }}
                    onMouseLeave={e => { if(!plan.current) e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)'; }}
                  >
                    {plan.current ? 'Active Plan Details' : 'Upgrade Subscription'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Save Button for profile sections */}
      {tab !== 'Usage Quotas' && (
        <button 
          onClick={handleSave} 
          style={{ 
            marginTop: 28, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 26px', fontSize: 13.5, fontWeight: 700, 
            background: saved ? '#10b981' : 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none', borderRadius: 10, 
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,0.25)', transition: 'background 0.15s' 
          }}
          onMouseEnter={e => { if(!saved) e.currentTarget.style.background = '#b91c1c'; }}
          onMouseLeave={e => { if(!saved) e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)'; }}
        >
          {saved ? <><Check size={15} strokeWidth={3} /> Changes Saved</> : 'Save Changes'}
        </button>
      )}

      {/* ── NICHE CHANGE DESTRUCTIVE WARNING MODAL ── */}
      {pendingNicheChange && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff', width: 440, borderRadius: 16,
            padding: '28px', border: '1px solid rgba(220,38,38,0.1)',
            boxShadow: '0 15px 45px rgba(0,0,0,0.2)',
            animation: 'fadeUp 0.15s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={20} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>Change Business Type?</h3>
            </div>
            
            <p style={{ fontSize: 13.5, color: '#4b5563', lineHeight: 1.5, marginBottom: 12 }}>
              You are about to switch your business niche to <strong>{niches.find(n => n.id === pendingNicheChange)?.label}</strong>.
            </p>
            <div style={{ background: '#fef2f2', padding: 12, borderRadius: 8, border: '1px solid #fecaca', marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: '#991b1b', margin: 0, lineHeight: 1.5 }}>
                <strong>Warning:</strong> This is a destructive action. Proceeding will permanently delete all your existing orders, appointments, leads, property listings, and AI knowledge base data. You will be redirected to the onboarding wizard.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setPendingNicheChange(null)}
                disabled={isChangingNiche}
                style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, border: '1px solid #e5e7eb', background: '#fff', color: '#4b5563', borderRadius: 9, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmNicheChange}
                disabled={isChangingNiche}
                style={{ 
                  padding: '10px 20px', fontSize: 13, fontWeight: 700, 
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', 
                  border: 'none', borderRadius: 9, cursor: isChangingNiche ? 'wait' : 'pointer', 
                  display: 'flex', alignItems: 'center', gap: 6, opacity: isChangingNiche ? 0.7 : 1
                }}
              >
                {isChangingNiche ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : 'Yes, Delete & Switch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#faf9f9' }}>
        <div style={{ color: '#dc2626', fontWeight: 600 }}>Loading Settings...</div>
      </div>
    }>
      <SettingsInner />
    </Suspense>
  );
}
