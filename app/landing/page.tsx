import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#fff',
      color: '#111827'
    }}>
      {/* Navigation */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 48px',
        borderBottom: '1px solid #f3f4f6'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/ittisalo-logo.png" 
            alt="Ittisalo Logo" 
            style={{ width: 32, height: 32, borderRadius: 8 }}
          />
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Ittisalo</span>
        </div>
        <nav>
          <a href="https://app.ittisalo.com/login" style={{
            padding: '10px 20px',
            background: '#2563eb',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 500
          }}>
            Login to Portal
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '120px 24px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '64px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: '24px'
        }}>
          Welcome to the new <br />
          <span style={{ color: '#2563eb' }}>Ittisalo Landing Page</span>
        </h1>
        
        <p style={{
          fontSize: '20px',
          color: '#4b5563',
          maxWidth: '600px',
          margin: '0 auto 48px',
          lineHeight: 1.6
        }}>
          This page is running on the exact same Next.js application as your portal,
          but is specifically routed to show up when visitors go to <strong>ittisalo.com</strong>.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <a href="https://app.ittisalo.com" style={{
            padding: '14px 28px',
            background: '#111827',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 500
          }}>
            Open App Portal
          </a>
        </div>
      </main>
    </div>
  );
}
