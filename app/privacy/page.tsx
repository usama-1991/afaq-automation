import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{ padding: '60px 32px', maxWidth: 800, margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: '#111827', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8, letterSpacing: '-1px' }}>Privacy Policy</h1>
      <p style={{ color: '#6b7280', marginBottom: 40 }}>Last updated: June 26, 2026</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>1. Information We Collect</h2>
        <p style={{ marginBottom: 12 }}>When you use AutoFlow AI, we may collect the following types of information:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
          <li><strong>Account Information:</strong> Name, email address, and company details provided during registration.</li>
          <li><strong>Messaging Data:</strong> Content, metadata, and communication history from connected channels (e.g., WhatsApp Business API) to facilitate AI-driven responses.</li>
          <li><strong>Usage Data:</strong> Information about how you interact with our platform, including logs, device information, and analytics.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>2. How We Use Your Information</h2>
        <p style={{ marginBottom: 12 }}>We use the collected information to:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
          <li>Provide, maintain, and improve the AutoFlow AI platform.</li>
          <li>Process and deliver AI-generated responses to your end-users via integrated messaging channels.</li>
          <li>Ensure compliance with Meta's Business policies and other third-party API requirements.</li>
          <li>Communicate with you regarding account updates, billing, and support.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>3. Data Sharing and Third-Party Services</h2>
        <p style={{ marginBottom: 12 }}>We do not sell your personal data. We may share information with:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
          <li><strong>Service Providers:</strong> Cloud hosting (Supabase, Vercel) and LLM providers necessary for core functionality.</li>
          <li><strong>Integrated Platforms:</strong> Data is securely transmitted to Meta (WhatsApp/Instagram) strictly to facilitate the delivery of your messages.</li>
          <li><strong>Legal Compliance:</strong> When required by law or to protect our legal rights.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>4. Data Security</h2>
        <p style={{ marginBottom: 12 }}>We implement industry-standard security measures, including AES-256 encryption for all sensitive API tokens (such as Meta System User Tokens) and Row Level Security (RLS) to ensure strict data isolation between tenants.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>5. Your Rights</h2>
        <p style={{ marginBottom: 12 }}>Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data. You may contact us to exercise these rights or to request the deletion of your workspace data.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>6. Contact Us</h2>
        <p style={{ marginBottom: 12 }}>If you have any questions or concerns about this Privacy Policy, please contact our privacy team at <strong>privacy@autoflow.ai</strong> (or your updated contact email).</p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '40px 0' }} />
      <p style={{ textAlign: 'center', fontSize: 14, color: '#9ca3af' }}>&copy; {new Date().getFullYear()} AutoFlow AI. All rights reserved.</p>
    </div>
  );
}
