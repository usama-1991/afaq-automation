import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import CTA from "@/components/landing/CTA";
import HowItWorks from "@/components/landing/HowItWorks";
import Comparison from "@/components/landing/Comparison";

export const metadata = {
  title: "How It Works — Ittisalo",
  description: "Learn how easy it is to set up and scale with Ittisalo.",
};

export default function HowItWorksPage() {
  return (
    <main className="relative min-h-screen bg-[#0E1629]">
      <Nav />
      <div className="pt-32 pb-8 bg-[#0E1629]">
        <div className="landing-container text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 mt-8 font-heading tracking-tight">
            How It <span className="text-[#C42B33]">Works</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Get up and running in minutes. Connect WhatsApp, add your data, and let the AI take over.
          </p>
        </div>
      </div>
      <HowItWorks />
      <Comparison />
      <CTA />
      <Footer />
    </main>
  );
}
