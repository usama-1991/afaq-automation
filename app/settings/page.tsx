'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Check, RefreshCw, Bot, Plug, Settings, Sparkles, 
  Volume2, UserX, BarChart3, Upload, Key, ShieldCheck, 
  User, CreditCard, LayoutGrid, Sliders, MessageSquare, 
  AlertCircle 
} from 'lucide-react';
import { useNiche } from '@/context/NicheContext';
import { niches } from '@/lib/niches';
import { supabase } from '@/lib/supabase/client';

const tabs = ['Business Profile', 'Channels & APIs', 'Voice & Opt-Outs', 'Usage Quotas'] as const;
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

  // Business settings
  const [businessName, setBusinessName] = useState('AutoFlow Solutions');
  const [ownerName, setOwnerName] = useState('Usama Habib');
  const [waNumber, setWaNumber] = useState('+92 300 0000000');
  const [location, setLocation] = useState('Karachi, Pakistan');
  const [website, setWebsite] = useState('https://autoflow.ai');

  // Dynamic niche fields
  const [menuLink, setMenuLink] = useState('https://menus.autoflow.ai/spice-garden');
  const [slotCapacity, setSlotCapacity] = useState('8');
  const [isHalal, setIsHalal] = useState(true);

  const [dentalEmergency, setDentalEmergency] = useState('+92 300 9991112');
  const [slotLength, setSlotLength] = useState('30');
  const [insurances, setInsurances] = useState('Jubilee Life, EFU Life, Adamjee Insurance');

  const [catalogLink, setCatalogLink] = useState('https://shop.autoflow.ai/lawn-collection');
  const [codEnabled, setCodEnabled] = useState(true);
  const [deliveryDays, setDeliveryDays] = useState('3');
  const [minOrder, setMinOrder] = useState('1500');

  const [agencyLicense, setAgencyLicense] = useState('RE-2026-9842');
  const [operatingCities, setOperatingCities] = useState('Karachi, Lahore, Islamabad');
  const [propertyTypes, setPropertyTypes] = useState('Luxury Apartments, Residential Plots');

  const [stylistsCount, setStylistsCount] = useState('5');
  const [bridalPackages, setBridalPackages] = useState(true);

  const [opdHours, setOpdHours] = useState('9:00 AM - 5:00 PM');
  const [emergencyPhone, setEmergencyPhone] = useState('+92 21 111 222 333');
  const [specialties, setSpecialties] = useState('Pediatrics, Cardiology, General Medicine');

  // APIs state
  const [openaiKey, setOpenaiKey] = useState('sk-proj-••••••••••••5aB2');
  const [waToken, setWaToken] = useState('EAAGm••••••••••••3kL');
  const [waPhoneId, setWaPhoneId] = useState('108253102123984');
  const [waAccountId, setWaAccountId] = useState('109283019238472');
  const [tiktokKey, setTiktokKey] = useState('tt-dev-••••••••••••x9A7');
  const [sheetKey, setSheetKey] = useState('AIza••••••••••••_M9');

  // Automation & Opt-Out settings
  const [voiceAutoTranscribe, setVoiceAutoTranscribe] = useState(true);
  const [voiceAccuracy, setVoiceAccuracy] = useState<'Standard' | 'Premium Whisper-4o'>('Premium Whisper-4o');
  const [optOutKeywords, setOptOutKeywords] = useState('STOP, UNSUBSCRIBE, CANCEL, MUT, EXIT');
  const [optOutAutoReply, setOptOutAutoReply] = useState('You have been successfully opted out of messages from our channel. You will not receive any further automated outreach.');

  // Opt-out lead count from localStorage (simulated)
  const [optOutCount, setOptOutCount] = useState(0);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && tabs.includes(t as any)) {
      setTab(t as Tab);
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('autoflow_contact_meta');
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
            const { data: tenant } = await supabase
              .from('tenants')
              .select('*')
              .eq('id', profile.tenant_id)
              .single();

            if (tenant) {
              if (tenant.business_name) setBusinessName(tenant.business_name);
              if (tenant.business_phone) setWaNumber(tenant.business_phone);
            }
          }
        }
      } catch (err) {
        console.error('Error loading tenant profile settings:', err);
      }
    };
    fetchTenantSettings();
  }, []);

  // Load custom simulated niche fields from localstorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`autoflow_custom_settings_${niche.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.menuLink) setMenuLink(parsed.menuLink);
        if (parsed.slotCapacity) setSlotCapacity(parsed.slotCapacity);
        if (parsed.isHalal !== undefined) setIsHalal(parsed.isHalal);
        if (parsed.dentalEmergency) setDentalEmergency(parsed.dentalEmergency);
        if (parsed.slotLength) setSlotLength(parsed.slotLength);
        if (parsed.insurances) setInsurances(parsed.insurances);
        if (parsed.catalogLink) setCatalogLink(parsed.catalogLink);
        if (parsed.codEnabled !== undefined) setCodEnabled(parsed.codEnabled);
        if (parsed.deliveryDays) setDeliveryDays(parsed.deliveryDays);
        if (parsed.minOrder) setMinOrder(parsed.minOrder);
        if (parsed.agencyLicense) setAgencyLicense(parsed.agencyLicense);
        if (parsed.operatingCities) setOperatingCities(parsed.operatingCities);
        if (parsed.propertyTypes) setPropertyTypes(parsed.propertyTypes);
        if (parsed.stylistsCount) setStylistsCount(parsed.stylistsCount);
        if (parsed.bridalPackages !== undefined) setBridalPackages(parsed.bridalPackages);
        if (parsed.opdHours) setOpdHours(parsed.opdHours);
        if (parsed.emergencyPhone) setEmergencyPhone(parsed.emergencyPhone);
        if (parsed.specialties) setSpecialties(parsed.specialties);
        if (parsed.ownerName) setOwnerName(parsed.ownerName);
        if (parsed.location) setLocation(parsed.location);
        if (parsed.website) setWebsite(parsed.website);
      }
    } catch (_) {}
  }, [niche]);

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
          // Update tenants table with basic profile data
          await supabase
            .from('tenants')
            .update({
              business_name: businessName,
              business_phone: waNumber
            })
            .eq('id', profile.tenant_id);
        }
      }
    } catch (err) {
      console.error('Error saving settings to Supabase:', err);
    }
    
    // Save other simulated fields to localstorage
    const localSettings = {
      menuLink, slotCapacity, isHalal, dentalEmergency, slotLength, insurances,
      catalogLink, codEnabled, deliveryDays, minOrder, agencyLicense, operatingCities,
      propertyTypes, stylistsCount, bridalPackages, opdHours, emergencyPhone, specialties,
      businessName, ownerName, waNumber, location, website
    };
    localStorage.setItem(`autoflow_custom_settings_${niche.id}`, JSON.stringify(localSettings));

    setSaved(true); 
    setTimeout(() => setSaved(false), 2000); 
  };
  
  const handleNicheChange = (id: string) => setNicheId(id);
  const handleReset = () => { 
    setOnboarded(false); 
    window.location.href = '/onboarding'; 
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1000 }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={24} color="#dc2626" /> System Settings
          </h1>
          <p style={{ fontSize: 13.5, color: '#6b7280', marginTop: 3 }}>Configure your AutoFlow AI channels, integrations, and preferences.</p>
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
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(220,38,38,0.08)', marginBottom: 28 }}>
        {tabs.map(t => {
          const active = tab === t;
          return (
            <button 
              key={t} 
              onClick={() => setTab(t)} 
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
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
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
              <Field label="WhatsApp Business Number" value={waNumber} onChange={setWaNumber} hint="Used to display in AI conversations" />
              <Field label="HQ Location" value={location} onChange={setLocation} />
              <Field label="Website Link" value={website} onChange={setWebsite} type="url" hint="Auto-scraped as primary knowledge base resource" />
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

            {/* Business Logo Upload */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Dashboard Logo</div>
              <div style={{ 
                border: '2.5px dashed rgba(220,38,38,0.15)', borderRadius: 12, padding: '24px', 
                textAlign: 'center', cursor: 'pointer', background: '#fff5f5', transition: 'all 0.15s' 
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#fef2f2';
                e.currentTarget.style.borderColor = '#dc2626';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#fff5f5';
                e.currentTarget.style.borderColor = 'rgba(220,38,38,0.15)';
              }}
              >
                <Upload size={22} color="#dc2626" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, color: '#4b5563', fontWeight: 600 }}>Upload company logo</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Supports SVG, PNG (Max 2MB)</div>
              </div>
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
              {/* OpenAI Key */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <Sparkles size={14} color="#dc2626" />
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>OpenAI Copilot Secret Key</label>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="password" 
                    value={openaiKey} 
                    onChange={e => setOpenaiKey(e.target.value)} 
                    style={{ flex: 1, padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', outline: 'none' }} 
                  />
                  <button style={{ padding: '8px 14px', fontSize: 12, border: '1px solid rgba(220,38,38,0.15)', borderRadius: 9, background: '#fff', cursor: 'pointer', color: '#dc2626', fontWeight: 600 }}>Test Connection</button>
                </div>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Powers user intent identification and chat automation replies.</p>
              </div>

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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

              {/* TikTok Business Link */}
              <div style={{ paddingTop: 10, borderTop: '1px solid rgba(220,38,38,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <Plug size={14} color="#dc2626" />
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>TikTok Business Client Key</label>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="password" 
                    value={tiktokKey} 
                    onChange={e => setTiktokKey(e.target.value)} 
                    style={{ flex: 1, padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, background: '#fafafa', outline: 'none' }} 
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef2f2', border: '1px solid rgba(220,38,38,0.15)', color: '#dc2626', padding: '0 12px', borderRadius: 9, fontSize: 11.5, fontWeight: 700 }}>
                    Active
                  </div>
                </div>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Syncs customer query direct messages from TikTok Business Creator Suite.</p>
              </div>

              {/* Google Sheets */}
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Google Sheets Sync API Key</label>
                <input 
                  type="password" 
                  value={sheetKey} 
                  onChange={e => setSheetKey(e.target.value)} 
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.12)', borderRadius: 9, background: '#fafafa', outline: 'none' }} 
                />
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
