import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import CTA from "@/components/landing/CTA";
import Verticals from "@/components/landing/Verticals";
import Trust from "@/components/landing/Trust";

export const metadata = {
  title: "Industries — Ittisalo",
  description: "See how Ittisalo transforms customer communication across different industries.",
};

export default function IndustriesPage() {
  return (
    <main className="relative min-h-screen bg-[#F6F5F2]">
      <Nav />
      <div className="pt-32 pb-8 bg-[#F6F5F2]">
        <div className="landing-container text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[#14161A] mb-6 mt-8 font-heading tracking-tight">
            Tailored for your <span className="text-[#C42B33]">Industry</span>
          </h1>
          <p className="text-lg text-[#6B6F76] max-w-2xl mx-auto">
            Whether you run a restaurant, clinic, or eCommerce store, our AI understands your specific business needs.
          </p>
        </div>
      </div>
      <Verticals />
      <Trust />
      <CTA />
      <Footer />
    </main>
  );
}
