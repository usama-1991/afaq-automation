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
        <div style={{
          width: 48, height: 48, borderRadius: 13,
          background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 auto 12px',
        }}>A</div>
        <div style={{ fontSize: 15, color: '#6b7280', fontWeight: 500 }}>AutoFlow AI</div>
      </div>
    </div>
  );
}
