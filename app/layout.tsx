import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NicheProvider } from '@/context/NicheContext';
import { PlanProvider } from '@/context/PlanContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'AutoFlow AI — WhatsApp Business Dashboard',
  description: 'AI-powered WhatsApp bot and CRM for your business',
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <NicheProvider>
          <PlanProvider>
            <AppShell>{children}</AppShell>
          </PlanProvider>
        </NicheProvider>
      </body>
    </html>
  );
}
