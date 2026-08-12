"use client";

import { motion } from "framer-motion";
import { MessageCircle, ShoppingBag, Calendar } from "lucide-react";

export default function HeroAnimation() {
  return (
    <div className="relative w-full max-w-4xl mx-auto h-[500px] flex items-center justify-center">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-mktg-bg)] via-[var(--color-mktg-cta)]/5 to-[var(--color-mktg-bg)] rounded-3xl" />
      
      {/* Central Inbox UI */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-2xl bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="font-medium text-sm text-[var(--color-mktg-surface)]">Ittisalo AI Copilot</div>
          <div className="w-16" />
        </div>

        {/* Content Body */}
        <div className="p-6 bg-white min-h-[300px] relative">
          {/* WhatsApp Thread */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-start gap-4 mb-6"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--color-mktg-wa)]/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle size={16} className="text-[var(--color-mktg-wa)]" />
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100 max-w-[80%]">
              <div className="text-xs font-semibold text-gray-500 mb-1">WhatsApp Customer</div>
              <p className="text-sm text-[var(--color-mktg-surface)]">Do you have the Nike Air Max in size 10?</p>
            </div>
          </motion.div>

          {/* AI Reply to WhatsApp */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            className="flex items-start gap-4 mb-6 flex-row-reverse"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--color-mktg-cta)]/10 flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 bg-[var(--color-mktg-cta)] rounded-sm rotate-45" />
            </div>
            <div className="bg-[var(--color-mktg-cta)]/5 p-4 rounded-2xl rounded-tr-none border border-[var(--color-mktg-cta)]/20 max-w-[80%]">
              <div className="text-xs font-semibold text-[var(--color-mktg-cta)] mb-1">AI Copilot</div>
              <p className="text-sm text-[var(--color-mktg-surface)]">Yes! We have 3 pairs left in size 10. Would you like to reserve one for pickup or order for delivery?</p>
              <div className="mt-3 flex gap-2">
                <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded text-xs font-medium border border-gray-100"><ShoppingBag size={12}/> Order Created</span>
              </div>
            </div>
          </motion.div>

          {/* Instagram Thread */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2 }}
            className="flex items-start gap-4 mb-6"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--color-mktg-ig)]/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle size={16} className="text-[var(--color-mktg-ig)]" />
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100 max-w-[80%]">
              <div className="text-xs font-semibold text-gray-500 mb-1">Instagram DM</div>
              <p className="text-sm text-[var(--color-mktg-surface)]">Hi, can I book a haircut for tomorrow at 3 PM?</p>
            </div>
          </motion.div>

          {/* AI Reply to Instagram */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 3.0 }}
            className="flex items-start gap-4 flex-row-reverse"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--color-mktg-cta)]/10 flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 bg-[var(--color-mktg-cta)] rounded-sm rotate-45" />
            </div>
            <div className="bg-[var(--color-mktg-cta)]/5 p-4 rounded-2xl rounded-tr-none border border-[var(--color-mktg-cta)]/20 max-w-[80%]">
              <div className="text-xs font-semibold text-[var(--color-mktg-cta)] mb-1">AI Copilot</div>
              <p className="text-sm text-[var(--color-mktg-surface)]">Tomorrow at 3 PM is open! I've booked you in with Sarah. See you then! ✨</p>
              <div className="mt-3 flex gap-2">
                <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded text-xs font-medium border border-gray-100"><Calendar size={12}/> Appointment Confirmed</span>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>

      {/* Floating Elements */}
      <motion.div 
        animate={{ y: [0, -10, 0] }} 
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 -left-10 md:left-10 bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3 z-20"
      >
        <div className="w-10 h-10 rounded-full bg-[var(--color-mktg-wa)] flex items-center justify-center">
           <MessageCircle size={20} className="text-white" />
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">WhatsApp</div>
          <div className="text-sm font-semibold text-[var(--color-mktg-surface)]">+42 new messages</div>
        </div>
      </motion.div>

      <motion.div 
        animate={{ y: [0, 15, 0] }} 
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-20 -right-4 md:-right-10 bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3 z-20"
      >
        <div className="w-10 h-10 rounded-full bg-[var(--color-mktg-ig)] flex items-center justify-center">
           <MessageCircle size={20} className="text-white" />
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Instagram</div>
          <div className="text-sm font-semibold text-[var(--color-mktg-surface)]">28 stories replied</div>
        </div>
      </motion.div>
    </div>
  );
}
