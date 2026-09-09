import HeroAnimation from "@/components/marketing/HeroAnimation";
import LiveProductShowcase from "@/components/marketing/LiveProductShowcase";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Bot,
  Zap,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Clock,
  Building2,
  Utensils,
  Stethoscope,
  Scissors,
  ShoppingBag,
  Home as HomeIcon,
  Star
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ittisalo — Multi-Tenant WhatsApp & AI Omnichannel Inbox SaaS for SMBs",
  description:
    "Turn WhatsApp, Instagram & Facebook DMs into automated sales and appointments. Ittisalo is the premier AI inbox for restaurants, clinics, salons & eCommerce in Pakistan & globally.",
  keywords: [
    "WhatsApp AI Inbox Pakistan",
    "Omnichannel B2B SaaS",
    "WhatsApp Business API Automation",
    "Instagram DM Automation",
    "Karachi Restaurant AI Bot",
    "Clinic Appointment Booking AI",
    "Ittisalo AI SaaS"
  ]
};

const VERTICAL_CARDS = [
  {
    title: "Restaurants & Cafes",
    slug: "restaurants",
    icon: Utensils,
    metric: "3.4x Faster Orders",
    desc: "Automate digital menu sharing, table reservations, and delivery orders over WhatsApp without manual staff delays.",
    image: "/images/solutions/restaurant.jpg",
    caseStudy: "Gourmet Bites Bistro (Karachi)"
  },
  {
    title: "Dental & Health Clinics",
    slug: "clinics",
    icon: Stethoscope,
    metric: "68% Fewer No-Shows",
    desc: "24/7 AI appointment booking, automated pre-visit intake, and WhatsApp reminders that sync with your clinic calendar.",
    image: "/images/solutions/clinic.jpg",
    caseStudy: "SmileCare Dental Clinic"
  },
  {
    title: "Salons & Beauty Spas",
    slug: "salons",
    icon: Scissors,
    metric: "94% Deposit Capture",
    desc: "Let clients pick staff, book slots on Instagram DMs, and receive confirmation reminders automatically.",
    image: "/images/solutions/salon.jpg",
    caseStudy: "Glow & Grace Studio"
  },
  {
    title: "eCommerce & Fashion",
    slug: "ecommerce-fashion",
    icon: ShoppingBag,
    metric: "+38% COD Conversions",
    desc: "Sync catalogs to WhatsApp & Instagram, recover abandoned carts, and confirm Cash on Delivery orders instantly.",
    image: "/images/solutions/ecommerce.jpg",
    caseStudy: "Urban Chic Apparel"
  },
  {
    title: "Real Estate Agencies",
    slug: "real-estate",
    icon: HomeIcon,
    metric: "Instant Lead Capture",
    desc: "Dispatch property brochures, pre-qualify buyers, and schedule site visits automatically from Click-to-WhatsApp ads.",
    image: "/images/solutions/real-estate.jpg",
    caseStudy: "Apex Horizon Realty"
  }
];

