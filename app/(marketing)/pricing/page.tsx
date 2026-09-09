import { CheckCircle2, Sparkles, HelpCircle, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Plans & Packages — Ittisalo AI Omnichannel SaaS",
  description:
    "Simple, transparent pricing for WhatsApp, Instagram, and Messenger automation. Plans starting at $29/mo or Rs. 7,999/mo for restaurants, clinics & SMBs.",
  keywords: [
    "Ittisalo Pricing",
    "WhatsApp Business API Pricing Pakistan",
    "AI Inbox Monthly Subscription",
    "Omnichannel SaaS Cost"
  ]
};

const PRICING_TIERS = [
  {
    name: "Starter SMB",
    priceUSD: "$29",
    pricePKR: "Rs. 7,999",
    badge: "1 Channel",
    desc: "Ideal for single-location salons, boutique shops, and emerging food outlets.",
    popular: false,
    cta: "Start 14-Day Trial",
    features: [
      "1 Meta Channel (WhatsApp or Instagram)",
      "Up to 1,500 AI-automated conversations / mo",
      "Standard PDF & FAQ menu training",
      "2 Agent Seats with Web Inbox",
      "Order status & Appointment booking tagger",
      "Email & WhatsApp Onboarding Support"
    ]
  },
  {
    name: "Business Pro",
    priceUSD: "$79",
    pricePKR: "Rs. 21,999",
    badge: "Most Popular",
    desc: "For busy restaurants, dental clinics, and growing fashion eCommerce stores.",
    popular: true,
    cta: "Get Started Free",
    features: [
      "All 3 Meta Channels (WhatsApp + Instagram + Messenger)",
      "Up to 6,000 AI-automated conversations / mo",
      "Advanced AI Engine (GPT-4o & Claude hybrid)",
      "5 Team Agent Seats with Round-Robin Routing",
      "Digital Menu, Catalog & Appointment booking engine",
      "Official WhatsApp Green Tick assistance",
      "Priority 24/7 WhatsApp Support"
    ]
  },
  {
    name: "Enterprise Multi-Tenant",
    priceUSD: "$199",
    pricePKR: "Rs. 54,999",
    badge: "Multi-Branch",
    desc: "For restaurant chains, hospital networks, real estate groups & high-volume retail.",
    popular: false,
    cta: "Contact Enterprise Sales",
    features: [
      "Unlimited WhatsApp, Instagram & Messenger accounts",
      "Up to 25,000+ AI-automated conversations / mo",
      "Custom Multi-Tenant Branch Isolation",
      "15+ Team Agent Seats with Granular Roles",
      "Custom CRM, POS & ERP Integration webhooks",
      "Dedicated Account Success Manager",
      "SLA Guarantee (99.9% Uptime)"
    ]
  }
];

const FAQS = [
  {
    q: "How does the 14-day setup work?",
    a: "Our Karachi-based engineering team configures your WhatsApp Business API or Meta Page connection, ingests your menu/catalog or clinic schedule, tests AI responses, and goes live within 24 hours."
  },
  {
    q: "Are Meta WhatsApp conversation charges included?",
    a: "Meta charges a small per-conversation rate directly via your Meta Business Manager account (approx $0.005–$0.015 per 24-hr session in Pakistan). Our monthly subscription covers all AI processing, multi-agent software, hosting, and analytics."
  },
  {
    q: "Can I accept payments in Pakistani Rupees (PKR)?",
    a: "Yes! We accept local Pakistani bank transfers, JazzCash, EasyPaisa, and credit/debit card billing in both PKR and USD."
  },
  {
    q: "Can my staff take over conversations from the AI anytime?",
    a: "Absolutely. With 1-click human agent takeover, whenever a human agent types in the inbox, the AI automatically pauses on that thread so your staff has full control."
  }
];

export default function PricingPage() {
  return (
    <div className="w-full bg-[#FDFCFB]">
      {/* Header */}
      <section className="pt-16 pb-20 px-4 text-center bg-gradient-to-b from-[#FFF5F5]/60 to-white border-b border-[#EFEBE4]">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#FFF5F5] border border-[#FFE8EA] px-4 py-1.5 rounded-full text-xs font-bold text-[#8B1531]">
            <Sparkles size={14} className="text-[#E63946]" /> Predictable Monthly Pricing • No Hidden Costs
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-[#1A1517] tracking-tight">
            Plans for Businesses of <span className="bg-gradient-to-r from-[#E63946] via-[#C81E3A] to-[#8B1531] bg-clip-text text-transparent">Every Scale</span>
          </h1>
          <p className="text-lg text-[#5C5255] max-w-xl mx-auto font-medium">
            Select a plan to start automating your WhatsApp, Instagram, and Messenger customer inquiries.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                tier.popular
                  ? "bg-[#240710] text-white shadow-2xl scale-105 border-2 border-[#E63946]"
                  : "bg-white text-[#1A1517] border border-[#EFEBE4] shadow-sm hover:shadow-xl"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#E63946] to-[#C81E3A] text-white text-xs font-extrabold px-4 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Sparkles size={12} /> {tier.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold">{tier.name}</h3>
                  {!tier.popular && (
                    <span className="text-[10px] font-bold bg-[#FFF5F5] text-[#8B1531] px-2.5 py-1 rounded-full uppercase">
                      {tier.badge}
                    </span>
                  )}
                </div>

                <p className={`text-xs mb-6 ${tier.popular ? "text-gray-300" : "text-[#5C5255]"}`}>
                  {tier.desc}
                </p>

                <div className="mb-6 space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">{tier.priceUSD}</span>
                    <span className={`text-xs ${tier.popular ? "text-gray-300" : "text-gray-500"}`}>/ month</span>
                  </div>
                  <div className={`text-xs font-semibold ${tier.popular ? "text-[#E63946]" : "text-[#8B1531]"}`}>
                    Equivalent to {tier.pricePKR} / month
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EFEBE4]/20 mb-8 space-y-3">
                  <div className={`text-xs font-bold uppercase tracking-wider ${tier.popular ? "text-gray-300" : "text-[#8C8285]"}`}>
                    Included Capabilities
                  </div>
                  {tier.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2
                        size={15}
                        className={`shrink-0 mt-0.5 ${tier.popular ? "text-[#10B981]" : "text-[#C81E3A]"}`}
                      />
                      <span className={tier.popular ? "text-gray-200" : "text-[#5C5255]"}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Link
                  href="/contact"
                  className={`block w-full py-4 px-4 text-center rounded-xl font-bold text-sm transition-all ${
                    tier.popular
                      ? "bg-gradient-to-r from-[#E63946] via-[#C81E3A] to-[#8B1531] text-white shadow-lg hover:scale-[1.02]"
                      : "bg-[#FDFCFB] text-[#1A1517] border border-[#EFEBE4] hover:bg-[#FFF5F5] hover:text-[#C81E3A]"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white border-t border-[#EFEBE4]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#FFF5F5] text-[#8B1531] px-3.5 py-1 rounded-full text-xs font-bold">
              <HelpCircle size={14} /> Clear Guidance
            </div>
            <h2 className="text-3xl font-display font-extrabold text-[#1A1517]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-[#FDFCFB] border border-[#EFEBE4] p-6 rounded-2xl space-y-2">
                <h4 className="text-base font-bold text-[#1A1517]">{faq.q}</h4>
                <p className="text-xs text-[#5C5255] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
