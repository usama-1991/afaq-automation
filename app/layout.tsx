import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NicheProvider } from '@/context/NicheContext';
import { PlanProvider } from '@/context/PlanContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Ittisalo — AI-Powered WhatsApp Business Dashboard',
  description: 'Ittisalo: AI-powered omnichannel CRM and WhatsApp automation for your business',
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
