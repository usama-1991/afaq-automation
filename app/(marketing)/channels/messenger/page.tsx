import Link from "next/link";
import { MessageSquare, ArrowRight, Sparkles, CheckCircle2, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facebook Messenger & Lead Ads AI Automation — Ittisalo",
  description:
    "Instantly capture, score, and qualify leads from Facebook Lead Ads and Messenger campaigns. Ittisalo AI routes high-intent prospects directly to sales teams.",
  keywords: [
    "Facebook Messenger AI Automation",
    "Facebook Lead Ads Auto Router",
    "Real Estate Lead Conversion AI",
    "Meta Messenger Bot Pakistan",
    "Ittisalo Messenger Integration"
  ]
};

export default function MessengerChannelPage() {
  return (
    <div className="w-full bg-[#FDFCFB]">
      {/* Hero */}
      <section className="pt-16 pb-24 px-4 bg-gradient-to-b from-[#EFF6FF]/70 via-[#FDFCFB] to-white border-b border-[#EFEBE4]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] text-xs sm:text-sm font-bold shadow-sm">
              <MessageSquare size={16} className="text-[#0084FF]" /> Facebook Messenger & Lead Ads Integration
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-[#1A1517] leading-[1.12]">
              Convert Click-to-Messenger Meta Ads into <span className="text-[#0084FF]">Qualified Buyers</span>
            </h1>

            <p className="text-lg text-[#5C5255] font-medium leading-relaxed max-w-2xl">
              Don’t let your Facebook ad spend go to waste with slow responses. Ittisalo instantly greets users clicking your Messenger ads, pre-qualifies their budget and intent, and schedules consultations automatically.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-xl shadow-[#0084FF]/20 bg-[#0084FF] hover:bg-[#0073E6] transition-all"
              >
                <Sparkles size={18} /> Connect Facebook Page
              </Link>
              <Link
                href="/product"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-[#1A1517] bg-white border border-[#EFEBE4] hover:bg-[#FFF5F5]"
              >
                Explore Product Features <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            {/* Live Messenger Mockup Card */}
            <div className="bg-white rounded-3xl p-6 border border-[#EFEBE4] shadow-2xl relative max-w-md mx-auto w-full">
              <div className="flex items-center justify-between border-b border-[#EFEBE4] pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0084FF] flex items-center justify-center text-white font-bold">
                    FB
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#1A1517]">Apex Horizon Realty</div>
                    <div className="text-[11px] text-[#0084FF] font-semibold">Click-to-Messenger Lead Ad</div>
                  </div>
                </div>
                <span className="text-[10px] bg-[#EFF6FF] text-[#0084FF] px-2 py-1 rounded font-bold">INSTANT LEAD</span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="bg-gray-100 p-3.5 rounded-2xl rounded-tl-sm text-[#1A1517] max-w-[85%]">
                  Hi! I clicked your ad for 3-Bedroom Apartments in DHA Phase 8 Karachi. What is the starting price?
                </div>

                <div className="bg-[#EFF6FF] p-3.5 rounded-2xl rounded-tr-sm border border-[#BFDBFE] max-w-[90%] ml-auto text-[#1A1517] space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-[#0084FF] text-[11px]">
                    <Sparkles size={13} /> Ittisalo Real Estate AI Assistant
                  </div>
                  <p>
                    Assalam-o-Alaikum! Apartments start from Rs. 2.8 Crore with a 2-year payment plan. I have dispatched the PDF brochure to your Messenger! Would you like to schedule a site visit this Saturday? 🏢
                  </p>
                  <div className="pt-1">
                    <span className="bg-[#0084FF] text-white px-3 py-1 rounded font-bold text-[10px]">
                      Book Site Visit Appointment
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-20 bg-white border-b border-[#EFEBE4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#1E40AF] px-3.5 py-1 rounded-full text-xs font-bold">
                <Zap size={14} /> Meta Lead Engine
              </div>
              <h2 className="text-3xl font-display font-extrabold text-[#1A1517]">
                Capture and qualify leads at scale
              </h2>
              <p className="text-sm text-[#5C5255] leading-relaxed">
                Seamlessly bridge your Facebook Page ad campaigns with your sales pipeline. High-score leads are immediately assigned to sales agents via round-robin routing.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs font-bold text-[#1A1517]">
                  <CheckCircle2 size={16} className="text-[#10B981]" /> Automated Lead Prequalification Questionnaires
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-[#1A1517]">
                  <CheckCircle2 size={16} className="text-[#10B981]" /> Direct PDF Brochure & Price List Sharing in Chat
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-[#1A1517]">
                  <CheckCircle2 size={16} className="text-[#10B981]" /> CRM & Calendar Synchronization
                </div>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[#EFEBE4] shadow-2xl bg-gray-900">
              <img src="/images/dashboard/analytics.png" alt="Messenger Analytics Dashboard" className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Cross Links */}
      <section className="py-16 bg-[#FDFCFB]">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h3 className="text-2xl font-bold text-[#1A1517]">Explore Messenger AI Workflows By Vertical</h3>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/solutions/real-estate" className="px-5 py-2.5 bg-white border border-[#EFEBE4] rounded-xl text-xs font-bold text-[#1A1517] hover:border-[#C81E3A]">
              Real Estate Lead Capture →
            </Link>
            <Link href="/solutions/clinics" className="px-5 py-2.5 bg-white border border-[#EFEBE4] rounded-xl text-xs font-bold text-[#1A1517] hover:border-[#C81E3A]">
              Clinic Consultation Booking →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
