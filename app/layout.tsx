import type { Metadata } from 'next';
import './globals.css';
import { NicheProvider } from '@/context/NicheContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'AutoFlow AI — WhatsApp Business Dashboard',
  description: 'AI-powered WhatsApp bot and CRM for your business',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NicheProvider>
          <AppShell>{children}</AppShell>
        </NicheProvider>
      </body>
    </html>
  );
}
