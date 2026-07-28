'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Star, MessageSquareQuote, Calendar } from 'lucide-react';
import { useNiche } from '@/context/NicheContext';
import { useRouter } from 'next/navigation';

import { createMemoryState } from '@/lib/useMemoryState';

const useMemoryState = createMemoryState();

export default function ReviewsPage() {
  const [reviews, setReviews] = useMemoryState<any[]>('reviews', []);
  const [loading, setLoading] = useMemoryState('loading', true);
  const [tenantId, setTenantId] = useMemoryState<string | null>('tenantId', null);
  const { nicheId } = useNiche();
  const router = useRouter();

  useEffect(() => {
    if (nicheId && nicheId !== 'ecommerce') {
      router.push('/dashboard');
    }
  }, [nicheId, router]);

  useEffect(() => {
    const fetchUserAndReviews = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRecord } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
      if (userRecord?.tenant_id) {
        setTenantId(userRecord.tenant_id);
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('tenant_id', userRecord.tenant_id)
          .order('created_at', { ascending: false });

        if (reviewsData) {
          setReviews(reviewsData);
        }
      }
      setLoading(false);
    };

    fetchUserAndReviews();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading reviews...</div>;

  return (
    <div style={{ padding: '30px 40px', maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Star color="#f59e0b" fill="#f59e0b" />
          Customer Reviews
        </h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: 15 }}>
          Monitor the feedback collected from customers after their orders are delivered.
        </p>
      </header>

      {reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f9fafb', borderRadius: 16, border: '1px dashed #e5e7eb' }}>
          <MessageSquareQuote size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#374151' }}>No reviews yet</h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
            Reviews will appear here automatically when customers reply to the delivery confirmation message.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {reviews.map(review => (
            <div key={review.id} style={{
              background: '#fff', borderRadius: 16, padding: 24,
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #f3f4f6'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: '#111827' }}>{review.customer_name || 'Customer'}</h4>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{review.customer_phone}</span>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star} 
                      size={16} 
                      color={star <= review.rating ? '#f59e0b' : '#e5e7eb'} 
                      fill={star <= review.rating ? '#f59e0b' : 'none'} 
                    />
                  ))}
                </div>
              </div>
              
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#4b5563', lineHeight: 1.5, fontStyle: 'italic' }}>
                  "{review.review_text}"
                </p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9ca3af', fontSize: 12 }}>
                <Calendar size={14} />
                {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
