import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Verticals from "@/components/landing/Verticals";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import Comparison from "@/components/landing/Comparison";
import InboxDemo from "@/components/landing/InboxDemo";
import Pricing from "@/components/landing/Pricing";
import Trust from "@/components/landing/Trust";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "Ittisalo — AI-Powered WhatsApp Assistant That Never Sleeps",
  description:
    "Ittisalo is an AI-powered WhatsApp customer communication platform for Pakistani SMBs. Automate responses, take orders, book appointments, and manage conversations 24/7.",
  keywords: [
    "WhatsApp automation",
    "AI chatbot Pakistan",
    "WhatsApp business",
    "customer communication",
    "AI assistant",
    "order management",
    "Ittisalo",
  ],
};

export default function Home() {
  return (
    <main className="relative min-h-screen bg-paper">
      <Nav />
      <Hero />
      <Verticals />
      <HowItWorks />
      <Features />
      <Comparison />
      <InboxDemo />
      <Pricing />
      <Trust />
      <CTA />
      <Footer />
    </main>
  );
}
