import LiveProductShowcase from "@/components/marketing/LiveProductShowcase";
import Link from "next/link";
import {
  Bot,
  MessageSquare,
  Zap,
  Shield,
  BarChart3,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Cpu,
  RefreshCw,
  Globe
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Features & AI Architecture — Ittisalo Omnichannel SaaS",
  description:
    "Explore Ittisalo's complete feature set: Multi-tenant AI Copilot, Unified Meta Inbox, WhatsApp Business API Catalog Sync, Automated Booking Engine, and Real-Time Analytics.",
  keywords: [
    "Ittisalo Features",
    "WhatsApp AI Automation Platform",
    "Omnichannel Customer Service SaaS",
    "AI Copilot for Businesses",
    "Meta Messaging Integration"
  ]
};

const DETAILED_FEATURES = [
  {
    icon: Bot,
    title: "Autonomous AI Copilot",
    desc: "Trained on your business context, menus, services, and FAQs. Responds with high accuracy in English & Urdu script.",
    tag: "AI Engine",
    image: "/images/dashboard/agents.png"
  },
  {
    icon: MessageSquare,
    title: "Unified Meta Omnichannel Inbox",
    desc: "Single dashboard aggregating WhatsApp, Instagram DMs, Story mentions, and Facebook Messenger threads seamlessly.",
    tag: "Messaging",
    image: "/images/dashboard/inbox.png"
  },
  {
    icon: Zap,
    title: "Automated Orders & Appointments",
    desc: "Process digital menu checkout, COD confirmations, and clinic/salon slot bookings directly inside customer DM threads.",
    tag: "Workflows",
    image: "/images/dashboard/orders.png"
  },
  {
    icon: BarChart3,
    title: "Executive Business Analytics",
    desc: "Track AI resolution rates, first response speed, agent performance metrics, and sales conversion attribution.",
    tag: "Analytics",
    image: "/images/dashboard/analytics.png"
  },
  {
    icon: Users,
    title: "Multi-Tenant Team Collaboration",
    desc: "Role-based staff access, round-robin chat routing, internal team notes, and multi-branch franchise isolation.",
    tag: "Team",
    image: "/images/dashboard/team.png"
  },
  {
    icon: Lock,
    title: "Enterprise Multi-Tenant Security",
    desc: "Isolated database tenant schemas, end-to-end data encryption, and GDPR/Meta Business compliance standards.",
    tag: "Security",
    image: "/images/dashboard/settings.png"
  }
];

