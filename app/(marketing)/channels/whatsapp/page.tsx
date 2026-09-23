import Link from "next/link";
import { MessageSquare, Calendar, ShoppingBag, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatsApp Business API AI Automation Platform — Ittisalo",
  description:
    "Automate WhatsApp catalog sales, delivery orders, and appointment scheduling with official WhatsApp Business API integration. Trusted by SMBs across Pakistan.",
  keywords: [
    "WhatsApp Business API Pakistan",
    "WhatsApp AI Automation",
    "WhatsApp Bot for Restaurants Karachi",
    "WhatsApp E-commerce Catalog",
    "Ittisalo WhatsApp Inbox"
  ]
};

export default function WhatsAppChannelPage() {
  return (
    <div className="w-full bg-[#FDFCFB]">
      {/* Hero */}
      <section className="pt-16 pb-24 px-4 bg-gradient-to-b from-[#ECFDF5]/60 via-[#FDFCFB] to-white border-b border-[#EFEBE4]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs sm:text-sm font-bold shadow-sm">
                <MessageSquare size={16} className="text-[#25D366]" /> Official WhatsApp Business API Solution
              </div>
              <div className="bg-[#1A050B] px-3.5 py-1.5 rounded-full border border-[#3D0C1A] inline-flex items-center gap-2 shadow-sm">
                <img
                  src="/meta-business-partner-badge.png"
                  alt="Official Meta Tech Partner Badge"
                  className="h-6 w-auto object-contain"
                />
                <span className="text-[11px] text-gray-300 font-bold hidden sm:inline">
                  Official Meta Tech Partner
                </span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-[#1A1517] leading-[1.12]">
              Turn WhatsApp into Your Highest-Converting <span className="text-[#25D366]">Sales Channel</span>
            </h1>

            <p className="text-lg text-[#5C5255] font-medium leading-relaxed max-w-2xl">
              WhatsApp is where your customers live. Ittisalo replaces slow manual texting with an automated AI engine that shares interactive catalogs, takes delivery orders, and books clinic or salon appointments 24 hours a day.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-xl shadow-[#25D366]/20 bg-[#25D366] hover:bg-[#1EBE5D] transition-all"
              >
                <Sparkles size={18} /> Connect WhatsApp Business API
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
            {/* Live WhatsApp Mockup Card */}
            <div className="bg-[#111B21] rounded-3xl p-6 border border-[#202C33] shadow-2xl relative max-w-md mx-auto w-full text-white">
              <div className="flex items-center justify-between border-b border-[#202C33] pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white font-bold">
                    WA
                  </div>
                  <div>
                    <div className="font-bold text-sm flex items-center gap-1">
                      Gourmet Bites Bistro <ShieldCheck size={14} className="text-[#00A884]" />
                    </div>
                    <div className="text-[11px] text-[#00A884] font-medium">Verified WhatsApp Business</div>
                  </div>
                </div>
                <span className="text-[10px] bg-[#202C33] px-2 py-1 rounded text-gray-400 font-mono">0.4s AI speed</span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="bg-[#202C33] p-3.5 rounded-2xl rounded-tl-sm text-gray-200 max-w-[85%]">
                  Assalam-o-Alaikum! Can I order 2 Zinger Burgers for delivery in DHA Phase 5 Karachi?
                </div>

                <div className="bg-[#005C4B] p-3.5 rounded-2xl rounded-tr-sm text-white max-w-[90%] ml-auto space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-[#00A884] text-[11px]">
                    <Sparkles size={13} /> Ittisalo AI Assistant
                  </div>
                  <p>
                    Walaikum Assalam! Yes! 2 Zinger Burgers combo with fries & drinks is Rs. 1,850. Cash on Delivery available. Should I confirm your order for DHA Phase 5? 🍔
                  </p>
                  <div className="pt-1 flex gap-2">
                    <span className="bg-[#00A884] text-white px-2.5 py-1 rounded font-bold text-[10px]">
                      Confirm Order & Delivery
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Dashboard Feature Screenshot */}
      <section className="py-20 bg-white border-b border-[#EFEBE4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-[#ECFDF5] text-[#065F46] px-3.5 py-1 rounded-full text-xs font-bold">
                <Zap size={14} /> Multi-Agent WhatsApp Hub
              </div>
              <h2 className="text-3xl font-display font-extrabold text-[#1A1517]">
                Manage all WhatsApp conversations from a single dashboard
              </h2>
              <p className="text-sm text-[#5C5255] leading-relaxed">
                Connect multiple phone numbers and assign team members with round-robin routing. Your support agents can view real-time AI suggestions, takeover chats seamlessly, and tag order states.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs font-bold text-[#1A1517]">
                  <CheckCircle2 size={16} className="text-[#10B981]" /> Official Green Tick Verification Guidance
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-[#1A1517]">
                  <CheckCircle2 size={16} className="text-[#10B981]" /> Interactive WhatsApp Button & List Messages
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-[#1A1517]">
                  <CheckCircle2 size={16} className="text-[#10B981]" /> Click-to-WhatsApp Ads Instant Conversion Tracking
                </div>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[#EFEBE4] shadow-2xl bg-gray-900">
              <img src="/images/dashboard/inbox.png" alt="WhatsApp Inbox Dashboard" className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Cross Links */}
      <section className="py-16 bg-[#FDFCFB]">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h3 className="text-2xl font-bold text-[#1A1517]">Explore WhatsApp AI Workflows By Vertical</h3>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/solutions/restaurants" className="px-5 py-2.5 bg-white border border-[#EFEBE4] rounded-xl text-xs font-bold text-[#1A1517] hover:border-[#C81E3A]">
              Restaurant Order Bot →
            </Link>
            <Link href="/solutions/clinics" className="px-5 py-2.5 bg-white border border-[#EFEBE4] rounded-xl text-xs font-bold text-[#1A1517] hover:border-[#C81E3A]">
              Clinic Booking AI →
            </Link>
            <Link href="/solutions/ecommerce-fashion" className="px-5 py-2.5 bg-white border border-[#EFEBE4] rounded-xl text-xs font-bold text-[#1A1517] hover:border-[#C81E3A]">
              eCommerce Catalog Sync →
            </Link>
            <Link href="/case-studies/gourmet-bites-bistro" className="px-5 py-2.5 bg-[#FFF5F5] border border-[#FFE8EA] rounded-xl text-xs font-bold text-[#C81E3A]">
              View Restaurant Case Study →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
