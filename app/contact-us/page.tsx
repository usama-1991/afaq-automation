import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "Contact Us — Ittisalo",
  description: "Get in touch with the Ittisalo team.",
};

export default function ContactUsPage() {
  return (
    <main className="relative min-h-screen bg-[#F6F5F2]">
      <Nav />
      <div className="pt-40 pb-24 bg-[#F6F5F2] min-h-[70vh] flex flex-col items-center justify-center">
        <div className="landing-container text-center max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-[#14161A] mb-6 font-heading tracking-tight">
            Get in <span className="text-[#C42B33]">Touch</span>
          </h1>
          <p className="text-lg text-[#6B6F76] mb-12">
            Have questions about pricing, features, or integrations? Our team is available to help you via WhatsApp 24/7.
          </p>
          
          <div className="bg-white p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#E7E5E0]">
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-[#E7F5EC] flex items-center justify-center text-[#157F3D]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#14161A] mb-2">WhatsApp Support</h3>
                <p className="text-[#6B6F76] text-sm">Average response time: &lt; 5 minutes</p>
              </div>
              <a
                href="https://wa.me/923360479649"
                target="_blank"
                rel="noopener noreferrer"
                className="landing-btn-primary w-full justify-center"
              >
                <span>Message +92 336 0479649</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