export default function ProductPage() {
  return (
    <div className="flex flex-col w-full bg-[#FDFCFB]">
      {/* Product Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Ittisalo Omnichannel AI Inbox SaaS",
            "description": "Multi-tenant conversational AI inbox for WhatsApp, Instagram, and Messenger.",
            "brand": {
              "@type": "Brand",
              "name": "Ittisalo"
            },
            "offers": {
              "@type": "Offer",
              "price": "29.00",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            }
          })
        }}
      />

      {/* Header Hero */}
      <section className="pt-16 pb-20 px-4 bg-gradient-to-b from-[#FFF5F5]/60 to-white border-b border-[#EFEBE4]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#FFF5F5] border border-[#FFE8EA] px-4 py-1.5 rounded-full text-xs font-bold text-[#8B1531]">
            <ShieldCheck size={14} className="text-[#E63946]" /> Built for High-Volume Business Messaging
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-[#1A1517] tracking-tight">
            The Complete <span className="bg-gradient-to-r from-[#E63946] via-[#C81E3A] to-[#8B1531] bg-clip-text text-transparent">AI Conversational Stack</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#5C5255] font-medium leading-relaxed max-w-2xl mx-auto">
            Everything your SMB needs to turn unstructured DMs into structured sales, scheduled appointments, and delighted repeat customers.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white shadow-xl shadow-[#E63946]/20"
              style={{ background: "linear-gradient(135deg, #E63946 0%, #C81E3A 50%, #8B1531 100%)" }}
            >
              Request Customized Product Demo <ArrowRight size={16} />
            </Link>
            <a
              href="https://app.ittisalo.com/login"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-[#1A1517] bg-white border border-[#EFEBE4] hover:bg-[#FFF5F5]"
            >
              Log in to Live App <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Interactive Showcase */}
      <LiveProductShowcase />

      {/* Feature Grid Deep-Dive */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 bg-[#FFF5F5] border border-[#FFE8EA] px-3.5 py-1 rounded-full text-xs font-bold text-[#C81E3A]">
              <Layers size={14} /> Modular Platform Capability
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#1A1517]">
              Engineered for absolute accuracy and zero downtime
            </h2>
            <p className="text-base text-[#5C5255]">
              Built on multi-tenant architecture designed to scale with your transaction volume effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {DETAILED_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="bg-[#FDFCFB] border border-[#EFEBE4] rounded-3xl p-8 space-y-5 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-[#FFF5F5] border border-[#FFE8EA] flex items-center justify-center text-[#C81E3A] group-hover:scale-110 transition-transform">
                        <Icon size={28} />
                      </div>
                      <span className="text-[10px] font-extrabold bg-[#240710] text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {feat.tag}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[#1A1517] group-hover:text-[#C81E3A] transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-[#5C5255] leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#EFEBE4]">
                    <div className="rounded-xl overflow-hidden border border-[#EFEBE4] aspect-[16/9] bg-gray-100">
                      <img
                        src={feat.image}
                        alt={feat.title}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integration & Tech Architecture */}
      <section className="py-20 bg-[#240710] text-white border-y border-[#3D0C1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#3D0C1A] border border-[#5C162A] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#E63946]">
                <Cpu size={14} /> Next-Gen Technology Architecture
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">
                Enterprise speed with SMB simplicity
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Ittisalo combines direct Meta Business API webhooks with low-latency LLM inference pipelines, giving you under 500ms AI responses while guaranteeing message deliverability.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-[#10B981] shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Official WhatsApp Business Cloud API</h4>
                    <p className="text-xs text-gray-400">Green tick verification eligible, no risk of phone number ban.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-[#10B981] shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Multi-Tenant Tenant Schema Isolation</h4>
                    <p className="text-xs text-gray-400">Your customer conversations and orders remain private to your workspace.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-[#10B981] shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Human Agent Seamless Handshake</h4>
                    <p className="text-xs text-gray-400">AI pauses automatically whenever a human agent sends a message.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#3D0C1A] border border-[#5C162A] p-8 rounded-3xl space-y-6">
              <h3 className="text-xl font-bold text-white">Internal Cross-Links</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/channels/whatsapp" className="p-3 bg-[#240710] rounded-xl text-xs font-bold text-gray-300 hover:text-white border border-[#5C162A]">
                  → WhatsApp Integration
                </Link>
                <Link href="/channels/instagram" className="p-3 bg-[#240710] rounded-xl text-xs font-bold text-gray-300 hover:text-white border border-[#5C162A]">
                  → Instagram Integration
                </Link>
                <Link href="/channels/messenger" className="p-3 bg-[#240710] rounded-xl text-xs font-bold text-gray-300 hover:text-white border border-[#5C162A]">
                  → Messenger Integration
                </Link>
                <Link href="/case-studies" className="p-3 bg-[#240710] rounded-xl text-xs font-bold text-gray-300 hover:text-white border border-[#5C162A]">
                  → Customer Case Studies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-4xl font-display font-extrabold text-[#1A1517]">
            Ready to upgrade your customer messaging?
          </h2>
          <p className="text-lg text-[#5C5255]">
            Book a personalized 1-on-1 walkthrough with our product specialists.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-xl shadow-[#E63946]/20"
              style={{ background: "linear-gradient(135deg, #E63946 0%, #C81E3A 50%, #8B1531 100%)" }}
            >
              <Sparkles size={20} /> Schedule Live Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
