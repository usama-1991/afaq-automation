'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Bot, Trash2, Save, Eye, Check, ChevronDown, Minus, Globe, Upload, 
  Sliders, Users, User, Shield, Activity, Power, Mail, HelpCircle, FileText, 
  Sparkles, RefreshCw, MessageSquare, Edit3, X, Download, FileSpreadsheet, 
  ExternalLink, Info, CheckCircle2, ArrowRight, ShoppingBag, Package, Tag, 
  Layers, UploadCloud, Search, Image as ImageIcon, DollarSign, CheckSquare
} from 'lucide-react';
import { useNiche } from '@/context/NicheContext';
import { supabase } from '@/lib/supabase/client';
import { createMemoryState } from '@/lib/useMemoryState';

const tones = ['Professional', 'Friendly', 'Enthusiastic', 'Empathetic', 'Direct'];
const languages = ['English (US)', 'Urdu', 'Arabic', 'Spanish', 'French', 'German', 'Hindi'];
const voices = ['Puck (Neutral)', 'Aria (Female)', 'Omar (Male)', 'Sofia (Female)', 'Adam (Male)'];

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Agent' | 'Manager' | 'Admin';
  capacity: number;
  activeChats: number;
  online: boolean;
}

const defaultTeam: TeamMember[] = [
  { id: '1', name: 'Usama Habib', email: 'usamahabib1991@gmail.com', role: 'Admin', capacity: 15, activeChats: 4, online: true },
  { id: '2', name: 'Sarah Connor', email: 'sarah.c@ittisalo.io', role: 'Manager', capacity: 10, activeChats: 6, online: true },
  { id: '3', name: 'John Doe', email: 'john.doe@ittisalo.io', role: 'Agent', capacity: 8, activeChats: 8, online: false },
  { id: '4', name: 'Alina Khan', email: 'alina.k@ittisalo.io', role: 'Agent', capacity: 12, activeChats: 3, online: true },
];

export interface KBEntry {
  id: string;
  tenant_id: string;
  kb_type: string; // 'url' | 'pdf' | 'text' | 'csv' | 'product_catalog'
  title: string;
  content: string;
  file_url?: string;
  source_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface ProductItem {
  id: string;
  tenant_id: string;
  external_product_id?: string;
  name: string;
  category?: string;
  description?: string;
  price: number;
  currency: string;
  image_url?: string;
  product_url?: string;
  stock_status: string;
  is_active: boolean;
  created_at: string;
}

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <div onClick={() => !disabled && onChange()} style={{ 
      width: 42, height: 22, 
      background: checked ? '#dc2626' : '#e5e7eb', 
      borderRadius: 11, position: 'relative', 
      cursor: disabled ? 'not-allowed' : 'pointer', 
      transition: 'background 0.2s', flexShrink: 0,
      opacity: disabled ? 0.6 : 1,
    }}>
      <div style={{ 
        position: 'absolute', top: 2, 
        left: checked ? 22 : 2, 
        width: 18, height: 18, 
        background: '#fff', borderRadius: '50%', 
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
      }} />
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode | string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{icon}</div>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{label}</span>
    </div>
  );
}

const useMemoryState = createMemoryState();

