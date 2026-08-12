import type { Metadata } from "next";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Ittisalo — One AI inbox for every DM your business gets",
  description:
    "Automate responses, take orders, book appointments, and manage conversations 24/7 across WhatsApp, Instagram, and Messenger.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[var(--color-mktg-bg)] text-[var(--color-mktg-base)] selection:bg-[var(--color-mktg-cta)] selection:text-white font-body antialiased">
        <Navbar />
        <main className="min-h-screen pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
