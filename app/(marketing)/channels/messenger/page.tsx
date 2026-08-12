import Link from "next/link";
import { MessageCircle, Megaphone, CheckCircle2 } from "lucide-react";

export default function MessengerChannel() {
  return (
    <div className="w-full bg-white">
      {/* Header */}
      <section className="pt-24 pb-16 px-4 bg-[var(--color-mktg-bg)]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[var(--color-mktg-ms)] text-sm font-semibold mb-6">
              <MessageCircle size={16} />
              Messenger Integration
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--color-mktg-base)] mb-6">
              Capture leads from your Facebook Page
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Connect your Facebook Page and Ads to Ittisalo. Let the AI qualify leads, capture contact info, and drive sales instantly.
            </p>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-[var(--color-mktg-cta)] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
              Start Automating
            </Link>
          </div>
          
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl relative max-w-sm mx-auto w-full">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">IB</div>
              <div>
                <div className="text-[var(--color-mktg-base)] font-bold text-sm">Ittisalo Real Estate</div>
                <div className="text-xs text-gray-400">Typically replies instantly</div>
              </div>
            </div>
            
            <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
              <div className="text-center text-xs text-gray-400 mb-2">From Ad: "Luxury Condos Downtown"</div>
              
              <div className="flex justify-end">
                <div className="bg-[#0084FF] text-white p-3 rounded-2xl rounded-tr-none text-sm w-5/6">
                  I'm interested in the 2-bedroom condos.
                </div>
              </div>
              <div className="flex">
                <div className="bg-gray-200 text-gray-900 p-3 rounded-2xl rounded-tl-none text-sm w-5/6">
                  Hi! Thanks for your interest. We have three 2-bedroom layouts available starting at $450k. Are you looking to move in the next 3 months?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-[#0084FF] text-white p-3 rounded-2xl rounded-tr-none text-sm w-5/6">
                  Yes, hoping to move by August.
                </div>
              </div>
              <div className="flex">
                <div className="bg-gray-200 text-gray-900 p-3 rounded-2xl rounded-tl-none text-sm w-5/6">
                  Perfect! Would you like to schedule a tour for this weekend? Please provide your email and I'll send the available time slots.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-display font-bold text-center mb-16">Specifically built for Messenger</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[var(--color-mktg-ms)] mb-4">
              <Megaphone size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Click-to-Messenger Ads</h3>
            <p className="text-gray-600">Run Facebook ads that open directly in Messenger. The AI instantly engages the lead while their interest is highest.</p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[var(--color-mktg-ms)] mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Lead Qualification</h3>
            <p className="text-gray-600">The AI asks qualifying questions (budget, timeline, needs) before handing off high-value leads to your sales team.</p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[var(--color-mktg-ms)] mb-4">
              <MessageCircle size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Page Inbox Integration</h3>
            <p className="text-gray-600">Every message sent to your Facebook Page is handled automatically, ensuring you never miss a customer inquiry.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
