"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ShoppingBag, Calendar, Sparkles, CheckCircle2, Bot, ArrowRight, ShieldCheck } from "lucide-react";

export default function HeroAnimation() {
  const [activeTab, setActiveTab] = useState<"whatsapp" | "instagram" | "messenger">("whatsapp");

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === "whatsapp") return "instagram";
        if (prev === "instagram") return "messenger";
        return "whatsapp";
      });
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Background Decorative Glows */}
      <div className="absolute -top-12 -left-12 w-72 h-72 bg-[#E63946]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-[#C81E3A]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Container */}
      <div className="relative z-10 bg-white/90 backdrop-blur-xl border border-[#EFEBE4] shadow-2xl rounded-3xl overflow-hidden">
        {/* Browser Top Window Bar */}
        <div className="bg-[#240710] px-5 py-3.5 flex items-center justify-between border-b border-[#3D0C1A]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#EF4444] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#F59E0B] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#10B981] inline-block" />
            <span className="ml-3 text-xs font-mono text-gray-300 hidden md:inline-block truncate max-w-[260px] sm:max-w-none">
              app.ittisalo.com/conversations
            </span>
          </div>

          {/* Tab selector */}
          <div className="flex items-center gap-1 bg-[#3D0C1A] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("whatsapp")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "whatsapp" ? "bg-[#25D366] text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              <MessageSquare size={13} /> WhatsApp
            </button>
            <button
              onClick={() => setActiveTab("instagram")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "instagram" ? "bg-[#E1306C] text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              <MessageSquare size={13} /> Instagram
            </button>
            <button
              onClick={() => setActiveTab("messenger")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "messenger" ? "bg-[#0084FF] text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              <MessageSquare size={13} /> Messenger
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 min-h-[380px] bg-gradient-to-b from-[#FDFCFB] to-white relative">
          <AnimatePresence mode="wait">
            {activeTab === "whatsapp" && (
              <motion.div
                key="whatsapp"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-4 max-w-2xl mx-auto"
              >
                {/* Meta Badge */}
                <div className="flex items-center justify-between text-xs text-[#5C5255] pb-2 border-b border-[#EFEBE4]">
                  <span className="flex items-center gap-1.5 font-bold text-[#25D366]">
                    <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" /> Official WhatsApp Business API
                  </span>
                  <span className="font-semibold text-gray-400">Gourmet Bites Bistro (Karachi)</span>
                </div>

                {/* Customer Message */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center font-bold text-[#25D366] text-xs shrink-0">
                    WA
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-[#EFEBE4] shadow-sm max-w-[85%]">
                    <div className="flex items-center justify-between text-xs text-[#8C8285] mb-1">
                      <span className="font-bold text-[#1A1517]">Zainab Khan (+92 300 8294192)</span>
                      <span>12:44 PM</span>
                    </div>
                    <p className="text-sm text-[#1A1517] font-medium leading-relaxed">
                      Hi! Do you have table availability for 4 people tonight at 8:30 PM? Also can I order the Charcoal Grilled Burger deal for pickup?
                    </p>
                  </div>
                </div>

                {/* AI Copilot Response */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start gap-3 flex-row-reverse"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E63946] to-[#8B1531] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                    <Bot size={18} />
                  </div>
                  <div className="bg-[#FFF5F5] p-4.5 rounded-2xl rounded-tr-sm border border-[#FFE8EA] shadow-sm max-w-[88%] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#C81E3A] flex items-center gap-1">
                        <Sparkles size={14} className="text-[#C81E3A]" /> Ittisalo AI Autonomous Agent (0.4s response)
                      </span>
                      <span className="text-[#8C8285]">Auto-Replied</span>
                    </div>
                    <p className="text-sm text-[#1A1517] font-medium leading-relaxed">
                      Assalam-o-Alaikum Zainab! Yes, we have reserved Table #7 for 4 guests tonight at 8:30 PM under your name. Your Charcoal Grilled Burger combo has also been sent to the kitchen queue! 🍔✨
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold">
                        <CheckCircle2 size={13} /> Table #7 Reserved
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs px-3 py-1 rounded-full font-bold">
                        <ShoppingBag size={13} /> Kitchen Order #GB-9401 (Rs. 2,450)
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === "instagram" && (
              <motion.div
                key="instagram"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-4 max-w-2xl mx-auto"
              >
                <div className="flex items-center justify-between text-xs text-[#5C5255] pb-2 border-b border-[#EFEBE4]">
                  <span className="flex items-center gap-1.5 font-bold text-[#E1306C]">
                    <span className="w-2 h-2 rounded-full bg-[#E1306C] animate-pulse" /> Instagram Automation (DM & Story)
                  </span>
                  <span className="font-semibold text-gray-400">Urban Chic Apparel (@urbanchic.pk)</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E1306C]/10 border border-[#E1306C]/30 flex items-center justify-center font-bold text-[#E1306C] text-xs shrink-0">
                    IG
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-[#EFEBE4] shadow-sm max-w-[85%]">
                    <div className="flex items-center justify-between text-xs text-[#8C8285] mb-1">
                      <span className="font-bold text-[#1A1517]">@samira_styles (Story Reply)</span>
                      <span>02:15 PM</span>
                    </div>
                    <p className="text-sm text-[#1A1517] font-medium leading-relaxed">
                      Loved this Crimson Velvet Kurti in your latest reel! Is Medium size in stock for delivery to Lahore?
                    </p>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start gap-3 flex-row-reverse"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E63946] to-[#8B1531] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                    <Bot size={18} />
                  </div>
                  <div className="bg-[#FFF5F5] p-4.5 rounded-2xl rounded-tr-sm border border-[#FFE8EA] shadow-sm max-w-[88%] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#C81E3A] flex items-center gap-1">
                        <Sparkles size={14} className="text-[#C81E3A]" /> AI Sales Assistant (Instagram Auto-DM)
                      </span>
                      <span className="text-[#8C8285]">Auto-Replied</span>
                    </div>
                    <p className="text-sm text-[#1A1517] font-medium leading-relaxed">
                      Hey Samira! Yes! 4 items left in Size Medium. We offer Cash on Delivery (2-day dispatch to Lahore). Click below to place your order directly via WhatsApp or Checkout catalog! 🛍️
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="inline-flex items-center gap-1.5 bg-[#FFF5F5] text-[#8B1531] border border-[#FFE8EA] text-xs px-3 py-1 rounded-full font-bold">
                        <Sparkles size={13} className="text-[#E63946]" /> One-Click WhatsApp Checkout Link Generated
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === "messenger" && (
              <motion.div
                key="messenger"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-4 max-w-2xl mx-auto"
              >
                <div className="flex items-center justify-between text-xs text-[#5C5255] pb-2 border-b border-[#EFEBE4]">
                  <span className="flex items-center gap-1.5 font-bold text-[#0084FF]">
                    <span className="w-2 h-2 rounded-full bg-[#0084FF] animate-pulse" /> Facebook Lead Ad Instant Router
                  </span>
                  <span className="font-semibold text-gray-400">SmileCare Dental Clinic (DHA Karachi)</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0084FF]/10 border border-[#0084FF]/30 flex items-center justify-center font-bold text-[#0084FF] text-xs shrink-0">
                    FB
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-[#EFEBE4] shadow-sm max-w-[85%]">
                    <div className="flex items-center justify-between text-xs text-[#8C8285] mb-1">
                      <span className="font-bold text-[#1A1517]">Tariq Mehmood (Click-to-Messenger Ad)</span>
                      <span>05:10 PM</span>
                    </div>
                    <p className="text-sm text-[#1A1517] font-medium leading-relaxed">
                      I saw your Teeth Whitening Special Offer ad. Can I book a consultation with Dr. Fatima tomorrow morning?
                    </p>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start gap-3 flex-row-reverse"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E63946] to-[#8B1531] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                    <Bot size={18} />
                  </div>
                  <div className="bg-[#FFF5F5] p-4.5 rounded-2xl rounded-tr-sm border border-[#FFE8EA] shadow-sm max-w-[88%] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#C81E3A] flex items-center gap-1">
                        <Sparkles size={14} className="text-[#C81E3A]" /> Clinic Scheduling AI
                      </span>
                      <span className="text-[#8C8285]">Auto-Booked</span>
                    </div>
                    <p className="text-sm text-[#1A1517] font-medium leading-relaxed">
                      Hello Mr. Tariq! Dr. Fatima has an open slot tomorrow Thursday at 11:00 AM. I have scheduled your Teeth Whitening Consultation & sent an automated SMS reminder! 🦷
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-3 py-1 rounded-full font-bold">
                        <Calendar size={13} /> Consultation Confirmed (Thu 11:00 AM)
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Metrics Bar */}
        <div className="bg-[#FFF5F5] border-t border-[#FFE8EA] px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[#5C5255]">
          <div className="flex items-center gap-2 font-bold text-[#1A1517]">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Multi-Tenant Architecture Active
          </div>
          <div className="flex items-center gap-6">
            <span>Average AI Response Time: <strong>&lt; 0.5s</strong></span>
            <span>Order Conversion Rate: <strong>+34%</strong></span>
            <span>No-Show Reduction: <strong>68%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

