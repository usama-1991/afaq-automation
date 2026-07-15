'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useNiche } from '@/context/NicheContext';
import { 
  Search, Loader2, Download, Filter, FileSpreadsheet, X,
  ShoppingBag, Calendar, Home, UtensilsCrossed, Check,
  Phone, Clock, CheckCircle2, Truck, XCircle, MoreVertical, MapPin, DollarSign, Activity,
  ExternalLink, Mail, Store
} from 'lucide-react';

export default function OrdersPage() {
  const { niche } = useNiche();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
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
          setSelectedRecord((prev: any) => prev?.id === payload.new.id ? payload.new : prev);
        }
        if (payload.eventType === 'DELETE') {
          setData(prev => prev.filter(o => o.id !== payload.old.id));
          setSelectedRecord((prev: any) => prev?.id === payload.old.id ? null : prev);
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

  const downloadCSV = () => {
    if (data.length === 0) {
      alert("No data available to download.");
      return;
    }
    
    let headers: string[] = [];
    let csvData: string[][] = [];

    if (tableName === 'orders') {
      headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Amount (PKR)', 'Status', 'Order Type', 'Delivery Address', 'Payment Method', 'Items'];
      csvData = filtered.map(item => [
        item.id,
        new Date(item.created_at).toLocaleString(),
        `"${(item.customer_name || '').replace(/"/g, '""')}"`,
        `"${item.customer_phone || ''}"`,
        item.order_amount || 0,
        item.status || 'pending',
        item.order_type || 'N/A',
        `"${(item.delivery_address || '').replace(/"/g, '""')}"`,
        `"${(item.payment_method || '').replace(/"/g, '""')}"`,
        `"${(Array.isArray(item.items) ? item.items.map((i:any) => `${i.qty||1}x ${i.name||i.title||'Item'}`).join(', ') : '')}"`
      ]);
    } else if (tableName === 'appointments') {
      headers = ['Appointment ID', 'Date Created', 'Patient Name', 'Phone', 'Service Type', 'Doctor', 'Appointment Date', 'Time', 'Status'];
      csvData = filtered.map(item => [
        item.id,
        new Date(item.created_at).toLocaleString(),
        `"${(item.patient_name || '').replace(/"/g, '""')}"`,
        `"${item.patient_phone || ''}"`,
        `"${(item.service_type || '').replace(/"/g, '""')}"`,
        `"${(item.doctor_name || '').replace(/"/g, '""')}"`,
        item.appointment_date || '',
        item.appointment_time || '',
        item.status || 'pending'
      ]);
    } else if (tableName === 'leads') {
      headers = ['Lead ID', 'Date', 'Name', 'Phone', 'Intent', 'Property Type', 'Budget', 'Area', 'Stage'];
      csvData = filtered.map(item => [
        item.id,
        new Date(item.created_at).toLocaleString(),
        `"${(item.customer_name || '').replace(/"/g, '""')}"`,
        `"${item.customer_phone || ''}"`,
        item.intent || '',
        item.property_type || '',
        `${item.budget_min||0}-${item.budget_max||'Any'}`,
        `"${(item.area_preference || '').replace(/"/g, '""')}"`,
        item.stage || 'new_inquiry'
      ]);
    }

    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tableName}_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const renderTitle = () => {
    if (isRestaurant) return 'Restaurant Orders';
    if (isEcommerce) return 'Store Orders';
    if (isAppointment) return 'Appointments';
    if (isRealEstate) return 'Property Leads';
    return 'Transactions';
  };

  const getMetrics = () => {
    const total = data.length;
    let pending = 0;
    let revenue = 0;
    
    data.forEach(item => {
      const status = (item.status || item.stage || '').toLowerCase();
      if (['pending', 'pending_address', 'new_inquiry'].includes(status)) pending++;
      if (tableName === 'orders' && !['cancelled'].includes(status)) {
        revenue += (Number(item.order_amount) || 0);
      }
    });

    return { total, pending, revenue };
  };

  const metrics = getMetrics();

  const ActionButton = ({ onClick, loadingVal, text, icon: Icon, variant = 'primary' }: any) => {
    const isDanger = variant === 'danger';
    return (
      <button
        onClick={onClick}
        disabled={!!actionLoading}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: isDanger ? '#fff' : '#dc2626',
          color: isDanger ? '#dc2626' : '#fff',
          border: isDanger ? '1px solid #fecaca' : '1px solid #b91c1c',
          cursor: actionLoading ? 'not-allowed' : 'pointer',
          opacity: actionLoading && actionLoading !== loadingVal ? 0.6 : 1,
          flex: 1, transition: 'all 0.2s', boxShadow: isDanger ? 'none' : '0 2px 8px rgba(220,38,38,0.2)'
        }}
      >
        {actionLoading === loadingVal ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : Icon && <Icon size={14} />}
        {text}
      </button>
    );
  };

  const renderActionButtons = (selected: any) => {
    if (!selected) return null;
    const status = selected.status || selected.stage || '';
    
    return (
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%' }}>
        {tableName === 'orders' && isEcommerce && (
          <>
            {status === 'pending_address' && <ActionButton loadingVal="confirmed" onClick={() => handleStatusUpdate(selected.id, 'confirmed')} text="Confirm Order" icon={CheckCircle2} />}
            {status === 'pending' && <ActionButton loadingVal="confirmed" onClick={() => handleStatusUpdate(selected.id, 'confirmed')} text="Confirm Order" icon={CheckCircle2} />}
            {status === 'confirmed' && <ActionButton loadingVal="dispatched" onClick={() => handleStatusUpdate(selected.id, 'dispatched')} text="Dispatch" icon={Truck} />}
            {status === 'dispatched' && <ActionButton loadingVal="delivered" onClick={() => handleStatusUpdate(selected.id, 'delivered')} text="Mark Delivered" icon={Check} />}
            {status !== 'cancelled' && status !== 'delivered' && <ActionButton variant="danger" loadingVal="cancelled" onClick={() => handleStatusUpdate(selected.id, 'cancelled')} text="Cancel" icon={XCircle} />}
          </>
        )}
        {tableName === 'orders' && isRestaurant && (
          <>
            {status === 'pending' && <ActionButton loadingVal="confirmed" onClick={() => handleStatusUpdate(selected.id, 'confirmed')} text="Confirm" icon={CheckCircle2} />}
            {status === 'confirmed' && <ActionButton loadingVal="preparing" onClick={() => handleStatusUpdate(selected.id, 'preparing')} text="Prepare" icon={UtensilsCrossed} />}
            {status === 'preparing' && <ActionButton loadingVal="delivered" onClick={() => handleStatusUpdate(selected.id, 'delivered')} text="Delivered" icon={Check} />}
            {status !== 'cancelled' && status !== 'delivered' && <ActionButton variant="danger" loadingVal="cancelled" onClick={() => handleStatusUpdate(selected.id, 'cancelled')} text="Cancel" icon={XCircle} />}
          </>
        )}
        {tableName === 'appointments' && (
          <>
            {status === 'pending' && <ActionButton loadingVal="confirmed" onClick={() => handleStatusUpdate(selected.id, 'confirmed')} text="Confirm Appt." icon={CheckCircle2} />}
            {status === 'confirmed' && <ActionButton loadingVal="completed" onClick={() => handleStatusUpdate(selected.id, 'completed')} text="Completed" icon={Check} />}
            {status !== 'cancelled' && status !== 'completed' && <ActionButton variant="danger" loadingVal="cancelled" onClick={() => handleStatusUpdate(selected.id, 'cancelled')} text="Cancel" icon={XCircle} />}
          </>
        )}
        {tableName === 'leads' && (
          <>
            {status === 'new_inquiry' && <ActionButton loadingVal="qualified" onClick={() => handleStatusUpdate(selected.id, 'qualified')} text="Qualify Lead" icon={CheckCircle2} />}
            {status === 'qualified' && <ActionButton loadingVal="properties_sent" onClick={() => handleStatusUpdate(selected.id, 'properties_sent')} text="Props Sent" icon={Home} />}
            {status === 'properties_sent' && <ActionButton loadingVal="visit_scheduled" onClick={() => handleStatusUpdate(selected.id, 'visit_scheduled')} text="Schedule Visit" icon={Calendar} />}
            {status === 'visit_scheduled' && <ActionButton loadingVal="closed_won" onClick={() => handleStatusUpdate(selected.id, 'closed_won')} text="Closed Won" icon={Check} />}
            {status !== 'closed_lost' && status !== 'closed_won' && <ActionButton variant="danger" loadingVal="closed_lost" onClick={() => handleStatusUpdate(selected.id, 'closed_lost')} text="Closed Lost" icon={XCircle} />}
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: '#f9fafb', minHeight: 'calc(100vh - 98px)', padding: '32px' }}>
      
      {/* ── Page Header & Stats ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>{renderTitle()}</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Manage, track, and update your {tableName.replace('_', ' ')}.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.15s' }}>
            <FileSpreadsheet size={16} color="#10b981" /> Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: 16, border: '1px solid #f3f4f6', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: '#fef2f2', padding: 8, borderRadius: 10, color: '#dc2626' }}><ShoppingBag size={18} /></div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Total Records</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>{metrics.total}</div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: 16, border: '1px solid #f3f4f6', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: '#fffbeb', padding: 8, borderRadius: 10, color: '#d97706' }}><Clock size={18} /></div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Action Required</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>{metrics.pending}</div>
        </div>
        {tableName === 'orders' && (
          <div style={{ background: '#fff', padding: '20px', borderRadius: 16, border: '1px solid #f3f4f6', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ background: '#f0fdf4', padding: 8, borderRadius: 10, color: '#16a34a' }}><DollarSign size={18} /></div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Estimated Revenue</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>PKR {metrics.revenue.toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* ── Data Table Area ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        
        {/* Table Toolbar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
          <div style={{ position: 'relative', width: 320 }}>
            <Search size={15} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search customers by name or phone..." 
              style={{ width: '100%', padding: '10px 14px 10px 40px', fontSize: 13, border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none', transition: 'border-color 0.2s' }} 
              onFocus={e => e.currentTarget.style.borderColor = '#dc2626'}
              onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#4b5563', cursor: 'pointer' }}>
            <Filter size={14} /> Filter
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', minHeight: 400 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: '#9ca3af' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 300, color: '#9ca3af' }}>
              <Search size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>No records found matching your search.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Customer</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{tableName === 'orders' ? 'Items' : 'Service/Intent'}</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{tableName === 'orders' ? 'Amount' : (tableName === 'leads' ? 'Budget' : 'Date')}</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Received</th>
                  <th style={{ padding: '16px 24px', width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const name = item.customer_name || item.patient_name || 'Unknown';
                  const phone = item.customer_phone || item.patient_phone || 'No phone';
                  const status = item.status || item.stage || 'pending';
                  const color = getStatusColor(status);
                  
                  let col2 = '';
                  if (tableName === 'orders') {
                    if (Array.isArray(item.items) && item.items.length > 0) {
                      col2 = item.items.map((i:any) => `${i.qty||1}x ${i.name||i.title||'Item'}`).join(', ');
                      if (col2.length > 35) col2 = col2.substring(0, 35) + '...';
                    } else {
                      col2 = 'No items listed';
                    }
                  } else if (tableName === 'appointments') {
                    col2 = item.service_type || 'Consultation';
                  } else {
                    col2 = `${item.intent || 'Buy'} ${item.property_type || 'Property'}`;
                  }

                  let col3 = '';
                  if (tableName === 'orders') col3 = `PKR ${item.order_amount || 0}`;
                  else if (tableName === 'leads') col3 = `${item.budget_min||0} - ${item.budget_max||'Any'}`;
                  else col3 = `${item.appointment_date || ''} ${item.appointment_time || ''}`;

                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedRecord(item)}
                      style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{name}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> {phone}</div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 13, color: '#4b5563', fontWeight: 500 }}>{col2}</td>
                      <td style={{ padding: '16px 24px', fontSize: 13, color: '#111827', fontWeight: 600 }}>{col3}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: color.bg, color: color.text, border: `1px solid ${color.border}`, display: 'inline-block', whiteSpace: 'nowrap' }}>
                          {(status).replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 12.5, color: '#6b7280' }}>
                        {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><MoreVertical size={18} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Slide-Over Detail Drawer ── */}
      {selectedRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
          <div 
            style={{ width: '100%', maxWidth: 500, background: '#f9fafb', height: '100%', boxShadow: '-5px 0 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.25s ease-out' }}
          >
            {/* Drawer Header */}
            <div style={{ padding: '24px 28px', background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: getStatusColor(selectedRecord.status || selectedRecord.stage).text, background: getStatusColor(selectedRecord.status || selectedRecord.stage).bg, padding: '4px 10px', borderRadius: 20, border: `1px solid ${getStatusColor(selectedRecord.status || selectedRecord.stage).border}`, display: 'inline-block', marginBottom: 12 }}>
                  {(selectedRecord.status || selectedRecord.stage || 'PENDING').replace(/_/g, ' ').toUpperCase()}
                </span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px 0' }}>
                  {selectedRecord.customer_name || selectedRecord.patient_name || 'Record Details'}
                </h2>
                <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={13} /> {selectedRecord.customer_phone || selectedRecord.patient_phone}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={13} /> {new Date(selectedRecord.created_at).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => setSelectedRecord(null)} style={{ background: '#f3f4f6', border: 'none', width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}>
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Bifurcated Content Cards */}
              
              {tableName === 'orders' && (
                <>
                  <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e5e7eb', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShoppingBag size={16} color="#dc2626" />
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Order Summary</h3>
                      </div>
                      {selectedRecord.platform_order_number && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Store size={11} />
                          {selectedRecord.platform_order_number}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px dashed #e5e7eb', marginBottom: 16 }}>
                      <span style={{ fontSize: 14, color: '#4b5563' }}>Total Amount</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>PKR {selectedRecord.order_amount || 0}</span>
                    </div>

                    <h4 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Items Ordered</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {Array.isArray(selectedRecord.items) && selectedRecord.items.length > 0 ? selectedRecord.items.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>{item.qty || 1}x</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1f2937', lineHeight: 1.3 }}>{item.name || item.title || 'Product Item'}</div>
                            {item.price && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>PKR {item.price} each</div>}
                          </div>
                        </div>
                      )) : (
                        <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic', padding: '10px 0' }}>No specific items parsed from chat.</div>
                      )}
                    </div>
                  </div>

                  {selectedRecord.delivery_address && (
                    <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e5e7eb', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <MapPin size={16} color="#dc2626" />
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Delivery Details</h3>
                      </div>
                      <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                        {selectedRecord.delivery_address}
                      </p>
                    </div>
                  )}

                  {selectedRecord.payment_method && (
                    <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e5e7eb', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <DollarSign size={16} color="#dc2626" />
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Payment Method</h3>
                      </div>
                      <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
                        {selectedRecord.payment_method}
                      </p>
                    </div>
                  )}

                  {/* Platform Sync & Email Status */}
                  {(selectedRecord.platform_order_number || selectedRecord.email_sent_at) && (
                    <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e5e7eb', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Activity size={16} color="#dc2626" />
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Sync Status</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {selectedRecord.platform_order_number && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <ExternalLink size={13} /> Platform Order
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>
                              {selectedRecord.platform_order_number} ({selectedRecord.platform_source || 'unknown'})
                            </span>
                          </div>
                        )}
                        {selectedRecord.email_sent_at && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Mail size={13} /> Email Confirmation
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>
                              Sent {new Date(selectedRecord.email_sent_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Action Banner Sticky Bottom */}
            </div>
            
            <div style={{ padding: '20px 28px', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
              {renderActionButtons(selectedRecord)}
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
