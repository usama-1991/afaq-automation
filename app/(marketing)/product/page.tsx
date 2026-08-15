import { Bot, MessageCircle, Zap, Shield, BarChart3, Users } from "lucide-react";
import Link from "next/link";

export default function Product() {
  return (
    <div className="flex flex-col w-full bg-white">
      {/* Header */}
      <section className="pt-24 pb-16 px-4 text-center bg-[var(--color-mktg-bg)]">
        <h1 className="text-4xl md:text-6xl font-display font-bold text-[var(--color-mktg-base)] mb-6">
          The all-in-one <span className="text-[var(--color-mktg-cta)]">AI Inbox</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Everything your business needs to automate conversations, manage orders, and delight customers across every messaging app.
        </p>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100">
            <Bot size={32} className="text-[var(--color-mktg-cta)] mb-6" />
            <h3 className="text-xl font-bold mb-3">Custom AI Copilot</h3>
            <p className="text-gray-600">Train the AI on your PDFs, website, and past chats. It responds exactly how you would, 24/7.</p>
          </div>
          
          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100">
            <MessageCircle size={32} className="text-[var(--color-mktg-cta)] mb-6" />
            <h3 className="text-xl font-bold mb-3">Unified Inbox</h3>
            <p className="text-gray-600">See WhatsApp, Instagram, and Messenger in one feed. No more tab switching.</p>
          </div>

          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100">
            <Zap size={32} className="text-[var(--color-mktg-cta)] mb-6" />
            <h3 className="text-xl font-bold mb-3">Automated Workflows</h3>
            <p className="text-gray-600">Automatically qualify leads, route chats to human agents, and trigger follow-up sequences.</p>
          </div>

          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100">
            <Shield size={32} className="text-[var(--color-mktg-cta)] mb-6" />
            <h3 className="text-xl font-bold mb-3">Enterprise Security</h3>
            <p className="text-gray-600">Bank-level encryption and compliance. Your customer data is safe and strictly private.</p>
          </div>

          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100">
            <BarChart3 size={32} className="text-[var(--color-mktg-cta)] mb-6" />
            <h3 className="text-xl font-bold mb-3">Rich Analytics</h3>
            <p className="text-gray-600">Track response times, resolution rates, and AI deflection metrics in real time.</p>
          </div>

          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100">
            <Users size={32} className="text-[var(--color-mktg-cta)] mb-6" />
            <h3 className="text-xl font-bold mb-3">Team Collaboration</h3>
            <p className="text-gray-600">Add notes, assign conversations to teammates, and collaborate seamlessly.</p>
          </div>
        </div>
      </section>

      {/* Deep Dive */}
      <section className="py-20 px-4 bg-[var(--color-mktg-surface)] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-display font-bold mb-6">Seamless Order & Booking Flows</h2>
              <p className="text-gray-400 text-lg mb-6">
                Turn chats into revenue. Ittisalo connects with your existing tools to handle the entire transaction without leaving the chat.
              </p>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-mktg-cta)]" />
                  Send payment links directly in WhatsApp
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-mktg-cta)]" />
                  Sync with your calendar for instant booking
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-mktg-cta)]" />
                  Display product catalogs automatically
                </li>
              </ul>
            </div>
            <div className="bg-[#2A364B] rounded-2xl p-8 border border-white/10 aspect-square flex items-center justify-center relative overflow-hidden">
               <div className="absolute w-full h-full bg-[url('/grid.svg')] opacity-10" />
               <div className="text-center relative z-10">
                 <div className="text-xl font-medium text-white mb-2">Interactive Example</div>
                 <div className="text-sm text-gray-400">Order Flow UI component</div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 text-center">
        <h2 className="text-3xl font-bold mb-6">Experience the future of customer communication.</h2>
        <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-[var(--color-mktg-cta)] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[var(--color-mktg-cta-hover)] transition-colors">
          Book a Demo
        </Link>
      </section>
    </div>
  );
}
