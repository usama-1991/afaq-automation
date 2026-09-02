import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "Ittisalo — One AI inbox for every DM your business gets",
  description:
    "Automate responses, take orders, book appointments, and manage conversations 24/7 across WhatsApp, Instagram, and Messenger.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ITTISALO (PRIVATE) LIMITED",
  "legalName": "ITTISALO (PRIVATE) LIMITED",
  "alternateName": "Ittisalo",
  "url": "https://ittisalo.com",
  "identifier": "0347762",
  "taxID": "J527787-0",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "p 45 1 22ND LANE PHASE 7 DHA KARACHI",
    "addressLocality": "Karachi",
    "addressCountry": "PK",
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+923103604110",
    "contactType": "customer service",
    "email": "Ittisaloai@gmail.com",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[var(--color-mktg-bg)] text-[var(--color-mktg-base)] selection:bg-[var(--color-mktg-cta)] selection:text-white font-body antialiased">
        <Navbar />
        <main className="min-h-screen pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
