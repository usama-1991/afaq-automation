import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Verticals from "@/components/landing/Verticals";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-paper">
      <Nav />
      <Hero />
      <Verticals />
      <HowItWorks />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}
