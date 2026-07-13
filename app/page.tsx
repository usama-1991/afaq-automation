// Root route — AppShell handles the redirect to /onboarding or /dashboard
// This must NOT return null, needs to render something visible during SSR
export default function RootPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdf4 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/ittisalo-logo.svg" alt="Ittisalo" style={{
          width: 48, height: 48, borderRadius: 13,
          margin: '0 auto 12px',
          boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
        }} />
        <div style={{ fontSize: 15, color: '#6b7280', fontWeight: 500 }}>Ittisalo</div>
      </div>
    </div>
  );
}
