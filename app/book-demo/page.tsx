import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "Book a Demo — Ittisalo",
  description: "Schedule a personalized demo of Ittisalo.",
};

export default function BookDemoPage() {
  return (
    <main className="relative min-h-screen bg-[#F6F5F2]">
      <Nav />
      <div className="pt-40 pb-24 bg-[#F6F5F2] min-h-[70vh] flex flex-col items-center justify-center">
        <div className="landing-container text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-[#14161A] mb-6 font-heading tracking-tight">
            Book your <span className="text-[#C42B33]">Live Demo</span>
          </h1>
          <p className="text-lg text-[#6B6F76] mb-10">
            See how our AI chatbot can transform your customer communication. Connect with our team via WhatsApp to schedule a personalized walkthrough.
          </p>
          <a
            href="https://wa.me/923360479649?text=Hi,%20I'd%20like%20to%20book%20a%20demo%20of%20Ittisalo"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-btn-primary"
            style={{ display: 'inline-flex', padding: '16px 32px', fontSize: '18px' }}
          >
            <span>Chat on WhatsApp</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
      <Footer />
    </main>
  );
}
