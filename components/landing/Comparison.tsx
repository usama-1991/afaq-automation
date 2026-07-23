"use client";

import { motion } from "framer-motion";
import { X, Check, Clock, MessageCircleOff, TrendingDown, Zap, Shield, ShoppingCart, Users } from "lucide-react";

const withoutItems = [
  { icon: Clock, text: "Customers wait hours for a reply", color: "#EF4444" },
  { icon: MessageCircleOff, text: "Missed messages during busy hours", color: "#EF4444" },
  { icon: TrendingDown, text: "Lost sales from slow responses", color: "#EF4444" },
  { icon: X, text: "No coverage after business hours", color: "#EF4444" },
];

const withItems = [
  { icon: Zap, text: "Instant response under 3 seconds", color: "#1B9E96" },
  { icon: Shield, text: "24/7 availability, never misses a message", color: "#1B9E96" },
  { icon: ShoppingCart, text: "Automated order & booking handling", color: "#1B9E96" },
  { icon: Users, text: "Seamless human handoff when needed", color: "#1B9E96" },
];

export default function Comparison() {
  return (
    <section className="relative bg-ink overflow-hidden py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />
      <div className="absolute top-[20%] left-[10%] w-96 h-96 rounded-full bg-maroon/[0.04] blur-[120px]" />
      <div className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full bg-teal/[0.04] blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-saffron">
            The Difference
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-paper sm:text-4xl lg:text-[2.75rem]">
            See what changes when AI handles your{" "}
            <span className="bg-gradient-to-r from-saffron to-maroon-light bg-clip-text text-transparent">
              WhatsApp conversations
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Without Ittisalo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-8 backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <X className="h-5 w-5 text-red-400" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-paper">Without Ittisalo</h3>
                <p className="text-sm text-paper/40">Manual WhatsApp management</p>
              </div>
            </div>
            <div className="space-y-4">
              {withoutItems.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3"
                >
                  <item.icon className="h-4 w-4 flex-shrink-0 text-red-400/70" strokeWidth={1.8} />
                  <span className="text-sm text-paper/60">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* With Ittisalo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl border border-teal/15 bg-teal/[0.04] p-8 backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15">
                <Check className="h-5 w-5 text-teal" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-paper">With Ittisalo</h3>
                <p className="text-sm text-paper/40">AI-powered automation</p>
              </div>
            </div>
            <div className="space-y-4">
              {withItems.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 + 0.2 }}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-3"
                >
                  <item.icon className="h-4 w-4 flex-shrink-0 text-teal" strokeWidth={1.8} />
                  <span className="text-sm text-paper/70">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
