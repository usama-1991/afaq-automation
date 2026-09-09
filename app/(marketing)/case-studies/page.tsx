import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Case Studies & Success Stories — Ittisalo AI",
  description:
    "Explore how restaurants, clinics, salons, and eCommerce brands in Pakistan and globally use Ittisalo to automate WhatsApp & Instagram sales, reduce no-shows, and cut response times.",
  keywords: [
    "Ittisalo Case Studies",
    "WhatsApp Automation Results",
    "Karachi Business Success Stories",
    "Restaurant AI Bot ROI"
  ]
};

export const CASE_STUDIES = [
  {
    slug: "gourmet-bites-bistro",
    company: "Gourmet Bites Bistro",
    vertical: "Restaurants & Cafes",
    location: "DHA Phase 6, Karachi",
    headline: "How Gourmet Bites Bistro Automated 240% More WhatsApp Delivery Orders During Peak Rush",
    metric: "+240%",
    metricLabel: "WhatsApp Orders",
    subMetric: "0.4s AI Response",
    summary:
      "Struggling with unread DMs and incorrect food orders during Friday night rushes, Gourmet Bites Bistro connected Ittisalo WhatsApp Bot to handle digital menu browsing, delivery address logging, and table reservations.",
    image: "/images/solutions/restaurant.jpg",
    quote: "Ittisalo feels like hiring 3 dedicated front-desk managers for a fraction of the cost. Our delivery revenue doubled in 30 days."
  },
  {
    slug: "smilecare-dental",
    company: "SmileCare Dental Clinic",
    vertical: "Dental & Healthcare",
    location: "DHA Phase 5, Karachi",
    headline: "Cutting Patient Appointment No-Shows by 68% with Automated WhatsApp Intake",
    metric: "68%",
    metricLabel: "No-Show Reduction",
    subMetric: "24/7 Booking",
    summary:
      "SmileCare Dental Clinic faced high patient cancellation rates and empty afternoon doctor slots. Ittisalo AI triaged symptoms, booked calendar slots, and dispatched automated 24-hr reminder texts.",
    image: "/images/solutions/clinic.jpg",
    quote: "Our reception staff no longer spend 4 hours a day making phone calls to confirm patient appointments. The AI handles it flawlessly."
  },
  {
    slug: "glow-grace-salon",
    company: "Glow & Grace Studio",
    vertical: "Salons & Beauty Spas",
    location: "Clifton, Karachi",
    headline: "Achieving 94% Booking Deposit Capture Across Instagram DMs & WhatsApp",
    metric: "94%",
    metricLabel: "Deposit Capture",
    subMetric: "120+ Weekly Slots",
    summary:
      "Glow & Grace Studio was losing late-night Instagram booking inquiries. Ittisalo AI showcased senior stylist menus, locked in calendar slots, and dispatched deposit links automatically.",
    image: "/images/solutions/salon.jpg",
    quote: "Clients love booking their haircut or facial at midnight directly over Instagram DM. Our weekend calendar is booked solid."
  },
  {
    slug: "urban-chic-apparel",
    company: "Urban Chic Apparel",
    vertical: "eCommerce & Apparel",
    location: "Lahore / Karachi",
    headline: "Boosting Cash on Delivery (COD) Checkout Conversions by 38% via Instagram Auto-DM",
    metric: "+38%",
    metricLabel: "COD Conversions",
    subMetric: "98% Order Accuracy",
    summary:
      "With over 500 daily 'Price please' comments on Instagram reels, Urban Chic Apparel deployed Ittisalo to auto-DM product links and confirm COD shipping details over WhatsApp.",
    image: "/images/solutions/ecommerce.jpg",
    quote: "Ittisalo eliminated our Instagram DM backlog. We scaled our weekly dispatches without hiring additional social media reps."
  }
];

export default function CaseStudiesIndex() {
  return (
    <div className="w-full bg-[#FDFCFB] min-h-screen">
      {/* Hero */}
      <section className="pt-16 pb-20 px-4 text-center bg-gradient-to-b from-[#FFF5F5]/60 to-white border-b border-[#EFEBE4]">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#FFF5F5] border border-[#FFE8EA] px-4 py-1.5 rounded-full text-xs font-bold text-[#8B1531]">
            <Sparkles size={14} className="text-[#E63946]" /> Real Business Outcomes
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-[#1A1517] tracking-tight">
            Proven Results for <span className="bg-gradient-to-r from-[#E63946] via-[#C81E3A] to-[#8B1531] bg-clip-text text-transparent">Pakistani SMBs</span>
          </h1>
          <p className="text-lg text-[#5C5255] max-w-2xl mx-auto font-medium">
            Discover how leading restaurants, clinics, salons, and eCommerce brands automate conversations and increase bottom-line revenue.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CASE_STUDIES.map((study) => (
            <Link
              key={study.slug}
              href={`/case-studies/${study.slug}`}
              className="bg-white rounded-3xl border border-[#EFEBE4] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-56 overflow-hidden bg-gray-100">
                  <img
                    src={study.image}
                    alt={study.company}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-[#1A1517] shadow-md">
                    {study.vertical} • {study.location}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-[#240710] text-white px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-md flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-[#10B981]" /> {study.metric} {study.metricLabel}
                  </div>
                </div>

                <div className="p-8 space-y-4">
                  <h2 className="text-2xl font-bold text-[#1A1517] group-hover:text-[#C81E3A] transition-colors leading-snug">
                    {study.headline}
                  </h2>
                  <p className="text-sm text-[#5C5255] leading-relaxed">
                    {study.summary}
                  </p>

                  <div className="p-4 bg-[#FFF5F5] border border-[#FFE8EA] rounded-2xl text-xs font-medium text-[#8B1531] italic">
                    "{study.quote}"
                  </div>
                </div>
              </div>

              <div className="p-8 pt-0 border-t border-[#EFEBE4] mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-[#8C8285]">Key Metric: {study.subMetric}</span>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-[#C81E3A] group-hover:translate-x-1 transition-transform">
                  Read Full Case Study <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
