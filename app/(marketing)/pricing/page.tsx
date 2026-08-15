import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Pricing() {
  return (
    <div className="w-full bg-[var(--color-mktg-bg)] py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-[var(--color-mktg-base)] mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600">
            One platform for all your messaging channels. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-24">
          {/* Starter Tier */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-2xl font-bold mb-2">Starter</h3>
            <p className="text-gray-500 mb-6 text-sm">Perfect for small businesses getting started.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$49</span>
              <span className="text-gray-500">/mo</span>
            </div>
            <Link href="/contact" className="block w-full py-3 px-4 bg-gray-50 text-[var(--color-mktg-surface)] font-medium text-center rounded-xl hover:bg-gray-100 transition-colors mb-8 border border-gray-200">
              Get Started
            </Link>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle2 size={18} className="text-[var(--color-mktg-cta)]" /> 1 Channel
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle2 size={18} className="text-[var(--color-mktg-cta)]" /> Up to 1,000 AI messages/mo
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle2 size={18} className="text-[var(--color-mktg-cta)]" /> Basic AI training
              </li>
            </ul>
          </div>

          {/* Pro Tier */}
          <div className="bg-[var(--color-mktg-surface)] rounded-3xl p-8 border border-[var(--color-mktg-surface)] shadow-xl relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-mktg-cta)] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white">Pro</h3>
            <p className="text-gray-400 mb-6 text-sm">Everything you need to automate at scale.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$149</span>
              <span className="text-gray-400">/mo</span>
            </div>
            <Link href="/contact" className="block w-full py-3 px-4 bg-[var(--color-mktg-cta)] text-white font-medium text-center rounded-xl hover:bg-[var(--color-mktg-cta-hover)] transition-colors mb-8 shadow-lg shadow-red-500/20">
              Get Started
            </Link>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircle2 size={18} className="text-[var(--color-mktg-cta)]" /> All 3 Channels
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircle2 size={18} className="text-[var(--color-mktg-cta)]" /> Up to 5,000 AI messages/mo
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircle2 size={18} className="text-[var(--color-mktg-cta)]" /> Advanced AI logic & flows
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircle2 size={18} className="text-[var(--color-mktg-cta)]" /> Order integrations
              </li>
            </ul>
          </div>

          {/* Enterprise Tier */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
            <p className="text-gray-500 mb-6 text-sm">Custom limits and dedicated support.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">Custom</span>
            </div>
            <Link href="/contact" className="block w-full py-3 px-4 bg-gray-50 text-[var(--color-mktg-surface)] font-medium text-center rounded-xl hover:bg-gray-100 transition-colors mb-8 border border-gray-200">
              Contact Sales
            </Link>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle2 size={18} className="text-[var(--color-mktg-cta)]" /> Unlimited Channels
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle2 size={18} className="text-[var(--color-mktg-cta)]" /> Unlimited AI messages
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle2 size={18} className="text-[var(--color-mktg-cta)]" /> Custom integrations
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle2 size={18} className="text-[var(--color-mktg-cta)]" /> Dedicated success manager
              </li>
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h4 className="text-lg font-bold mb-2">How long does setup take?</h4>
              <p className="text-gray-600">Most businesses are fully set up and running within 24 hours. Our team assists with the initial AI training and channel connection.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h4 className="text-lg font-bold mb-2">Are there any API or Meta costs?</h4>
              <p className="text-gray-600">WhatsApp charges per conversation based on your region (Meta pricing). Instagram and Messenger APIs are completely free. Our subscription covers the AI and platform usage.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h4 className="text-lg font-bold mb-2">Do you require a long-term contract?</h4>
              <p className="text-gray-600">No, all our standard plans are month-to-month. You can cancel at any time. We also offer annual plans with a discount if you prefer.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
