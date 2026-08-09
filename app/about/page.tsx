import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import Trust from "@/components/landing/Trust";
import CTA from "@/components/landing/CTA";

export const metadata = {
  title: "About Us — Ittisalo",
  description: "Learn more about the mission and team behind Ittisalo.",
};

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-[#F6F5F2]">
      <Nav />
      <div className="pt-32 pb-16 bg-[#F6F5F2]">
        <div className="landing-container text-center max-w-3xl">
          <span className="landing-label landing-label--maroon mb-4 mx-auto">OUR MISSION</span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#14161A] mb-6 font-heading tracking-tight">
            Building the communication layer for <span className="text-[#C42B33]">modern businesses</span>
          </h1>
          <p className="text-lg text-[#6B6F76] mb-8 leading-relaxed">
            Ittisalo was founded with a single goal: to help small and medium businesses in Pakistan and beyond harness the power of AI on the world's most popular messaging app. 
          </p>
          <p className="text-lg text-[#6B6F76] leading-relaxed">
            We believe that every business, regardless of size, deserves enterprise-grade automation to manage their orders, leads, and customer support without needing a team of engineers.
          </p>
        </div>
      </div>
      <Trust />
      <CTA />
      <Footer />
    </main>
  );
}
