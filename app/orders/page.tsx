'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useNiche } from '@/context/NicheContext';
import { 
  Search, Plus, Filter, Loader2, Download, 
  ShoppingBag, Calendar, Home, UtensilsCrossed, 
  ChevronRight, Phone, Clock, DollarSign
} from 'lucide-react';

export default function OrdersPage() {
  const { niche } = useNiche();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);

  // Get tenant ID
  useEffect(() => {
    async function fetchTenant() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        if (profile?.tenant_id) {
          setTenantId(profile.tenant_id);
        }
      }
    }
    fetchTenant();
  }, []);

  // Fetch data based on niche
  useEffect(() => {
    if (!tenantId) return;

    async function fetchData() {
      setLoading(true);
      try {
        let tableName = 'orders';
        let query = supabase.from(tableName).select('*').eq('tenant_id', tenantId);

        if (niche.id === 'restaurant') {
          tableName = 'restaurant_orders';
          query = supabase.from(tableName).select('*').eq('tenant_id', tenantId).order('order_placed_at', { ascending: false });
        } else if (niche.id === 'ecommerce') {
          tableName = 'orders';
          query = supabase.from(tableName).select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
        } else if (niche.id === 'dental' || niche.id === 'salon' || niche.id === 'clinic') {
          tableName = 'appointments';
          query = supabase.from(tableName).select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
        } else if (niche.id === 'realestate') {
          tableName = 'leads';
          query = supabase.from(tableName).select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
        }

        const { data: records, error } = await query;
        if (!error && records) {
          setData(records);
          if (records.length > 0 && !selected) {
            setSelected(records[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Subscribe to realtime changes based on niche table
    let tableName = 'orders';
    if (niche.id === 'restaurant') tableName = 'restaurant_orders';
    if (['dental', 'salon', 'clinic'].includes(niche.id)) tableName = 'appointments';
    if (niche.id === 'realestate') tableName = 'leads';

    const channel = supabase.channel(`${tableName}-sync`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tenantId, niche.id]);

  // Determine configuration based on niche
  const isRestaurant = niche.id === 'restaurant';
  const isEcommerce = niche.id === 'ecommerce';
  const isAppointment = ['dental', 'salon', 'clinic'].includes(niche.id);
  const isRealEstate = niche.id === 'realestate';

  // Filter logic
  const filtered = data.filter(item => {
    const term = search.toLowerCase();
    const name = (item.customer_name || item.patient_name || '').toLowerCase();
    const phone = item.customer_phone || item.patient_phone || '';
    return name.includes(term) || phone.includes(term);
  });

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'pending' || s === 'new_inquiry') return { bg: '#fef3c7', text: '#92400e' };
    if (s === 'confirmed' || s === 'qualified' || s === 'preparing') return { bg: '#dbeafe', text: '#1e40af' };
    if (s === 'delivered' || s === 'completed' || s === 'closed_won' || s === 'shipped') return { bg: '#d1fae5', text: '#065f46' };
    if (s === 'cancelled' || s === 'closed_lost' || s === 'no_show') return { bg: '#fee2e2', text: '#991b1b' };
    return { bg: '#f3f4f6', text: '#374151' };
  };

  const renderIcon = () => {
    if (isRestaurant) return <UtensilsCrossed size={14} />;
    if (isEcommerce) return <ShoppingBag size={14} />;
    if (isAppointment) return <Calendar size={14} />;
    if (isRealEstate) return <Home size={14} />;
    return <ShoppingBag size={14} />;
  };

  const renderTitle = () => {
    if (isRestaurant) return 'Restaurant Orders';
    if (isEcommerce) return 'Store Orders';
    if (isAppointment) return 'Appointments';
    if (isRealEstate) return 'Property Leads';
    return 'Transactions';
  };

  return (
    <div className="split-pane-root" style={{ display: 'flex', height: 'calc(100vh - 98px)' }}>
      
      {/* Left Panel: List */}
      <div className="split-left-panel" style={{ width: 340, background: '#fff', borderRight: '1px solid rgba(220,38,38,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '18px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
              {renderTitle()}
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <button 
                title="Export Data"
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: '#fef2f2', border: '1px solid rgba(220,38,38,0.2)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Download size={14} color="#dc2626" />
              </button>
            </div>
          </div>
          
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by name or phone..."
              style={{ width: '100%', padding: '8px 10px 8px 28px', fontSize: 12.5, border: '1px solid rgba(220,38,38,0.15)', borderRadius: 8, background: '#fff5f5', color: '#111', outline: 'none' }} 
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12.5 }}>No records found</div>
          ) : filtered.map(item => {
            const name = item.customer_name || item.patient_name || 'Unknown';
            const phone = item.customer_phone || item.patient_phone || 'No phone';
            const status = item.status || item.stage || 'pending';
            const color = getStatusColor(status);
            
            let primaryInfo = '';
            if (isEcommerce) primaryInfo = `PKR ${item.order_amount || 0}`;
            if (isRestaurant) primaryInfo = `PKR ${item.total_amount || 0} • ${item.order_type || 'Delivery'}`;
            if (isAppointment) primaryInfo = `${item.treatment_type || 'Consultation'}`;
            if (isRealEstate) primaryInfo = `${item.property_type || 'Property'} • ${item.intent || 'Buy'}`;

            return (
              <div 
                key={item.id} 
                onClick={() => setSelected(item)} 
                style={{
                  padding: '12px 16px', cursor: 'pointer',
                  borderBottom: '1px solid rgba(220,38,38,0.05)',
                  background: selected?.id === item.id ? '#fef2f2' : 'transparent',
                  borderLeft: selected?.id === item.id ? '3px solid #dc2626' : '3px solid transparent',
                  transition: 'all 0.12s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{name}</div>
                  <span style={{ fontSize: 9.5, fontWeight: 600, padding: '2px 6px', borderRadius: 10, background: color.bg, color: color.text }}>
                    {(status).replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#4b5563', fontWeight: 500, marginBottom: 4 }}>
                  {primaryInfo}
                </div>
                <div style={{ fontSize: 10.5, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Phone size={10} /> {phone}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Details */}
      {selected ? (
        <div className="split-right-panel" style={{ flex: 1, background: '#fafafa', overflowY: 'auto', padding: '24px 32px' }}>
          
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(220,38,38,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
            {/* Detail Header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(220,38,38,0.08)', background: 'linear-gradient(to right, #ffffff, #fef2f2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {renderIcon()}
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>
                      {selected.customer_name || selected.patient_name || 'Record Details'}
                    </h2>
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {selected.customer_phone || selected.patient_phone}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {new Date(selected.created_at || selected.order_placed_at).toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <span style={{ 
                    fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 12, 
                    background: getStatusColor(selected.status || selected.stage).bg, 
                    color: getStatusColor(selected.status || selected.stage).text,
                    border: `1px solid ${getStatusColor(selected.status || selected.stage).text}30`
                  }}>
                    {(selected.status || selected.stage || 'PENDING').replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Detail Body */}
            <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              
              {/* Financials / Key Info */}
              <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Summary
                </h3>
                
                {(isEcommerce || isRestaurant) && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 14, color: '#4b5563', fontWeight: 500 }}>Total Amount</span>
                    <span style={{ fontSize: 18, color: '#dc2626', fontWeight: 800 }}>PKR {selected.order_amount || selected.total_amount || 0}</span>
                  </div>
                )}
                
                {isAppointment && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                      <span style={{ color: '#6b7280' }}>Treatment</span>
                      <span style={{ fontWeight: 600, color: '#111' }}>{selected.treatment_type || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                      <span style={{ color: '#6b7280' }}>Provider</span>
                      <span style={{ fontWeight: 600, color: '#111' }}>{selected.doctor_name || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: '#6b7280' }}>Date & Time</span>
                      <span style={{ fontWeight: 600, color: '#111' }}>{selected.appointment_date} {selected.appointment_time}</span>
                    </div>
                  </>
                )}

                {isRealEstate && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                      <span style={{ color: '#6b7280' }}>Intent</span>
                      <span style={{ fontWeight: 600, color: '#111', textTransform: 'capitalize' }}>{selected.intent || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                      <span style={{ color: '#6b7280' }}>Property Type</span>
                      <span style={{ fontWeight: 600, color: '#111', textTransform: 'capitalize' }}>{selected.property_type || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: '#6b7280' }}>Budget Range</span>
                      <span style={{ fontWeight: 600, color: '#111' }}>{selected.budget_min} - {selected.budget_max}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Items or Extra Info */}
              <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  {(isEcommerce || isRestaurant) ? 'Order Items' : 'Additional Details'}
                </h3>
                
                {(isEcommerce || isRestaurant) ? (
                  <div>
                    {Array.isArray(selected.items) && selected.items.length > 0 ? (
                      selected.items.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx !== selected.items.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{item.qty || 1}x {item.name || item.title || 'Item'}</span>
                          <span style={{ fontSize: 13, color: '#111', fontWeight: 600 }}>{item.price ? `PKR ${item.price}` : ''}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>No items recorded.</div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>
                    {isRealEstate && (
                      <div>
                        <strong>Area Preference:</strong> {selected.area_preference || 'Not specified'}<br/>
                        <strong>Bedrooms:</strong> {selected.bedrooms || 'Any'}<br/>
                        <strong>Temperature:</strong> <span style={{ textTransform: 'capitalize' }}>{selected.temperature || 'Warm'}</span>
                      </div>
                    )}
                    {isAppointment && (
                      <div>
                        <strong>New Patient:</strong> {selected.is_new_patient ? 'Yes' : 'No'}<br/>
                        <strong>Notes:</strong> {selected.notes || 'No notes provided by AI.'}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <div style={{ fontSize: 15, fontWeight: 500 }}>Select a record to view details</div>
          </div>
        </div>
      )}
    </div>
  );
}
