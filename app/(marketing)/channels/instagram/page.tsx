import Link from "next/link";
import { MessageSquare, ArrowRight, Sparkles, CheckCircle2, Zap, Heart, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instagram DMs & Story Automation AI Platform — Ittisalo",
  description:
    "Turn Instagram story mentions, post comments, and DMs into instant sales and appointments with Ittisalo AI automation for fashion, salons, and retail brands.",
  keywords: [
    "Instagram DM Automation Pakistan",
    "Instagram Story Auto Reply Bot",
    "Instagram Comment to DM Automation",
    "Fashion Ecommerce Instagram AI",
    "Ittisalo Instagram Inbox"
  ]
};

export default function InstagramChannelPage() {
  return (
    <div className="w-full bg-[#FDFCFB]">
      {/* Hero */}
      <section className="pt-16 pb-24 px-4 bg-gradient-to-b from-[#FDF2F8]/70 via-[#FDFCFB] to-white border-b border-[#EFEBE4]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FDF2F8] border border-[#FBCFE8] text-[#9D174D] text-xs sm:text-sm font-bold shadow-sm">
              <MessageSquare size={16} className="text-[#E1306C]" /> Instagram Messaging & DM Automation
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-[#1A1517] leading-[1.12]">
              Convert Every Story Reply & DM into <span className="text-[#E1306C]">Instant Revenue</span>
            </h1>

            <p className="text-lg text-[#5C5255] font-medium leading-relaxed max-w-2xl">
              Don’t let high-intent story mentions or "Price please?" post comments sit unanswered for hours. Ittisalo automatically sends product links, checks size availability, and transfers buyers to instant WhatsApp checkout.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-xl shadow-[#E1306C]/20 bg-[#E1306C] hover:bg-[#C12759] transition-all"
              >
                <Sparkles size={18} /> Connect Instagram Account
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
            {/* Live Instagram Mockup Card */}
            <div className="bg-white rounded-3xl p-6 border border-[#EFEBE4] shadow-2xl relative max-w-md mx-auto w-full">
              <div className="flex items-center justify-between border-b border-[#EFEBE4] pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-[#E1306C] to-purple-600 flex items-center justify-center text-white font-bold">
                    IG
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#1A1517]">Urban Chic Apparel (@urbanchic.pk)</div>
                    <div className="text-[11px] text-[#E1306C] font-semibold">Instagram Direct Automation</div>
                  </div>
                </div>
                <Heart size={18} className="text-[#E1306C]" />
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="bg-gray-100 p-3.5 rounded-2xl rounded-tl-sm text-[#1A1517] max-w-[85%]">
                  <div className="text-[10px] text-gray-500 font-bold mb-1">Replying to your Story:</div>
                  Is this embroidered maroon lawn suit available in Medium?
                </div>

                <div className="bg-[#FFF5F5] p-3.5 rounded-2xl rounded-tr-sm border border-[#FFE8EA] max-w-[90%] ml-auto text-[#1A1517] space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-[#C81E3A] text-[11px]">
                    <Sparkles size={13} /> Ittisalo AI Direct Assistant
                  </div>
                  <p>
                    Hey there! Yes, 3 pieces left in Size Medium (Rs. 4,200). Tap below to order on WhatsApp with Cash on Delivery! 🛍️
                  </p>
                  <div className="pt-1">
                    <span className="bg-[#25D366] text-white px-3 py-1 rounded font-bold text-[10px] inline-flex items-center gap-1">
                      <ShoppingBag size={11} /> One-Click WhatsApp Checkout
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-20 bg-white border-b border-[#EFEBE4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden border border-[#EFEBE4] shadow-2xl bg-gray-900 order-2 lg:order-1">
              <img src="/images/dashboard/inbox.png" alt="Instagram DM Inbox Dashboard" className="w-full h-auto object-cover" />
            </div>

            <div className="space-y-5 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-[#FDF2F8] text-[#9D174D] px-3.5 py-1 rounded-full text-xs font-bold">
                <Zap size={14} /> Instagram Automation Suite
              </div>
              <h2 className="text-3xl font-display font-extrabold text-[#1A1517]">
                Never miss an Instagram sales opportunity again
              </h2>
              <p className="text-sm text-[#5C5255] leading-relaxed">
                Whether a customer sends a DM, tags your handle in a story, or comments "DM price" on a post, Ittisalo triggers instant, personalized replies to lock in buyer intent.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs font-bold text-[#1A1517]">
                  <CheckCircle2 size={16} className="text-[#10B981]" /> Story Mention Auto-Thank & Discount Code Trigger
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-[#1A1517]">
                  <CheckCircle2 size={16} className="text-[#10B981]" /> Comment-to-DM Private Product Catalog Dispatch
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-[#1A1517]">
                  <CheckCircle2 size={16} className="text-[#10B981]" /> Seamless Transfer to WhatsApp & Online Store Checkout
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Cross Links */}
      <section className="py-16 bg-[#FDFCFB]">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h3 className="text-2xl font-bold text-[#1A1517]">Explore Instagram AI Workflows By Vertical</h3>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/solutions/ecommerce-fashion" className="px-5 py-2.5 bg-white border border-[#EFEBE4] rounded-xl text-xs font-bold text-[#1A1517] hover:border-[#C81E3A]">
              Fashion eCommerce AI →
            </Link>
            <Link href="/solutions/salons" className="px-5 py-2.5 bg-white border border-[#EFEBE4] rounded-xl text-xs font-bold text-[#1A1517] hover:border-[#C81E3A]">
              Salon Booking DM Engine →
            </Link>
            <Link href="/case-studies/urban-chic-apparel" className="px-5 py-2.5 bg-[#FFF5F5] border border-[#FFE8EA] rounded-xl text-xs font-bold text-[#C81E3A]">
              View Fashion Case Study →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
