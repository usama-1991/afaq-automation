import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { NicheProvider } from '@/context/NicheContext';
import { PlanProvider } from '@/context/PlanContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Ittisalo — AI-Powered WhatsApp Business Dashboard',
  description: 'Ittisalo: AI-powered omnichannel CRM and WhatsApp automation for your business',
};

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} ${inter.className}`}>
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
