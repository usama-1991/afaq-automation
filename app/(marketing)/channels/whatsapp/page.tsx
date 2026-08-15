import Link from "next/link";
import { MessageCircle, Calendar, ShoppingBag, ArrowRight } from "lucide-react";

export default function WhatsAppChannel() {
  return (
    <div className="w-full bg-white">
      {/* Header */}
      <section className="pt-24 pb-16 px-4 bg-[var(--color-mktg-bg)]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-[var(--color-mktg-wa)] text-sm font-semibold mb-6">
              <MessageCircle size={16} />
              WhatsApp Integration
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--color-mktg-base)] mb-6">
              Turn WhatsApp into your best storefront
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Don't just answer questions. Automate complete order flows, share catalogs, and book appointments directly in WhatsApp.
            </p>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-[var(--color-mktg-cta)] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[var(--color-mktg-cta-hover)] transition-colors shadow-lg shadow-red-500/20">
              Start Automating
            </Link>
          </div>
          
          <div className="bg-[#111B21] rounded-3xl p-6 border border-gray-200 shadow-2xl relative max-w-sm mx-auto w-full">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">IB</div>
              <div className="text-white font-semibold">Ittisalo Boutique <span className="block text-xs text-green-400 font-normal">Online</span></div>
            </div>
            <div className="space-y-4">
              <div className="bg-[#202C33] text-white p-3 rounded-2xl rounded-tl-none text-sm w-5/6">
                Hi! Do you have the summer dress in blue?
              </div>
              <div className="bg-[#005C4B] text-white p-3 rounded-2xl rounded-tr-none text-sm w-5/6 ml-auto">
                Yes! We have it in blue (Sizes S, M, L). It's $45 with free shipping. Would you like to order?
              </div>
              <div className="bg-[#202C33] text-white p-3 rounded-2xl rounded-tl-none text-sm w-5/6">
                Yes, size M please.
              </div>
              <div className="bg-[#005C4B] text-white p-4 rounded-2xl rounded-tr-none text-sm w-5/6 ml-auto shadow-sm border border-[#005C4B]">
                <div className="font-bold mb-2 flex items-center gap-2"><ShoppingBag size={14}/> Order Summary</div>
                <div className="text-green-100 mb-1">1x Summer Dress (Blue, M)</div>
                <div className="font-bold mb-3">Total: $45</div>
                <button className="w-full bg-[#00A884] text-white font-bold py-2 rounded-lg">Pay Now</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-display font-bold text-center mb-16">Specifically built for WhatsApp</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-[var(--color-mktg-wa)] mb-4">
              <ShoppingBag size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Native Catalog Sync</h3>
            <p className="text-gray-600">Connect your inventory and let the AI showcase products, check stock, and process orders entirely within the chat.</p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-[var(--color-mktg-wa)] mb-4">
              <Calendar size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Frictionless Bookings</h3>
            <p className="text-gray-600">The AI checks your calendar availability in real-time and books appointments without sending users to a web link.</p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-[var(--color-mktg-wa)] mb-4">
              <ArrowRight size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Broadcast Campaigns</h3>
            <p className="text-gray-600">Send personalized promotional messages to your customer list and let the AI handle the hundreds of replies instantly.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
