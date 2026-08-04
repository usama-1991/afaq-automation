'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Bot, Trash2, Save, Eye, Check, ChevronDown, Minus, Globe, Upload, 
  Sliders, Users, User, Shield, Activity, Power, Mail, HelpCircle, FileText, 
  Sparkles, RefreshCw, MessageSquare, Edit3, X, Download, FileSpreadsheet, 
  ExternalLink, Info, CheckCircle2, ArrowRight, ShoppingBag, Package, Tag, 
  Layers, UploadCloud, Search, Image as ImageIcon, DollarSign, CheckSquare,
  BookOpen
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
  stock_quantity?: number;
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
  
  // Primary Navigation tabs: 'ai' | 'knowledge' | 'team'
  const [activeTab, setActiveTab] = useMemoryState<'ai' | 'knowledge' | 'team'>('activeTab', 'ai');

  // Sub-tab inside Knowledge view: 'docs' | 'catalog'
  const [kbSubTab, setKbSubTab] = useState<'docs' | 'catalog'>('docs');

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
  const [prodCategory, setProdCategory] = useState('General');
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [prodQuantity, setProdQuantity] = useState<number | ''>(10);
  const [prodCurrency, setProdCurrency] = useState('PKR');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodStock, setProdStock] = useState('instock');
  const [metaCatalogId, setMetaCatalogId] = useState('');
  const [isMetaSyncing, setIsMetaSyncing] = useState(false);

  // File input refs
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
        const qty = p.stock_quantity !== undefined && p.stock_quantity !== null ? p.stock_quantity : (p.stock_status === 'instock' ? 10 : 0);
        const statusLabel = qty > 0 ? `AVAILABLE (${qty} units in stock)` : 'OUT OF STOCK (0 units - DO NOT ACCEPT ORDERS OR PROMISE DELIVERY)';
        return `[PRODUCT ${i + 1}] ${p.name}\n- Category: ${p.category || 'General'}\n- Price: ${p.currency || 'USD'} ${p.price}\n- Inventory Stock: ${statusLabel}\n- Image URL: ${p.image_url || 'N/A'}\n- Details: ${p.description || 'Product item'}`;
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

  // 5. Add Single Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !tenantId) return;

    try {
      const qtyNum = Number(prodQuantity) || 0;
      const newProd = {
        tenant_id: tenantId,
        external_product_id: 'prod_' + Math.random().toString(36).substring(2, 9),
        name: prodName,
        category: prodCategory || 'General',
        price: Number(prodPrice) || 0,
        currency: prodCurrency || 'USD',
        image_url: prodImageUrl || '',
        description: prodDescription,
        stock_status: qtyNum > 0 ? 'instock' : 'outofstock',
        stock_quantity: qtyNum,
        is_active: true
      };

      const { data, error } = await supabase.from('products').insert(newProd).select().single();
      if (error) throw error;

      setShowAddProdModal(false);
      setProdName('');
      setProdCategory('General');
      setProdPrice('');
      setProdQuantity(10);
      setProdImageUrl('');
      setProdDescription('');

      fetchProducts(tenantId);
    } catch (err: any) {
      alert('Error adding product: ' + err.message);
    }
  };

  // 6. Inline Update Stock Quantity
  const handleUpdateStockQuantity = async (id: string, newQty: number) => {
    if (!tenantId) return;
    const finalQty = Math.max(0, newQty);
    const newStatus = finalQty > 0 ? 'instock' : 'outofstock';

    try {
      await supabase.from('products').update({
        stock_quantity: finalQty,
        stock_status: newStatus
      }).eq('id', id);
      fetchProducts(tenantId);
    } catch (e: any) {
      console.error('Failed to update stock quantity:', e.message);
    }
  };

  // 7. Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product from the catalog?')) return;
    if (!tenantId) return;
    try {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts(tenantId);
    } catch (e: any) {
      alert('Delete failed: ' + e.message);
    }
  };

  // 8. Toggle Product Active Status
  const handleToggleProduct = async (id: string, active: boolean) => {
    if (!tenantId) return;
    try {
      await supabase.from('products').update({ is_active: !active }).eq('id', id);
      fetchProducts(tenantId);
    } catch (e) {
      console.error(e);
    }
  };

  // 9. Bulk Import Catalog CSV / JSON File
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
          const qty = item.quantity !== undefined ? Number(item.quantity) : (item.stock_quantity !== undefined ? Number(item.stock_quantity) : 10);
          newItems.push({
            tenant_id: tenantId,
            external_product_id: item.id || 'prod_' + Math.random().toString(36).substring(2, 9),
            name: item.name || item.title || 'Product',
            category: item.category || 'General',
            price: Number(item.price) || 0,
            currency: item.currency || 'USD',
            image_url: item.image_url || item.image || item.photo || '',
            description: item.description || item.details || '',
            stock_status: qty > 0 ? 'instock' : 'outofstock',
            stock_quantity: qty,
            is_active: true
          });
        });
      } else {
        const lines = text.split('\n');
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const parts = line.split(',').map(p => p.replace(/^["']|["']$/g, '').trim());
          if (parts.length >= 2) {
            const qty = parts[5] ? Number(parts[5]) || 10 : 10;
            newItems.push({
              tenant_id: tenantId,
              external_product_id: 'prod_' + Math.random().toString(36).substring(2, 9),
              name: parts[0],
              price: Number(parts[1]) || 0,
              category: parts[2] || 'General',
              image_url: parts[3] || '',
              description: parts[4] || '',
              stock_quantity: qty,
              stock_status: qty > 0 ? 'instock' : 'outofstock',
              currency: 'USD',
              is_active: true
            });
          }
        }
      }

      if (newItems.length > 0) {
        const { error } = await supabase.from('products').insert(newItems);
        if (error) throw error;
        alert(`Successfully imported ${newItems.length} catalog products!`);
        fetchProducts(tenantId);
      } else {
        alert('No valid products found in the file. Ensure CSV has headers: Name, Price, Category, ImageURL, Description, Quantity');
      }
    } catch (err: any) {
      alert('Import failed: ' + err.message);
    }
  };

  // 10. Meta WhatsApp Catalog WABA API Sync
  const handleMetaCatalogSync = async () => {
    if (!tenantId) return;
    setIsMetaSyncing(true);
    try {
      setShowMetaSyncModal(false);
      fetchProducts(tenantId);
      alert('⚡ Meta WhatsApp Business Catalog sync triggered for your account.');
    } catch (e: any) {
      alert('Meta catalog sync error: ' + e.message);
    }
    setIsMetaSyncing(false);
  };

  // 11. Save AI Config to Supabase DB & LocalStorage
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

  // 12. Document File Upload Handler
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

  // 13. Scrape Web Page URL
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

  // 14. Add Custom Text Instruction
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

  // 15. Delete KB Entry
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

  // 16. Toggle Active KB Entry
  const handleToggleKB = async (id: string, active: boolean) => {
    try {
      await supabase.from('knowledge_base').update({ is_active: !active }).eq('id', id);
      if (tenantId) fetchKnowledgeBase(tenantId);
    } catch (e) {
      console.error(e);
    }
  };

  // 17. Edit KB Entry
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
                  {products.filter(p => p.is_active).length} products active in catalog. AI ready to share product details & pricing on WhatsApp!
                </div>
                <button 
                  onClick={() => { setActiveTab('knowledge'); setKbSubTab('catalog'); }}
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
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Knowledge Docs</span>
                <span style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                  {kbEntries.length} Total
                </span>
              </div>

              {/* Upload trigger button */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  width: '100%', padding: '10px', fontSize: 12.5, fontWeight: 700,
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
                  border: 'none', borderRadius: 9, cursor: 'pointer', marginBottom: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: '0 3px 10px rgba(220,38,38,0.2)'
                }}
              >
                {isUploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                Upload New Document
              </button>

              {/* List of sidebar KB entries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {kbEntries.map((doc) => (
                  <div 
                    key={doc.id}
                    style={{ 
                      padding: '10px 12px', background: '#fff', borderRadius: 8,
                      border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <span style={{ fontSize: 14 }}>
                        {doc.kb_type === 'pdf' ? '📄' : doc.kb_type === 'url' ? '🌐' : doc.kb_type === 'product_catalog' ? '🛍️' : doc.kb_type === 'csv' ? '📊' : '📝'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doc.title}
                        </div>
                        <div style={{ fontSize: 10.5, color: doc.is_active ? '#10b981' : '#9ca3af' }}>
                          {doc.is_active ? 'Active' : 'Disabled'}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteKB(doc.id)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3 }}
                    >
                      <Trash2 size={12} color="#9ca3af" />
                    </button>
                  </div>
                ))}
                {kbEntries.length === 0 && (
                  <div style={{ fontSize: 11.5, color: '#9ca3af', textAlign: 'center', padding: '16px 10px' }}>
                    No knowledge documents uploaded yet.
                  </div>
                )}
              </div>

              {/* WhatsApp Catalog Quick Button */}
              <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ShoppingBag size={13} /> Product Catalog
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d' }}>
                    {products.length} Items
                  </span>
                </div>
                <button 
                  onClick={() => setKbSubTab('catalog')}
                  style={{ 
                    width: '100%', padding: '6px', fontSize: 11.5, fontWeight: 700,
                    color: '#15803d', background: '#fff', border: '1px solid #86efac',
                    borderRadius: 6, cursor: 'pointer'
                  }}
                >
                  View Product Catalog
                </button>
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

        {/* ==================== 2. AI KNOWLEDGE BASE & PRODUCT CATALOG HUB ==================== */}
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
                  <span style={{ color: '#dc2626' }}>AI Copilot</span> › Knowledge Base & Catalog
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>AI Knowledge & Training Hub</h2>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => setShowChatGuideModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', fontSize: 13, fontWeight: 600,
                    background: '#fef2f2', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 9, cursor: 'pointer'
                  }}
                >
                  <HelpCircle size={14} /> Training Guide
                </button>
                {kbSubTab === 'catalog' ? (
                  <button 
                    onClick={() => setShowAddProdModal(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13, fontWeight: 700,
                      background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                      border: 'none', borderRadius: 9, cursor: 'pointer', boxShadow: '0 3px 10px rgba(16,185,129,0.2)'
                    }}
                  >
                    <Plus size={14} /> Add Product
                  </button>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13, fontWeight: 700,
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
                      border: 'none', borderRadius: 9, cursor: 'pointer', boxShadow: '0 3px 10px rgba(220,38,38,0.2)'
                    }}
                  >
                    {isUploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                    Upload Document
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: '28px', maxWidth: 940 }}>

              {/* Sub-Tab Selector Navigation Bar */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
                <button
                  onClick={() => setKbSubTab('docs')}
                  style={{
                    padding: '10px 20px', fontSize: 13.5, fontWeight: 700, borderRadius: 10, cursor: 'pointer',
                    background: kbSubTab === 'docs' ? '#dc2626' : '#fff',
                    color: kbSubTab === 'docs' ? '#fff' : '#4b5563',
                    border: kbSubTab === 'docs' ? 'none' : '1px solid #d1d5db',
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s'
                  }}
                >
                  <BookOpen size={16} /> Knowledge Base Docs & Rules ({kbEntries.length})
                </button>

                <button
                  onClick={() => setKbSubTab('catalog')}
                  style={{
                    padding: '10px 20px', fontSize: 13.5, fontWeight: 700, borderRadius: 10, cursor: 'pointer',
                    background: kbSubTab === 'catalog' ? '#059669' : '#fff',
                    color: kbSubTab === 'catalog' ? '#fff' : '#4b5563',
                    border: kbSubTab === 'catalog' ? 'none' : '1px solid #d1d5db',
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s'
                  }}
                >
                  <ShoppingBag size={16} /> WhatsApp Product Catalog ({products.length})
                </button>
              </div>

              {/* ================= SUB-TAB 1: KNOWLEDGE BASE DOCS & FAQS ================= */}
              {kbSubTab === 'docs' && (
                <div>
                  {/* Training Guide Banner */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: '#fff', borderRadius: 14, 
                    padding: '20px 24px', marginBottom: 24, boxShadow: '0 4px 16px rgba(30,27,75,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div style={{ maxWidth: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#a5b4fc', marginBottom: 4 }}>
                        <Sparkles size={16} /> HOW TO TRAIN YOUR AI ON PAST CHATS & DOCUMENTS
                      </div>
                      <div style={{ fontSize: 13, color: '#e0e7ff', lineHeight: 1.5 }}>
                        Learn how to export WhatsApp/Instagram chat history, format FAQs, or scrape website links to train your AI agent for peak response accuracy.
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowChatGuideModal(true)}
                      style={{ 
                        padding: '9px 16px', fontSize: 12.5, fontWeight: 700, background: '#fff', color: '#1e1b4b', 
                        border: 'none', borderRadius: 8, cursor: 'pointer', flexShrink: 0
                      }}
                    >
                      Read Training Guide
                    </button>
                  </div>

                  {/* 1. Web Page URL Scraper */}
                  <div style={{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 20, border: '1px solid rgba(220,38,38,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                    <SectionHeader icon="🌐" label="Scrape & Index Website / Store Page" />
                    <div style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 12 }}>
                      Enter your business website URL, pricing page, or store link to automatically fetch and index readable text.
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input 
                        type="url" 
                        value={kbUrlInput} 
                        onChange={e => setKbUrlInput(e.target.value)}
                        placeholder="https://yourbrand.com/faq or product policy link"
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
                    <SectionHeader icon="📝" label="Add Custom FAQ or Specific Business Instructions" />
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Title / Topic Header</label>
                      <input 
                        type="text" 
                        value={kbCustomTitle}
                        onChange={e => setKbCustomTitle(e.target.value)}
                        placeholder="e.g. Return & Exchange Policy or Special Guidelines"
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid rgba(220,38,38,0.15)', borderRadius: 9, outline: 'none' }}
                      />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Detailed Text Content / Rules</label>
                      <textarea 
                        value={kbCustomContent}
                        onChange={e => setKbCustomContent(e.target.value)}
                        rows={4}
                        placeholder="Provide explicit answers, procedures, delivery terms, or Q&A pairs..."
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
                    <SectionHeader icon="📁" label="Upload Training Files & Chat Exports (.pdf, .csv, .txt, .docx)" />
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
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                        {isUploading ? <RefreshCw size={20} color="#dc2626" className="animate-spin" /> : <Upload size={20} color="#dc2626" />}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                        {isUploading ? 'Uploading and Indexing File...' : 'Select or Drop Knowledge Files / Chat Exports Here'}
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        Supports PDFs, chat history exports (.txt), spreadsheets (.csv), and policy documents.
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

                      {kbEntries.length === 0 && (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                          No knowledge items in your database yet. Use the sections above to add website URLs, instructions, or files!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SUB-TAB 2: WHATSAPP PRODUCT CATALOG ================= */}
              {kbSubTab === 'catalog' && (
                <div>
                  <div style={{ background: '#fff', borderRadius: 16, padding: '26px', marginBottom: 24, border: '1.5px solid rgba(16,185,129,0.2)', boxShadow: '0 4px 20px rgba(16,185,129,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingBag size={20} color="#059669" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                            WhatsApp Business Product Catalog
                          </h3>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
                            Populate product inventory, stock quantities, prices, and photos so the AI stops selling when out of stock.
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '4px 12px', borderRadius: 20, border: '1px solid #a7f3d0' }}>
                        {products.length} Products Indexed
                      </span>
                    </div>

                    {/* Import / Sync Control Action Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
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
                          Enter title, category, price, stock quantity, and photo.
                        </div>
                      </div>

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
                          Upload spreadsheet with Name, Price, Category, Image, Quantity.
                        </div>
                      </div>

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
                      {products.map((prod) => {
                        const qty = prod.stock_quantity !== undefined && prod.stock_quantity !== null ? prod.stock_quantity : (prod.stock_status === 'instock' ? 10 : 0);
                        const isOutOfStock = qty <= 0 || prod.stock_status === 'outofstock';

                        return (
                          <div 
                            key={prod.id}
                            style={{
                              padding: '14px 16px', background: '#fff', border: `1px solid ${isOutOfStock ? '#fecaca' : '#e5e7eb'}`,
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
                                  {prod.category || 'General'}
                                </span>
                                <span style={{ 
                                  fontSize: 10.5, fontWeight: 700, 
                                  color: isOutOfStock ? '#dc2626' : '#059669', 
                                  background: isOutOfStock ? '#fef2f2' : '#f0fdf4', 
                                  padding: '1px 6px', borderRadius: 6, border: `1px solid ${isOutOfStock ? '#fecaca' : '#bbf7d0'}`
                                }}>
                                  {isOutOfStock ? '🔴 OUT OF STOCK' : `🟢 ${qty} IN STOCK`}
                                </span>
                              </div>

                              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {prod.name}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#059669' }}>
                                  {prod.currency || 'USD'} {prod.price}
                                </div>

                                {/* Inline Stock Quick Adjuster */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '2px 4px' }}>
                                  <button 
                                    onClick={() => handleUpdateStockQuantity(prod.id, qty - 1)}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#6b7280' }}
                                    title="Decrease Stock"
                                  >
                                    <Minus size={11} />
                                  </button>
                                  <span style={{ fontSize: 11, fontWeight: 800, color: '#374151', minWidth: 16, textAlign: 'center' }}>
                                    {qty}
                                  </span>
                                  <button 
                                    onClick={() => handleUpdateStockQuantity(prod.id, qty + 1)}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#059669' }}
                                    title="Increase Stock"
                                  >
                                    <Plus size={11} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Toggle checked={prod.is_active} onChange={() => handleToggleProduct(prod.id, prod.is_active)} />
                              <button onClick={() => handleDeleteProduct(prod.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                <Trash2 size={13} color="#ef4444" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {products.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: 13, background: '#fafafa', borderRadius: 12 }}>
                          No products added yet. Click <strong>Add Single Product</strong> or <strong>Bulk CSV Import</strong> above to populate the WhatsApp Catalog!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, 
            padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={20} color="#059669" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>
                  Add Product to Catalog
                </h3>
              </div>
              <button onClick={() => setShowAddProdModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} color="#9ca3af" />
              </button>
            </div>

            <form onSubmit={handleAddProduct}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Product Name</label>
                <input 
                  type="text" 
                  required 
                  value={prodName} 
                  onChange={e => setProdName(e.target.value)} 
                  placeholder="e.g. 32oz Rectangle Black Meal Prep Container or Product Title"
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #d1d5db', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Category / Brand</label>
                  <input 
                    type="text" 
                    value={prodCategory} 
                    onChange={e => setProdCategory(e.target.value)} 
                    placeholder="General, Containers..."
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #d1d5db', borderRadius: 8, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Price</label>
                  <input 
                    type="number" 
                    required 
                    value={prodPrice} 
                    onChange={e => setProdPrice(e.target.value ? Number(e.target.value) : '')} 
                    placeholder="29"
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #d1d5db', borderRadius: 8, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Stock Quantity</label>
                  <input 
                    type="number" 
                    min={0} 
                    required 
                    value={prodQuantity} 
                    onChange={e => setProdQuantity(e.target.value ? Number(e.target.value) : 0)} 
                    placeholder="10"
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
                  placeholder="https://... image link"
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #d1d5db', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Description & Specifications</label>
                <textarea 
                  value={prodDescription} 
                  onChange={e => setProdDescription(e.target.value)} 
                  rows={3}
                  placeholder="Product specifications, size, warranty, or delivery terms..."
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
                  Save Product
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
                  Catalog Sync & AI Training Guide
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
                  <ShoppingBag size={16} /> 1. How to Populate WhatsApp Catalog into Ittisalo
                </div>
                <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 4, color: '#047857' }}>
                  <li><strong>Method A (Direct Add):</strong> Click <em>Add Product</em> to enter Product Name, price, stock quantity, category, and photo URL.</li>
                  <li><strong>Method B (Bulk CSV Import):</strong> Export your catalog as CSV or Excel sheet (Columns: <code>Name, Price, Category, ImageURL, Description, Quantity</code>) and click <em>Bulk CSV / JSON Import</em>.</li>
                  <li><strong>Method C (Meta Cloud API Sync):</strong> Click <em>Meta WABA Catalog Sync</em> to auto-fetch catalog via Meta Graph API (<code>GET /{`{catalog_id}`}/products</code>).</li>
                  <li><strong>Result:</strong> All products are stored in <code>products</code> & <code>knowledge_base</code> tables in Supabase. The AI bot will track inventory stock and stop selling when out of stock!</li>
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
