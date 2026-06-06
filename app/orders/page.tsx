'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useNiche } from '@/context/NicheContext';
import { 
  Search, Loader2, Download, 
  ShoppingBag, Calendar, Home, UtensilsCrossed, 
  Phone, Clock, CheckCircle2, Truck, XCircle, ChevronRight, Check
} from 'lucide-react';

export default function OrdersPage() {
  const { niche } = useNiche();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isRestaurant = niche.id === 'restaurant';
  const isEcommerce = niche.id === 'ecommerce';
  const isAppointment = ['dental', 'salon', 'clinic'].includes(niche.id);
  const isRealEstate = niche.id === 'realestate';

  const tableName = isAppointment ? 'appointments' : (isRealEstate ? 'leads' : 'orders');

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

  // Fetch data
  useEffect(() => {
    if (!tenantId) return;

    async function fetchData() {
      setLoading(true);
      try {
        const { data: records, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

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

    const channel = supabase.channel(`${tableName}-realtime`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName, filter: `tenant_id=eq.${tenantId}` }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          setData(prev => [payload.new, ...prev]);
        }
        if (payload.eventType === 'UPDATE') {
          setData(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
          setSelected((prev: any) => prev?.id === payload.new.id ? payload.new : prev);
        }
        if (payload.eventType === 'DELETE') {
          setData(prev => prev.filter(o => o.id !== payload.old.id));
          setSelected((prev: any) => prev?.id === payload.old.id ? null : prev);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tenantId, tableName]);

  const handleStatusUpdate = async (recordId: string, newStatus: string) => {
    setActionLoading(newStatus);
    try {
      const updatePayload: any = {};
      
      if (tableName === 'leads') {
        updatePayload.stage = newStatus;
      } else {
        updatePayload.status = newStatus;
      }

      if (tableName === 'orders') {
        if (newStatus === 'confirmed') updatePayload.confirmed_at = new Date().toISOString();
        if (newStatus === 'dispatched') updatePayload.dispatched_at = new Date().toISOString();
        if (newStatus === 'delivered') updatePayload.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from(tableName)
        .update(updatePayload)
        .eq('id', recordId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (['pending', 'pending_address', 'new_inquiry'].includes(s)) return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
    if (['confirmed', 'qualified', 'preparing', 'properties_sent', 'visit_scheduled'].includes(s)) return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' };
    if (['delivered', 'completed', 'closed_won', 'dispatched'].includes(s)) return { bg: '#dcfce3', text: '#166534', border: '#bbf7d0' };
    if (['cancelled', 'closed_lost', 'no_show'].includes(s)) return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
    return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
  };

  const filtered = data.filter(item => {
    const term = search.toLowerCase();
    const name = (item.customer_name || item.patient_name || '').toLowerCase();
    const phone = item.customer_phone || item.patient_phone || '';
    return name.includes(term) || phone.includes(term);
  });

  const renderIcon = () => {
    if (isRestaurant) return <UtensilsCrossed size={14} />;
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

  const ActionButton = ({ onClick, loadingVal, text, icon: Icon, variant = 'primary' }: any) => {
    const isDanger = variant === 'danger';
    return (
      <button
        onClick={onClick}
        disabled={!!actionLoading}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: isDanger ? '#fee2e2' : '#dc2626',
          color: isDanger ? '#dc2626' : '#fff',
          border: isDanger ? '1px solid #fca5a5' : '1px solid #b91c1c',
          cursor: actionLoading ? 'not-allowed' : 'pointer',
          opacity: actionLoading && actionLoading !== loadingVal ? 0.6 : 1,
          transition: 'all 0.2s'
        }}
      >
        {actionLoading === loadingVal ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : Icon && <Icon size={14} />}
        {text}
      </button>
    );
  };

  const renderActionButtons = () => {
    if (!selected) return null;
    const status = selected.status || selected.stage || '';
    
    return (
      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', padding: '16px 20px', background: '#fff', borderRadius: 12, border: '1px solid #f3f4f6' }}>
        <div style={{ width: '100%', fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Actions</div>
        {tableName === 'orders' && isEcommerce && (
          <>
            {status === 'pending_address' && <ActionButton loadingVal="confirmed" onClick={() => handleStatusUpdate(selected.id, 'confirmed')} text="Confirm Order" icon={CheckCircle2} />}
            {status === 'confirmed' && <ActionButton loadingVal="dispatched" onClick={() => handleStatusUpdate(selected.id, 'dispatched')} text="Dispatch" icon={Truck} />}
            {status === 'dispatched' && <ActionButton loadingVal="delivered" onClick={() => handleStatusUpdate(selected.id, 'delivered')} text="Mark Delivered" icon={Check} />}
            {status !== 'cancelled' && status !== 'delivered' && <ActionButton variant="danger" loadingVal="cancelled" onClick={() => handleStatusUpdate(selected.id, 'cancelled')} text="Cancel Order" icon={XCircle} />}
          </>
        )}
        {tableName === 'orders' && isRestaurant && (
          <>
            {status === 'pending' && <ActionButton loadingVal="confirmed" onClick={() => handleStatusUpdate(selected.id, 'confirmed')} text="Confirm Order" icon={CheckCircle2} />}
            {status === 'confirmed' && <ActionButton loadingVal="preparing" onClick={() => handleStatusUpdate(selected.id, 'preparing')} text="Start Preparing" icon={UtensilsCrossed} />}
            {status === 'preparing' && <ActionButton loadingVal="delivered" onClick={() => handleStatusUpdate(selected.id, 'delivered')} text="Mark Delivered" icon={Check} />}
            {status !== 'cancelled' && status !== 'delivered' && <ActionButton variant="danger" loadingVal="cancelled" onClick={() => handleStatusUpdate(selected.id, 'cancelled')} text="Cancel Order" icon={XCircle} />}
          </>
        )}
        {tableName === 'appointments' && (
          <>
            {status === 'pending' && <ActionButton loadingVal="confirmed" onClick={() => handleStatusUpdate(selected.id, 'confirmed')} text="Confirm Appointment" icon={CheckCircle2} />}
            {status === 'confirmed' && <ActionButton loadingVal="completed" onClick={() => handleStatusUpdate(selected.id, 'completed')} text="Mark Completed" icon={Check} />}
            {status !== 'cancelled' && status !== 'completed' && <ActionButton variant="danger" loadingVal="cancelled" onClick={() => handleStatusUpdate(selected.id, 'cancelled')} text="Cancel" icon={XCircle} />}
          </>
        )}
        {tableName === 'leads' && (
          <>
            {status === 'new_inquiry' && <ActionButton loadingVal="qualified" onClick={() => handleStatusUpdate(selected.id, 'qualified')} text="Mark Qualified" icon={CheckCircle2} />}
            {status === 'qualified' && <ActionButton loadingVal="properties_sent" onClick={() => handleStatusUpdate(selected.id, 'properties_sent')} text="Properties Sent" icon={Home} />}
            {status === 'properties_sent' && <ActionButton loadingVal="visit_scheduled" onClick={() => handleStatusUpdate(selected.id, 'visit_scheduled')} text="Schedule Visit" icon={Calendar} />}
            {status === 'visit_scheduled' && <ActionButton loadingVal="closed_won" onClick={() => handleStatusUpdate(selected.id, 'closed_won')} text="Closed Won" icon={Check} />}
            {status !== 'closed_lost' && status !== 'closed_won' && <ActionButton variant="danger" loadingVal="closed_lost" onClick={() => handleStatusUpdate(selected.id, 'closed_lost')} text="Closed Lost" icon={XCircle} />}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="split-pane-root" style={{ display: 'flex', height: 'calc(100vh - 98px)' }}>
      {/* Left Panel */}
      <div className="split-left-panel" style={{ width: 340, background: '#fff', borderRight: '1px solid rgba(220,38,38,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
              {renderTitle()}
            </h2>
            <button style={{ width: 30, height: 30, borderRadius: 8, background: '#fef2f2', border: '1px solid rgba(220,38,38,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Download size={14} color="#dc2626" />
            </button>
          </div>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..." style={{ width: '100%', padding: '8px 10px 8px 28px', fontSize: 12.5, border: '1px solid rgba(220,38,38,0.15)', borderRadius: 8, background: '#fff5f5', color: '#111', outline: 'none' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', display: 'flex', justifyContent: 'center' }}><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12.5 }}>No records found</div>
          ) : filtered.map(item => {
            const name = item.customer_name || item.patient_name || 'Unknown';
            const phone = item.customer_phone || item.patient_phone || 'No phone';
            const status = item.status || item.stage || 'pending';
            const color = getStatusColor(status);
            
            let primaryInfo = '';
            if (isEcommerce) primaryInfo = `PKR ${item.order_amount || 0}`;
            if (isRestaurant) primaryInfo = `PKR ${item.order_amount || 0} • ${item.order_type || 'Delivery'}`;
            if (isAppointment) primaryInfo = `${item.service_type || 'Consultation'}`;
            if (isRealEstate) primaryInfo = `${item.property_type || 'Property'} • ${item.intent || 'Buy'}`;

            return (
              <div key={item.id} onClick={() => setSelected(item)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(220,38,38,0.05)', background: selected?.id === item.id ? '#fef2f2' : 'transparent', borderLeft: selected?.id === item.id ? '3px solid #dc2626' : '3px solid transparent', transition: 'all 0.12s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{name}</div>
                  <span style={{ fontSize: 9.5, fontWeight: 600, padding: '2px 6px', borderRadius: 10, background: color.bg, color: color.text, border: `1px solid ${color.border}` }}>
                    {(status).replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#4b5563', fontWeight: 500, marginBottom: 4 }}>{primaryInfo}</div>
                <div style={{ fontSize: 10.5, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={10} /> {phone}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel */}
      {selected ? (
        <div className="split-right-panel" style={{ flex: 1, background: '#fafafa', overflowY: 'auto', padding: '24px 32px' }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(220,38,38,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {new Date(selected.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 12, background: getStatusColor(selected.status || selected.stage).bg, color: getStatusColor(selected.status || selected.stage).text, border: `1px solid ${getStatusColor(selected.status || selected.stage).border}` }}>
                    {(selected.status || selected.stage || 'PENDING').replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Summary</h3>
                  {(tableName === 'orders') && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, color: '#4b5563', fontWeight: 500 }}>Total Amount</span>
                        <span style={{ fontSize: 18, color: '#dc2626', fontWeight: 800 }}>PKR {selected.order_amount || 0}</span>
                      </div>
                      {isRestaurant && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                          <span style={{ color: '#6b7280' }}>Order Type</span>
                          <span style={{ fontWeight: 600, color: '#111', textTransform: 'capitalize' }}>{selected.order_type || 'Delivery'}</span>
                        </div>
                      )}
                      {selected.delivery_address && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Delivery Address</div>
                          <div style={{ fontSize: 13, color: '#111', fontWeight: 500, lineHeight: 1.4 }}>{selected.delivery_address}</div>
                        </div>
                      )}
                    </>
                  )}
                  {tableName === 'appointments' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                        <span style={{ color: '#6b7280' }}>Treatment</span>
                        <span style={{ fontWeight: 600, color: '#111' }}>{selected.service_type || 'N/A'}</span>
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
                  {tableName === 'leads' && (
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
                        <span style={{ fontWeight: 600, color: '#111' }}>{selected.budget_min || 0} - {selected.budget_max || 'Any'}</span>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    {tableName === 'orders' ? 'Items' : 'Additional Details'}
                  </h3>
                  {tableName === 'orders' ? (
                    <div>
                      {Array.isArray(selected.items) && selected.items.length > 0 ? selected.items.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx !== selected.items.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{item.qty || 1}x {item.name || item.title || 'Item'}</span>
                          <span style={{ fontSize: 13, color: '#111', fontWeight: 600 }}>{item.price ? `PKR ${item.price}` : ''}</span>
                        </div>
                      )) : <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>No items recorded.</div>}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>
                      {tableName === 'leads' && (
                        <div>
                          <strong>Area Preference:</strong> {selected.area_preference || 'Not specified'}<br/>
                          <strong>Bedrooms:</strong> {selected.bedrooms || 'Any'}<br/>
                          <strong>Temperature:</strong> <span style={{ textTransform: 'capitalize', color: selected.temperature === 'hot' ? '#ef4444' : selected.temperature === 'cold' ? '#3b82f6' : '#f59e0b', fontWeight: 600 }}>{selected.temperature || 'Warm'}</span>
                        </div>
                      )}
                      {tableName === 'appointments' && (
                        <div>
                          <strong>New Patient:</strong> {selected.is_new_patient ? 'Yes' : 'No'}<br/>
                          <strong>Notes:</strong> {selected.notes || 'No notes provided by AI.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {renderActionButtons()}
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
