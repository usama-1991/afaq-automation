import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import CTA from "@/components/landing/CTA";
import Verticals from "@/components/landing/Verticals";
import Trust from "@/components/landing/Trust";

export default function IndustryDetail({ params }: { params: { slug: string } }) {
  const titleMap: Record<string, string> = {
    'restaurants': 'Restaurants & Food',
    'clinics': 'Clinics & Healthcare',
    'ecommerce': 'eCommerce & Retail',
    'real-estate': 'Real Estate',
    'salons': 'Salons & Studios',
  };

  const title = titleMap[params.slug] || 'Your Industry';

  return (
    <main className="relative min-h-screen bg-[#F6F5F2]">
      <Nav />
      <div className="pt-32 pb-8 bg-[#F6F5F2]">
        <div className="landing-container text-center max-w-4xl mx-auto">
          <span className="landing-label landing-label--maroon mb-4 mx-auto">INDUSTRY SOLUTION</span>
          <h1 className="text-4xl md:text-6xl font-bold text-[#14161A] mb-6 font-heading tracking-tight capitalize">
            WhatsApp AI for <span className="text-[#C42B33]">{title}</span>
          </h1>
          <p className="text-lg text-[#6B6F76] mb-8 leading-relaxed">
            See how top {title.toLowerCase()} businesses use Ittisalo to automate customer inquiries, take orders, and capture leads 24/7.
          </p>
        </div>
      </div>
      
      {/* Display industry specific blocks and full Verticals grid */}
      <Verticals />
      <Trust />
      
      <CTA />
      <Footer />
    </main>
  );
}