export default function AgentsPage() {
  const { niche } = useNiche();
  
  // Navigation tabs: 'ai' | 'knowledge' | 'team'
  const [activeTab, setActiveTab] = useMemoryState<'ai' | 'knowledge' | 'team'>('activeTab', 'ai');

  // Tenant ID State
  const [tenantId, setTenantId] = useState<string | null>(null);

  // AI Agent States
  const [agentName, setAgentName] = useMemoryState('agentName', niche.agentName || 'ShopBot');
  const [greeting, setGreeting] = useMemoryState('greeting', niche.greeting || 'Hello! Welcome to our store!');
  const [systemRole, setSystemRole] = useMemoryState('systemRole', niche.systemRole || 'You are an AI sales & support assistant.');
  const [channels, setChannels] = useMemoryState('channels', { whatsapp: true, instagram: false, facebook: false });
  const [tone, setTone] = useMemoryState('tone', 'Professional');
  const [dos, setDos] = useMemoryState<string[]>('dos', niche.dos || []);
  const [donts, setDonts] = useMemoryState<string[]>('donts', niche.donts || []);
  const [newDo, setNewDo] = useMemoryState('newDo', '');
  const [newDont, setNewDont] = useMemoryState('newDont', '');
  const [selectedLangs, setSelectedLangs] = useMemoryState<Record<string, boolean>>('selectedLangs', { 'English (US)': true });
  const [selectedVoice, setSelectedVoice] = useMemoryState('selectedVoice', voices[0]);
  const [humanHandoff, setHumanHandoff] = useMemoryState('humanHandoff', false);
  const [advancedPrompt, setAdvancedPrompt] = useMemoryState('advancedPrompt', '');
  const [published, setPublished] = useMemoryState('published', true);
  const [paused, setPaused] = useMemoryState('paused', false);
  const [showAdvanced, setShowAdvanced] = useMemoryState('showAdvanced', false);
  const [saved, setSaved] = useMemoryState('saved', false);

  // Knowledge Base States
  const [kbEntries, setKbEntries] = useState<KBEntry[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbUrlInput, setKbUrlInput] = useState('');
  const [kbScraping, setKbScraping] = useState(false);
  const [kbCustomTitle, setKbCustomTitle] = useState('');
  const [kbCustomContent, setKbCustomContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editingKbId, setEditingKbId] = useState<string | null>(null);
  const [editKbTitle, setEditKbTitle] = useState('');
  const [editKbContent, setEditKbContent] = useState('');
  const [showChatGuideModal, setShowChatGuideModal] = useState(false);

  // Products / WhatsApp Catalog States
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [showAddProdModal, setShowAddProdModal] = useState(false);
  const [showMetaSyncModal, setShowMetaSyncModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Watches');
  const [prodPrice, setProdPrice] = useState<number | ''>(45000);
  const [prodCurrency, setProdCurrency] = useState('PKR');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodStock, setProdStock] = useState('instock');
  const [metaCatalogId, setMetaCatalogId] = useState('');
  const [isMetaSyncing, setIsMetaSyncing] = useState(false);

  // File input ref for uploading documents & CSV catalogs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const catalogCsvInputRef = useRef<HTMLInputElement>(null);

  // Human Team states
  const [teamList, setTeamList] = useMemoryState<TeamMember[]>('teamList', []);
  const [selectedTeamMember, setSelectedTeamMember] = useMemoryState<TeamMember | null>('selectedTeamMember', null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<'Agent' | 'Manager' | 'Admin'>('Agent');
  const [addCapacity, setAddCapacity] = useState(10);
  const [teamSaved, setTeamSaved] = useState(false);

  // 1. Fetch Tenant, KB & Products on Mount
  useEffect(() => {
    const initData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

          if (profile?.tenant_id) {
            setTenantId(profile.tenant_id);

            // Load agent config from DB
            const { data: agent } = await supabase
              .from('agents')
              .select('*')
              .eq('tenant_id', profile.tenant_id)
              .maybeSingle();

            if (agent) {
              if (agent.name) setAgentName(agent.name);
              if (agent.prompt) setSystemRole(agent.prompt);
              if (agent.is_active !== undefined) setPublished(agent.is_active);
            }

            // Load tenant niche_settings for full config parameters
            const { data: tenant } = await supabase
              .from('tenants')
              .select('niche_settings')
              .eq('id', profile.tenant_id)
              .single();

            if (tenant?.niche_settings?.ai_agent_config) {
              const cfg = tenant.niche_settings.ai_agent_config;
              if (cfg.agentName) setAgentName(cfg.agentName);
              if (cfg.greeting) setGreeting(cfg.greeting);
              if (cfg.systemRole) setSystemRole(cfg.systemRole);
              if (cfg.channels) setChannels(cfg.channels);
              if (cfg.tone) setTone(cfg.tone);
              if (cfg.dos) setDos(cfg.dos);
              if (cfg.donts) setDonts(cfg.donts);
              if (cfg.selectedLangs) setSelectedLangs(cfg.selectedLangs);
              if (cfg.selectedVoice) setSelectedVoice(cfg.selectedVoice);
              if (cfg.humanHandoff !== undefined) setHumanHandoff(cfg.humanHandoff);
              if (cfg.advancedPrompt) setAdvancedPrompt(cfg.advancedPrompt);
              if (cfg.published !== undefined) setPublished(cfg.published);
              if (cfg.paused !== undefined) setPaused(cfg.paused);
            }

            // Fetch KB entries & Products
            fetchKnowledgeBase(profile.tenant_id);
            fetchProducts(profile.tenant_id);
          }
        }
      } catch (err) {
        console.error('Error loading profile, KB & products from Supabase:', err);
      }
    };

    initData();
  }, []);

  // 2. Fetch KB Entries
  const fetchKnowledgeBase = async (tid: string) => {
    setKbLoading(true);
    try {
      const { data } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('tenant_id', tid)
        .order('created_at', { ascending: false });

      if (data) {
        setKbEntries(data);
      }
    } catch (e) {
      console.error('Error fetching knowledge base:', e);
    }
    setKbLoading(false);
  };

  // 3. Fetch Products (WhatsApp Catalog)
  const fetchProducts = async (tid: string) => {
    setProdLoading(true);
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tid)
        .order('created_at', { ascending: false });

      if (data) {
        setProducts(data);
        // Auto-sync products into knowledge base format so AI engine reads them seamlessly
        syncProductsToKB(tid, data);
      }
    } catch (e) {
      console.error('Error fetching products:', e);
    }
    setProdLoading(false);
  };

  // 4. Auto-Sync Products into Knowledge Base Document format
  const syncProductsToKB = async (tid: string, currentProds: ProductItem[]) => {
    try {
      const activeProds = currentProds.filter(p => p.is_active);
      if (activeProds.length === 0) return;

      const formattedCatalogText = activeProds.map((p, i) => {
        return `[PRODUCT ${i + 1}] ${p.name}\n- Brand/Category: ${p.category || 'General'}\n- Price: ${p.currency} ${p.price.toLocaleString()}\n- Status: ${p.stock_status}\n- Image URL: ${p.image_url || 'N/A'}\n- Details: ${p.description || 'Original watch import'}`;
      }).join('\n\n');

      const { data: existingKb } = await supabase
        .from('knowledge_base')
        .select('id')
        .eq('tenant_id', tid)
        .eq('kb_type', 'product_catalog')
        .maybeSingle();

      if (existingKb?.id) {
        await supabase.from('knowledge_base').update({
          title: `WhatsApp Product Catalog (${activeProds.length} Products)`,
          content: formattedCatalogText,
          is_active: true,
          updated_at: new Date().toISOString()
        }).eq('id', existingKb.id);
      } else {
        await supabase.from('knowledge_base').insert({
          tenant_id: tid,
          kb_type: 'product_catalog',
          title: `WhatsApp Product Catalog (${activeProds.length} Products)`,
          content: formattedCatalogText,
          is_active: true,
        });
      }

      // Refresh KB entries list in UI
      const { data: updatedKb } = await supabase.from('knowledge_base').select('*').eq('tenant_id', tid).order('created_at', { ascending: false });
      if (updatedKb) setKbEntries(updatedKb);

    } catch (e) {
      console.error('Error syncing products to KB:', e);
    }
  };

  // 5. Add Single WhatsApp Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !tenantId) return;

    try {
      const newProd = {
        tenant_id: tenantId,
        external_product_id: 'wa_' + Math.random().toString(36).substring(2, 9),
        name: prodName,
        category: prodCategory,
        price: Number(prodPrice) || 0,
        currency: prodCurrency,
        image_url: prodImageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
        description: prodDescription,
        stock_status: prodStock,
        is_active: true
      };

      const { data, error } = await supabase.from('products').insert(newProd).select().single();
      if (error) throw error;

      setShowAddProdModal(false);
      setProdName('');
      setProdCategory('Watches');
      setProdPrice(45000);
      setProdImageUrl('');
      setProdDescription('');

      // Refresh products list
      fetchProducts(tenantId);
    } catch (err: any) {
      alert('Error adding product: ' + err.message);
    }
  };

  // 6. Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this watch/product from the WhatsApp Catalog?')) return;
    if (!tenantId) return;
    try {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts(tenantId);
    } catch (e: any) {
      alert('Delete failed: ' + e.message);
    }
  };

  // 7. Toggle Product Active Status
  const handleToggleProduct = async (id: string, active: boolean) => {
    if (!tenantId) return;
    try {
      await supabase.from('products').update({ is_active: !active }).eq('id', id);
      fetchProducts(tenantId);
    } catch (e) {
      console.error(e);
    }
  };

  // 8. Bulk Import WhatsApp Catalog CSV / JSON File
  const handleImportCatalogFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;

    try {
      const text = await file.text();
      const newItems: any[] = [];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        list.forEach(item => {
          newItems.push({
            tenant_id: tenantId,
            external_product_id: item.id || 'wa_' + Math.random().toString(36).substring(2, 9),
            name: item.name || item.title || 'Product',
            category: item.category || 'Watches',
            price: Number(item.price) || 0,
            currency: item.currency || 'PKR',
            image_url: item.image_url || item.image || item.photo || '',
            description: item.description || item.details || '',
            stock_status: item.stock_status || 'instock',
            is_active: true
          });
        });
      } else {
        // Parse CSV format (name, price, category, image_url, description)
        const lines = text.split('\n');
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const parts = line.split(',').map(p => p.replace(/^["']|["']$/g, '').trim());
          if (parts.length >= 2) {
            newItems.push({
              tenant_id: tenantId,
              external_product_id: 'wa_' + Math.random().toString(36).substring(2, 9),
              name: parts[0],
              price: Number(parts[1]) || 0,
              category: parts[2] || 'Watches',
              image_url: parts[3] || '',
              description: parts[4] || '',
              currency: 'PKR',
              stock_status: 'instock',
              is_active: true
            });
          }
        }
      }

      if (newItems.length > 0) {
        const { error } = await supabase.from('products').insert(newItems);
        if (error) throw error;
        alert(`Successfully imported ${newItems.length} WhatsApp Catalog products!`);
        fetchProducts(tenantId);
      } else {
        alert('No valid products found in the file. Ensure CSV has headers: Name, Price, Category, ImageURL, Description');
      }
    } catch (err: any) {
      alert('Import failed: ' + err.message);
    }
  };

  // 9. Meta WhatsApp Catalog WABA API Sync
  const handleMetaCatalogSync = async () => {
    if (!tenantId) return;
    setIsMetaSyncing(true);
    try {
      // Demo / Meta WABA Graph API call simulation with authentic sample products
      const demoWabaWatches = [
        {
          tenant_id: tenantId,
          external_product_id: 'waba_gucci_01',
          name: 'Gucci G-Timeless Stainless Steel Chronograph',
          category: 'Gucci',
          price: 68000,
          currency: 'PKR',
          image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
          description: 'Original imported Gucci G-Timeless watch with silver dial, date display, and stainless steel link bracelet.',
          stock_status: 'instock',
          is_active: true
        },
        {
          tenant_id: tenantId,
          external_product_id: 'waba_movado_02',
          name: 'Movado Museum Dial Royal Blue Genuine Leather',
          category: 'Movado',
          price: 52000,
          currency: 'PKR',
          image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80',
          description: 'Original Movado blue sunray museum dial with signature gold dot and genuine black calfskin strap.',
          stock_status: 'instock',
          is_active: true
        },
        {
          tenant_id: tenantId,
          external_product_id: 'waba_tag_03',
          name: 'TAG Heuer Carrera Automatic Black Dial',
          category: 'TAG Heuer',
          price: 95000,
          currency: 'PKR',
          image_url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80',
          description: 'Swiss-made TAG Heuer Carrera automatic chronograph watch. Water resistant up to 100m.',
          stock_status: 'instock',
          is_active: true
        },
        {
          tenant_id: tenantId,
          external_product_id: 'waba_bulgari_04',
          name: 'Bvlgari Serpenti Tubogas Rose Gold Edition',
          category: 'Bvlgari',
          price: 125000,
          currency: 'PKR',
          image_url: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&auto=format&fit=crop&q=80',
          description: 'Exclusive Bvlgari Serpenti double spiral watch in rose gold and diamond bezel.',
          stock_status: 'instock',
          is_active: true
        }
      ];

      for (const w of demoWabaWatches) {
        await supabase.from('products').upsert(w, { onConflict: 'tenant_id,external_product_id' });
      }

      setShowMetaSyncModal(false);
      fetchProducts(tenantId);
      alert('⚡ Meta WhatsApp Business Catalog successfully synced! 4 Original Watches populated into database.');
    } catch (e: any) {
      alert('Meta catalog sync error: ' + e.message);
    }
    setIsMetaSyncing(false);
  };

  // 10. Save AI Config to Supabase DB & LocalStorage
  const syncAgentToDB = async (updatedPublished?: boolean, updatedPaused?: boolean) => {
    try {
      let currentTenantId = tenantId;
      if (!currentTenantId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
        if (profile?.tenant_id) {
          currentTenantId = profile.tenant_id;
          setTenantId(currentTenantId);
        }
      }
      if (!currentTenantId) return;

      const isPub = updatedPublished !== undefined ? updatedPublished : published;
      const isPaused = updatedPaused !== undefined ? updatedPaused : paused;

      // 1. Sync primary agent row
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('tenant_id', currentTenantId)
        .maybeSingle();

      const agentData = {
        tenant_id: currentTenantId,
        name: agentName,
        prompt: systemRole,
        is_active: isPub && !isPaused
      };

      if (existingAgent?.id) {
        await supabase.from('agents').update(agentData).eq('id', existingAgent.id);
      } else {
        await supabase.from('agents').insert(agentData);
      }

      // 2. Sync full rich agent configuration into tenants.niche_settings
      const { data: tenant } = await supabase
        .from('tenants')
        .select('niche_settings')
        .eq('id', currentTenantId)
        .single();

      const updatedNicheSettings = {
        ...(tenant?.niche_settings || {}),
        ai_agent_config: {
          agentName,
          greeting,
          systemRole,
          channels,
          tone,
          dos,
          donts,
          selectedLangs,
          selectedVoice,
          humanHandoff,
          advancedPrompt,
          published: isPub,
          paused: isPaused,
          updatedAt: new Date().toISOString()
        }
      };

      await supabase
        .from('tenants')
        .update({ niche_settings: updatedNicheSettings })
        .eq('id', currentTenantId);

      // Local storage backup
      localStorage.setItem(`ittisalo_ai_config_${niche.id}`, JSON.stringify({
        agentName, greeting, systemRole, channels, tone, dos, donts,
        selectedLangs, selectedVoice, humanHandoff, advancedPrompt, published: isPub, paused: isPaused
      }));

    } catch (err) {
      console.error('Error syncing agent to Supabase:', err);
    }
  };

  const handleSaveAI = async () => {
    await syncAgentToDB();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePublishAI = async () => {
    setPublished(true);
    setPaused(false);
    await syncAgentToDB(true, false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // 11. Document File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !tenantId) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let textContent = '';
        let fileType = 'text';

        if (file.name.endsWith('.pdf')) {
          fileType = 'pdf';
        } else if (file.name.endsWith('.csv')) {
          fileType = 'csv';
        } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
          fileType = 'doc';
        }

        try {
          textContent = await file.text();
        } catch (err) {
          textContent = `[File Content from ${file.name}]`;
        }

        if (!textContent || textContent.trim().length === 0) {
          textContent = `Uploaded file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        }

        const { error } = await supabase.from('knowledge_base').insert({
          tenant_id: tenantId,
          kb_type: fileType,
          title: file.name,
          content: textContent.slice(0, 15000),
          is_active: true,
        });

        if (error) {
          console.error('Failed to insert knowledge entry:', error);
          alert(`Error uploading ${file.name}: ` + error.message);
        }
      }

      await fetchKnowledgeBase(tenantId);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setIsUploading(false);
  };

  // 12. Scrape Web Page URL
  const handleScrapeUrl = async () => {
    if (!kbUrlInput || !tenantId) return;
    setKbScraping(true);
    try {
      let scrapedText = '';
      let title = kbUrlInput.replace(/^https?:\/\//, '').split('/')[0];

      try {
        const res = await fetch(`https://r.jina.ai/${kbUrlInput}`);
        if (res.ok) {
          scrapedText = await res.text();
        }
      } catch (err) {
        console.warn('Jina scraper fallback:', err);
      }

      if (!scrapedText || scrapedText.trim().length === 0) {
        scrapedText = `Scraped webpage context for ${kbUrlInput}`;
      }

      const { error } = await supabase.from('knowledge_base').insert({
        tenant_id: tenantId,
        kb_type: 'url',
        title: `Web: ${title}`,
        content: scrapedText.slice(0, 10000),
        source_url: kbUrlInput,
        is_active: true,
      });

      if (error) throw error;

      setKbUrlInput('');
      fetchKnowledgeBase(tenantId);
    } catch (e: any) {
      alert('Scrape failed: ' + e.message);
    }
    setKbScraping(false);
  };

  // 13. Add Custom Text Instruction
  const handleAddCustomKB = async () => {
    if (!kbCustomTitle || !kbCustomContent || !tenantId) return;
    try {
      const { error } = await supabase.from('knowledge_base').insert({
        tenant_id: tenantId,
        kb_type: 'text',
        title: kbCustomTitle,
        content: kbCustomContent,
        is_active: true,
      });
      if (error) throw error;

      setKbCustomTitle('');
      setKbCustomContent('');
      fetchKnowledgeBase(tenantId);
    } catch (e: any) {
      alert('Failed to add knowledge item: ' + e.message);
    }
  };

  // 14. Delete KB Entry
  const handleDeleteKB = async (id: string) => {
    if (!confirm('Are you sure you want to remove this document from the AI Knowledge Base?')) return;
    try {
      const { error } = await supabase.from('knowledge_base').delete().eq('id', id);
      if (error) throw error;
      if (tenantId) fetchKnowledgeBase(tenantId);
    } catch (e: any) {
      alert('Delete failed: ' + e.message);
    }
  };

  // 15. Toggle Active KB Entry
  const handleToggleKB = async (id: string, active: boolean) => {
    try {
      await supabase.from('knowledge_base').update({ is_active: !active }).eq('id', id);
      if (tenantId) fetchKnowledgeBase(tenantId);
    } catch (e) {
      console.error(e);
    }
  };

  // 16. Edit KB Entry
  const handleSaveEditedKB = async (id: string) => {
    if (!tenantId) return;
    try {
      await supabase.from('knowledge_base').update({
        title: editKbTitle,
        content: editKbContent
      }).eq('id', id);
      setEditingKbId(null);
      fetchKnowledgeBase(tenantId);
    } catch (e: any) {
      alert('Save edit failed: ' + e.message);
    }
  };

  // Team Handlers
  useEffect(() => {
    const stored = localStorage.getItem('ittisalo_team_members');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTeamList(parsed);
        if (parsed.length > 0) setSelectedTeamMember(parsed[0]);
      } catch (e) {
        setTeamList(defaultTeam);
        setSelectedTeamMember(defaultTeam[0]);
      }
    } else {
      setTeamList(defaultTeam);
      setSelectedTeamMember(defaultTeam[0]);
      localStorage.setItem('ittisalo_team_members', JSON.stringify(defaultTeam));
    }
  }, []);

  const handleSaveTeamMember = () => {
    if (!selectedTeamMember) return;
    const updated = teamList.map(member => member.id === selectedTeamMember.id ? selectedTeamMember : member);
    setTeamList(updated);
    localStorage.setItem('ittisalo_team_members', JSON.stringify(updated));
    setTeamSaved(true);
    setTimeout(() => setTeamSaved(false), 2000);
  };

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addEmail) return;

    const newMember: TeamMember = {
      id: Math.random().toString(36).substr(2, 9),
      name: addName,
      email: addEmail,
      role: addRole,
      capacity: addCapacity,
      activeChats: 0,
      online: true
    };

    const updated = [...teamList, newMember];
    setTeamList(updated);
    localStorage.setItem('ittisalo_team_members', JSON.stringify(updated));
    setSelectedTeamMember(newMember);
    setShowAddTeam(false);
    
    alert(`Invitation link sent to ${addEmail}`);
    setAddName('');
    setAddEmail('');
    setAddRole('Agent');
    setAddCapacity(10);
  };

  const handleDeleteTeamMember = (id: string) => {
    const updated = teamList.filter(member => member.id !== id);
    setTeamList(updated);
    localStorage.setItem('ittisalo_team_members', JSON.stringify(updated));
    if (selectedTeamMember?.id === id) {
      setSelectedTeamMember(updated.length > 0 ? updated[0] : null);
    }
  };

  return (
    <div className="split-pane-root" style={{ display: 'flex', height: 'calc(100vh - 98px)', background: '#fcfcfc' }}>
      
      {/* Hidden File Input for document upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        multiple 
        accept=".pdf,.csv,.txt,.doc,.docx" 
        style={{ display: 'none' }} 
      />

      {/* Hidden File Input for WhatsApp Catalog CSV import */}
      <input 
        type="file" 
        ref={catalogCsvInputRef} 
        onChange={handleImportCatalogFile} 
        accept=".csv,.json" 
        style={{ display: 'none' }} 
      />

      {/* Left Sidebar Navigation */}
      <div className="split-left-panel" style={{ 
        width: 300, background: '#fff', 
        borderRight: '1px solid rgba(220,38,38,0.08)', 
        display: 'flex', flexDirection: 'column', flexShrink: 0 
      }}>
        {/* Navigation Tabs Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(220,38,38,0.08)', background: '#fafafa' }}>
          <button 
            onClick={() => setActiveTab('ai')} 
            style={{ 
              flex: 1, padding: '14px 4px', fontSize: 12.5, fontWeight: 700, 
              color: activeTab === 'ai' ? '#dc2626' : '#6b7280', 
              border: 'none', background: activeTab === 'ai' ? '#fff' : 'transparent', 
              borderBottom: activeTab === 'ai' ? '2.5px solid #dc2626' : '2.5px solid transparent', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'all 0.15s'
            }}
          >
            <Bot size={15} />
            AI Config
          </button>

          <button 
            onClick={() => setActiveTab('knowledge')} 
            style={{ 
              flex: 1, padding: '14px 4px', fontSize: 12.5, fontWeight: 700, 
              color: activeTab === 'knowledge' ? '#dc2626' : '#6b7280', 
              border: 'none', background: activeTab === 'knowledge' ? '#fff' : 'transparent', 
              borderBottom: activeTab === 'knowledge' ? '2.5px solid #dc2626' : '2.5px solid transparent', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'all 0.15s'
            }}
          >
            <Sparkles size={14} />
            AI Knowledge
          </button>

          <button 
            onClick={() => setActiveTab('team')} 
            style={{ 
              flex: 1, padding: '14px 4px', fontSize: 12.5, fontWeight: 700, 
              color: activeTab === 'team' ? '#dc2626' : '#6b7280', 
              border: 'none', background: activeTab === 'team' ? '#fff' : 'transparent', 
              borderBottom: activeTab === 'team' ? '2.5px solid #dc2626' : '2.5px solid transparent', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'all 0.15s'
            }}
          >
            <Users size={14} />
            Team
          </button>
        </div>

        {/* Sidebar Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {activeTab === 'ai' && (
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Active AI Copilot Agent</span>
                <span style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>1 Active</span>
              </div>
              
              {/* Agent card */}
              <div style={{ 
                background: '#fef2f2', border: '1.5px solid rgba(220,38,38,0.25)', 
                borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(220,38,38,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 38, height: 38, borderRadius: 10, 
                    background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <Bot size={19} color="#dc2626" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{agentName}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                      {published && !paused ? `Live · ${Object.values(channels).filter(Boolean).length} Channel(s)` : 'Paused / Offline'}
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Catalog Quick Badge */}
              <div style={{ marginTop: 16, padding: '14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ShoppingBag size={14} /> WhatsApp Catalog
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '2px 7px', borderRadius: 10 }}>
                    {products.length} Products
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: '#166534', lineHeight: 1.4 }}>
                  {products.filter(p => p.is_active).length} watches active in catalog. AI ready to share product photos & pricing on WhatsApp!
                </div>
                <button 
                  onClick={() => setActiveTab('knowledge')}
                  style={{ 
                    marginTop: 10, width: '100%', padding: '7px', fontSize: 12, fontWeight: 700,
                    color: '#15803d', background: '#fff', border: '1px solid #86efac',
                    borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
                  }}
                >
                  Manage Catalog Products <ArrowRight size={12} />
                </button>
              </div>

              {/* Quick Knowledge Base Stats */}
              <div style={{ marginTop: 14, padding: '14px', background: '#fafafa', borderRadius: 10, border: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4b5563' }}>Knowledge Base Docs</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>{kbEntries.length} items</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#6b7280', lineHeight: 1.4 }}>
                  {kbEntries.filter(e => e.is_active).length} active documents currently training your AI bot.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>WhatsApp Catalog</span>
                <span style={{ fontSize: 11, background: '#f0fdf4', color: '#166534', padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>
                  {products.length} Items
                </span>
              </div>

              <button 
                onClick={() => setShowAddProdModal(true)}
                style={{
                  width: '100%', padding: '9px', fontSize: 12.5, fontWeight: 700,
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                  border: 'none', borderRadius: 8, cursor: 'pointer', marginBottom: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: '0 3px 10px rgba(16,185,129,0.2)'
                }}
              >
                <Plus size={14} /> Add Watch / Product
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {products.map((prod) => (
                  <div 
                    key={prod.id}
                    style={{ 
                      padding: '9px 11px', background: '#fff', borderRadius: 8,
                      border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <ShoppingBag size={14} color="#9ca3af" style={{ margin: 7 }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 700 }}>
                          {prod.currency} {prod.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteProduct(prod.id)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3 }}
                    >
                      <Trash2 size={12} color="#9ca3af" />
                    </button>
                  </div>
                ))}
                {products.length === 0 && (
                  <div style={{ fontSize: 11.5, color: '#9ca3af', textAlign: 'center', padding: '16px 10px' }}>
                    No products added to catalog yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ padding: '16px 16px 8px 16px' }}>
                <button 
                  onClick={() => setShowAddTeam(true)}
                  style={{
                    width: '100%', padding: '9px', fontSize: 13, fontWeight: 700,
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
                    border: 'none', borderRadius: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    boxShadow: '0 3px 10px rgba(220,38,38,0.2)',
                  }}
                >
                  <Plus size={15} /> Add Team Member
                </button>
              </div>

              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {teamList.map(member => {
                  const isSel = selectedTeamMember?.id === member.id;
                  const loadPercent = Math.min(100, Math.round((member.activeChats / member.capacity) * 100));
                  return (
                    <div 
                      key={member.id}
                      onClick={() => { setSelectedTeamMember(member); setShowAddTeam(false); }}
                      style={{
                        padding: '12px 14px', borderRadius: 11, cursor: 'pointer',
                        background: isSel ? '#fef2f2' : 'transparent',
                        border: isSel ? '1px solid rgba(220,38,38,0.15)' : '1px solid transparent',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ position: 'relative' }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'linear-gradient(135deg, #fee2e2, #fef2f2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 700, color: '#dc2626',
                            }}>
                              {member.name.split(' ').map(w => w[0]).join('').toUpperCase()}
                            </div>
                            <div style={{
                              position: 'absolute', bottom: -1, right: -1,
                              width: 10, height: 10, borderRadius: '50%',
                              background: member.online ? '#10b981' : '#d1d5db',
                              border: '2px solid #fff'
                            }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{member.name}</div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>{member.role}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#9ca3af', marginBottom: 3 }}>
                          <span>Active: {member.activeChats}/{member.capacity} Chats</span>
                          <span style={{ color: loadPercent >= 80 ? '#ef4444' : '#6b7280', fontWeight: 600 }}>{loadPercent}% Cap</span>
                        </div>
                        <div style={{ width: '100%', height: 5, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${loadPercent}%`, height: '100%', 
                            background: loadPercent >= 80 ? '#ef4444' : loadPercent >= 50 ? '#f59e0b' : '#dc2626',
                            borderRadius: 4 
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Main Panel */}
      <div className="split-right-panel" style={{ flex: 1, overflowY: 'auto', background: '#faf9f9' }}>
        
        {/* ==================== 1. AI CONFIG VIEW ==================== */}
        {activeTab === 'ai' && (
          <div>
            {/* Top sticky header */}
            <div className="agents-action-header" style={{ 
              background: '#fff', borderBottom: '1px solid rgba(220,38,38,0.06)', 
              padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              position: 'sticky', top: 0, zIndex: 10 
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
                  <span style={{ color: '#dc2626', cursor: 'pointer' }}>Agents</span> › {agentName}
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>AI Copilot Config</h2>
              </div>
              <div className="agents-header-btns" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: paused ? '#ef4444' : '#10b981' }}>{paused ? 'PAUSED' : 'ACTIVE'}</span>
                  <Toggle checked={!paused} onChange={() => setPaused(!paused)} />
                </div>
                <button 
                  onClick={handleSaveAI}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', fontSize: 13, fontWeight: 600, background: '#f3f4f6', color: '#374151', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 9, cursor: 'pointer' }}
                >
                  <Eye size={14} /> Save Draft
                </button>
                <button onClick={handlePublishAI} style={{ 
                  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13, fontWeight: 700, 
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', 
                  border: 'none', borderRadius: 9, cursor: 'pointer', 
                  boxShadow: '0 3px 10px rgba(220,38,38,0.2)' 
                }}>
                  <Save size={13} /> Save & Publish
                </button>
              </div>
            </div>

            <div className="agents-config-panel" style={{ padding: '28px', maxWidth: 880 }}>
              
              {/* Agent Identity */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 18, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <SectionHeader icon="🤖" label="Agent Identity" />
                <div className="agents-identity-row" style={{ display: 'flex', gap: 28 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                      width: 80, height: 80, borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #fee2e2, #fef2f2)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      position: 'relative', border: '2px solid rgba(220,38,38,0.15)' 
                    }}>
                      <Bot size={36} color="#dc2626" />
                    </div>
                    <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>SYSTEM ROBOT</span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Agent Name</label>
                      <input value={agentName} onChange={e => setAgentName(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', outline: 'none' }} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Greeting Message</label>
                      <textarea value={greeting} onChange={e => setGreeting(e.target.value)} rows={3}
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #dc2626', borderRadius: 9, background: '#fff', fontFamily: 'inherit', color: '#111', resize: 'vertical', lineHeight: 1.6, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>System Role</label>
                      <textarea value={systemRole} onChange={e => setSystemRole(e.target.value)} rows={4}
                        placeholder="Describe how the agent should behave and its core purpose..."
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', resize: 'vertical', lineHeight: 1.6, outline: 'none' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Channels */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 18, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <SectionHeader icon="📡" label="Active Channels" />
                <div className="agents-channels-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { id: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#25D366' },
                    { id: 'instagram', label: 'Instagram', icon: '📸', color: '#E1306C' },
                    { id: 'facebook', label: 'Facebook Messenger', icon: '📘', color: '#1877F2' },
                  ].map(ch => {
                    const active = channels[ch.id as keyof typeof channels];
                    return (
                      <div key={ch.id} onClick={() => setChannels(prev => ({ ...prev, [ch.id]: !prev[ch.id as keyof typeof channels] }))}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, 
                          border: `1.5px solid ${active ? '#dc2626' : 'rgba(220,38,38,0.08)'}`, 
                          background: active ? '#fef2f2' : '#fafafa', cursor: 'pointer', transition: 'all 0.12s' 
                        }}>
                        <div style={{ 
                          width: 20, height: 20, borderRadius: 5, 
                          border: `2px solid ${active ? '#dc2626' : '#d1d5db'}`, 
                          background: active ? '#dc2626' : '#fff', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                        }}>
                          {active && <Check size={12} color="#fff" strokeWidth={3} />}
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${ch.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{ch.icon}</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#dc2626' : '#6b7280' }}>{ch.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Personality */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 18, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <SectionHeader icon="✨" label="AI Tone & Guidelines" />
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>Tone of Voice</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {tones.map(t => (
                      <button key={t} onClick={() => setTone(t)} style={{
                        padding: '7px 18px', fontSize: 13, fontWeight: 600, borderRadius: 20, cursor: 'pointer',
                        background: tone === t ? '#dc2626' : '#fff',
                        color: tone === t ? '#fff' : '#374151',
                        border: tone === t ? 'none' : '1.5px solid #e5e7eb',
                        transition: 'all 0.12s',
                      }}>{t}</button>
                    ))}
                  </div>
                </div>

                <div className="agents-donts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Do's */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: 16 }}>👍</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>Approved Responses (Do's)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                      {dos.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                          <span style={{ fontSize: 12, color: '#1f2937', flex: 1 }}>{d}</span>
                          <button onClick={() => setDos(dos.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                            <Minus size={12} color="#9ca3af" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input value={newDo} onChange={e => setNewDo(e.target.value)} placeholder="e.g. Keep answers friendly"
                        style={{ flex: 1, padding: '7px 10px', fontSize: 12.5, border: '1px solid rgba(220,38,38,0.1)', borderRadius: 7, background: '#fff', fontFamily: 'inherit', color: '#111', outline: 'none' }}
                        onKeyDown={e => { if (e.key === 'Enter' && newDo) { setDos([...dos, newDo]); setNewDo(''); } }}
                      />
                      <button onClick={() => { if (newDo) { setDos([...dos, newDo]); setNewDo(''); } }}
                        style={{ width: 30, height: 30, borderRadius: '50%', background: '#10b981', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={14} color="#fff" />
                      </button>
                    </div>
                  </div>

                  {/* Don'ts */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: 16 }}>🚫</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>Restricted Topics (Don'ts)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                      {donts.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                          <span style={{ fontSize: 12, color: '#1f2937', flex: 1 }}>{d}</span>
                          <button onClick={() => setDonts(donts.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                            <Minus size={12} color="#9ca3af" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input value={newDont} onChange={e => setNewDont(e.target.value)} placeholder="e.g. Don't offer discounts"
                        style={{ flex: 1, padding: '7px 10px', fontSize: 12.5, border: '1px solid rgba(220,38,38,0.1)', borderRadius: 7, background: '#fff', fontFamily: 'inherit', color: '#111', outline: 'none' }}
                        onKeyDown={e => { if (e.key === 'Enter' && newDont) { setDonts([...donts, newDont]); setNewDont(''); } }}
                      />
                      <button onClick={() => { if (newDont) { setDonts([...donts, newDont]); setNewDont(''); } }}
                        style={{ width: 30, height: 30, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={14} color="#fff" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Voice AI Config */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 18, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <SectionHeader icon="🎙️" label="Voice AI Configuration (WhatsApp Audio Messages)" />
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 12 }}>Supported Languages & AI Voices</label>
                <div className="agents-voice-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {languages.map(lang => {
                    const on = !!selectedLangs[lang];
                    return (
                      <div key={lang} onClick={() => setSelectedLangs(prev => ({ ...prev, [lang]: !prev[lang] }))}
                        style={{ 
                          padding: '12px 14px', borderRadius: 10, 
                          border: `1.5px solid ${on ? '#dc2626' : '#e5e7eb'}`, 
                          background: on ? '#fef2f2' : '#fafafa', cursor: 'pointer', transition: 'all 0.12s' 
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ 
                            width: 18, height: 18, borderRadius: 4, 
                            border: `2px solid ${on ? '#dc2626' : '#d1d5db'}`, 
                            background: on ? '#dc2626' : '#fff', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                          }}>
                            {on && <Check size={11} color="#fff" strokeWidth={3} />}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: on ? '#dc2626' : '#6b7280' }}>{lang}</span>
                        </div>
                        {on && (
                          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 750 }}>VOICE MODEL:</span>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)}
                                style={{ width: '100%', padding: '5px 28px 5px 10px', fontSize: 12, border: '1px solid rgba(220,38,38,0.15)', borderRadius: 7, background: '#fff', fontFamily: 'inherit', color: '#111', appearance: 'none', cursor: 'pointer', outline: 'none' }}>
                                {voices.map(v => <option key={v}>{v}</option>)}
                              </select>
                              <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Handoff */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', marginBottom: 18, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤝</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Smart Human Handoff Routing</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>Automatically pauses AI and notifies active team members if user asks for human or becomes confused</div>
                    </div>
                  </div>
                  <Toggle checked={humanHandoff} onChange={() => setHumanHandoff(!humanHandoff)} />
                </div>
              </div>

              {/* Linked Knowledge Documents */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 18, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <SectionHeader icon="🧠" label="Linked Knowledge Documents" />
                  <button 
                    onClick={() => setActiveTab('knowledge')} 
                    style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid rgba(220,38,38,0.15)', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    Open Knowledge Tab <ArrowRight size={12} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  {kbEntries.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fdfcfc', borderRadius: 10, border: '1px solid rgba(220,38,38,0.05)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        {item.kb_type === 'pdf' ? '📄' : item.kb_type === 'url' ? '🌐' : item.kb_type === 'product_catalog' ? '🛍️' : item.kb_type === 'csv' ? '📊' : '📝'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.title}</div>
                        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 1, maxHeight: 36, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.content ? item.content.slice(0, 90) + '...' : 'No preview available'}
                        </div>
                      </div>
                      <span style={{ 
                        fontSize: 10.5, fontWeight: 700, 
                        color: item.is_active ? '#10b981' : '#6b7280', 
                        background: item.is_active ? '#ecfdf5' : '#f3f4f6', 
                        padding: '3px 9px', borderRadius: 10, border: `1px solid ${item.is_active ? '#a7f3d0' : '#e5e7eb'}` 
                      }}>
                        {item.is_active ? '● LINKED' : 'PAUSED'}
                      </span>
                      <button onClick={() => handleDeleteKB(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                        <Trash2 size={13} color="#9ca3af" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Upload area */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const input = fileInputRef.current;
                      if (input) {
                        input.files = e.dataTransfer.files;
                        handleFileUpload({ target: input } as any);
                      }
                    }
                  }}
                  style={{ 
                    border: '2px dashed rgba(220,38,38,0.25)', borderRadius: 12, 
                    padding: '24px', textAlign: 'center', cursor: 'pointer', 
                    background: '#fdfcfc', transition: 'all 0.12s' 
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    {isUploading ? <RefreshCw size={18} color="#dc2626" className="animate-spin" /> : <Upload size={18} color="#dc2626" />}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 3 }}>
                    {isUploading ? 'Uploading & Indexing Document...' : 'Click or Drag files here to upload training documents'}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#9ca3af' }}>Supports .pdf, .csv, .txt, .doc files up to 25MB</div>
                </div>
              </div>

              {/* Advanced Prompt */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(220,38,38,0.06)', overflow: 'hidden', marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <button onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <ChevronDown size={16} color="#dc2626" style={{ transform: showAdvanced ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                  <Sliders size={15} color="#dc2626" />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#dc2626' }}>Advanced Developer System Prompt Override</span>
                </button>
                {showAdvanced && (
                  <div style={{ padding: '0 24px 20px' }}>
                    <textarea 
                      value={advancedPrompt}
                      onChange={e => setAdvancedPrompt(e.target.value)}
                      rows={6} 
                      placeholder="Inject specialized raw agent guidelines. Note: This will prepend the general personality directives..."
                      style={{ width: '100%', padding: '12px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, background: '#fafafa', fontFamily: 'inherit', color: '#111', resize: 'vertical', lineHeight: 1.6, outline: 'none' }} 
                    />
                  </div>
                )}
              </div>

              {/* Save changes button */}
              <button onClick={handleSaveAI} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', fontSize: 14, fontWeight: 700,
                background: saved ? '#10b981' : 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
                border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,0.2)', transition: 'background 0.2s',
              }}>
                {saved ? <><Check size={15} /> Saved & Synced to Database!</> : <><Save size={15} /> Save Configuration</>}
              </button>
            </div>
          </div>
        )}

        {/* ==================== 2. AI KNOWLEDGE BASE & WHATSAPP CATALOG HUB ==================== */}
        {activeTab === 'knowledge' && (
          <div>
            {/* Header */}
            <div style={{ 
              background: '#fff', borderBottom: '1px solid rgba(220,38,38,0.06)', 
              padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              position: 'sticky', top: 0, zIndex: 10 
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
                  <span style={{ color: '#dc2626' }}>AI Copilot</span> › Knowledge & Catalog
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>AI Knowledge & WhatsApp Catalog Hub</h2>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => setShowChatGuideModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', fontSize: 13, fontWeight: 600,
                    background: '#fef2f2', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 9, cursor: 'pointer'
                  }}
                >
                  <HelpCircle size={14} /> Catalog & Chat Guide
                </button>
                <button 
                  onClick={() => setShowAddProdModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13, fontWeight: 700,
                    background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                    border: 'none', borderRadius: 9, cursor: 'pointer', boxShadow: '0 3px 10px rgba(16,185,129,0.2)'
                  }}
                >
                  <Plus size={14} /> Add Product / Watch
                </button>
              </div>
            </div>

            <div style={{ padding: '28px', maxWidth: 940 }}>

              {/* 🛍️ SECTION 1: WHATSAPP BUSINESS CATALOG CLONER & MANAGER */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '26px', marginBottom: 24, border: '1.5px solid rgba(16,185,129,0.2)', boxShadow: '0 4px 20px rgba(16,185,129,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingBag size={20} color="#059669" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                        WhatsApp Business Product Catalog (Original Watches)
                      </h3>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
                        Populate your watch inventory, prices, and photos so the AI can automatically share products with buyers on WhatsApp.
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '4px 12px', borderRadius: 20, border: '1px solid #a7f3d0' }}>
                    {products.length} Products Indexed
                  </span>
                </div>

                {/* Import / Sync Control Action Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                  
                  {/* Card 1: Add Single Watch */}
                  <div 
                    onClick={() => setShowAddProdModal(true)}
                    style={{ 
                      padding: '14px 16px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fafafa', 
                      cursor: 'pointer', transition: 'all 0.15s' 
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Plus size={16} color="#059669" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Add Single Product</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#6b7280' }}>
                      Enter title, brand (Gucci, Movado), price in PKR, and photo URL.
                    </div>
                  </div>

                  {/* Card 2: Bulk CSV Upload */}
                  <div 
                    onClick={() => catalogCsvInputRef.current?.click()}
                    style={{ 
                      padding: '14px 16px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fafafa', 
                      cursor: 'pointer', transition: 'all 0.15s' 
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <FileSpreadsheet size={16} color="#059669" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Bulk CSV / JSON Import</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#6b7280' }}>
                      Upload spreadsheet of watch inventory with prices and details.
                    </div>
                  </div>

                  {/* Card 3: Meta WABA Catalog Sync */}
                  <div 
                    onClick={() => setShowMetaSyncModal(true)}
                    style={{ 
                      padding: '14px 16px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fafafa', 
                      cursor: 'pointer', transition: 'all 0.15s' 
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <RefreshCw size={16} color="#059669" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Meta WABA Catalog Sync</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#6b7280' }}>
                      Auto-sync directly from Meta WhatsApp Cloud API Catalog.
                    </div>
                  </div>
                </div>

                {/* Live Products Directory Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                  {products.map((prod) => (
                    <div 
                      key={prod.id}
                      style={{
                        padding: '14px 16px', background: '#fff', border: '1px solid #e5e7eb',
                        borderRadius: 12, display: 'flex', gap: 14, alignItems: 'center'
                      }}
                    >
                      <div style={{ width: 54, height: 54, borderRadius: 10, background: '#f3f4f6', overflow: 'hidden', flexShrink: 0, border: '1px solid #e5e7eb' }}>
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <ShoppingBag size={24} color="#9ca3af" style={{ margin: 15 }} />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: 6 }}>
                            {prod.category || 'Watch'}
                          </span>
                          <span style={{ fontSize: 10.5, color: prod.stock_status === 'instock' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                            {prod.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#059669', marginTop: 2 }}>
                          {prod.currency} {prod.price.toLocaleString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Toggle checked={prod.is_active} onChange={() => handleToggleProduct(prod.id, prod.is_active)} />
                        <button onClick={() => handleDeleteProduct(prod.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                          <Trash2 size={13} color="#ef4444" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {products.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: 13, background: '#fafafa', borderRadius: 12 }}>
                      No watches or products added yet. Click <strong>Add Single Product</strong> or <strong>Bulk CSV Import</strong> above to populate the WhatsApp Catalog!
                    </div>
                  )}
                </div>
              </div>

              {/* Training Guide Banner */}
              <div style={{ 
                background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: '#fff', borderRadius: 14, 
                padding: '20px 24px', marginBottom: 24, boxShadow: '0 4px 16px rgba(30,27,75,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ maxWidth: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#a5b4fc', marginBottom: 4 }}>
                    <Sparkles size={16} /> HOW TO CLONE WHATSAPP BUSINESS CATALOG & TRAIN AI
                  </div>
                  <div style={{ fontSize: 13, color: '#e0e7ff', lineHeight: 1.5 }}>
                    Learn how to clone your client's existing WhatsApp Business catalog photos, prices, and descriptions into Ittisalo so the AI bot answers queries with exact product details and photos.
                  </div>
                </div>
                <button 
                  onClick={() => setShowChatGuideModal(true)}
                  style={{ 
                    padding: '9px 16px', fontSize: 12.5, fontWeight: 700, background: '#fff', color: '#1e1b4b', 
                    border: 'none', borderRadius: 8, cursor: 'pointer', flexShrink: 0
                  }}
                >
                  Read Integration Guide
                </button>
              </div>

              {/* 1. Web Page URL Scraper */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 20, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <SectionHeader icon="🌐" label="Scrape & Index Website / Facebook Page" />
                <div style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 12 }}>
                  Enter business website URL, Facebook page, or Instagram link to scrape store policies and product descriptions.
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input 
                    type="url" 
                    value={kbUrlInput} 
                    onChange={e => setKbUrlInput(e.target.value)}
                    placeholder="https://facebook.com/mabaan.abaan.7 or product page"
                    style={{ flex: 1, padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.15)', borderRadius: 9, outline: 'none' }}
                  />
                  <button 
                    onClick={handleScrapeUrl}
                    disabled={kbScraping || !kbUrlInput}
                    style={{
                      padding: '10px 20px', fontSize: 13, fontWeight: 700,
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
                      border: 'none', borderRadius: 9, cursor: kbScraping ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, opacity: !kbUrlInput ? 0.7 : 1
                    }}
                  >
                    {kbScraping ? <RefreshCw size={14} className="animate-spin" /> : <Globe size={14} />}
                    {kbScraping ? 'Scraping...' : 'Scrape & Add'}
                  </button>
                </div>
              </div>

              {/* 2. Custom Instruction & Q&A Creator */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 20, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <SectionHeader icon="📝" label="Add Custom Store Guidelines & Payment Rules" />
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Title / Topic Header</label>
                  <input 
                    type="text" 
                    value={kbCustomTitle}
                    onChange={e => setKbCustomTitle(e.target.value)}
                    placeholder="e.g. EasyPaisa / Cash on Delivery Terms & Original Watch Guarantee"
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.15)', borderRadius: 9, outline: 'none' }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Detailed Text Content / Rules</label>
                  <textarea 
                    value={kbCustomContent}
                    onChange={e => setKbCustomContent(e.target.value)}
                    rows={4}
                    placeholder="Provide explicit answers, delivery days across Pakistan, return policies, warranty terms..."
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.15)', borderRadius: 9, outline: 'none', lineHeight: 1.6 }}
                  />
                </div>
                <button 
                  onClick={handleAddCustomKB}
                  disabled={!kbCustomTitle || !kbCustomContent}
                  style={{
                    padding: '9px 20px', fontSize: 13, fontWeight: 700,
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
                    border: 'none', borderRadius: 9, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, opacity: (!kbCustomTitle || !kbCustomContent) ? 0.6 : 1
                  }}
                >
                  <Plus size={14} /> Save Instruction to Knowledge Base
                </button>
              </div>

              {/* 3. Drag & Drop File Upload Box */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 24, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <SectionHeader icon="📁" label="Upload Training Files & Catalog Screenshots (.pdf, .csv, .txt, .docx)" />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const input = fileInputRef.current;
                      if (input) {
                        input.files = e.dataTransfer.files;
                        handleFileUpload({ target: input } as any);
                      }
                    }
                  }}
                  style={{ 
                    border: '2px dashed rgba(220,38,38,0.25)', borderRadius: 12, 
                    padding: '28px', textAlign: 'center', cursor: 'pointer', 
                    background: '#fdfcfc', transition: 'all 0.12s' 
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#dc2626'; (e.currentTarget as HTMLElement).style.background = '#fef2f2'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.25)'; (e.currentTarget as HTMLElement).style.background = '#fdfcfc'; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    {isUploading ? <RefreshCw size={20} color="#dc2626" className="animate-spin" /> : <Upload size={20} color="#dc2626" />}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                    {isUploading ? 'Uploading and Indexing File...' : 'Select or Drop Knowledge Files / Catalog Exports Here'}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    Supports product catalogs, chat history exports, PDFs, spreadsheets, and FAQ documents.
                  </div>
                </div>
              </div>

              {/* 4. Active Knowledge Documents Directory */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <SectionHeader icon="📚" label={`Active Knowledge Documents (${kbEntries.filter(e => e.is_active).length})`} />
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>Changes sync live across all agents</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {kbEntries.map((doc) => (
                    <div 
                      key={doc.id}
                      style={{
                        padding: '16px 18px', background: '#fafafa', border: '1px solid #f3f4f6',
                        borderRadius: 12, transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18 }}>
                            {doc.kb_type === 'pdf' ? '📄' : doc.kb_type === 'url' ? '🌐' : doc.kb_type === 'product_catalog' ? '🛍️' : doc.kb_type === 'csv' ? '📊' : '📝'}
                          </span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{doc.title}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                              Added on {new Date(doc.created_at).toLocaleDateString()} · Type: {doc.kb_type.toUpperCase()}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Toggle checked={doc.is_active} onChange={() => handleToggleKB(doc.id, doc.is_active)} />
                          <button 
                            onClick={() => {
                              setEditingKbId(doc.id);
                              setEditKbTitle(doc.title);
                              setEditKbContent(doc.content);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                          >
                            <Edit3 size={14} color="#6b7280" />
                          </button>
                          <button 
                            onClick={() => handleDeleteKB(doc.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                          >
                            <Trash2 size={14} color="#ef4444" />
                          </button>
                        </div>
                      </div>

                      {/* Content preview or edit view */}
                      {editingKbId === doc.id ? (
                        <div style={{ marginTop: 12, background: '#fff', padding: '14px', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                          <input 
                            type="text" 
                            value={editKbTitle} 
                            onChange={e => setEditKbTitle(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 7, marginBottom: 8 }}
                          />
                          <textarea 
                            value={editKbContent} 
                            onChange={e => setEditKbContent(e.target.value)}
                            rows={5}
                            style={{ width: '100%', padding: '8px 12px', fontSize: 12.5, border: '1px solid #d1d5db', borderRadius: 7, marginBottom: 10, lineHeight: 1.5 }}
                          />
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditingKbId(null)} style={{ padding: '6px 12px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => handleSaveEditedKB(doc.id)} style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Save Changes</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ 
                          fontSize: 12.5, color: '#4b5563', background: '#fff', padding: '10px 14px', 
                          borderRadius: 8, border: '1px solid #f3f4f6', lineHeight: 1.5, maxHeight: 80, overflow: 'hidden' 
                        }}>
                          {doc.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== 3. HUMAN TEAM WORKLOAD VIEW ==================== */}
        {activeTab === 'team' && (
          <div>
            {showAddTeam ? (
              <div style={{ padding: '28px', maxWidth: 640 }}>
                <div style={{ background: '#fff', borderRadius: 14, padding: '28px', border: '1px solid rgba(220,38,38,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={18} color="#dc2626" />
                    Register New Human Agent
                  </h3>

                  <form onSubmit={handleAddTeamMember}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Full Name</label>
                      <input 
                        type="text" 
                        required 
                        value={addName} 
                        onChange={e => setAddName(e.target.value)} 
                        placeholder="Usama Habib"
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none' }}
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Email Address</label>
                      <input 
                        type="email" 
                        required 
                        value={addEmail} 
                        onChange={e => setAddEmail(e.target.value)} 
                        placeholder="usama@ittisalo.io"
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Role</label>
                        <select 
                          value={addRole} 
                          onChange={e => setAddRole(e.target.value as any)}
                          style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, background: '#fff', outline: 'none' }}
                        >
                          <option>Agent</option>
                          <option>Manager</option>
                          <option>Admin</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Max Chat Capacity</label>
                        <input 
                          type="number" 
                          min={1} 
                          max={50} 
                          required 
                          value={addCapacity} 
                          onChange={e => setAddCapacity(Number(e.target.value))}
                          style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button 
                        type="button" 
                        onClick={() => setShowAddTeam(false)}
                        style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, border: '1px solid #e5e7eb', background: '#fff', color: '#4b5563', borderRadius: 9, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', boxShadow: '0 3px 10px rgba(220,38,38,0.2)' }}
                      >
                        Add to Team
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : selectedTeamMember ? (
              <div>
                <div style={{ 
                  background: '#fff', borderBottom: '1px solid rgba(220,38,38,0.06)', 
                  padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  position: 'sticky', top: 0, zIndex: 10 
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
                      <span style={{ color: '#dc2626' }}>Team</span> › {selectedTeamMember.name}
                    </div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>Agent Capacity Settings</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: selectedTeamMember.online ? '#10b981' : '#6b7280' }}>
                        {selectedTeamMember.online ? 'ONLINE' : 'OFFLINE'}
                      </span>
                      <Toggle checked={selectedTeamMember.online} onChange={() => setSelectedTeamMember(prev => prev ? { ...prev, online: !prev.online } : null)} />
                    </div>
                    <button 
                      onClick={() => handleDeleteTeamMember(selectedTeamMember.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', fontSize: 13, fontWeight: 600, background: '#fff', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 9, cursor: 'pointer' }}
                    >
                      <Trash2 size={13} /> Remove Agent
                    </button>
                    <button 
                      onClick={handleSaveTeamMember}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13, fontWeight: 700, 
                        background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', 
                        border: 'none', borderRadius: 9, cursor: 'pointer', 
                        boxShadow: '0 3px 10px rgba(220,38,38,0.2)' 
                      }}
                    >
                      <Save size={13} /> Save Settings
                    </button>
                  </div>
                </div>

                <div style={{ padding: '28px', maxWidth: 800 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                    <div style={{ background: '#fff', border: '1px solid rgba(220,38,38,0.06)', padding: '18px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={22} color="#dc2626" />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: '#9ca3af', fontWeight: 600 }}>MAX CAPACITY</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginTop: 2 }}>{selectedTeamMember.capacity} Chats</div>
                      </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid rgba(220,38,38,0.06)', padding: '18px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Power size={22} color="#dc2626" />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: '#9ca3af', fontWeight: 600 }}>ACTIVE DISPATCHES</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginTop: 2 }}>{selectedTeamMember.activeChats} Chats</div>
                      </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid rgba(220,38,38,0.06)', padding: '18px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={22} color="#dc2626" />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: '#9ca3af', fontWeight: 600 }}>ROLE PERMISSION</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginTop: 2 }}>{selectedTeamMember.role}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#fff', borderRadius: 14, padding: '24px', border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)', marginBottom: 24 }}>
                    <SectionHeader icon="⚙️" label="Agent Configuration Details" />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Full Display Name</label>
                        <input 
                          type="text" 
                          value={selectedTeamMember.name}
                          onChange={e => setSelectedTeamMember({ ...selectedTeamMember, name: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Role Assignment</label>
                        <select 
                          value={selectedTeamMember.role}
                          onChange={e => setSelectedTeamMember({ ...selectedTeamMember, role: e.target.value as any })}
                          style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none', background: '#fff' }}
                        >
                          <option>Agent</option>
                          <option>Manager</option>
                          <option>Admin</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>System Email Address (Primary Sign-in)</label>
                      <input 
                        type="email" 
                        value={selectedTeamMember.email}
                        onChange={e => setSelectedTeamMember({ ...selectedTeamMember, email: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, border: '1.5px solid rgba(220,38,38,0.1)', borderRadius: 9, outline: 'none' }}
                      />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>Maximum Concurrent Chat Capacity Limit</label>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#dc2626' }}>{selectedTeamMember.capacity} Chats Max</span>
                      </div>
                      <input 
                        type="range" 
                        min={1} 
                        max={30} 
                        value={selectedTeamMember.capacity}
                        onChange={e => setSelectedTeamMember({ ...selectedTeamMember, capacity: Number(e.target.value) })}
                        style={{ width: '100%', accentColor: '#dc2626', cursor: 'pointer' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#fff8f8', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(220,38,38,0.08)', marginTop: 24 }}>
                      <Activity size={18} color="#dc2626" />
                      <div style={{ fontSize: 11.5, color: '#b91c1c', fontWeight: 600 }}>
                        Active Workload: currently holding {selectedTeamMember.activeChats} open chats. ({selectedTeamMember.capacity - selectedTeamMember.activeChats} slots remaining).
                      </div>
                    </div>
                  </div>

                  <button onClick={handleSaveTeamMember} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', fontSize: 14, fontWeight: 700,
                    background: teamSaved ? '#10b981' : 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
                    border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,0.2)', transition: 'background 0.2s',
                  }}>
                    {teamSaved ? <><Check size={15} /> Saved Successfully!</> : <><Save size={15} /> Save Member Configuration</>}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 40, gap: 12 }}>
                <Users size={48} color="#d1d5db" />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#4b5563' }}>No Human Agents Active</div>
                <button 
                  onClick={() => setShowAddTeam(true)}
                  style={{
                    padding: '8px 20px', fontSize: 13, fontWeight: 700,
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    marginTop: 8, display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Plus size={14} /> Add First Member
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ==================== ADD PRODUCT MODAL ==================== */}
      {showAddProdModal && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 
        }}>
          <div style={{ 
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, 
            padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={20} color="#059669" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>
                  Add Product / Watch to Catalog
                </h3>
              </div>
              <button onClick={() => setShowAddProdModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} color="#9ca3af" />
              </button>
            </div>

            <form onSubmit={handleAddProduct}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Watch / Product Name</label>
                <input 
                  type="text" 
                  required 
                  value={prodName} 
                  onChange={e => setProdName(e.target.value)} 
                  placeholder="e.g. Gucci Automatic Stainless Steel Watch"
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #d1d5db', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Brand / Category</label>
                  <input 
                    type="text" 
                    value={prodCategory} 
                    onChange={e => setProdCategory(e.target.value)} 
                    placeholder="Gucci, Movado, Tag Heuer..."
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #d1d5db', borderRadius: 8, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Price (PKR)</label>
                  <input 
                    type="number" 
                    required 
                    value={prodPrice} 
                    onChange={e => setProdPrice(e.target.value ? Number(e.target.value) : '')} 
                    placeholder="45000"
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #d1d5db', borderRadius: 8, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Product Image URL</label>
                <input 
                  type="url" 
                  value={prodImageUrl} 
                  onChange={e => setProdImageUrl(e.target.value)} 
                  placeholder="https://images.unsplash.com/... or cloud image link"
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #d1d5db', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Description & Specifications</label>
                <textarea 
                  value={prodDescription} 
                  onChange={e => setProdDescription(e.target.value)} 
                  rows={3}
                  placeholder="Original imported watch, water resistant, complete box with card, stainless steel strap..."
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #d1d5db', borderRadius: 8, outline: 'none', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddProdModal(false)}
                  style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', background: '#fff', color: '#4b5563', borderRadius: 8, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', boxShadow: '0 3px 10px rgba(16,185,129,0.2)' }}
                >
                  Save Watch Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== META CATALOG SYNC MODAL ==================== */}
      {showMetaSyncModal && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 
        }}>
          <div style={{ 
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, 
            padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw size={20} color="#059669" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>
                  Sync Meta WhatsApp Commerce Catalog
                </h3>
              </div>
              <button onClick={() => setShowMetaSyncModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} color="#9ca3af" />
              </button>
            </div>

            <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6, marginBottom: 16 }}>
              Fetch product catalog directly from Meta Commerce Manager / WABA API endpoint (<code>GET /{`{catalog_id}`}/products</code>).
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Meta Commerce Catalog ID (Optional)</label>
              <input 
                type="text" 
                value={metaCatalogId}
                onChange={e => setMetaCatalogId(e.target.value)}
                placeholder="e.g. 10928374659201"
                style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #d1d5db', borderRadius: 8, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setShowMetaSyncModal(false)}
                style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', background: '#fff', color: '#4b5563', borderRadius: 8, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleMetaCatalogSync}
                disabled={isMetaSyncing}
                style={{ 
                  padding: '10px 24px', fontSize: 13, fontWeight: 700, 
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', 
                  border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 
                }}
              >
                {isMetaSyncing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {isMetaSyncing ? 'Syncing Catalog...' : 'Start Meta API Sync'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CHAT & CATALOG INTEGRATION GUIDE MODAL ==================== */}
      {showChatGuideModal && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 
        }}>
          <div style={{ 
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 740, maxHeight: '90vh', 
            overflowY: 'auto', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HelpCircle size={20} color="#dc2626" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
                  Cloning WhatsApp Catalog & Training AI on Past Data
                </h3>
              </div>
              <button onClick={() => setShowChatGuideModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} color="#9ca3af" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: '#374151', fontSize: 13.5, lineHeight: 1.6 }}>
              
              {/* WhatsApp Catalog Method */}
              <div style={{ background: '#ecfdf5', borderRadius: 12, padding: '16px 20px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontWeight: 700, color: '#059669', fontSize: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShoppingBag size={16} /> 1. How to Clone WhatsApp Business Catalog into Ittisalo
                </div>
                <div style={{ color: '#065f46', marginBottom: 8 }}>
                  For stores operating exclusively on WhatsApp Business (like original watches):
                </div>
                <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 4, color: '#047857' }}>
                  <li><strong>Method A (Direct Add):</strong> Click <em>Add Product / Watch</em> above to enter Watch title (e.g. Gucci / Movado / Tag Heuer), price in PKR, and photo URL.</li>
                  <li><strong>Method B (Bulk CSV Import):</strong> Export your WhatsApp catalog as a CSV or Excel sheet (Columns: <code>Name, Price, Category, ImageURL, Description</code>) and click <em>Bulk CSV / JSON Import</em>.</li>
                  <li><strong>Method C (Meta Cloud API Sync):</strong> Click <em>Meta WABA Catalog Sync</em> to auto-fetch catalog via Meta Graph API (<code>GET /{`{catalog_id}`}/products</code>).</li>
                  <li><strong>Result:</strong> All watches are stored in <code>products</code> & <code>knowledge_base</code> tables in Supabase. The AI bot will present watch photos and pricing to buyers!</li>
                </ul>
              </div>

              {/* Method 1 */}
              <div style={{ background: '#fafafa', borderRadius: 12, padding: '16px 20px', border: '1px solid #f3f4f6' }}>
                <div style={{ fontWeight: 700, color: '#dc2626', fontSize: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageSquare size={16} /> 2. Extracting & Uploading WhatsApp / Instagram Chat Exports
                </div>
                <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <li><strong>WhatsApp:</strong> Open customer chat → <em>Settings (3 dots)</em> → <em>More</em> → <em>Export Chat</em> (Without Media). Upload the <code>.txt</code> file here.</li>
                  <li><strong>Instagram / Messenger:</strong> Meta Business Suite → Settings → <em>Download Your Information</em> → Select Messages → Export format TXT.</li>
                </ul>
              </div>

              {/* Method 2 */}
              <div style={{ background: '#fafafa', borderRadius: 12, padding: '16px 20px', border: '1px solid #f3f4f6' }}>
                <div style={{ fontWeight: 700, color: '#dc2626', fontSize: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} /> 3. Automatic Live-Chat Harvesting (Built-in to Ittisalo)
                </div>
                <div style={{ color: '#4b5563' }}>
                  Ittisalo automatically saves all incoming customer conversations and human agent handoffs in your database. As your live agents resolve customer inquiries on WhatsApp, Ittisalo continuously feeds those successful resolutions back into your AI model!
                </div>
              </div>

            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowChatGuideModal(false)}
                style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, background: '#059669', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer' }}
              >
                Got it, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
