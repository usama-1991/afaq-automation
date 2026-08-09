import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import CTA from "@/components/landing/CTA";
import Features from "@/components/landing/Features";
import InboxDemo from "@/components/landing/InboxDemo";

export default function FeatureDetail({ params }: { params: { slug: string } }) {
  const titleMap: Record<string, string> = {
    'ai-chatbot': 'AI Chatbot',
    'shared-inbox': 'Shared Inbox',
    'order-management': 'Order Management',
    'appointment-booking': 'Appointment Booking',
    'analytics': 'Analytics Dashboard',
    'campaigns': 'Broadcast Campaigns',
  };

  const title = titleMap[params.slug] || 'Powerful Feature';

  return (
    <main className="relative min-h-screen bg-[#F6F5F2]">
      <Nav />
      <div className="pt-32 pb-8 bg-[#F6F5F2]">
        <div className="landing-container text-center max-w-4xl mx-auto">
          <span className="landing-label landing-label--maroon mb-4 mx-auto">FEATURE HIGHLIGHT</span>
          <h1 className="text-4xl md:text-6xl font-bold text-[#14161A] mb-6 font-heading tracking-tight capitalize">
            {title}
          </h1>
          <p className="text-lg text-[#6B6F76] mb-8 leading-relaxed">
            Discover how our {title.toLowerCase()} can transform your customer experience, automate your workflows, and scale your business effortlessly on WhatsApp.
          </p>
        </div>
      </div>
      
      {/* For now we showcase the Inbox Demo and the full Features list */}
      <InboxDemo />
      <Features />
      
      <CTA />
      <Footer />
    </main>
  );
}
