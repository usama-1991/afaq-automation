import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import CTA from "@/components/landing/CTA";
import Features from "@/components/landing/Features";
import InboxDemo from "@/components/landing/InboxDemo";

export const metadata = {
  title: "Features — Ittisalo",
  description: "Explore the powerful features of Ittisalo's AI-powered WhatsApp automation platform.",
};

export default function FeaturesPage() {
  return (
    <main className="relative min-h-screen bg-[#F6F5F2]">
      <Nav />
      <div className="pt-32 pb-8 bg-[#F6F5F2]">
        <div className="landing-container text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[#14161A] mb-6 mt-8 font-heading tracking-tight">
            Platform <span className="text-[#C42B33]">Features</span>
          </h1>
          <p className="text-lg text-[#6B6F76] max-w-2xl mx-auto">
            Everything you need to automate your customer communication and scale your business on WhatsApp.
          </p>
        </div>
      </div>
      <Features />
      <InboxDemo />
      <CTA />
      <Footer />
    </main>
  );
}
