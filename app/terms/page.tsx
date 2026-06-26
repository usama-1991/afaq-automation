import React from 'react';

export default function TermsOfService() {
  return (
    <div style={{ padding: '60px 32px', maxWidth: 800, margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: '#111827', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8, letterSpacing: '-1px' }}>Terms of Service</h1>
      <p style={{ color: '#6b7280', marginBottom: 40 }}>Last updated: June 26, 2026</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>1. Acceptance of Terms</h2>
        <p style={{ marginBottom: 12 }}>By accessing or using the AutoFlow AI platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>2. Description of Service</h2>
        <p style={{ marginBottom: 12 }}>AutoFlow AI is a B2B Software-as-a-Service (SaaS) platform that provides AI-powered omnichannel messaging workflows, including integrations with the WhatsApp Business API. The service is provided "as is" and we reserve the right to modify or discontinue features at any time.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>3. Meta & Third-Party API Policies</h2>
        <p style={{ marginBottom: 12 }}>By utilizing our WhatsApp integration, you strictly agree to comply with the <a href="https://www.whatsapp.com/legal/business-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#0b63e5', textDecoration: 'none' }}>WhatsApp Business Policy</a> and <a href="https://www.whatsapp.com/legal/commerce-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#0b63e5', textDecoration: 'none' }}>Commerce Policy</a>. AutoFlow AI is not responsible for any account suspension or bans imposed by Meta due to your violation of their messaging policies (e.g., sending unauthorized promotional broadcasts).</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>4. Account Security</h2>
        <p style={{ marginBottom: 12 }}>You are responsible for maintaining the confidentiality of your account credentials. You must immediately notify us of any unauthorized use of your account. AutoFlow AI will not be liable for any losses caused by unauthorized access to your workspace.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>5. Payments, Subscriptions, and Trials</h2>
        <p style={{ marginBottom: 12 }}>AutoFlow AI may offer trial periods for its services. Upon expiration of a trial, you must subscribe to a paid tier to avoid service disruption. All payments are non-refundable unless legally required or explicitly stated otherwise.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>6. Limitation of Liability</h2>
        <p style={{ marginBottom: 12 }}>To the maximum extent permitted by law, AutoFlow AI shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services, including but not limited to loss of profits, data, or business opportunities.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>7. Governing Law</h2>
        <p style={{ marginBottom: 12 }}>These Terms of Service shall be governed by and construed in accordance with the laws of your operating jurisdiction, without regard to its conflict of law provisions.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>8. Contact Information</h2>
        <p style={{ marginBottom: 12 }}>For any questions regarding these terms, please contact us at <strong>legal@autoflow.ai</strong>.</p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '40px 0' }} />
      <p style={{ textAlign: 'center', fontSize: 14, color: '#9ca3af' }}>&copy; {new Date().getFullYear()} AutoFlow AI. All rights reserved.</p>
    </div>
  );
}
