"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    title: "Connect WhatsApp",
    detail:
      "Link your existing business number through Meta's official WhatsApp Business API. No new number, no app switching — customers won't notice a thing.",
    accent: "#C42B33",
  },
  {
    n: "02",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    title: "Train Your AI",
    detail:
      "Upload your menu, price list, service hours, or product catalogue. Ittisalo learns your business once and starts answering in your voice — in English and Urdu.",
    accent: "#D98E1F",
  },
  {
    n: "03",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "Let AI Handle Conversations",
    detail:
      "Every incoming message gets an instant, accurate answer. Orders placed, appointments booked, questions resolved — day or night, automatically.",
    accent: "#1B9E96",
  },
  {
    n: "04",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Step In When Needed",
    detail:
      "If a conversation needs a human touch, Ittisalo pauses and notifies your team. You take over seamlessly in the same chat thread.",
    accent: "#6366F1",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative bg-ink py-24 lg:py-32 overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Gradient orbs */}
      <div className="absolute top-0 left-[20%] w-96 h-96 rounded-full bg-teal/[0.06] blur-[100px]" />
      <div className="absolute bottom-0 right-[10%] w-80 h-80 rounded-full bg-maroon/[0.06] blur-[100px]" />

      <div className="jaan-border-thin" />

      <div className="relative mx-auto max-w-7xl px-6 pt-16 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-saffron">
            How It Works
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-paper sm:text-4xl lg:text-[2.75rem]">
            Live in an afternoon, not a quarter.
          </h2>
          <p className="mt-4 text-balance text-paper/40 text-lg">
            Four simple steps to transform your WhatsApp into an AI-powered business assistant.
          </p>
        </motion.div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className={`relative group ${i < steps.length - 1 ? "step-connector" : ""}`}
            >
              {/* Step number */}
              <div className="mb-6 flex items-start justify-between">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-105"
                  style={{ backgroundColor: `${s.accent}20` }}
                >
                  <div style={{ color: s.accent }}>{s.icon}</div>
                </div>
                <span className="text-5xl font-bold text-paper/[0.06] leading-none">
                  {s.n}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-paper mb-3">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-paper/45">
                {s.detail}
              </p>

              {/* Connector line (hidden on mobile and last item) */}
              {i < steps.length - 1 && (
                <div className="absolute -right-4 top-7 hidden h-px w-8 bg-gradient-to-r from-paper/20 to-transparent lg:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
