"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Bot, ShoppingBag, BarChart3, Users, Settings, Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";

const SCREENSHOT_TABS = [
  {
    id: "inbox",
    title: "Unified AI Inbox",
    icon: MessageSquare,
    badge: "Omnichannel Hub",
    description: "Manage WhatsApp, Instagram DMs & Facebook Messenger conversations in one real-time multi-agent inbox.",
    image: "/images/dashboard/inbox.png",
    bullets: [
      "Real-time synchronized chat threads across Meta channels",
      "One-click AI copilot draft generation & automated response mode",
      "Custom customer tags, order history & appointment logs on sidebar"
    ]
  },
  {
    id: "agents",
    title: "AI Copilot & Training",
    icon: Bot,
    badge: "GPT-4o & Claude",
    description: "Train your AI assistant on menu prices, clinic schedules, returns policy & product catalogs in seconds.",
    image: "/images/dashboard/agents.png",
    bullets: [
      "Upload PDFs, menus, price sheets or URL docs for instant training",
      "Set tone of voice, greeting messages & escalation fallback rules",
      "Human-in-the-loop takeover when high-value leads request human agents"
    ]
  },
  {
    id: "orders",
    title: "Automated Orders & Bookings",
    icon: ShoppingBag,
    badge: "Direct Checkout",
    description: "Accept WhatsApp catalog orders, food delivery requests & clinic bookings directly inside the chat flow.",
    image: "/images/dashboard/orders.png",
    bullets: [
      "Automated order status tracking & invoice generation",
      "Real-time inventory stock sync & payment proof verification",
      "Appointment deposit requests & reminder alerts via WhatsApp"
    ]
  },
  {
    id: "analytics",
    title: "Analytics & Performance",
    icon: BarChart3,
    badge: "Real-time Metrics",
    description: "Track response times, agent performance, lead conversion rates, and channel ROI in real time.",
    image: "/images/dashboard/analytics.png",
    bullets: [
      "Average first-response time & resolution speed metrics",
      "Peak messaging hour heatmaps to optimize agent shift scheduling",
      "Conversion tracking from Meta Ads (Click-to-WhatsApp ROI)"
    ]
  },
  {
    id: "team",
    title: "Team & Multi-Tenant Routing",
    icon: Users,
    badge: "Role Access",
    description: "Collaborate seamlessly across branch locations, managers, and support agents with granular permissions.",
    image: "/images/dashboard/team.png",
    bullets: [
      "Automated round-robin lead assignment among team members",
      "Internal staff notes & @mentions invisible to customers",
      "Multi-tenant branch isolation for franchise locations"
    ]
  }
];

export default function LiveProductShowcase() {
  const [activeTab, setActiveTab] = useState(SCREENSHOT_TABS[0].id);

  const activeContent = SCREENSHOT_TABS.find((t) => t.id === activeTab) || SCREENSHOT_TABS[0];

  return (
    <section className="py-24 bg-gradient-to-b from-white via-[#FDFCFB] to-[#FFF5F5]/40 border-y border-[#EFEBE4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#FFF5F5] border border-[#FFE8EA] px-4 py-1.5 rounded-full text-xs font-bold text-[#C81E3A]">
            <ShieldCheck size={14} /> Production-Grade Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-[#1A1517] tracking-tight">
            See how Ittisalo powers your business conversations
          </h2>
          <p className="text-lg text-[#5C5255] font-medium leading-relaxed">
            No mockups or static concepts — explore the real application dashboard used daily by restaurants, clinics, salons, and eCommerce brands across Pakistan and globally.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
          {SCREENSHOT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-[#240710] text-white shadow-lg shadow-[#240710]/15 scale-105"
                    : "bg-white text-[#5C5255] border border-[#EFEBE4] hover:bg-[#FFF5F5] hover:text-[#C81E3A]"
                }`}
              >
                <Icon size={18} className={isActive ? "text-[#E63946]" : "text-[#8C8285]"} />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* Display Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-8 rounded-3xl border border-[#EFEBE4] shadow-xl">
          {/* Screenshot Display */}
          <div className="lg:col-span-8 relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#EFEBE4] shadow-2xl bg-[#1A1517]">
              {/* Top Browser Bar */}
              <div className="bg-[#240710] px-4 py-3 flex items-center justify-between border-b border-[#3D0C1A]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                  <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                </div>
                <div className="bg-[#3D0C1A] px-3 py-1 rounded-lg text-xs font-mono text-gray-300 truncate max-w-[220px] sm:max-w-none">
                  https://app.ittisalo.com/{activeContent.id}
                </div>
                <span className="text-[10px] font-bold bg-[#E63946] text-white px-2 py-0.5 rounded-full shrink-0">
                  LIVE DASHBOARD
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeContent.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="relative aspect-[16/10] bg-gray-900"
                >
                  <img
                    src={activeContent.image}
                    alt={`${activeContent.title} - Ittisalo SaaS Dashboard`}
                    className="w-full h-full object-cover object-top"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Details & Features Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#FFF5F5] border border-[#FFE8EA] text-[#8B1531] px-3 py-1 rounded-full text-xs font-bold">
              {activeContent.badge}
            </div>

            <h3 className="text-2xl font-bold text-[#1A1517]">
              {activeContent.title}
            </h3>

            <p className="text-sm text-[#5C5255] leading-relaxed">
              {activeContent.description}
            </p>

            <div className="space-y-3 pt-2">
              {activeContent.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#10B981] shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-[#1A1517] leading-tight">{bullet}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#EFEBE4]">
              <a
                href="https://app.ittisalo.com/login"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #E63946 0%, #C81E3A 50%, #8B1531 100%)" }}
              >
                Try Live Interactive App <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
