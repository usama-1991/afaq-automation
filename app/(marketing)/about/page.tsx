import Link from "next/link";
import { Globe2, Users, Rocket, Building2 } from "lucide-react";

export default function About() {
  return (
    <div className="w-full bg-white">
      {/* Header */}
      <section className="pt-24 pb-16 px-4 text-center bg-[var(--color-mktg-bg)]">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-[var(--color-mktg-base)] mb-6">
            Building the communication layer for local commerce
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            We believe that every small business deserves enterprise-grade AI to manage their customer relationships.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <div className="prose prose-lg text-gray-600">
          <h2 className="text-3xl font-bold text-[var(--color-mktg-base)] mb-6">Our Story</h2>
          <p className="mb-6">
            Small and medium businesses are the backbone of local economies globally, but they face an impossible challenge: customers expect instant replies 24/7 on WhatsApp, Instagram, and Messenger.
          </p>
          <p className="mb-6">
            A small salon owner shouldn't have to hire a full-time receptionist just to answer "what are your hours?" or "can I book an appointment?". A local restaurant shouldn't miss out on catering orders just because they were too busy in the kitchen to check Instagram DMs.
          </p>
          <p className="mb-12">
            That's why we built Ittisalo. We leverage the latest in generative AI to create a unified inbox that literally works while you sleep. It doesn't just chat—it takes orders, books appointments, and captures leads.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <Globe2 size={32} className="mx-auto text-[var(--color-mktg-cta)] mb-4" />
            <h4 className="text-3xl font-bold text-[var(--color-mktg-base)] mb-2">50+</h4>
            <p className="text-sm text-gray-500">Countries served</p>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <Users size={32} className="mx-auto text-[var(--color-mktg-cta)] mb-4" />
            <h4 className="text-3xl font-bold text-[var(--color-mktg-base)] mb-2">10M+</h4>
            <p className="text-sm text-gray-500">Messages automated</p>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <Rocket size={32} className="mx-auto text-[var(--color-mktg-cta)] mb-4" />
            <h4 className="text-3xl font-bold text-[var(--color-mktg-base)] mb-2">300%</h4>
            <p className="text-sm text-gray-500">Avg. increase in response speed</p>
          </div>
        </div>

        {/* Corporate Legal Entity Section */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 mb-20 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="text-[var(--color-mktg-cta)]" size={28} />
            <h3 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              Corporate & Registration Information
            </h3>
          </div>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Ittisalo is owned and operated by <strong className="text-gray-900 font-semibold">ITTISALO (PRIVATE) LIMITED</strong>, a registered company incorporated under the Companies Act, 2017 with the Securities and Exchange Commission of Pakistan (SECP).
          </p>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
              <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Legal Entity Name</span>
              <span className="font-bold text-gray-900 text-base">ITTISALO (PRIVATE) LIMITED</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
              <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">SECP Registration (CUIN)</span>
              <span className="font-mono font-bold text-gray-900 text-base">0347762</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
              <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">National Tax Number (NTN)</span>
              <span className="font-mono font-bold text-gray-900 text-base">J527787-0</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
              <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Registered Address</span>
              <span className="font-medium text-gray-900">p 45 1 22ND LANE PHASE 7 DHA KARACHI, Pakistan</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-24 bg-[var(--color-mktg-surface)] text-center text-white">
        <h2 className="text-3xl font-bold mb-6">Join us on our mission</h2>
        <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
          We're a fast-growing team of engineers, designers, and operators building the future of local commerce.
        </p>
        <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-[var(--color-mktg-cta)] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[var(--color-mktg-cta-hover)] transition-colors shadow-lg shadow-red-500/20">
          Contact Us
        </Link>
      </section>
    </div>
  );
}