export default function Home() {
  return (
    <div className="flex flex-col w-full bg-[#FDFCFB]">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Ittisalo AI Omnichannel Inbox",
            "operatingSystem": "Web Browser",
            "applicationCategory": "BusinessApplication",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "128"
            },
            "offers": {
              "@type": "Offer",
              "price": "29.00",
              "priceCurrency": "USD"
            }
          })
        }}
      />

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden bg-gradient-to-b from-[#FFF5F5]/60 via-[#FDFCFB] to-white border-b border-[#EFEBE4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center mb-16">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFF5F5] border border-[#FFE8EA] text-[#8B1531] text-xs sm:text-sm font-bold shadow-sm">
                <ShieldCheck size={16} className="text-[#E63946]" />
                <span>Multi-Tenant Conversational AI Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-[#1A1517] leading-[1.12]">
                One AI Inbox for <span className="bg-gradient-to-r from-[#E63946] via-[#C81E3A] to-[#8B1531] bg-clip-text text-transparent">Every DM</span> Your Business Gets
              </h1>

              <p className="text-lg sm:text-xl text-[#5C5255] font-medium leading-relaxed max-w-2xl">
                Automate responses, take orders, book appointments, and capture leads 24/7 across WhatsApp, Instagram, and Messenger. Designed for fast-growing restaurants, clinics, salons, and eCommerce brands in Pakistan and worldwide.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-xl shadow-[#E63946]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #E63946 0%, #C81E3A 50%, #8B1531 100%)" }}
                >
                  Book Live Demo & Free Trial <ArrowRight size={18} />
                </Link>
                <Link
                  href="/product"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-[#1A1517] bg-white border border-[#EFEBE4] hover:bg-[#FFF5F5] transition-colors shadow-sm"
                >
                  Explore Platform Features <ArrowRight size={18} />
                </Link>
              </div>

              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#EFEBE4] max-w-lg">
                <div>
                  <div className="text-2xl font-extrabold text-[#1A1517]">0.4s</div>
                  <div className="text-xs font-semibold text-[#8C8285]">Average AI Reply Speed</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#1A1517]">3.4x</div>
                  <div className="text-xs font-semibold text-[#8C8285]">Sales Order Uplift</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#1A1517]">100%</div>
                  <div className="text-xs font-semibold text-[#8C8285]">WhatsApp API Compliant</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <HeroAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Banner */}
      <section className="py-10 bg-white border-b border-[#EFEBE4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#8C8285]">
            Powering customer messaging for top SMBs in Karachi, Lahore, Islamabad & Globally
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-85">
            <div className="flex items-center gap-2 font-display font-bold text-lg text-[#1A1517]">
              <Utensils size={18} className="text-[#E63946]" /> Gourmet Bites Bistro
            </div>
            <div className="flex items-center gap-2 font-display font-bold text-lg text-[#1A1517]">
              <Stethoscope size={18} className="text-[#2563EB]" /> SmileCare Dental
            </div>
            <div className="flex items-center gap-2 font-display font-bold text-lg text-[#1A1517]">
              <Scissors size={18} className="text-[#E1306C]" /> Glow & Grace Studio
            </div>
            <div className="flex items-center gap-2 font-display font-bold text-lg text-[#1A1517]">
              <ShoppingBag size={18} className="text-[#10B981]" /> Urban Chic Apparel
            </div>
            <div className="flex items-center gap-2 font-display font-bold text-lg text-[#1A1517]">
              <HomeIcon size={18} className="text-[#8B5CF6]" /> Apex Horizon Realty
            </div>
          </div>
        </div>
      </section>

      {/* Live Dashboard Showcase Section */}
      <LiveProductShowcase />

      {/* Industry Solutions Grid Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 bg-[#FFF5F5] border border-[#FFE8EA] px-4 py-1.5 rounded-full text-xs font-bold text-[#8B1531]">
              <Building2 size={14} /> Tailored Workflows By Vertical
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-[#1A1517] tracking-tight">
              Pre-built AI templates for your specific industry
            </h2>
            <p className="text-lg text-[#5C5255] font-medium leading-relaxed">
              Don’t build chatbots from scratch. Ittisalo comes pre-trained with custom dialogs for food orders, dental triage, salon bookings, and fashion size consultation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {VERTICAL_CARDS.map((vertical) => {
              const Icon = vertical.icon;
              return (
                <div
                  key={vertical.slug}
                  className="bg-[#FDFCFB] border border-[#EFEBE4] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        src={vertical.image}
                        alt={vertical.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-[#1A1517] shadow-md flex items-center gap-1.5">
                        <Icon size={14} className="text-[#E63946]" /> {vertical.title}
                      </div>
                      <div className="absolute bottom-4 right-4 bg-[#240710] text-white px-3 py-1 rounded-full text-xs font-extrabold shadow-md">
                        {vertical.metric}
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <h3 className="text-xl font-bold text-[#1A1517] group-hover:text-[#C81E3A] transition-colors">
                        {vertical.title}
                      </h3>
                      <p className="text-sm text-[#5C5255] leading-relaxed">
                        {vertical.desc}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-[#EFEBE4] mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#8C8285]">Proof: {vertical.caseStudy}</span>
                    <Link
                      href={`/solutions/${vertical.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-bold text-[#C81E3A] hover:text-[#8B1531] transition-colors"
                    >
                      View Solution <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Case Studies Preview Bar */}
      <section className="py-20 bg-[#240710] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E63946]/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#3D0C1A] border border-[#5C162A] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#E63946]">
                <Star size={14} /> Verified Business Impact
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">
                Read how Pakistani SMBs grow with Ittisalo
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Explore real business metrics, response time reductions, and revenue increases achieved across Karachi and beyond.
              </p>
              <div className="pt-2">
                <Link
                  href="/case-studies"
                  className="inline-flex items-center gap-2 bg-[#E63946] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-[#C81E3A] transition-colors"
                >
                  Explore All 4 Case Studies <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              <div className="bg-[#3D0C1A] border border-[#5C162A] p-6 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs text-[#E63946] font-bold">
                  <span>Gourmet Bites Bistro</span>
                  <span>Karachi</span>
                </div>
                <div className="text-3xl font-extrabold text-white">+240%</div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  "WhatsApp delivery orders jumped 240% after installing Ittisalo AI order bot. Zero missed customer chats."
                </p>
              </div>

              <div className="bg-[#3D0C1A] border border-[#5C162A] p-6 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs text-[#E63946] font-bold">
                  <span>SmileCare Dental Clinic</span>
                  <span>Karachi</span>
                </div>
                <div className="text-3xl font-extrabold text-white">68% Drop</div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  "Appointment no-shows dropped by 68% thanks to automated WhatsApp confirmations and intake reminders."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main CTA Block */}
      <section className="py-24 bg-white relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-[#FFF5F5] border border-[#FFE8EA] px-4 py-1.5 rounded-full text-xs font-bold text-[#8B1531]">
            <Zap size={14} /> Instant 14-Day Free Setup
          </div>

          <h2 className="text-4xl sm:text-5xl font-display font-extrabold text-[#1A1517] tracking-tight">
            Stop losing revenue to slow DM responses
          </h2>

          <p className="text-lg text-[#5C5255] max-w-2xl mx-auto leading-relaxed">
            Connect your WhatsApp Business API, Instagram, and Messenger accounts in under 10 minutes. Get personalized onboarding support from our Karachi team.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-xl shadow-[#E63946]/20 transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #E63946 0%, #C81E3A 50%, #8B1531 100%)" }}
            >
              Schedule Live Demo <ArrowRight size={18} />
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-[#1A1517] bg-[#FDFCFB] border border-[#EFEBE4] hover:bg-[#FFF5F5] transition-colors"
            >
              View Transparent Pricing <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
