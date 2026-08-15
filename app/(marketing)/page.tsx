import HeroAnimation from "@/components/marketing/HeroAnimation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle, Bot, Zap, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="w-full py-20 lg:py-32 overflow-hidden bg-[var(--color-mktg-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-[var(--color-mktg-cta)] text-sm font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-[var(--color-mktg-cta)] animate-pulse" />
                Ittisalo AI is now available globally
              </div>
              <h1 className="text-5xl lg:text-7xl font-display font-bold tracking-tight text-[var(--color-mktg-base)] mb-6 leading-[1.1]">
                One AI inbox for <span className="text-[var(--color-mktg-cta)]">every DM</span> your business gets
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-xl leading-relaxed">
                Automate responses, take orders, book appointments, and manage conversations 24/7 across WhatsApp, Instagram, and Messenger. Stop losing customers to slow replies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-[var(--color-mktg-cta)] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[var(--color-mktg-cta-hover)] transition-colors shadow-lg shadow-red-500/20">
                  Book a Demo <ArrowRight size={20} />
                </Link>
                <Link href="/product" className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-mktg-surface)] border border-gray-200 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors">
                  Explore Product
                </Link>
              </div>
            </div>
            <div className="relative">
              <HeroAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-8">Trusted by SMBs globally across 5+ industries</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
            {/* Logos would go here, placeholders for now */}
            <div className="text-xl font-display font-bold">Bella Salon</div>
            <div className="text-xl font-display font-bold">Fresh Eats</div>
            <div className="text-xl font-display font-bold">Urban Realty</div>
            <div className="text-xl font-display font-bold">Smile Clinic</div>
            <div className="text-xl font-display font-bold">Chic Boutique</div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-[var(--color-mktg-base)] mb-6">
              Works while you sleep
            </h2>
            <p className="text-lg text-gray-600">
              Your customers are messaging you at 2 AM. Ittisalo is awake, answering FAQs, taking orders, and booking appointments automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
                <Bot size={24} className="text-[var(--color-mktg-cta)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-mktg-base)] mb-3">AI Copilot</h3>
              <p className="text-gray-600 mb-6">
                Train your AI on your specific business rules, inventory, and FAQs. It handles the busywork so you can focus on growth.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
                <MessageCircle size={24} className="text-[var(--color-mktg-cta)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-mktg-base)] mb-3">Unified Inbox</h3>
              <p className="text-gray-600 mb-6">
                WhatsApp, Instagram, and Messenger in one place. Never lose track of a conversation or switch between apps again.
              </p>
            </div>

            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
                <Zap size={24} className="text-[var(--color-mktg-cta)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-mktg-base)] mb-3">Instant Actions</h3>
              <p className="text-gray-600 mb-6">
                Convert conversations into transactions. Send payment links, book appointments, and capture leads directly in the chat.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Channels Section */}
      <section className="py-24 bg-[var(--color-mktg-surface)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
                Native to the platforms your customers use.
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-xl">
                We've built deep integrations with the world's most popular messaging apps. Each channel has unique features tailored to its specific audience.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-mktg-wa)] flex items-center justify-center shrink-0">
                    <MessageCircle size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">WhatsApp Business</h4>
                    <p className="text-gray-400">Automate catalogs, orders, and booking flows for your most direct channel.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-mktg-ig)] flex items-center justify-center shrink-0">
                    <MessageCircle size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">Instagram</h4>
                    <p className="text-gray-400">Turn story mentions and post comments into automated DM conversations.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-mktg-ms)] flex items-center justify-center shrink-0">
                    <MessageCircle size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">Messenger</h4>
                    <p className="text-gray-400">Seamless integration with your Facebook Page and Ads for instant lead capture.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#2A364B] rounded-3xl p-8 border border-white/10 shadow-2xl relative">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-[var(--color-mktg-cta)]/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[var(--color-mktg-wa)]/20 rounded-full blur-2xl" />
              
              {/* Fake UI */}
              <div className="bg-[#1E293B] rounded-xl border border-white/5 overflow-hidden">
                <div className="flex border-b border-white/5 p-4 items-center justify-between">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-mktg-ig)] flex-shrink-0" />
                    <div className="bg-[#2A364B] p-3 rounded-xl text-sm">Do you deliver to downtown?</div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-mktg-cta)] flex-shrink-0" />
                    <div className="bg-[var(--color-mktg-cta)] p-3 rounded-xl text-sm text-white font-medium">Yes we do! Delivery is free for orders over $50. Would you like to see the menu?</div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-mktg-wa)] flex-shrink-0" />
                    <div className="bg-[#2A364B] p-3 rounded-xl text-sm">Can I book a table for 4 tonight at 8pm?</div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-mktg-cta)] flex-shrink-0" />
                    <div className="bg-[var(--color-mktg-cta)] p-3 rounded-xl text-sm text-white font-medium">I've booked you in! Your confirmation code is #1042. See you tonight!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-mktg-bg)] rounded-[3rem] m-4 md:m-8 lg:m-12" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <Globe size={48} className="mx-auto text-[var(--color-mktg-cta)] mb-6 opacity-50" />
          <h2 className="text-4xl md:text-6xl font-display font-bold text-[var(--color-mktg-base)] mb-6">
            Ready to scale your business?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Join thousands of SMBs globally who are saving time and increasing sales with Ittisalo.
          </p>
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-[var(--color-mktg-cta)] text-white px-10 py-5 rounded-2xl font-semibold text-xl hover:bg-[var(--color-mktg-cta-hover)] transition-colors shadow-xl shadow-red-500/20">
            Book a Demo
          </Link>
        </div>
      </section>
    </div>
  );
}
